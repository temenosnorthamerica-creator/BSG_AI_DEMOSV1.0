"""
Connection Adapters

Provides abstraction layer for external connections (database, RAG APIs, etc.)
to enable easy swapping of implementations without affecting core application logic.
"""

from app.adapters.database import DatabaseAdapter, get_database_adapter
from app.adapters.rag import RAGAdapter, get_rag_adapter

__all__ = [
    "DatabaseAdapter",
    "get_database_adapter",
    "RAGAdapter",
    "get_rag_adapter",
]

