"""
Database API Endpoints
Provides REST API for querying external MSSQL databases
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.core.logging import get_logger

logger = get_logger(__name__)

# Try to import MSSQL service, but don't fail if ODBC drivers are missing
try:
    from app.services.mssql_service import MSSQLService
    MSSQL_AVAILABLE = True
except ImportError as e:
    logger.warning(f"MSSQL service not available: {e}")
    MSSQL_AVAILABLE = False
    MSSQLService = None

router = APIRouter(prefix="/database", tags=["database"])


async def get_mssql_service() -> MSSQLService:
    """
    Get MSSQL service instance with connection details from MongoDB.
    Falls back to settings if MongoDB connection details are not found.
    """
    if not MSSQL_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="MSSQL service is not available. ODBC drivers may not be installed."
        )
    return await MSSQLService.from_mongodb(
        connection_name="demo_sql_server",
        component_id="data-architecture"
    )


# Response Models
class ConnectionStatus(BaseModel):
    """Database connection status"""
    status: str
    database: str
    host: str
    version: Optional[str] = None
    error: Optional[str] = None


class TableInfo(BaseModel):
    """Table information"""
    schema: str
    name: str
    type: str


class ColumnInfo(BaseModel):
    """Column information"""
    name: str
    type: str
    max_length: Optional[int] = None
    nullable: bool
    default: Optional[str] = None


class QueryRequest(BaseModel):
    """Query request"""
    query: str = Field(..., description="SQL query to execute")
    limit: int = Field(default=100, ge=1, le=1000, description="Maximum rows to return")


class QueryResponse(BaseModel):
    """Query response"""
    columns: List[str]
    data: List[Dict[str, Any]]
    row_count: int
    query: str


class TableDataResponse(BaseModel):
    """Table data response"""
    columns: List[str]
    data: List[Dict[str, Any]]
    row_count: int
    total_rows: Optional[int] = None


# Endpoints

@router.get("/connection/test", response_model=ConnectionStatus)
async def test_connection():
    """
    Test database connection

    Returns connection status and database version
    """
    try:
        service = await get_mssql_service()
        status = service.test_connection()
        return ConnectionStatus(**status)
    except Exception as e:
        logger.error(f"Connection test failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables", response_model=List[TableInfo])
async def get_tables(
    schema: Optional[str] = Query(None, description="Schema name (defaults to configured schema)")
):
    """
    Get list of tables in the database

    Args:
        schema: Schema name (optional, defaults to configured schema)

    Returns:
        List of tables with their schema and type
    """
    try:
        service = await get_mssql_service()
        tables = service.get_tables(schema=schema)
        return [TableInfo(**table) for table in tables]
    except Exception as e:
        logger.error(f"Error fetching tables: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables/{table_name}/columns", response_model=List[ColumnInfo])
async def get_table_columns(
    table_name: str,
    schema: Optional[str] = Query(None, description="Schema name")
):
    """
    Get columns for a specific table

    Args:
        table_name: Name of the table
        schema: Schema name (optional)

    Returns:
        List of column definitions
    """
    try:
        service = await get_mssql_service()
        columns = service.get_table_columns(table_name, schema=schema)
        return [ColumnInfo(**col) for col in columns]
    except Exception as e:
        logger.error(f"Error fetching columns for {table_name}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/tables/{table_name}/data", response_model=TableDataResponse)
async def get_table_data(
    table_name: str,
    schema: Optional[str] = Query(None, description="Schema name"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum rows to return"),
    offset: int = Query(0, ge=0, description="Number of rows to skip")
):
    """
    Get data from a specific table

    Args:
        table_name: Name of the table
        schema: Schema name (optional)
        limit: Maximum number of rows to return (1-1000)
        offset: Number of rows to skip

    Returns:
        Table data with columns and rows
    """
    try:
        service = await get_mssql_service()

        # Get table data
        result = service.get_table_data(
            table_name=table_name,
            schema=schema,
            limit=limit,
            offset=offset
        )

        # Get total row count
        try:
            total_rows = service.get_row_count(table_name, schema=schema)
        except:
            total_rows = None

        return TableDataResponse(
            columns=result["columns"],
            data=result["data"],
            row_count=result["row_count"],
            total_rows=total_rows
        )
    except ValueError as e:
        logger.error(f"Invalid table name: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error fetching table data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/query", response_model=QueryResponse)
async def execute_query(request: QueryRequest):
    """
    Execute a custom SQL query

    Args:
        request: Query request with SQL and limit

    Returns:
        Query results with columns and data

    Note:
        - Only SELECT queries are supported for security
        - Query results are limited to prevent performance issues
    """
    try:
        # Basic security check - only allow SELECT queries
        query_upper = request.query.strip().upper()
        if not query_upper.startswith('SELECT'):
            raise HTTPException(
                status_code=400,
                detail="Only SELECT queries are allowed"
            )

        # Check for potentially dangerous keywords
        dangerous_keywords = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'TRUNCATE', 'ALTER', 'CREATE']
        for keyword in dangerous_keywords:
            if keyword in query_upper:
                raise HTTPException(
                    status_code=400,
                    detail=f"Query contains forbidden keyword: {keyword}"
                )

        service = await get_mssql_service()
        result = service.execute_query(
            query=request.query,
            limit=request.limit
        )

        return QueryResponse(**result)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error executing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/schemas", response_model=List[str])
async def get_schemas():
    """
    Get list of available schemas

    Returns:
        List of schema names
    """
    try:
        service = await get_mssql_service()
        with service.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DISTINCT SCHEMA_NAME
                FROM INFORMATION_SCHEMA.SCHEMATA
                WHERE SCHEMA_NAME NOT IN ('sys', 'INFORMATION_SCHEMA', 'guest')
                ORDER BY SCHEMA_NAME
            """)
            schemas = [row[0] for row in cursor.fetchall()]
            return schemas
    except Exception as e:
        logger.error(f"Error fetching schemas: {e}")
        raise HTTPException(status_code=500, detail=str(e))
