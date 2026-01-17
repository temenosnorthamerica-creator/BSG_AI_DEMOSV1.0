"""
RAG Adapter Factory

Factory for creating RAG adapter instances based on configuration.
"""

from typing import Optional
from app.adapters.rag.base import RAGAdapter
from app.adapters.rag.temenos_adapter import TemenosRAGAdapter
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Global adapter instance
_rag_adapter: Optional[RAGAdapter] = None


def get_rag_adapter() -> RAGAdapter:
    """
    Get RAG adapter instance (singleton).
    
    Returns:
        RAGAdapter instance based on configuration
    """
    global _rag_adapter
    
    if _rag_adapter is None:
        # Determine adapter type from configuration
        rag_type = getattr(settings, 'RAG_TYPE', 'temenos').lower()
        
        if rag_type == 'temenos':
            _rag_adapter = TemenosRAGAdapter()
            logger.info("Using Temenos RAG adapter")
        else:
            raise ValueError(f"Unsupported RAG type: {rag_type}")
    
    return _rag_adapter

