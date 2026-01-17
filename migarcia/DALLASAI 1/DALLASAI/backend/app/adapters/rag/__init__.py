"""
RAG Adapter

Abstract interface for RAG (Retrieval-Augmented Generation) API connections.
"""

from app.adapters.rag.base import RAGAdapter
from app.adapters.rag.temenos_adapter import TemenosRAGAdapter
from app.adapters.rag.factory import get_rag_adapter

__all__ = [
    "RAGAdapter",
    "TemenosRAGAdapter",
    "get_rag_adapter",
]

