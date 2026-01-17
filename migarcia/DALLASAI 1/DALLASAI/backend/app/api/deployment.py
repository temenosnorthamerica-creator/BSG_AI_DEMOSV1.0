"""
Deployment API Endpoints

Provides Azure deployment analysis endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from app.core.config import Settings, get_settings
from app.core.logging import get_logger
from app.services.azure_service import AzureService, AzureResourceGroup, AzureResource
from app.services.temenos_service import TemenosService, TemenosAnalysisResult
from app.services.aks_service import AKSService
import asyncio
import time

router = APIRouter(prefix="/deployment", tags=["deployment"])
logger = get_logger(__name__)

# Store Azure service instances per subscription
azure_service_cache: Dict[str, AzureService] = {}


class SubscriptionConnectRequest(BaseModel):
    """Request model for Azure subscription connection."""
    subscription_id: str = Field(..., description="Azure subscription ID")


class ResourcesRequest(BaseModel):
    """Request model for getting resources."""
    subscription_id: str = Field(..., description="Azure subscription ID")
    resource_group_names: List[str] = Field(..., description="List of resource group names")


class AnalyzeRequest(BaseModel):
    """Request model for analyzing services."""
    services: List[Dict[str, Any]] = Field(..., description="List of Azure resources")
    analysis_id: Optional[str] = Field(None, description="Analysis ID for progress tracking")
    selected_namespaces: Optional[List[str]] = Field(None, description="Selected AKS namespaces to analyze")
    force_refresh: Optional[bool] = Field(False, description="Force refresh RAG queries even if cached")


class NamespacesRequest(BaseModel):
    """Request model for getting AKS namespaces."""
    subscription_id: str = Field(..., description="Azure subscription ID")
    resource_group_names: List[str] = Field(..., description="List of resource group names")


def get_azure_service(subscription_id: str) -> AzureService:
    """Get or create Azure service instance."""
    if subscription_id not in azure_service_cache:
        azure_service_cache[subscription_id] = AzureService(subscription_id)
    return azure_service_cache[subscription_id]


@router.post("/azure/connect")
async def connect_azure_subscription(request: SubscriptionConnectRequest):
    """
    Initialize Azure connection for a subscription.
    
    Args:
        request: Subscription connection request
        
    Returns:
        Connection status
    """
    try:
        subscription_id = request.subscription_id
        
        if not subscription_id:
            raise HTTPException(status_code=400, detail="Subscription ID is required")
        
        # Create or retrieve Azure service instance
        azure_service = get_azure_service(subscription_id)
        
        # Test the connection
        await azure_service.test_connection()
        
        return {
            "status": "success",
            "message": "Connected to Azure subscription",
            "subscriptionId": subscription_id
        }
    except RuntimeError as e:
        error_msg = str(e)
        error_type = "unknown"
        recovery_steps = []
        
        if "authentication" in error_msg.lower() or "credential" in error_msg.lower():
            error_type = "authentication"
            # Check if running in Azure App Service
            import os
            is_azure_app_service = os.getenv("WEBSITE_SITE_NAME") is not None
            
            if is_azure_app_service:
                recovery_steps = [
                    "Enable Managed Identity for the App Service in Azure Portal",
                    "Grant the Managed Identity 'Reader' role on the subscription",
                    "OR configure Service Principal credentials in App Settings:",
                    "  - AZURE_CLIENT_ID",
                    "  - AZURE_CLIENT_SECRET", 
                    "  - AZURE_TENANT_ID",
                    "Restart the App Service after configuration"
                ]
            else:
                recovery_steps = [
                    "Check if Azure CLI is installed: Run `az --version`",
                    "Login to Azure: Run `az login`",
                    "Verify your login: Run `az account show`",
                    "Set the correct subscription: Run `az account set --subscription <subscription-id>`",
                    "After logging in, restart the backend server"
                ]
        elif "permission" in error_msg.lower() or "authorization" in error_msg.lower():
            error_type = "permission"
            recovery_steps = [
                "Verify subscription access in Azure Portal",
                "Ensure your account has at least 'Reader' role on the subscription",
                "Check Azure RBAC settings",
                "Contact your Azure administrator to grant permissions"
            ]
        elif "not found" in error_msg.lower() or "subscription" in error_msg.lower():
            error_type = "subscription"
            recovery_steps = [
                f"Verify subscription ID '{subscription_id}' is correct",
                "Check Azure Portal → Subscriptions to confirm the subscription exists",
                "Ensure the subscription is active"
            ]
        else:
            recovery_steps = [
                "Check backend server logs for detailed error information",
                "Verify Azure CLI is installed and logged in",
                "Try restarting the backend server"
            ]
        
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "error": error_msg,
                "errorType": error_type,
                "recoverySteps": recovery_steps
            }
        )
    except Exception as e:
        logger.error(f"Connect error: {e}", exc_info=True)
        error_msg = str(e)
        error_type = type(e).__name__
        
        # Try to extract more information from the error
        recovery_steps = [
            "Check backend server logs for detailed error information",
            "Verify Azure CLI is installed and logged in (run: az login)",
            f"Verify subscription ID '{request.subscription_id}' is correct",
            "Run: az account set --subscription <subscription-id>",
            "Try restarting the backend server"
        ]
        
        # Check if it's an Azure-specific error
        if "azure" in error_msg.lower() or "subscription" in error_msg.lower():
            recovery_steps.insert(0, f"Verify you have access to subscription '{request.subscription_id}' in Azure Portal")
        
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "error": error_msg,
                "errorType": error_type,
                "recoverySteps": recovery_steps
            }
        )


@router.get("/azure/resource-groups")
async def get_resource_groups(subscriptionId: str):
    """
    Get all resource groups for a subscription.
    
    Args:
        subscriptionId: Azure subscription ID
        
    Returns:
        List of resource groups
    """
    try:
        if not subscriptionId:
            raise HTTPException(status_code=400, detail="Subscription ID is required")
        
        azure_service = get_azure_service(subscriptionId)
        resource_groups = await azure_service.get_resource_groups()
        
        return {
            "status": "success",
            "data": [rg.to_dict() for rg in resource_groups],
            "count": len(resource_groups)
        }
    except Exception as e:
        logger.error(f"Error getting resource groups: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "error": str(e),
                "errorType": "unknown",
                "recoverySteps": [
                    "Check backend server logs",
                    "Verify Azure CLI is installed and logged in",
                    "Try restarting the backend server"
                ]
            }
        )


@router.post("/aks/namespaces")
async def get_aks_namespaces(request: NamespacesRequest):
    """
    Get all namespaces from AKS clusters in the specified resource groups.
    
    Args:
        request: Namespaces request with subscription ID and resource group names
        
    Returns:
        List of namespaces grouped by cluster
    """
    # CRITICAL: Use both logger AND print for visibility
    print("=" * 80)
    print("=== API ENDPOINT CALLED: /aks/namespaces ===")
    print(f"Request subscription_id: {request.subscription_id}")
    print(f"Request resource_group_names: {request.resource_group_names}")
    print("=" * 80)
    logger.info("=" * 80)
    logger.info("=== API ENDPOINT CALLED: /aks/namespaces ===")
    logger.info(f"Request subscription_id: {request.subscription_id}")
    logger.info(f"Request resource_group_names: {request.resource_group_names}")
    logger.info("=" * 80)
    
    try:
        subscription_id = request.subscription_id
        resource_group_names = request.resource_group_names
        
        logger.info(f"Step 1: Validating request...")
        
        if not subscription_id:
            raise HTTPException(status_code=400, detail="Subscription ID is required")
        
        if not resource_group_names or len(resource_group_names) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one resource group name is required"
            )
        
        azure_service = get_azure_service(subscription_id)
        resources = await azure_service.get_resources_by_resource_groups(resource_group_names)
        
        # Find AKS clusters
        logger.info(f"Searching for AKS clusters in {len(resources)} resources...")
        aks_clusters = [
            r for r in resources 
            if "microsoft.containerservice/managedclusters" in r.type.lower()
        ]
        
        logger.info(f"Found {len(aks_clusters)} AKS cluster(s)")
        for cluster in aks_clusters:
            logger.info(f"  - Cluster: {cluster.name}, Type: {cluster.type}, RG: {cluster.resource_group}")
        
        if not aks_clusters:
            logger.warning("No AKS clusters found in selected resource groups")
            return {
                "status": "success",
                "data": [],
                "message": "No AKS clusters found in selected resource groups"
            }
        
        # Get namespaces from each cluster
        logger.info(f"Initializing AKS service for subscription: {subscription_id}")
        aks_service = AKSService(subscription_id)
        cluster_namespaces = {}
        
        logger.info(f"Step 4: Processing {len(aks_clusters)} cluster(s) for namespace discovery...")
        for idx, cluster in enumerate(aks_clusters, 1):
            try:
                logger.info("=" * 80)
                logger.info(f"=== CLUSTER {idx}/{len(aks_clusters)}: {cluster.name} ===")
                logger.info(f"Cluster type: {cluster.type}")
                logger.info(f"Cluster ID: {cluster.id}")
                logger.info(f"Resource Group: {cluster.resource_group}")
                logger.info("Calling aks_service.list_cluster_namespaces()...")
                logger.info("=" * 80)
                namespaces = await aks_service.list_cluster_namespaces(cluster)
                logger.info(f"✓ Got {len(namespaces)} namespaces from cluster {cluster.name}")
                if namespaces:
                    logger.info(f"Namespaces: {namespaces[:5]}...")  # Show first 5
                else:
                    logger.warning(f"⚠ No namespaces returned for cluster {cluster.name}")
                logger.info(f"Retrieved {len(namespaces)} namespaces from cluster {cluster.name}")
                logger.info(f"Namespaces list: {namespaces}")
                cluster_namespaces[cluster.name] = {
                    "cluster_name": cluster.name,
                    "resource_group": cluster.resource_group,
                    "namespaces": namespaces
                }
                if len(namespaces) == 0:
                    logger.warning(f"No namespaces found for cluster {cluster.name}. This might indicate:")
                    logger.warning("  1. kubectl is not installed or not in PATH")
                    logger.warning("  2. Kubernetes Python client failed and kubectl fallback also failed")
                    logger.warning("  3. Cluster credentials are not configured (run: az aks get-credentials)")
                    logger.warning("  4. No non-system namespaces exist in the cluster")
                    logger.warning("  5. Backend is running in Azure App Service and kubectl installation failed")
                    logger.warning("  Note: In Azure App Service, kubectl should be installed by startup.sh")
                    logger.warning("  Check App Service logs for startup.sh execution and kubectl installation")
                    logger.warning("  Also check if Managed Identity has permissions to access AKS cluster")
            except Exception as e:
                logger.error(f"Error getting namespaces from cluster {cluster.name}: {e}", exc_info=True)
                cluster_namespaces[cluster.name] = {
                    "cluster_name": cluster.name,
                    "resource_group": cluster.resource_group,
                    "namespaces": [],
                    "error": f"Failed to retrieve namespaces: {str(e)}"
                }
        
        return {
            "status": "success",
            "data": list(cluster_namespaces.values()),
            "count": len(cluster_namespaces)
        }
    except Exception as e:
            logger.error(f"Error getting AKS namespaces: {e}", exc_info=True)
            import traceback
            error_detail = {
                "status": "error",
                "error": str(e),
                "traceback": traceback.format_exc()
            }
            logger.error(f"Full traceback: {traceback.format_exc()}")
            raise HTTPException(
                status_code=500,
                detail=error_detail
            )


@router.post("/azure/resources")
async def get_resources(request: ResourcesRequest):
    """
    Get all resources (services) in selected resource groups.
    
    Args:
        request: Resources request
        
    Returns:
        List of resources
    """
    try:
        subscription_id = request.subscription_id
        resource_group_names = request.resource_group_names
        
        if not subscription_id:
            raise HTTPException(status_code=400, detail="Subscription ID is required")
        
        if not resource_group_names or len(resource_group_names) == 0:
            raise HTTPException(
                status_code=400,
                detail="At least one resource group name is required"
            )
        
        azure_service = get_azure_service(subscription_id)
        resources = await azure_service.get_resources_by_resource_groups(resource_group_names)
        
        # Discover pods from AKS clusters
        try:
            logger.info(f"Starting AKS pod discovery for {len(resources)} resources...")
            aks_service = AKSService(subscription_id)
            # Don't filter by specific namespaces - let auto-detection find all Temenos namespaces
            # This will discover: eventstore, adapterservice, genericconfig, holdings, partyv2, transact, etc.
            aks_pods = await aks_service.discover_pods_from_resources(resources, temenos_namespaces=None)
            
            if aks_pods:
                logger.info(f"✓ Successfully discovered {len(aks_pods)} AKS pods from Temenos namespaces")
                logger.info(f"Sample pod namespaces: {list(set([p.properties.get('namespace', 'unknown') for p in aks_pods[:5]]))}")
                resources.extend(aks_pods)
                logger.info(f"Total resources after adding pods: {len(resources)}")
            else:
                logger.warning("⚠ No AKS pods discovered - this might indicate:")
                logger.warning("  1. No AKS clusters found in resource groups")
                logger.warning("  2. AKS discovery failed (check logs above)")
                logger.warning("  3. No Temenos namespaces found in clusters")
        except Exception as e:
            logger.error(f"❌ Failed to discover AKS pods: {e}", exc_info=True)
            # Don't fail the whole request if AKS discovery fails
        
        return {
            "status": "success",
            "data": [r.to_dict() for r in resources],
            "count": len(resources)
        }
    except Exception as e:
        logger.error(f"Error getting resources: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "error": str(e),
                "errorType": "unknown",
                "recoverySteps": [
                    "Check backend server logs",
                    "Verify Azure CLI is installed and logged in",
                    "Try restarting the backend server"
                ]
            }
        )


@router.post("/temenos/analyze")
async def analyze_services(request: AnalyzeRequest):
    """Analyze Azure services for Temenos components (uses cache by default)."""
    return await _analyze_services_impl(request)


@router.post("/temenos/analyze/refresh")
async def refresh_analysis(request: AnalyzeRequest):
    """Refresh analysis - forces RAG queries even if cached."""
    request.force_refresh = True
    return await _analyze_services_impl(request)


async def _analyze_services_impl(request: AnalyzeRequest):
    """
    Analyze Azure services and identify Temenos components.
    
    Args:
        request: Analysis request
        
    Returns:
        Analysis results
    """
    try:
        services_data = request.services
        analysis_id = request.analysis_id or f"analysis_{int(time.time() * 1000)}"
        
        if not services_data or len(services_data) == 0:
            raise HTTPException(
                status_code=400,
                detail="Services array is required"
            )
        
        # Convert dicts to AzureResource objects
        services = []
        for svc_data in services_data:
            services.append(AzureResource(
                id=svc_data.get("id", ""),
                name=svc_data.get("name", ""),
                resource_type=svc_data.get("type", ""),
                location=svc_data.get("location", ""),
                resource_group=svc_data.get("resourceGroup", ""),
                tags=svc_data.get("tags", {}),
                properties=svc_data.get("properties", {})
            ))
        
        # Discover AKS pods from ALL Temenos namespaces (not just selected ones)
        # This ensures we find all pods, then we can filter if needed
        selected_namespaces = request.selected_namespaces if request.selected_namespaces else None
        
        # Extract subscription ID from first resource
        subscription_id = None
        if services and services[0].id:
            id_parts = services[0].id.split("/")
            if "subscriptions" in id_parts:
                subscription_id = id_parts[id_parts.index("subscriptions") + 1]
        
        if subscription_id:
            try:
                # Find AKS clusters in the resources
                aks_clusters = [s for s in services if "microsoft.containerservice/managedclusters" in s.type.lower()]
                if aks_clusters:
                    aks_service = AKSService(subscription_id)
                    
                    # ALWAYS discover from ALL Temenos namespaces (auto-detection)
                    # This ensures we find all pods regardless of selection
                    logger.info(f"Discovering pods from ALL Temenos namespaces (auto-detection)...")
                    aks_pods = await aks_service.discover_pods_from_resources(services, temenos_namespaces=None)
                    
                    # Log what we found
                    if aks_pods:
                        all_pod_namespaces = list(set([p.properties.get('namespace', 'unknown') for p in aks_pods]))
                        logger.info(f"✓ Discovered pods from {len(all_pod_namespaces)} namespaces: {all_pod_namespaces}")
                        
                        # If namespaces were selected, log which ones match
                        if selected_namespaces and len(selected_namespaces) > 0:
                            matching_namespaces = [ns for ns in all_pod_namespaces if ns in selected_namespaces]
                            logger.info(f"Selected namespaces {selected_namespaces} match {len(matching_namespaces)} discovered namespaces: {matching_namespaces}")
                    
                    if aks_pods:
                        logger.info(f"✓ Successfully discovered {len(aks_pods)} AKS pods")
                        pod_namespaces = list(set([p.properties.get('namespace', 'unknown') for p in aks_pods]))
                        logger.info(f"Pod namespaces found: {pod_namespaces}")
                        services.extend(aks_pods)
                        logger.info(f"Total services after adding pods: {len(services)}")
                    else:
                        logger.warning("No AKS pods discovered")
            except Exception as e:
                logger.error(f"Failed to discover AKS pods: {e}", exc_info=True)
                # Continue with analysis even if AKS discovery fails
        
        # Log what we're analyzing
        pod_count = sum(1 for s in services if "managedclusters/pods" in s.type.lower())
        logger.info(f"Analyzing {len(services)} services ({pod_count} AKS pods, {len(services) - pod_count} Azure resources)")
        if pod_count > 0:
            pod_namespaces = list(set([s.properties.get("namespace", "unknown") for s in services if "managedclusters/pods" in s.type.lower()]))
            logger.info(f"Pod namespaces: {pod_namespaces}")
        
        # Initialize Temenos service
        temenos_service = TemenosService()
        
        # Analyze services (use cache by default, unless force_refresh is True)
        force_refresh = getattr(request, 'force_refresh', False)
        results = await temenos_service.analyze_services(services, use_cache=True, force_refresh=force_refresh)
        
        # Deduplicate components (simplified version)
        deduplicated_results = _deduplicate_components(results)
        
        return {
            "status": "success",
            "data": [r.to_dict() for r in deduplicated_results],
            "count": len(deduplicated_results),
            "processed": len(services),
            "analysisId": analysis_id
        }
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "status": "error",
                "error": str(e),
                "serviceCount": len(request.services) if request.services else 0
            }
        )


def _deduplicate_components(results: List[TemenosAnalysisResult]) -> List[TemenosAnalysisResult]:
    """
    Deduplicate components by grouping services with the same normalized component name.
    For AKS pods, group by namespace/component rather than individual pod names.
    """
    component_map: Dict[str, TemenosAnalysisResult] = {}
    unidentified: List[TemenosAnalysisResult] = []
    
    for result in results:
        if not result.component_info:
            unidentified.append(result)
            continue
        
        # Use normalized component name for grouping (not the individual service/pod name)
        # This groups all pods from the same namespace/component together
        normalized_name = result.component_info.component_name
        
        # For AKS pods, group by namespace ONLY - all pods in same namespace = one component
        # This way: eventstore namespace = 1 component, adapterservice = 1 component, etc.
        if "managedclusters/pods" in result.service.type.lower():
            namespace = result.service.properties.get("namespace", "")
            if namespace:
                # Use namespace as the PRIMARY grouping key
                # All pods from the same namespace should be grouped as ONE component
                # This ensures: adapterservice (3 pods) = 1 component, eventstore (3 pods) = 1 component
                grouping_key = namespace.lower()  # Use lowercase for consistency
            else:
                # Fallback if namespace not found (shouldn't happen)
                grouping_key = normalized_name
        else:
            # For non-pod resources, use normalized name
            # But exclude infrastructure types
            if any(infra_type in result.service.type.lower() for infra_type in [
                "microsoft.storage", "microsoft.keyvault", "microsoft.network",
                "microsoft.insights", "microsoft.operationalinsights"
            ]):
                # Skip infrastructure resources - they shouldn't be Temenos components
                logger.debug(f"Skipping infrastructure resource: {result.service.name} ({result.service.type})")
                unidentified.append(result)
                continue
            grouping_key = normalized_name
        
        existing = component_map.get(grouping_key)
        
        if not existing:
            component_map[grouping_key] = result
        else:
            # Merge services - add related services list
            # Keep the first result but note that there are multiple instances
            if result.service.name not in existing.component_info.related_services:
                existing.component_info.related_services.append(result.service.name)
    
    # Filter out infrastructure services from unidentified
    # Infrastructure services are not meaningful to show as "Other Azure Services"
    infrastructure_types = [
        "microsoft.storage", "microsoft.keyvault", "microsoft.network",
        "microsoft.insights", "microsoft.operationalinsights", "microsoft.compute/virtualmachines",
        "microsoft.compute/virtualmachinescalesets"
    ]
    
    filtered_unidentified = []
    for result in unidentified:
        resource_type = result.service.type.lower()
        # Skip infrastructure resources
        if any(infra_type in resource_type for infra_type in infrastructure_types):
            logger.debug(f"Filtering out infrastructure resource: {result.service.name} ({result.service.type})")
            continue
        filtered_unidentified.append(result)
    
    # Return identified components first, then filtered unidentified
    identified = list(component_map.values())
    logger.info(f"Deduplication: {len(identified)} unique components from {len(results)} results")
    logger.info(f"Filtered out {len(unidentified) - len(filtered_unidentified)} infrastructure services")
    return identified + filtered_unidentified


@router.get("/temenos/health")
async def temenos_health():
    """Health check for Temenos API."""
    try:
        temenos_service = TemenosService()
        # Simple check - verify JWT token is set
        if not temenos_service.jwt_token:
            raise HTTPException(status_code=500, detail="RAG_JWT_TOKEN not configured")
        
        return {
            "status": "success",
            "message": "Temenos service is available"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/temenos/query")
async def query_rag(request: Dict[str, Any]):
    """
    Query Temenos RAG API directly.
    
    Args:
        request: Query request with question, region, RAGmodelId, and optional context
        
    Returns:
        RAG API response
    """
    try:
        question = request.get("question")
        region = request.get("region", "global")
        rag_model_id = request.get("RAGmodelId")
        context = request.get("context")
        
        if not question or not rag_model_id:
            raise HTTPException(
                status_code=400,
                detail="question and RAGmodelId are required"
            )
        
        temenos_service = TemenosService()
        result = await temenos_service.query_rag(
            question=question,
            region=region,
            rag_model_id=rag_model_id,
            context=context
        )
        
        return {
            "status": "success",
            "data": result.get("data", result)
        }
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ValueError as e:
        # Configuration errors
        logger.error(f"RAG configuration error: {e}", exc_info=True)
        error_detail = f"RAG configuration error: {str(e)}. Please check RAG_JWT_TOKEN and RAG_API_URL environment variables."
        raise HTTPException(
            status_code=500,
            detail=error_detail
        )
    except RuntimeError as e:
        # Runtime errors (e.g., adapter not initialized)
        logger.error(f"RAG runtime error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
    except Exception as e:
        # Other exceptions - provide more context
        error_msg = str(e)
        error_type = type(e).__name__
        logger.error(f"RAG query error ({error_type}): {e}", exc_info=True)
        
        # Provide more helpful error messages based on error type
        if "timeout" in error_msg.lower() or "TimeoutException" in error_type:
            error_msg = f"RAG API request timed out. The RAG service may be slow or unavailable. Original error: {error_msg}"
        elif "401" in error_msg or "403" in error_msg or "unauthorized" in error_msg.lower():
            error_msg = f"RAG API authentication failed. Please check RAG_JWT_TOKEN. Original error: {error_msg}"
        elif "connection" in error_msg.lower() or "network" in error_msg.lower():
            error_msg = f"Failed to connect to RAG API. Please check RAG_API_URL and network connectivity. Original error: {error_msg}"
        elif "RAG_JWT_TOKEN" in error_msg or "RAG_API_URL" in error_msg:
            error_msg = f"RAG configuration issue: {error_msg}. Please check environment variables."
        
        raise HTTPException(
            status_code=500,
            detail=f"[{error_type}] {error_msg}"
        )


@router.get("/temenos/jwt-info")
async def get_jwt_info(settings: Settings = Depends(get_settings)):
    """
    Get JWT token information including expiration status.

    Returns:
        JWT token expiration information
    """
    import jwt
    from datetime import datetime

    try:
        if not settings.RAG_JWT_TOKEN:
            raise HTTPException(
                status_code=500,
                detail="RAG_JWT_TOKEN not configured"
            )

        # Decode JWT without verification to get payload
        payload = jwt.decode(
            settings.RAG_JWT_TOKEN,
            options={"verify_signature": False}
        )

        exp_timestamp = payload.get("exp")
        iat_timestamp = payload.get("iat")

        if not exp_timestamp:
            jwt_data = {
                "configured": True,
                "has_expiration": False,
                "user_id": payload.get("user_id"),
                "email": payload.get("email")
            }
            return {"success": True, "data": jwt_data}

        exp_date = datetime.fromtimestamp(exp_timestamp)
        iat_date = datetime.fromtimestamp(iat_timestamp) if iat_timestamp else None
        now = datetime.now()

        is_expired = exp_date < now
        days_remaining = (exp_date - now).days if not is_expired else 0

        jwt_data = {
            "configured": True,
            "has_expiration": True,
            "is_expired": is_expired,
            "expires_at": exp_date.isoformat(),
            "issued_at": iat_date.isoformat() if iat_date else None,
            "days_remaining": days_remaining,
            "user_id": payload.get("user_id"),
            "email": payload.get("email"),
            "issuer": payload.get("iss"),
            "audience": payload.get("aud")
        }

        return {"success": True, "data": jwt_data}
    except jwt.DecodeError:
        raise HTTPException(
            status_code=500,
            detail="Invalid JWT token format"
        )
    except Exception as e:
        logger.error(f"Error getting JWT info: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving JWT information: {str(e)}"
        )

