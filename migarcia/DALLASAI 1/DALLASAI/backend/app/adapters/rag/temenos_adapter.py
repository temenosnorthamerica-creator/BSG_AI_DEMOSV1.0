"""
Temenos RAG Adapter Implementation

Temenos-specific implementation of RAGAdapter.
"""

from typing import Optional, Dict, Any
import httpx
import asyncio

from app.adapters.rag.base import RAGAdapter
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class TemenosRAGAdapter(RAGAdapter):
    """Temenos RAG API implementation of RAGAdapter."""
    
    def __init__(self):
        """Initialize Temenos RAG adapter."""
        self.jwt_token = settings.RAG_JWT_TOKEN
        self.base_url = settings.RAG_API_URL.rstrip('/')
        self.api_base = f"{self.base_url}/api/v1.0"
        
        if not self.jwt_token:
            raise ValueError("RAG_JWT_TOKEN environment variable is not set")
        
        logger.info(f"Temenos RAG adapter initialized with base URL: {self.api_base}")
    
    async def query(
        self,
        question: str,
        region: str = "global",
        rag_model_id: Optional[str] = None,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Query the Temenos RAG API.
        
        Args:
            question: The question to ask
            region: Region context (default: "global")
            rag_model_id: Model ID to use (optional)
            context: Additional context (optional)
            
        Returns:
            Response dictionary with answer and sources
        """
        try:
            url = f"{self.api_base}/query"
            headers = {
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            }
            payload = {
                "question": question,
                "region": region
            }
            
            if rag_model_id:
                payload["RAGmodelId"] = rag_model_id
            
            if context:
                payload["context"] = context
            
            # Increase timeout significantly for comprehensive RAG queries
            # Use 70 seconds to allow for 60s asyncio.wait_for timeout plus overhead
            async with httpx.AsyncClient(timeout=70.0) as client:
                logger.info(f"Sending RAG query to {url} with timeout 70s")
                logger.debug(f"Query payload: {payload.get('question', '')[:200]}...")
                response = await client.post(url, json=payload, headers=headers)
                response.raise_for_status()
                result = response.json()
                logger.info(f"RAG API response received: {len(str(result))} characters")
                
                # RAG API may return data directly or wrapped in 'data' field
                # Return consistent format
                if isinstance(result, dict):
                    # If it has 'data' field, return as-is
                    if "data" in result:
                        return result
                    # Otherwise wrap in 'data' field for consistency
                    return {"data": result}
                # If it's not a dict, wrap it
                return {"data": {"answer": str(result)}}
                
        except httpx.TimeoutException:
            logger.error(f"Temenos RAG API timeout for question: {question[:50]}...")
            raise RuntimeError(f"Temenos RAG API timeout: Request took too long")
        except httpx.HTTPStatusError as e:
            logger.error(f"Temenos RAG API HTTP error: {e.response.status_code} - {e.response.text}")
            raise RuntimeError(f"Temenos RAG API error: {e.response.status_code}")
        except Exception as e:
            logger.error(f"Temenos RAG API error: {e}")
            raise RuntimeError(f"Temenos API error: {e}")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check Temenos RAG API health status."""
        try:
            # Try a simple query to check if API is accessible
            url = f"{self.api_base}/query"
            headers = {
                "Authorization": f"Bearer {self.jwt_token}",
                "Content-Type": "application/json"
            }
            payload = {
                "question": "test",
                "region": "global",
                "RAGmodelId": "ModularBanking, TechnologyOverview"
            }
            
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.post(url, json=payload, headers=headers)
                
                if response.status_code == 200:
                    return {
                        "status": "healthy",
                        "api_url": self.api_base,
                        "connected": True
                    }
                else:
                    return {
                        "status": "unhealthy",
                        "api_url": self.api_base,
                        "error": f"HTTP {response.status_code}",
                        "connected": False
                    }
        except Exception as e:
            logger.error(f"Temenos RAG API health check failed: {e}")
            return {
                "status": "unhealthy",
                "api_url": self.api_base,
                "error": str(e),
                "connected": False
            }

