"""
AKS Service

Handles Azure Kubernetes Service (AKS) interactions to discover pods and namespaces.
"""

from typing import List, Optional, Dict, Any
from azure.identity import DefaultAzureCredential, AzureCliCredential
from azure.mgmt.containerservice import ContainerServiceClient
from azure.core.exceptions import AzureError
from app.core.logging import get_logger
from app.services.azure_service import AzureResource
import base64
import subprocess
import json
import re
import tempfile
import os

# Kubernetes Python client
try:
    from kubernetes import client as k8s_client, config as k8s_config
    from kubernetes.client.rest import ApiException
    KUBERNETES_AVAILABLE = True
except ImportError:
    KUBERNETES_AVAILABLE = False
    # Logger not yet initialized, use print for now
    print("WARNING: kubernetes Python client library not available. AKS namespace discovery will use kubectl fallback.")

logger = get_logger(__name__)


class AKSPod:
    """AKS Pod model."""
    def __init__(
        self,
        name: str,
        namespace: str,
        cluster_name: str,
        cluster_resource_group: str,
        status: str = "Unknown",
        labels: Optional[Dict[str, str]] = None,
        containers: Optional[List[str]] = None
    ):
        self.name = name
        self.namespace = namespace
        self.cluster_name = cluster_name
        self.cluster_resource_group = cluster_resource_group
        self.status = status
        self.labels = labels or {}
        self.containers = containers or []

    def to_azure_resource(self) -> AzureResource:
        """Convert pod to AzureResource for analysis."""
        # Create a synthetic resource ID
        resource_id = f"/subscriptions/{self.cluster_resource_group}/resourceGroups/{self.cluster_resource_group}/providers/Microsoft.ContainerService/managedClusters/{self.cluster_name}/namespaces/{self.namespace}/pods/{self.name}"
        
        # Use namespace as the primary identifier for Temenos components
        # This helps with component identification
        pod_display_name = f"{self.namespace}/{self.name}"
        
        # Ensure namespace is in properties for Temenos service to find it
        # Also store in tags for redundancy
        resource = AzureResource(
            id=resource_id,
            name=pod_display_name,
            resource_type="Microsoft.ContainerService/managedClusters/pods",
            location="",  # Pods don't have location
            resource_group=self.cluster_resource_group,
            tags={
                **self.labels,
                "namespace": self.namespace,  # Store namespace in tags too
                "pod_name": self.name,
                "cluster": self.cluster_name
            },
            properties={
                "namespace": self.namespace,  # CRITICAL: Must be here for Temenos service
                "cluster": self.cluster_name,
                "status": self.status,
                "containers": self.containers,
                "pod_name": self.name,
                "namespace_name": self.namespace  # Redundant but ensures it's always available
            }
        )
        
        # Debug logging
        logger.debug(f"Converted pod {self.name} from namespace {self.namespace} to AzureResource")
        logger.debug(f"  Resource type: {resource.type}")
        logger.debug(f"  Properties namespace: {resource.properties.get('namespace')}")
        logger.debug(f"  Tags namespace: {resource.tags.get('namespace')}")
        
        return resource


class AKSService:
    """Service for interacting with AKS clusters."""
    
    def __init__(self, subscription_id: str):
        """
        Initialize AKS service.
        
        Args:
            subscription_id: Azure subscription ID
        """
        self.subscription_id = subscription_id
        # Detect if running in Azure App Service
        import os
        self.is_azure_app_service = os.getenv("WEBSITE_SITE_NAME") is not None
        
        try:
            # For Azure App Service, use DefaultAzureCredential (Managed Identity)
            # For local development, try Azure CLI first, then DefaultAzureCredential
            if self.is_azure_app_service:
                # In Azure App Service, use Managed Identity via DefaultAzureCredential
                credential = DefaultAzureCredential()
                logger.info("Using DefaultAzureCredential (Azure App Service - Managed Identity)")
            else:
                # Local development: try Azure CLI first, then DefaultAzureCredential
                try:
                    credential = AzureCliCredential()
                    logger.info("Using Azure CLI credential (local development)")
                except Exception:
                    # Fall back to DefaultAzureCredential if Azure CLI credential fails
                    credential = DefaultAzureCredential()
                    logger.info("Using DefaultAzureCredential (tries multiple credential sources)")
            
            self.client = ContainerServiceClient(credential, subscription_id)
            logger.info(f"AKS service initialized for subscription: {subscription_id}")
        except Exception as e:
            logger.error(f"Failed to initialize AKS client: {e}", exc_info=True)
            raise RuntimeError(f"Failed to initialize AKS client: {e}")

    def _is_aks_cluster(self, resource: AzureResource) -> bool:
        """Check if resource is an AKS cluster."""
        return resource.type.lower() == "microsoft.containerservice/managedclusters"

    async def get_aks_clusters(self, resources: List[AzureResource]) -> List[AzureResource]:
        """Filter and return only AKS cluster resources."""
        return [r for r in resources if self._is_aks_cluster(r)]

    async def get_cluster_credentials(self, resource_group: str, cluster_name: str) -> Optional[Dict[str, str]]:
        """
        Get AKS cluster credentials using Azure CLI.
        
        Args:
            resource_group: Resource group name
            cluster_name: AKS cluster name
            
        Returns:
            Dict with kubeconfig path or None if failed
        """
        try:
            import tempfile
            import os
            import asyncio
            
            # Create temporary kubeconfig file
            temp_dir = tempfile.gettempdir()
            kubeconfig_path = os.path.join(temp_dir, f"{cluster_name}_kubeconfig.yaml")
            
            # Run subprocess commands in executor to avoid blocking
            loop = asyncio.get_event_loop()
            
            # Use Azure CLI to get credentials
            # On Windows, use az.cmd if az.exe doesn't work
            def _get_credentials():
                import shutil
                # Find az command
                az_cmd = shutil.which("az") or shutil.which("az.cmd") or "az"
                cmd = [
                    az_cmd, "aks", "get-credentials",
                    "--resource-group", resource_group,
                    "--name", cluster_name,
                    "--file", kubeconfig_path,
                    "--overwrite-existing"
                ]
                return subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=30,
                    shell=False
                )
            
            result = await loop.run_in_executor(None, _get_credentials)
            
            # Azure CLI may return non-zero for warnings, but command might still succeed
            # Check if kubeconfig file was created
            kubeconfig_exists = os.path.exists(kubeconfig_path)
            
            if result.returncode != 0 and not kubeconfig_exists:
                error_output = result.stderr or result.stdout or "Unknown error"
                logger.warning(f"Failed to get credentials for {cluster_name}. Return code: {result.returncode}")
                logger.warning(f"Error output: {error_output[:500]}")
                # Try using default kubeconfig location as fallback
                default_kubeconfig = os.path.expanduser("~/.kube/config")
                if os.path.exists(default_kubeconfig):
                    logger.info(f"Trying default kubeconfig at {default_kubeconfig}")
                    # Check if cluster context exists in default config
                    def _check_default_config():
                        return subprocess.run(
                            [shutil.which("kubectl") or "kubectl", "config", "get-contexts", "--kubeconfig", default_kubeconfig],
                            capture_output=True,
                            text=True,
                            timeout=5
                        )
                    check_result = await loop.run_in_executor(None, _check_default_config)
                    if check_result.returncode == 0 and cluster_name in check_result.stdout:
                        logger.info(f"Found cluster context in default kubeconfig, using it")
                        return {"kubeconfig_path": default_kubeconfig, "cluster_name": cluster_name, "use_default": True}
                return None
            
            # If kubeconfig was created (even with warnings), use it
            if kubeconfig_exists:
                logger.info(f"Successfully created kubeconfig at {kubeconfig_path}")
            else:
                # Fallback to default kubeconfig
                default_kubeconfig = os.path.expanduser("~/.kube/config")
                if os.path.exists(default_kubeconfig):
                    logger.info(f"Using default kubeconfig at {default_kubeconfig}")
                    kubeconfig_path = default_kubeconfig
                else:
                    logger.warning(f"Kubeconfig not created and default not found")
                    return None
            
            # Verify kubectl can access the cluster
            def _check_kubectl():
                import shutil
                import os
                kubectl_cmd = shutil.which("kubectl") or "kubectl"
                env = os.environ.copy()
                env["KUBECONFIG"] = kubeconfig_path
                return subprocess.run(
                    [kubectl_cmd, "version", "--client"],
                    capture_output=True,
                    text=True,
                    timeout=10,
                    env=env,
                    shell=False
                )
            
            kubectl_result = await loop.run_in_executor(None, _check_kubectl)
            
            if kubectl_result.returncode == 0:
                return {"kubeconfig_path": kubeconfig_path, "cluster_name": cluster_name}
            
            return None
        except Exception as e:
            error_msg = str(e)
            if "timeout" in error_msg.lower() or "timed out" in error_msg.lower():
                logger.warning(f"Timeout getting credentials for {cluster_name}")
            elif "cannot find the file" in error_msg.lower() or "not found" in error_msg.lower():
                logger.error(f"Azure CLI or kubectl not found. Please ensure 'az' and 'kubectl' are installed and in PATH")
            else:
                logger.warning(f"Error getting credentials for {cluster_name}: {e}")
            return None

    async def get_pods_from_cluster(
        self,
        cluster: AzureResource,
        temenos_namespaces: Optional[List[str]] = None
    ) -> List[AKSPod]:
        """
        Get pods from an AKS cluster, optionally filtered by namespaces.
        
        Args:
            cluster: AKS cluster resource
            temenos_namespaces: Optional list of namespace names to filter (e.g., ['transact', 'eventstore', 'holdings'])
            
        Returns:
            List of pods
        """
        pods = []
        
        try:
            # Extract resource group from cluster ID
            # Format: /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.ContainerService/managedClusters/{name}
            id_parts = cluster.id.split("/")
            resource_group = id_parts[id_parts.index("resourceGroups") + 1] if "resourceGroups" in id_parts else cluster.resource_group
            cluster_name = cluster.name
            
            # Try to get credentials, but fallback to default kubeconfig if it fails
            creds = await self.get_cluster_credentials(resource_group, cluster_name)
            
            # Use default kubeconfig if credentials failed or use_default flag is set
            import os
            default_kubeconfig = os.path.expanduser("~/.kube/config")
            
            if not creds:
                if os.path.exists(default_kubeconfig):
                    logger.info(f"Using default kubeconfig at {default_kubeconfig} for cluster {cluster_name}")
                    kubeconfig_path = default_kubeconfig
                    # Try to switch context to this cluster
                    import asyncio
                    loop = asyncio.get_event_loop()
                    def _set_context():
                        import shutil
                        kubectl_cmd = shutil.which("kubectl") or "kubectl"
                        return subprocess.run(
                            [kubectl_cmd, "config", "use-context", cluster_name],
                            capture_output=True,
                            text=True,
                            timeout=5
                        )
                    context_result = await loop.run_in_executor(None, _set_context)
                    if context_result.returncode != 0:
                        logger.warning(f"Could not switch to context {cluster_name}, but will try anyway")
                else:
                    logger.warning(f"Could not get credentials for cluster {cluster_name} and no default kubeconfig found")
                    return pods
            else:
                kubeconfig_path = creds.get("kubeconfig_path")
                if not kubeconfig_path:
                    kubeconfig_path = default_kubeconfig if os.path.exists(default_kubeconfig) else None
                    if not kubeconfig_path:
                        logger.warning(f"No kubeconfig available for cluster {cluster_name}")
                        return pods
            
            # Get namespaces first - use same approach as list_cluster_namespaces
            import asyncio
            import shutil
            import os
            # Use just "kubectl" command name (not full path) - works better with Rancher Desktop
            kubectl_path = shutil.which("kubectl") or shutil.which("kubectl.exe")
            kubectl_cmd = "kubectl"  # Use just the command name, not full path
            
            # Use KUBECONFIG environment variable
            env = os.environ.copy()
            env["KUBECONFIG"] = kubeconfig_path
            
            # NOTE: Rancher Desktop kubectl doesn't support "kubectl config" commands
            # The context should already be set by Azure CLI when we ran "az aks get-credentials"
            # So we'll skip context switching and just use the current context
            logger.info(f"Skipping context switch (Rancher Desktop kubectl doesn't support 'config' command)")
            logger.info(f"Assuming context '{cluster_name}' is already set from Azure CLI credentials")
            
            cmd_parts = [kubectl_cmd, "get", "namespaces", "-o", "json"]
            
            logger.debug(f"Getting namespaces with command: {' '.join(cmd_parts)}")
            logger.debug(f"KUBECONFIG={kubeconfig_path}")
            
            try:
                def _run_kubectl():
                    result = subprocess.run(
                        cmd_parts,
                        capture_output=True,
                        text=True,
                        timeout=30,
                        env=env,
                        shell=False
                    )
                    logger.debug(f"kubectl return code: {result.returncode}")
                    if result.returncode != 0:
                        logger.debug(f"kubectl stderr: {result.stderr[:500]}")
                    return result
                
                loop = asyncio.get_event_loop()
                result = await loop.run_in_executor(None, _run_kubectl)
                
                if result.returncode != 0:
                    error_msg = result.stderr if result.stderr else "Unknown error"
                    logger.warning(f"Failed to get namespaces from {cluster_name}: {error_msg}")
                    logger.debug(f"Full command: {' '.join(cmd_parts)}")
                    logger.debug(f"KUBECONFIG: {env.get('KUBECONFIG')}")
                    return pods
                
                result_stdout = result.stdout if result.stdout else "{}"
            except Exception as e:
                logger.warning(f"Error executing kubectl for namespaces: {e}", exc_info=True)
                return pods
            
            try:
                namespaces_data = json.loads(result_stdout)
                namespaces = []
                
                for ns in namespaces_data.get("items", []):
                    ns_name = ns.get("metadata", {}).get("name", "")
                    
                    # Skip system namespaces
                    if ns_name in ["kube-system", "kube-public", "kube-node-lease", "default"]:
                        continue
                    
                    # Filter by Temenos-related namespaces if provided
                    if temenos_namespaces:
                        if any(tns.lower() in ns_name.lower() for tns in temenos_namespaces):
                            namespaces.append(ns_name)
                            logger.debug(f"Including namespace '{ns_name}' (matched filter)")
                    else:
                        # Auto-detect Temenos namespaces - use comprehensive patterns
                        # Match namespaces that contain these patterns (even with numbers/suffixes)
                        temenos_patterns = [
                            r"transact", r"eventstore", r"adapter", r"genericconfig",
                            r"holdings", r"party", r"modular", r"temenos", r"tap",
                            r"stmtgen", r"notification", r"audit", r"file", r"workflow",
                            r"deposits", r"lending", r"webingress", r"ingress", r"payment",
                            r"card", r"account", r"transaction", r"core", r"banking",
                            r"integration", r"api", r"gateway", r"service", r"microservice"
                        ]
                        # Also check if namespace starts with or contains these patterns
                        # This handles cases like "deposits202507", "ingress-nginx-transact", etc.
                        # Be more permissive - include if it matches any pattern
                        if any(re.search(pattern, ns_name, re.IGNORECASE) for pattern in temenos_patterns):
                            namespaces.append(ns_name)
                            logger.info(f"Including namespace '{ns_name}' (matched Temenos pattern)")
                        else:
                            # If no explicit filter and namespace doesn't match patterns, still include it
                            # This ensures we don't miss any potential Temenos namespaces
                            # Only skip if it's clearly a system namespace
                            if not ns_name.startswith(("kube-", "system-", "default")):
                                namespaces.append(ns_name)
                                logger.info(f"Including namespace '{ns_name}' (non-system namespace)")
                            else:
                                logger.debug(f"Skipping namespace '{ns_name}' (system namespace)")
                
                logger.info(f"Found {len(namespaces)} Temenos-related namespaces in {cluster_name}: {namespaces}")
                
                # Get pods from each namespace - use subprocess.run via executor
                for namespace in namespaces:
                    logger.info(f"Querying pods from namespace '{namespace}' in cluster '{cluster_name}'")
                    import shutil
                    import os
                    # Use just "kubectl" command name (not full path) - works better with Rancher Desktop
                    kubectl_path = shutil.which("kubectl") or shutil.which("kubectl.exe")
                    kubectl_cmd = "kubectl"  # Use just the command name, not full path
                    
                    env = os.environ.copy()
                    env["KUBECONFIG"] = kubeconfig_path
                    
                    # NOTE: Rancher Desktop kubectl doesn't support "kubectl config" commands
                    # Skip context switching - assume context is already set from Azure CLI
                    logger.debug(f"Skipping context switch for pods (Rancher Desktop limitation)")
                    
                    # Try JSON format first - use --namespace instead of -n (Rancher Desktop compatibility)
                    cmd_pods_json = [
                        kubectl_cmd, "get", "pods",
                        "--namespace", namespace,
                        "-o", "json"
                    ]
                    
                    try:
                        def _get_pods_json():
                            return subprocess.run(
                                cmd_pods_json,
                                capture_output=True,
                                text=True,
                                timeout=30,
                                env=env,
                                shell=False
                            )
                        
                        loop = asyncio.get_event_loop()
                        result = await loop.run_in_executor(None, _get_pods_json)
                        
                        pods_parsed = False
                        if result.returncode == 0:
                            try:
                                pods_data = json.loads(result.stdout if result.stdout else "{}")
                                namespace_pod_count = 0
                                for pod in pods_data.get("items", []):
                                    pod_metadata = pod.get("metadata", {})
                                    pod_status = pod.get("status", {})
                                    
                                    pod_name = pod_metadata.get("name", "")
                                    pod_labels = pod_metadata.get("labels", {})
                                    
                                    # Get container names
                                    containers = []
                                    for container in pod.get("spec", {}).get("containers", []):
                                        containers.append(container.get("name", ""))
                                    
                                    # Get pod status
                                    phase = pod_status.get("phase", "Unknown")
                                    
                                    pods.append(AKSPod(
                                        name=pod_name,
                                        namespace=namespace,
                                        cluster_name=cluster_name,
                                        cluster_resource_group=resource_group,
                                        status=phase,
                                        labels=pod_labels,
                                        containers=containers
                                    ))
                                    namespace_pod_count += 1
                                
                                logger.info(f"Found {namespace_pod_count} pods in namespace '{namespace}' (JSON format)")
                                pods_parsed = True
                            except json.JSONDecodeError as e:
                                logger.warning(f"Failed to parse pods JSON for namespace {namespace}: {e}")
                                logger.debug(f"Response: {result.stdout[:200] if result.stdout else 'None'}")
                        else:
                            error_msg = result.stderr if result.stderr else "Unknown error"
                            # Check if it's the same "-o" flag error
                            if "unknown shorthand flag" in error_msg.lower() or "unknown flag" in error_msg.lower():
                                logger.warning(f"kubectl doesn't support -o flag for pods, trying table format...")
                            else:
                                logger.warning(f"Failed to get pods from namespace '{namespace}': {error_msg}")
                        
                        # If JSON failed, try table format (Rancher Desktop limitation)
                        if not pods_parsed:
                            logger.info(f"Trying table format for pods in namespace '{namespace}'...")
                            cmd_pods_table = [
                                kubectl_cmd, "get", "pods",
                                "--namespace", namespace
                            ]
                            
                            def _get_pods_table():
                                return subprocess.run(
                                    cmd_pods_table,
                                    capture_output=True,
                                    text=True,
                                    timeout=30,
                                    env=env,
                                    shell=False
                                )
                            
                            result_table = await loop.run_in_executor(None, _get_pods_table)
                            
                            if result_table.returncode == 0 and result_table.stdout:
                                # Parse table format
                                # Format: NAME READY STATUS RESTARTS AGE
                                lines = result_table.stdout.strip().split('\n')
                                if len(lines) > 1:  # Has header + data
                                    namespace_pod_count = 0
                                    for line in lines[1:]:  # Skip header line
                                        parts = line.split()
                                        if len(parts) > 0:
                                            pod_name = parts[0].strip()
                                            if pod_name:
                                                # Get status from parts (usually index 2)
                                                pod_status = parts[2] if len(parts) > 2 else "Unknown"
                                                
                                                pods.append(AKSPod(
                                                    name=pod_name,
                                                    namespace=namespace,
                                                    cluster_name=cluster_name,
                                                    cluster_resource_group=resource_group,
                                                    status=pod_status,
                                                    labels={},
                                                    containers=[]
                                                ))
                                                namespace_pod_count += 1
                                    
                                    logger.info(f"Found {namespace_pod_count} pods in namespace '{namespace}' (table format)")
                                else:
                                    logger.warning(f"No pods found in namespace '{namespace}' (table format)")
                            else:
                                error_msg = result_table.stderr if result_table.stderr else "Unknown error"
                                logger.warning(f"Failed to get pods from namespace '{namespace}' (table format): {error_msg}")
                    except Exception as e:
                        logger.warning(f"Error getting pods from namespace '{namespace}': {e}", exc_info=True)
                        continue
                
                logger.info(f"Found total {len(pods)} pods across {len(namespaces)} namespaces in cluster '{cluster_name}'")
                return pods
                
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse namespaces JSON for {cluster_name}")
                return pods
                
        except Exception as e:
            logger.error(f"Error getting pods from cluster {cluster.name}: {e}", exc_info=True)
            return pods

    async def _get_cluster_kubeconfig(self, resource_group: str, cluster_name: str) -> Optional[str]:
        """
        Get cluster admin credentials (kubeconfig) from Azure.
        
        Args:
            resource_group: Resource group name
            cluster_name: AKS cluster name
            
        Returns:
            Path to temporary kubeconfig file or None if failed
        """
        try:
            logger.info(f"Getting cluster admin credentials for {cluster_name}...")
            
            # Get cluster admin credentials from Azure
            credential_response = self.client.managed_clusters.list_cluster_admin_credentials(
                resource_group_name=resource_group,
                resource_name=cluster_name
            )
            
            if not credential_response.kubeconfigs or len(credential_response.kubeconfigs) == 0:
                logger.error(f"No kubeconfig returned for cluster {cluster_name}")
                return None
            
            # Decode the kubeconfig (it's base64 encoded)
            kubeconfig_data = base64.b64decode(credential_response.kubeconfigs[0].value).decode('utf-8')
            
            # Write to temporary file
            temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.yaml', delete=False)
            temp_file.write(kubeconfig_data)
            temp_file.close()
            
            logger.info(f"✓ Cluster credentials retrieved and saved to {temp_file.name}")
            return temp_file.name
            
        except Exception as e:
            logger.error(f"Failed to get cluster credentials: {e}", exc_info=True)
            return None
    
    async def list_cluster_namespaces(
        self,
        cluster: AzureResource
    ) -> List[str]:
        """
        List all namespaces in an AKS cluster (excluding system namespaces).
        
        Uses Kubernetes Python client library if available, falls back to kubectl.
        
        Args:
            cluster: AKS cluster resource
            
        Returns:
            List of namespace names
        """
        logger.info("=" * 80)
        logger.info(f"=== FUNCTION ENTRY: list_cluster_namespaces ===")
        logger.info(f"Cluster name: {cluster.name}")
        logger.info(f"Cluster ID: {cluster.id}")
        logger.info(f"Cluster resource group: {cluster.resource_group}")
        logger.info(f"Kubernetes Python client available: {KUBERNETES_AVAILABLE}")
        logger.info("=" * 80)
        
        namespaces = []
        
        try:
            # Extract resource group and cluster name
            id_parts = cluster.id.split("/")
            resource_group = id_parts[id_parts.index("resourceGroups") + 1] if "resourceGroups" in id_parts else cluster.resource_group
            cluster_name = cluster.name
            
            # Try Kubernetes Python client first (works in Azure App Service)
            if KUBERNETES_AVAILABLE:
                try:
                    logger.info(f"Attempting to use Kubernetes Python client library...")
                    kubeconfig_path = await self._get_cluster_kubeconfig(resource_group, cluster_name)
                    
                    if kubeconfig_path:
                        # Load kubeconfig
                        k8s_config.load_kube_config(config_file=kubeconfig_path)
                        
                        # Create Kubernetes API client
                        v1 = k8s_client.CoreV1Api()
                        
                        # List namespaces
                        logger.info(f"Querying namespaces using Kubernetes Python client...")
                        namespace_list = v1.list_namespace()
                        
                        # Filter out system namespaces
                        system_namespaces = {"kube-system", "kube-public", "kube-node-lease", "default"}
                        for ns in namespace_list.items:
                            ns_name = ns.metadata.name
                            if ns_name and ns_name not in system_namespaces:
                                namespaces.append(ns_name)
                        
                        logger.info(f"✓ Found {len(namespaces)} namespaces using Kubernetes Python client: {namespaces}")
                        
                        # Clean up temporary kubeconfig file
                        try:
                            os.unlink(kubeconfig_path)
                        except Exception:
                            pass
                        
                        return sorted(namespaces)
                    else:
                        logger.warning("Failed to get kubeconfig, falling back to kubectl...")
                except ApiException as e:
                    logger.error(f"Kubernetes API error: {e}", exc_info=True)
                    logger.warning("Falling back to kubectl...")
                except Exception as e:
                    logger.error(f"Error using Kubernetes Python client: {e}", exc_info=True)
                    logger.warning("Falling back to kubectl...")
            
            # Fallback to kubectl (for local development or if Kubernetes client failed)
            logger.info("Using kubectl fallback method...")
            
            # Check if kubectl is available
            import shutil
            kubectl_path = shutil.which("kubectl") or shutil.which("kubectl.exe")
            kubectl_cmd = "kubectl"
            
            if not kubectl_path:
                error_msg = f"kubectl not found in PATH"
                if self.is_azure_app_service:
                    logger.error(f"{error_msg} and Kubernetes Python client failed")
                    logger.error(f"Cannot list namespaces for cluster {cluster_name}")
                    logger.error("This should not happen if Kubernetes Python client is properly configured")
                    logger.error("kubectl should be installed by startup.sh - check if startup script ran successfully")
                    logger.error("Check App Service logs for startup.sh execution")
                else:
                    logger.error(f"{error_msg}! Cannot list namespaces for cluster {cluster_name}")
                    logger.error("To fix: Install kubectl or ensure it's in PATH")
                    logger.error("On Windows: choco install kubernetes-cli")
                    logger.error("On Linux/Mac: See https://kubernetes.io/docs/tasks/tools/")
                # Return empty list with detailed error info
                logger.error(f"Returning empty namespaces list due to: {error_msg}")
                return namespaces
            
            logger.info(f"✓ kubectl found at: {kubectl_path}, will use '{kubectl_cmd}' command")
            
            # Use default kubeconfig (Azure CLI merges credentials here)
            import os
            # Handle Windows path correctly
            if os.name == 'nt':  # Windows
                default_kubeconfig = os.path.expanduser("~/.kube/config").replace('/', os.sep)
            else:
                default_kubeconfig = os.path.expanduser("~/.kube/config")
            
            logger.info(f"Looking for kubeconfig at: {default_kubeconfig}")
            logger.info(f"Kubeconfig exists: {os.path.exists(default_kubeconfig)}")
            
            # Ensure credentials are up to date
            try:
                # Get credentials to ensure they're in the default kubeconfig
                creds = await self.get_cluster_credentials(resource_group, cluster_name)
                # But use default kubeconfig regardless
                if os.path.exists(default_kubeconfig):
                    kubeconfig_path = default_kubeconfig
                    logger.info(f"Using default kubeconfig: {kubeconfig_path}")
                elif creds and creds.get("kubeconfig_path") and os.path.exists(creds["kubeconfig_path"]):
                    kubeconfig_path = creds["kubeconfig_path"]
                    logger.info(f"Using credential kubeconfig: {kubeconfig_path}")
                else:
                    logger.error(f"No kubeconfig found for cluster {cluster_name}")
                    logger.error(f"Default kubeconfig path: {default_kubeconfig}")
                    logger.error(f"Default kubeconfig exists: {os.path.exists(default_kubeconfig)}")
                    return namespaces
            except Exception as e:
                logger.warning(f"Error getting credentials, trying default kubeconfig: {e}")
                if os.path.exists(default_kubeconfig):
                    kubeconfig_path = default_kubeconfig
                    logger.info(f"Using default kubeconfig after error: {kubeconfig_path}")
                else:
                    logger.error(f"No kubeconfig found for cluster {cluster_name}")
                    logger.error(f"Default kubeconfig path: {default_kubeconfig}")
                    return namespaces
            
            logger.info(f"Using kubeconfig: {kubeconfig_path} for cluster {cluster_name}")
            
            # Set KUBECONFIG environment variable and context
            import asyncio
            loop = asyncio.get_event_loop()
            env = os.environ.copy()
            env["KUBECONFIG"] = kubeconfig_path
            
            # NOTE: Rancher Desktop kubectl doesn't support "kubectl config" commands
            # The context should already be set by Azure CLI when we ran "az aks get-credentials"
            # So we'll skip context switching and just use the current context
            print(f"Note: Skipping context switch (Rancher Desktop limitation), using current context")
            logger.info(f"Skipping context switch (Rancher Desktop kubectl doesn't support 'config' command)")
            logger.info(f"Assuming context '{cluster_name}' is already set from Azure CLI credentials")
            
            # Build command - simple kubectl get namespaces
            cmd_parts = [kubectl_cmd, "get", "namespaces", "-o", "json"]
            
            # CRITICAL: Print for immediate visibility
            print(f"Executing kubectl: {' '.join(cmd_parts)}")
            print(f"KUBECONFIG={kubeconfig_path}")
            print(f"kubectl path: {kubectl_cmd}")
            print(f"Using context: {cluster_name}")
            logger.info(f"Executing kubectl: {' '.join(cmd_parts)}")
            logger.info(f"KUBECONFIG={kubeconfig_path}")
            logger.info(f"kubectl path: {kubectl_cmd}")
            logger.info(f"Using context: {cluster_name}")
            logger.info(f"Resource group: {resource_group}, Cluster: {cluster_name}")
            
            # Use run_in_executor for Windows compatibility
            def _run_kubectl():
                logger.info(f"Running kubectl command: {' '.join(cmd_parts)}")
                logger.info(f"Environment KUBECONFIG={env.get('KUBECONFIG')}")
                logger.info(f"Using context: {cluster_name}")
                logger.info(f"kubectl path: {kubectl_cmd}")
                try:
                    result = subprocess.run(
                        cmd_parts,
                        capture_output=True,
                        text=True,
                        timeout=30,
                        env=env,
                        shell=False
                    )
                    # CRITICAL: Print for immediate visibility
                    print(f"kubectl completed with return code: {result.returncode}")
                    logger.info(f"kubectl completed with return code: {result.returncode}")
                    if result.returncode != 0:
                        print(f"✗ kubectl FAILED! stderr: {result.stderr if result.stderr else 'None'}")
                        print(f"✗ kubectl stdout: {result.stdout[:500] if result.stdout else 'None'}")
                        logger.error(f"kubectl FAILED! stderr: {result.stderr if result.stderr else 'None'}")
                        logger.error(f"kubectl stdout: {result.stdout[:500] if result.stdout else 'None'}")
                    else:
                        print(f"✓ kubectl SUCCESS! stdout length: {len(result.stdout) if result.stdout else 0}")
                        logger.info(f"kubectl SUCCESS! stdout length: {len(result.stdout) if result.stdout else 0}")
                    return result
                except Exception as e:
                    logger.error(f"Exception running kubectl: {e}", exc_info=True)
                    raise
            
            result = await loop.run_in_executor(None, _run_kubectl)
            
            logger.info(f"kubectl command completed. Return code: {result.returncode}")
            if result.stdout:
                logger.info(f"kubectl stdout length: {len(result.stdout)}")
            if result.stderr:
                logger.warning(f"kubectl stderr: {result.stderr[:500]}")
            
            if result.returncode != 0:
                error_msg = result.stderr if result.stderr else "Unknown error"
                print(f"✗ kubectl JSON failed: {error_msg}")
                logger.error(f"Failed to get namespaces from {cluster_name}: {error_msg}")
                
                # Try alternative: use table format (Rancher Desktop kubectl doesn't support -o json)
                if "-o" in error_msg.lower() or "flag" in error_msg.lower() or "shorthand" in error_msg.lower():
                    print("⚠ kubectl doesn't support -o flag, trying table format...")
                    logger.warning("kubectl doesn't support -o flag, trying table format...")
                    # Use simple command without any flags
                    cmd_parts_table = [kubectl_cmd, "get", "namespaces"]
                    print(f"Trying: {' '.join(cmd_parts_table)}")
                    logger.info(f"Trying table format command: {' '.join(cmd_parts_table)}")
                    
                    def _run_kubectl_table():
                        try:
                            # Use list format (works on both Windows and Linux)
                            # This avoids shell interpretation issues
                            print(f"Running: {cmd_parts_table}")
                            logger.info(f"Running table command: {cmd_parts_table}")
                            return subprocess.run(
                                cmd_parts_table,
                                capture_output=True,
                                text=True,
                                timeout=30,
                                env=env,
                                shell=False,  # Use shell=False for better control
                                cwd=None
                            )
                        except Exception as e:
                            print(f"Exception in table command: {e}")
                            logger.error(f"Exception in table command: {e}", exc_info=True)
                            return type('obj', (object,), {'returncode': 1, 'stderr': str(e), 'stdout': ''})()
                    
                    result = await loop.run_in_executor(None, _run_kubectl_table)
                    print(f"Table command return code: {result.returncode}")
                    print(f"Table stdout length: {len(result.stdout) if result.stdout else 0}")
                    print(f"Table stderr: {result.stderr[:200] if result.stderr else 'None'}")
                    
                    if result.returncode == 0 and result.stdout:
                        print("✓ Got table output, parsing...")
                        print(f"First 500 chars: {result.stdout[:500]}")
                        logger.info("Got table output, parsing...")
                        logger.info(f"Table output (first 500 chars): {result.stdout[:500]}")
                        
                        # Parse table output - split by newlines and skip header
                        lines = [l.strip() for l in result.stdout.strip().split('\n') if l.strip()]
                        if len(lines) > 1:  # Has header + data
                            system_namespaces = {"kube-system", "kube-public", "kube-node-lease", "default"}
                            for line in lines[1:]:  # Skip header line
                                # Split by whitespace and take first column (namespace name)
                                parts = line.split()
                                if len(parts) > 0:
                                    ns_name = parts[0].strip()
                                    if ns_name and ns_name not in system_namespaces:
                                        namespaces.append(ns_name)
                            print(f"✓ Parsed {len(namespaces)} namespaces from table: {namespaces}")
                            logger.info(f"Parsed {len(namespaces)} namespaces from table: {namespaces}")
                            if len(namespaces) > 0:
                                return namespaces
                        else:
                            print("⚠ Table output has no data lines")
                            logger.warning("Table output has no data lines")
                    else:
                        print(f"✗ Table format failed - return code: {result.returncode}")
                        print(f"Stderr: {result.stderr[:500] if result.stderr else 'None'}")
                        logger.error(f"Table format failed - return code: {result.returncode}, stderr: {result.stderr[:500] if result.stderr else 'None'}")
                
                # Try alternative: ensure credentials are fresh
                logger.info(f"Retrying with fresh credentials...")
                try:
                    az_cmd = shutil.which("az") or shutil.which("az.cmd") or "az"
                    def _refresh_creds():
                        return subprocess.run(
                            [az_cmd, "aks", "get-credentials", "--resource-group", resource_group, "--name", cluster_name, "--overwrite-existing"],
                            capture_output=True,
                            text=True,
                            timeout=30,
                            shell=False
                        )
                    refresh_result = await loop.run_in_executor(None, _refresh_creds)
                    if refresh_result.returncode == 0:
                        logger.info("Credentials refreshed, retrying namespace listing...")
                        # Retry the kubectl command
                        result = await loop.run_in_executor(None, _run_kubectl)
                        if result.returncode != 0:
                            logger.error(f"Still failed after credential refresh")
                            return namespaces
                    else:
                        logger.warning(f"Failed to refresh credentials: {refresh_result.stderr}")
                        return namespaces
                except Exception as retry_error:
                    logger.error(f"Error retrying: {retry_error}")
                    return namespaces
            
            result_stdout = result.stdout if result.stdout else "{}"
            logger.info(f"kubectl stdout length: {len(result_stdout)}")
            
            if not result_stdout or result_stdout.strip() == "":
                logger.error(f"kubectl returned empty stdout!")
                logger.error(f"stderr: {result.stderr if result.stderr else 'None'}")
                return namespaces
            
            try:
                logger.info(f"Attempting to parse kubectl JSON output...")
                logger.info(f"JSON string length: {len(result_stdout)}")
                logger.info(f"First 500 chars: {result_stdout[:500]}")
                namespaces_data = json.loads(result_stdout)
                total_namespaces = len(namespaces_data.get('items', []))
                logger.info(f"✓ Parsed JSON successfully, found {total_namespaces} total namespaces")
                logger.info(f"Namespace items: {[item.get('metadata', {}).get('name') for item in namespaces_data.get('items', [])[:10]]}")
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse namespaces JSON: {e}")
                logger.error(f"Output (first 500 chars): {result_stdout[:500]}")
                logger.error(f"Output (last 500 chars): {result_stdout[-500:] if len(result_stdout) > 500 else result_stdout}")
                return namespaces
            
            items = namespaces_data.get("items", [])
            logger.info(f"Processing {len(items)} namespace items")
            
            # System namespaces to exclude
            system_namespaces = {"kube-system", "kube-public", "kube-node-lease", "default"}
            
            for ns in items:
                ns_name = ns.get("metadata", {}).get("name", "")
                # Skip system namespaces
                if ns_name and ns_name not in system_namespaces:
                    namespaces.append(ns_name)
                    logger.info(f"Added namespace: {ns_name}")
            
            logger.info(f"Found {len(namespaces)} non-system namespaces in cluster {cluster_name}")
            if len(namespaces) == 0:
                logger.warning(f"No non-system namespaces found! Total namespaces: {len(items)}")
                all_namespaces = [ns.get("metadata", {}).get("name", "") for ns in items]
                logger.warning(f"All namespaces: {all_namespaces}")
                logger.warning(f"This might indicate all namespaces are system namespaces")
            
            return sorted(namespaces)
            
        except Exception as e:
            logger.error(f"Error listing namespaces for cluster {cluster.name}: {e}", exc_info=True)
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return namespaces

    async def discover_pods_from_resources(
        self,
        resources: List[AzureResource],
        temenos_namespaces: Optional[List[str]] = None
    ) -> List[AzureResource]:
        """
        Discover pods from AKS clusters in the resource list.
        
        Args:
            resources: List of Azure resources
            temenos_namespaces: Optional list of namespace names to filter
            
        Returns:
            List of AzureResource objects representing pods
        """
        aks_clusters = await self.get_aks_clusters(resources)
        
        if not aks_clusters:
            logger.info("No AKS clusters found in resources")
            return []
        
        logger.info(f"Found {len(aks_clusters)} AKS cluster(s), discovering pods...")
        
        all_pods = []
        for cluster in aks_clusters:
            try:
                pods = await self.get_pods_from_cluster(cluster, temenos_namespaces)
                # Convert pods to AzureResource objects
                for pod in pods:
                    all_pods.append(pod.to_azure_resource())
            except Exception as e:
                logger.error(f"Error discovering pods from {cluster.name}: {e}", exc_info=True)
                continue
        
        logger.info(f"Discovered {len(all_pods)} pods from {len(aks_clusters)} AKS cluster(s)")
        return all_pods

