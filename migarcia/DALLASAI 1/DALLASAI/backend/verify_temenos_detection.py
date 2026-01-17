"""
Quick verification that Temenos components can be identified from AKS pods.
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.azure_service import AzureService
from app.services.aks_service import AKSService
from app.services.temenos_service import TemenosService

async def verify():
    subscription_id = "58a91cf0-0f39-45fd-a63e-5a9a28c7072b"
    resource_group = "modulartest3"
    
    print("Verifying Temenos component detection...")
    
    # Get resources
    azure_service = AzureService(subscription_id)
    resources = await azure_service.get_resources_by_resource_groups([resource_group])
    print(f"Found {len(resources)} Azure resources")
    
    # Discover AKS pods
    aks_service = AKSService(subscription_id)
    aks_pods = await aks_service.discover_pods_from_resources(resources)
    print(f"Found {len(aks_pods)} AKS pods")
    
    if not aks_pods:
        print("ERROR: No pods found!")
        return
    
    # Test component identification
    temenos_service = TemenosService()
    
    # Test a few pods
    test_pods = aks_pods[:5]
    print(f"\nTesting component identification on {len(test_pods)} pods...")
    
    identified = 0
    for pod in test_pods:
        component = await temenos_service.identify_component(pod)
        if component:
            identified += 1
            ns = pod.properties.get("namespace", "unknown")
            print(f"  {ns}: {component.component_name}")
    
    print(f"\nResult: {identified}/{len(test_pods)} pods identified as Temenos components")
    
    if identified > 0:
        print("SUCCESS: Component detection is working!")
    else:
        print("WARNING: No components identified - check logs")

if __name__ == "__main__":
    asyncio.run(verify())

