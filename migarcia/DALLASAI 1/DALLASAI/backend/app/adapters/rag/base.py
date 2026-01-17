"""
Base RAG Adapter Interface

Defines the contract for RAG adapters.
"""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any


class RAGAdapter(ABC):
    """Abstract base class for RAG adapters."""
    
    @abstractmethod
    async def query(
        self,
        question: str,
        region: str = "global",
        rag_model_id: Optional[str] = None,
        context: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Query the RAG API.
        
        Args:
            question: The question to ask
            region: Region context (e.g., "global")
            rag_model_id: Model ID to use (optional)
            context: Additional context (optional)
            
        Returns:
            Response dictionary with answer and sources
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Check RAG API health status."""
        pass

