"""
Security component API endpoints.
Handles slide search and retrieval from MongoDB collections.
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from motor import motor_asyncio
from io import BytesIO
import base64
import re
import traceback
import tempfile
import os
import json
from pathlib import Path

from app.core.database import get_database
from app.core.logging import get_logger
from app.api.security_html5 import convert_pptx_to_html5

router = APIRouter(prefix="/components/security", tags=["security"])
logger = get_logger(__name__)


class SlideResponse(BaseModel):
    """Response model for a single slide."""
    slide_number: int
    slide_content: str  # Base64 encoded JPEG image
    content_type: str = "image/jpeg"


class SlideSearchResponse(BaseModel):
    """Response model for slide search results."""
    slides: List[SlideResponse]
    total_results: int
    query: str


class ParagraphResponse(BaseModel):
    """Response model for a single paragraph."""
    paragraph_number: int
    paragraph_content: str


class ParagraphSearchResponse(BaseModel):
    """Response model for paragraph search results."""
    paragraphs: List[ParagraphResponse]
    total_results: int
    query: str


@router.get("/slides/search")
async def search_slides(
    q: str = Query(..., description="Search query: 'p10' for first 10 slides, 'prg 10-20' for range"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Search slides from security slides collection.
    
    Query formats:
    - 'p10' or 'p15': Returns first 10 or 15 slides
    - 'prg 10-20': Returns slides from 10 to 20 (inclusive)
    
    Returns slides as base64-encoded JPEG images.
    """
    try:
        query_trimmed = q.strip().lower()
        slides = []
        
        # Parse query
        if query_trimmed.startswith('prg '):
            # Range query: prg 10-20
            try:
                range_part = query_trimmed[4:].strip()
                start, end = map(int, range_part.split('-'))
                if start < 1 or end < start:
                    raise ValueError("Invalid range")
                
                cursor = db.security_slides.find({
                    "slide_number": {"$gte": start, "$lte": end}
                }).sort("slide_number", 1)
                
                rows = await cursor.to_list(length=1000)
                
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid range format. Use 'prg 10-20'")
        
        elif query_trimmed.startswith('p'):
            # Numeric query: p10, p15, etc.
            try:
                count = int(query_trimmed[1:])
                if count < 1:
                    raise ValueError("Count must be positive")
                
                cursor = db.security_slides.find().sort("slide_number", 1).limit(count)
                rows = await cursor.to_list(length=count)
                
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid query format. Use 'p10' for first 10 slides or 'prg 10-20' for range")
        
        else:
            raise HTTPException(status_code=400, detail="Invalid query format. Use 'p10' for first 10 slides or 'prg 10-20' for range")
        
        # Convert slide_content (Binary) to base64
        for row in rows:
            slide_content_bytes = row.get('slide_content')
            if slide_content_bytes:
                if isinstance(slide_content_bytes, bytes):
                    slide_content_b64 = base64.b64encode(slide_content_bytes).decode('utf-8')
                else:
                    # If already a string, assume it's base64
                    slide_content_b64 = str(slide_content_bytes)
            else:
                slide_content_b64 = ""
            
            slides.append(SlideResponse(
                slide_number=row['slide_number'],
                slide_content=slide_content_b64,
                content_type="image/jpeg"
            ))
        
        return {
            "success": True,
            "data": {
                "slides": [slide.dict() for slide in slides],
                "total_results": len(slides),
                "query": q
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching slides: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error searching slides: {str(e)}")


@router.get("/slides/{slide_number}")
async def get_slide(
    slide_number: int,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific slide by slide number."""
    try:
        row = await db.security_slides.find_one({"slide_number": slide_number})
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Slide {slide_number} not found")
        
        # Convert slide_content (Binary) to base64
        slide_content_bytes = row.get('slide_content')
        if slide_content_bytes:
            if isinstance(slide_content_bytes, bytes):
                slide_content_b64 = base64.b64encode(slide_content_bytes).decode('utf-8')
            else:
                slide_content_b64 = str(slide_content_bytes)
        else:
            slide_content_b64 = ""
        
        return {
            "success": True,
            "data": {
                "slide_number": row['slide_number'],
                "slide_content": slide_content_b64,
                "content_type": "image/jpeg"
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving slide: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving slide: {str(e)}")


@router.get("/paragraphs/search")
async def search_paragraphs(
    q: str = Query(..., description="Search query: '10' for first 10 paragraphs, 'rg 10-20' for range"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Search paragraphs from security paragraphs collection.
    
    Query formats:
    - '10' or '15': Returns first 10 or 15 paragraphs
    - 'rg 10-20': Returns paragraphs from 10 to 20 (inclusive)
    
    Returns paragraphs as text content.
    """
    try:
        query_trimmed = q.strip().lower()
        paragraphs = []
        
        # Parse query
        if query_trimmed.startswith('rg '):
            # Range query: rg 10-20
            try:
                range_part = query_trimmed[3:].strip()
                start, end = map(int, range_part.split('-'))
                if start < 1 or end < start:
                    raise ValueError("Invalid range")
                
                cursor = db.security_paragraphs.find({
                    "paragraph_number": {"$gte": start, "$lte": end}
                }).sort("paragraph_number", 1)
                
                rows = await cursor.to_list(length=1000)
                
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid range format. Use 'rg 10-20'")
        
        elif query_trimmed.isdigit():
            # Numeric query: 10, 15, etc.
            try:
                count = int(query_trimmed)
                if count < 1:
                    raise ValueError("Count must be positive")
                
                cursor = db.security_paragraphs.find().sort("paragraph_number", 1).limit(count)
                rows = await cursor.to_list(length=count)
                
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid query format. Use '10' for first 10 paragraphs or 'rg 10-20' for range")
        
        else:
            raise HTTPException(status_code=400, detail="Invalid query format. Use '10' for first 10 paragraphs or 'rg 10-20' for range")
        
        # Convert to response format
        for row in rows:
            paragraphs.append(ParagraphResponse(
                paragraph_number=row['paragraph_number'],
                paragraph_content=row.get('paragraph_content', '')
            ))
        
        return {
            "success": True,
            "data": {
                "paragraphs": [para.dict() for para in paragraphs],
                "total_results": len(paragraphs),
                "query": q
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching paragraphs: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error searching paragraphs: {str(e)}")


@router.get("/paragraphs/{paragraph_number}")
async def get_paragraph(
    paragraph_number: int,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get a specific paragraph by paragraph number."""
    try:
        row = await db.security_paragraphs.find_one({"paragraph_number": paragraph_number})
        
        if not row:
            raise HTTPException(status_code=404, detail=f"Paragraph {paragraph_number} not found")
        
        return {
            "success": True,
            "data": {
                "paragraph_number": row['paragraph_number'],
                "paragraph_content": row.get('paragraph_content', '')
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving paragraph: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving paragraph: {str(e)}")


class SecurityItemResponse(BaseModel):
    """Response model for a single security item."""
    document_number: int
    document_name: str
    document: Dict[str, Any]


class SecurityItemSearchResponse(BaseModel):
    """Response model for security item search results."""
    items: List[SecurityItemResponse]
    total_results: int


class SecurityPresentationResponse(BaseModel):
    """Response model for a security presentation."""
    presentation_number: int
    presentation_name: str
    presentation: Dict[str, Any]


@router.get("/items/search")
async def search_security_items(
    document_number: Optional[int] = Query(None, description="Search by document number (exact match)"),
    search_context: Optional[str] = Query(None, description="Search in document content (text search)"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Search security items from security_items collection.
    
    Parameters:
    - document_number: Exact match search by document_number field
    - search_context: Text search in document content (searches in document.full_text and document.paragraphs)
    
    Returns items with document_number, document_name, and document fields.
    """
    try:
        items = []
        
        # Check if at least one search parameter is provided
        if document_number is None and (not search_context or not search_context.strip()):
            logger.warning("No search parameters provided")
            return {
                "success": True,
                "data": {
                    "items": [],
                    "total_results": 0
                }
            }
        
        # Check if collection exists and has documents
        try:
            collection = db["security_items"]
            total_docs = await collection.count_documents({})
            logger.info(f"security_items collection has {total_docs} documents")
        except Exception as e:
            logger.error(f"Error accessing security_items collection: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error accessing security_items collection: {str(e)}")
        
        if total_docs == 0:
            logger.warning("security_items collection is empty")
            return {
                "success": True,
                "data": {
                    "items": [],
                    "total_results": 0
                }
            }
        
        # Build query
        query = {}
        query_parts = []
        
        # Search by document_number (exact match)
        if document_number is not None:
            query_parts.append({"document_number": document_number})
            logger.info(f"Searching by document_number: {document_number}")
        
        # Search in document content (text search)
        if search_context and search_context.strip():
            search_text = search_context.strip()
            escaped_query = re.escape(search_text)
            search_regex = {"$regex": escaped_query, "$options": "i"}
            
            # Search in document.full_text (primary search field)
            # Azure Cosmos DB may have limitations with nested array queries, so prioritize full_text
            query_parts.append({"document.full_text": search_regex})
            logger.info(f"Searching in document content: '{search_text}'")
        
        # Build final query
        if len(query_parts) == 1:
            query = query_parts[0]
        elif len(query_parts) > 1:
            query = {"$and": query_parts}
        else:
            # This shouldn't happen due to validation above, but handle it
            query = {}
        
        # Execute query
        try:
            cursor = collection.find(query).sort("document_number", 1)
            rows = await cursor.to_list(length=1000)
            logger.info(f"Query returned {len(rows)} documents")
        except Exception as e:
            logger.error(f"Error executing query: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error executing query: {str(e)}")
        
        # Convert to response format
        if not rows:
            logger.info("No documents found")
        else:
            for row in rows:
                try:
                    doc_number = row.get('document_number')
                    doc_name = row.get('document_name', '')
                    doc_content = row.get('document', {})
                    
                    if doc_number is None:
                        logger.warning(f"Document missing document_number: {row.get('_id')}")
                        continue
                    
                    items.append(SecurityItemResponse(
                        document_number=int(doc_number),
                        document_name=str(doc_name),
                        document=doc_content if isinstance(doc_content, dict) else {}
                    ))
                except Exception as e:
                    logger.error(f"Error processing document {row.get('_id', 'unknown')}: {e}", exc_info=True)
                    continue
        
        return {
            "success": True,
            "data": {
                "items": [item.model_dump() for item in items],
                "total_results": len(items)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching security items: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error searching security items: {str(e)}")


@router.get("/items/{document_number}")
async def get_security_item(
    document_number: int,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific security item by document number.
    
    Parameters:
    - document_number: Document number to retrieve
    
    Returns the document with document_number, document_name, and document fields.
    """
    try:
        collection = db["security_items"]
        
        # Find document by document_number
        row = await collection.find_one({"document_number": document_number})
        
        if not row:
            raise HTTPException(
                status_code=404, 
                detail=f"Document with number {document_number} not found"
            )
        
        doc_number = row.get('document_number')
        doc_name = row.get('document_name', '')
        doc_content = row.get('document', {})
        
        return {
            "success": True,
            "data": SecurityItemResponse(
                document_number=int(doc_number),
                document_name=str(doc_name),
                document=doc_content if isinstance(doc_content, dict) else {}
            ).model_dump()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving security item: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving security item: {str(e)}")


def save_search_results_to_temp_file(search_results: Dict[str, Any], search_term: str) -> str:
    """
    Save search results to a temporary JSON file.
    
    Args:
        search_results: Dictionary containing search results
        search_term: The search term used
        
    Returns:
        Path to the temporary file
    """
    temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False)
    json.dump({
        'search_term': search_term,
        'results': search_results
    }, temp_file, indent=2)
    temp_file.close()
    return temp_file.name


def create_authentication_html5_page_static() -> str:
    """
    Create a proper HTML5 page from scratch with static authentication content.
    Limited to approximately 3 pages of content.
    
    Returns:
        HTML5 string representation
    """
    # Build HTML5 page from scratch
    html = []
    
    # HTML5 Document Structure
    html.append('<!DOCTYPE html>')
    html.append('<html lang="en">')
    
    # Head Section
    html.append('<head>')
    html.append('<meta charset="UTF-8">')
    html.append('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
    html.append('<meta name="description" content="Temenos Authentication Framework - Core principles and architecture">')
    html.append('<title>Authentication Framework - Temenos SaaS</title>')
    
    # CSS Styles
    html.append('<style>')
    html.append('''
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html {
            font-size: 16px;
            scroll-behavior: smooth;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.7;
            color: #1f2937;
            background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
            padding: 0;
            margin: 0;
        }
        
        .page-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            min-height: 100vh;
        }
        
        header {
            background: linear-gradient(135deg, #283054 0%, #3B82F6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }
        
        header p {
            font-size: 1.1rem;
            opacity: 0.95;
        }
        
        main {
            padding: 40px 30px;
        }
        
        section {
            margin-bottom: 40px;
        }
        
        h2 {
            color: #283054;
            font-size: 1.8rem;
            margin-bottom: 20px;
            margin-top: 30px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        h2:first-of-type {
            margin-top: 0;
        }
        
        h3 {
            color: #1e40af;
            font-size: 1.3rem;
            margin-bottom: 15px;
            margin-top: 25px;
        }
        
        p {
            color: #4b5563;
            line-height: 1.8;
            font-size: 1rem;
            margin-bottom: 15px;
            text-align: justify;
        }
        
        ul {
            margin-left: 30px;
            margin-bottom: 20px;
        }
        
        li {
            color: #4b5563;
            line-height: 1.8;
            font-size: 1rem;
            margin-bottom: 10px;
        }
        
        .highlight {
            background: #fef3c7;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 600;
            color: #92400e;
        }
        
        .info-box {
            background: #eff6ff;
            border-left: 4px solid #3B82F6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 6px;
        }
        
        .info-box p {
            margin-bottom: 10px;
        }
        
        .info-box p:last-child {
            margin-bottom: 0;
        }
        
        .numbered-list {
            list-style: decimal;
            margin-left: 30px;
            margin-bottom: 20px;
        }
        
        .numbered-list li {
            margin-bottom: 15px;
        }
        
        footer {
            background: #f9fafb;
            padding: 25px 30px;
            text-align: center;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            margin-top: 40px;
        }
        
        footer p {
            font-size: 0.9rem;
            text-align: center;
        }
        
        @media print {
            body {
                background: white;
            }
            .page-container {
                box-shadow: none;
            }
        }
        
        @media (max-width: 768px) {
            header h1 {
                font-size: 2rem;
            }
            
            main {
                padding: 30px 20px;
            }
            
            h2 {
                font-size: 1.5rem;
            }
            
            h3 {
                font-size: 1.2rem;
            }
        }
    ''')
    html.append('</style>')
    html.append('</head>')
    
    # Body Section
    html.append('<body>')
    html.append('<div class="page-container">')
    
    # Header
    html.append('<header>')
    html.append('<h1>Authentication Framework</h1>')
    html.append('<p>Temenos SaaS - Core Principles and Architecture</p>')
    html.append('</header>')
    
    # Main Content
    html.append('<main>')
    
    # Section 1: Core Concepts
    html.append('<section>')
    html.append('<h2>1. Core Concepts</h2>')
    
    html.append('<h3>OpenID Connect (OIDC) vs. OAuth 2.0</h3>')
    html.append('<ul>')
    html.append('<li><strong>OAuth 2.0</strong> is a framework for building authorization protocols. It defines a process for obtaining an access token that grants a client application permission to access a user\'s data on a resource server. However, OAuth 2.0 is not an authentication protocol in itself; it does not provide information about who the user is.</li>')
    html.append('<li><strong>OpenID Connect (OIDC)</strong> is an authentication protocol built as an extension of OAuth 2.0. It provides a complete and standardized solution for both authentication and authorization. OIDC introduces an <span class="highlight">identity token</span> (in the form of a JWT) that provides verified information about the user\'s identity.</li>')
    html.append('</ul>')
    
    html.append('<h3>JSON Web Tokens (JWT)</h3>')
    html.append('<p>OIDC makes extensive use of the JSON Web Token (JWT) set of standards. A JWT is a compact, URL-safe way of representing claims between two parties. In the context of Temenos authentication, a JWT serves as the identity token, containing digitally signed user information (e.g., username, roles) that can be trusted by the application. This signed format ensures the integrity and authenticity of the user\'s identity data.</p>')
    html.append('</section>')
    
    # Section 2: The Temenos Authentication Architecture
    html.append('<section>')
    html.append('<h2>2. The Temenos Authentication Architecture</h2>')
    html.append('<p>The authentication mechanism for Temenos solutions is a federated model that gives clients control over their own user identity while providing a seamless integration point for Temenos applications.</p>')
    
    html.append('<h3>Keycloak as the Central Identity Hub</h3>')
    html.append('<p>Temenos SaaS comes pre-integrated with <span class="highlight">Keycloak</span>, which serves as the de facto Identity and Access Management (IAM) system for all Temenos-hosted applications. Keycloak is responsible for managing user sessions, issuing tokens for application access, and enforcing access policies based on user roles and permissions.</p>')
    
    html.append('<h3>Keycloak as an Identity Broker</h3>')
    html.append('<p>The core of the federated model is Keycloak\'s role as an <span class="highlight">Identity Broker</span>. Instead of storing and managing user credentials directly, Keycloak is configured to trust a client\'s existing IAM system. This creates a bridge between the Temenos SaaS environment and the client\'s infrastructure, such as their corporate Active Directory.</p>')
    
    html.append('<h3>The Authentication Process</h3>')
    html.append('<p>The following step-by-step flow illustrates how a user gains access to a Temenos application:</p>')
    html.append('<ol class="numbered-list">')
    html.append('<li><strong>Initial Request:</strong> A user attempts to access a Temenos SaaS application via their browser.</li>')
    html.append('<li><strong>Redirect to Keycloak:</strong> The application, recognizing the unauthenticated user, redirects the browser to the Temenos Keycloak instance for authentication.</li>')
    html.append('<li><strong>Broker Redirection:</strong> Keycloak, acting as a broker, identifies that the user belongs to a federated client identity provider and redirects the authentication request to the client\'s managed IdP (e.g., the Bank\'s Active Directory).</li>')
    html.append('<li><strong>Client-Side Authentication:</strong> The user is prompted to authenticate against the client\'s IdP using their corporate credentials. This is where the client can enforce their own security policies, such as Multi-Factor Authentication (MFA), password complexity, and account lockout rules.</li>')
    html.append('<li><strong>Identity Assertion:</strong> Upon successful authentication, the client\'s IdP (Active Directory) is responsible for generating the initial identity assertion. It validates the user\'s credentials and issues a token or security claim containing the user\'s identity information.</li>')
    html.append('<li><strong>Token Exchange and Validation:</strong> This assertion is sent back to Keycloak. Keycloak validates the response from the trusted IdP.</li>')
    html.append('<li><strong>Final Access Token:</strong> Keycloak creates its own session for the user and issues a final, Temenos-specific JWT access token to the user\'s browser. This token contains the user\'s identity and the roles/permissions required for authorization.</li>')
    html.append('<li><strong>Application Access:</strong> The browser presents the JWT to the Temenos application. The application validates the token\'s signature and grants the user access based on the permissions and roles encoded within it.</li>')
    html.append('</ol>')
    html.append('</section>')
    
    # Section 3: Key Security Features
    html.append('<section>')
    html.append('<h2>3. Key Security Features and Best Practices</h2>')
    
    html.append('<h3>Authorization Code Flow with PKCE</h3>')
    html.append('<p>The framework utilizes the <span class="highlight">OpenID Connect Authorization Code Flow with Proof Key for Code Exchange (PKCE)</span>. This is the industry best practice for securing applications, particularly single-page apps (SPAs) and native mobile apps. PKCE mitigates the risk of authorization code interception attacks by adding a dynamic secret that is verified when the code is exchanged for a token, ensuring that only the original application can complete the flow.</p>')
    
    html.append('<h3>Client-Managed MFA Enforcement</h3>')
    html.append('<p>A critical design principle is that the enforcement of <span class="highlight">Multi-Factor Authentication (MFA)</span> is managed and enforced entirely by the client on their own IdP. This provides the client with full autonomy to align authentication strength with their internal security and compliance requirements, without requiring changes to the Temenos SaaS platform.</p>')
    html.append('</section>')
    
    # Section 4: Scalability
    html.append('<section>')
    html.append('<h2>4. Scalability Across the SaaS Ecosystem</h2>')
    html.append('<p>The federated authentication pattern is highly scalable. Once the trust relationship is established between Temenos Keycloak and a client\'s IdP, that single configuration can be leveraged to control access to <span class="highlight">multiple applications</span> hosted in the Temenos SaaS environment.</p>')
    html.append('<ul>')
    html.append('<li><strong>Onboarding New Applications:</strong> When a new Temenos application is introduced, it is simply registered within the central Keycloak instance.</li>')
    html.append('<li><strong>Leveraging Existing Identity:</strong> The application immediately inherits the federated authentication capabilities. There is no need to re-configure the client\'s IdP for each new application.</li>')
    html.append('<li><strong>Centralized Management:</strong> This approach simplifies administration, as access control policies are managed centrally in Keycloak, while the core user identity remains with the client.</li>')
    html.append('</ul>')
    html.append('</section>')
    
    # Section 5: Conclusion
    html.append('<section>')
    html.append('<h2>5. Conclusion</h2>')
    html.append('<p>The Temenos authentication framework provides a robust, secure, and flexible solution for enterprise clients. By leveraging Keycloak as an identity broker, it creates a powerful separation of concerns:</p>')
    html.append('<ul>')
    html.append('<li><strong>Temenos</strong> manages application authorization and access policies.</li>')
    html.append('<li><strong>The Client</strong> maintains full control over user authentication and security policies (like MFA).</li>')
    html.append('</ul>')
    html.append('<p>This federated approach, built on the industry-standard OIDC protocol with PKCE, ensures a secure and seamless user experience while offering the scalability required to manage a growing portfolio of SaaS applications.</p>')
    html.append('</section>')
    
    html.append('</main>')
    
    # Footer
    html.append('<footer>')
    html.append('<p>Temenos Authentication Framework Documentation</p>')
    html.append('<p>BSG Demo Platform</p>')
    html.append('</footer>')
    
    html.append('</div>')
    html.append('</body>')
    html.append('</html>')
    
    return '\n'.join(html)


def create_html5_page_from_temp_file(temp_file_path: str) -> str:
    """
    Create a proper HTML5 page from scratch based on results in temporary file.
    Limited to approximately 3 pages of content.
    
    Args:
        temp_file_path: Path to temporary file containing search results
        
    Returns:
        HTML5 string representation
    """
    # Read results from temp file
    with open(temp_file_path, 'r') as f:
        data = json.load(f)
    
    search_term = data.get('search_term', 'Authentication')
    results = data.get('results', {})
    
    doc_name = results.get('document_name', 'Unknown Document')
    matches_found = results.get('matches_found', 0)
    filtered_content = results.get('document', {})
    
    # Limit content to approximately 3 pages (roughly 15-20 paragraphs max)
    paragraphs = filtered_content.get('paragraphs', [])
    max_paragraphs = min(len(paragraphs), 20)  # Limit to 20 paragraphs max
    limited_paragraphs = paragraphs[:max_paragraphs]
    
    # Build HTML5 page from scratch
    html = []
    
    # HTML5 Document Structure
    html.append('<!DOCTYPE html>')
    html.append('<html lang="en">')
    
    # Head Section
    html.append('<head>')
    html.append('<meta charset="UTF-8">')
    html.append('<meta name="viewport" content="width=device-width, initial-scale=1.0">')
    html.append('<meta name="description" content="Authentication search results from Security Framework document">')
    html.append(f'<title>{search_term} - Security Framework</title>')
    
    # CSS Styles
    html.append('<style>')
    html.append('''
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        html {
            font-size: 16px;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.7;
            color: #1f2937;
            background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
            padding: 0;
            margin: 0;
        }
        
        .page-container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            min-height: 100vh;
        }
        
        header {
            background: linear-gradient(135deg, #283054 0%, #3B82F6 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }
        
        header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
            letter-spacing: -0.5px;
        }
        
        header p {
            font-size: 1.1rem;
            opacity: 0.95;
        }
        
        main {
            padding: 40px 30px;
        }
        
        .summary-section {
            background: #eff6ff;
            border-left: 4px solid #3B82F6;
            padding: 20px;
            margin-bottom: 30px;
            border-radius: 6px;
        }
        
        .summary-section h2 {
            color: #1e40af;
            font-size: 1.3rem;
            margin-bottom: 15px;
        }
        
        .summary-section ul {
            list-style: none;
            padding-left: 0;
        }
        
        .summary-section li {
            color: #1e40af;
            margin: 8px 0;
            padding-left: 20px;
            position: relative;
        }
        
        .summary-section li::before {
            content: "•";
            color: #3B82F6;
            font-weight: bold;
            position: absolute;
            left: 0;
        }
        
        .content-section {
            margin-top: 30px;
        }
        
        .content-section h2 {
            color: #283054;
            font-size: 1.8rem;
            margin-bottom: 25px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .match-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-left: 4px solid #3B82F6;
            padding: 25px;
            margin-bottom: 20px;
            border-radius: 6px;
            transition: box-shadow 0.2s;
        }
        
        .match-card:hover {
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        
        .match-card h3 {
            color: #283054;
            font-size: 1.1rem;
            margin-bottom: 12px;
            display: flex;
            align-items: center;
        }
        
        .match-card h3::before {
            content: "🔐";
            margin-right: 10px;
            font-size: 1.2rem;
        }
        
        .match-text {
            color: #4b5563;
            line-height: 1.8;
            font-size: 1rem;
            text-align: justify;
        }
        
        .highlight {
            background: #fef3c7;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: 600;
            color: #92400e;
        }
        
        footer {
            background: #f9fafb;
            padding: 25px 30px;
            text-align: center;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            margin-top: 40px;
        }
        
        footer p {
            font-size: 0.9rem;
        }
        
        .no-results {
            text-align: center;
            padding: 60px 20px;
            color: #6b7280;
        }
        
        .no-results h3 {
            font-size: 1.5rem;
            color: #283054;
            margin-bottom: 10px;
        }
        
        @media print {
            body {
                background: white;
            }
            .page-container {
                box-shadow: none;
            }
        }
    ''')
    html.append('</style>')
    html.append('</head>')
    
    # Body Section
    html.append('<body>')
    html.append('<div class="page-container">')
    
    # Header
    html.append('<header>')
    html.append(f'<h1>{search_term}</h1>')
    html.append(f'<p>Security Framework Document - Search Results</p>')
    html.append('</header>')
    
    # Main Content
    html.append('<main>')
    
    # Summary Section
    html.append('<section class="summary-section">')
    html.append('<h2>Search Summary</h2>')
    html.append('<ul>')
    html.append(f'<li><strong>Document:</strong> {doc_name}</li>')
    html.append(f'<li><strong>Search Term:</strong> {search_term}</li>')
    html.append(f'<li><strong>Matches Found:</strong> {matches_found} paragraph(s)</li>')
    html.append(f'<li><strong>Displayed:</strong> {len(limited_paragraphs)} of {len(paragraphs)} matches</li>')
    html.append('</ul>')
    html.append('</section>')
    
    # Content Section
    html.append('<section class="content-section">')
    html.append('<h2>Found Content</h2>')
    
    if matches_found > 0 and limited_paragraphs:
        for idx, para in enumerate(limited_paragraphs, 1):
            para_text = para.get('text', '') if isinstance(para, dict) else str(para)
            if para_text:
                # Clean and truncate very long paragraphs (max 500 chars per paragraph for readability)
                if len(para_text) > 500:
                    para_text = para_text[:500] + "..."
                
                # Highlight search term (case-insensitive)
                highlighted_text = re.sub(
                    f'({re.escape(search_term)})',
                    r'<span class="highlight">\1</span>',
                    para_text,
                    flags=re.IGNORECASE
                )
                
                html.append('<article class="match-card">')
                html.append(f'<h3>Finding {idx}</h3>')
                html.append(f'<div class="match-text">{highlighted_text}</div>')
                html.append('</article>')
    else:
        html.append('<div class="no-results">')
        html.append('<h3>No Results Found</h3>')
        html.append(f'<p>No content found matching "{search_term}" in this document.</p>')
        html.append('</div>')
    
    html.append('</section>')
    html.append('</main>')
    
    # Footer
    html.append('<footer>')
    html.append(f'<p>Generated from: {doc_name} | Security Items Collection</p>')
    html.append('<p>BSG Demo Platform</p>')
    html.append('</footer>')
    
    html.append('</div>')
    html.append('</body>')
    html.append('</html>')
    
    return '\n'.join(html)


@router.get("/items/authentication/html5", response_class=HTMLResponse)
async def get_authentication_html5_page():
    """
    Get the static Authentication Framework HTML5 page.
    This endpoint returns a pre-built HTML5 page with authentication framework documentation.
    
    Returns HTML5 page with authentication framework content.
    """
    try:
        # Generate static HTML5 page from scratch
        html5_content = create_authentication_html5_page_static()
        return HTMLResponse(content=html5_content)
    except Exception as e:
        logger.error(f"Error generating HTML5 authentication page: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating HTML5 page: {str(e)}")


@router.get("/items/by-name/{document_name}/search/{search_term}/html5", response_class=HTMLResponse)
async def search_document_by_name_and_term_html5(
    document_name: str,
    search_term: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Search for a document by name and search term, return HTML5 page.
    
    Parameters:
    - document_name: Name of the document to search (URL decoded)
    - search_term: Term to search for within the document
    
    Returns HTML5 page with search results.
    """
    try:
        import urllib.parse
        # Decode URL-encoded parameters
        decoded_name = urllib.parse.unquote(document_name)
        decoded_term = urllib.parse.unquote(search_term)
        
        collection = db["security_items"]
        
        # Try to find document by exact document_name match first
        row = await collection.find_one({"document_name": decoded_name})
        
        # If not found, try partial match (for cases where document_name might be different)
        if not row:
            # Try searching for documents containing the search term in document_name
            cursor = collection.find({
                "document_name": {"$regex": re.escape(decoded_name), "$options": "i"}
            })
            rows_list = await cursor.to_list(length=10)
            if rows_list:
                row = rows_list[0]
        
        # If still not found, try finding document_number = 1 (common case)
        if not row:
            row = await collection.find_one({"document_number": 1})
        
        if not row:
            raise HTTPException(
                status_code=404, 
                detail=f"Document not found. Searched for: '{decoded_name}'"
            )
        
        doc_number = row.get('document_number')
        doc_name = str(row.get('document_name', ''))
        doc_content_raw = row.get('document', {})
        
        if not isinstance(doc_content_raw, dict):
            raise HTTPException(
                status_code=400,
                detail="Document content is not in expected format"
            )
        
        # Search for the term in document content
        search_text = decoded_term.strip()
        escaped_query = re.escape(search_text)
        
        # Search in paragraphs
        all_paragraphs = doc_content_raw.get('paragraphs', [])
        matching_paragraphs = []
        
        if isinstance(all_paragraphs, list):
            for para in all_paragraphs:
                if isinstance(para, dict):
                    para_text = para.get('text', '')
                elif isinstance(para, str):
                    para_text = para
                else:
                    continue
                
                if para_text and re.search(escaped_query, para_text, re.IGNORECASE):
                    matching_paragraphs.append(para)
        
        # Search in full_text if available
        full_text = doc_content_raw.get('full_text', '')
        if full_text and isinstance(full_text, str):
            if re.search(escaped_query, full_text, re.IGNORECASE):
                # If no paragraphs matched but full_text matches, extract relevant sections
                if not matching_paragraphs:
                    # Split full_text into sentences and find matches
                    sentences = re.split(r'[.!?]+', full_text)
                    for sentence in sentences:
                        if re.search(escaped_query, sentence, re.IGNORECASE):
                            matching_paragraphs.append({'text': sentence.strip()})
        
        # Search in tables
        matching_tables = []
        all_tables = doc_content_raw.get('tables', [])
        if isinstance(all_tables, list):
            for table in all_tables:
                if isinstance(table, dict):
                    table_rows = table.get('rows', [])
                    if isinstance(table_rows, list):
                        # Check if any cell contains the search term
                        has_match = False
                        for row in table_rows:
                            if isinstance(row, list):
                                for cell in row:
                                    cell_text = str(cell) if cell else ""
                                    if re.search(escaped_query, cell_text, re.IGNORECASE):
                                        has_match = True
                                        break
                                if has_match:
                                    break
                        if has_match:
                            matching_tables.append(table)
        
        # Create filtered content
        filtered_content = {
            'paragraphs': matching_paragraphs,
            'tables': matching_tables,
            'paragraph_count': len(matching_paragraphs),
            'table_count': len(matching_tables)
        }
        
        # Prepare search results
        search_results = {
            'document_number': doc_number,
            'document_name': doc_name,
            'document': filtered_content,
            'search_term': search_text,
            'matches_found': len(matching_paragraphs)
        }
        
        # Save results to temporary file
        temp_file_path = None
        try:
            temp_file_path = save_search_results_to_temp_file(search_results, search_text)
            
            # Generate HTML5 page from scratch using temp file
            html5_content = create_html5_page_from_temp_file(temp_file_path)
            
            return HTMLResponse(content=html5_content)
        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except Exception as e:
                    logger.warning(f"Failed to delete temp file {temp_file_path}: {e}")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating HTML5 search results: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating HTML5 search results: {str(e)}")


@router.get("/items/{document_number}/search")
async def search_within_document(
    document_number: int,
    search_context: str = Query(..., description="Search text within the document content"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Search within a specific document's content.
    
    Parameters:
    - document_number: Document number to search within
    - search_context: Text to search for in document content
    
    Returns filtered document content matching the search.
    """
    try:
        if not search_context or not search_context.strip():
            raise HTTPException(
                status_code=400,
                detail="search_context parameter is required"
            )
        
        collection = db["security_items"]
        
        # Find the document first
        row = await collection.find_one({"document_number": document_number})
        
        if not row:
            raise HTTPException(
                status_code=404,
                detail=f"Document with number {document_number} not found"
            )
        
        # Store document info immediately (before any loops that might overwrite 'row')
        doc_number = int(row.get('document_number'))
        doc_name = str(row.get('document_name', ''))
        
        doc_content_raw = row.get('document', {})
        search_text = search_context.strip()
        escaped_query = re.escape(search_text)
        
        # Search within the document content
        # Filter paragraphs that match the search
        filtered_content = {}
        matching_paragraphs = []
        
        # Ensure doc_content is a dict
        if isinstance(doc_content_raw, dict):
            doc_content = doc_content_raw
        elif isinstance(doc_content_raw, list):
            logger.warning(f"Document content is a list, converting to dict")
            doc_content = {}
        else:
            logger.warning(f"Document content is not a dict, type: {type(doc_content_raw)}")
            doc_content = {}
        
        try:
            if isinstance(doc_content, dict):
                # Filter paragraphs that contain the search text
                all_paragraphs = doc_content.get("paragraphs", [])
                if not isinstance(all_paragraphs, list):
                    all_paragraphs = []
                
                for para in all_paragraphs:
                    try:
                        # Handle different paragraph formats
                        if isinstance(para, dict):
                            para_text = para.get("text", "")
                        elif isinstance(para, str):
                            para_text = para
                        else:
                            para_text = str(para)
                        
                        if para_text and re.search(escaped_query, para_text, re.IGNORECASE):
                            matching_paragraphs.append(para)
                    except Exception as e:
                        logger.warning(f"Error processing paragraph: {e}")
                        continue
                
                # Include full_text if it matches (for context)
                full_text = doc_content.get("full_text", "")
                has_full_text_match = False
                if full_text and isinstance(full_text, str) and re.search(escaped_query, full_text, re.IGNORECASE):
                    has_full_text_match = True
                
                # Include tables if they match
                tables = doc_content.get("tables", [])
                if not isinstance(tables, list):
                    tables = []
                    
                matching_tables = []
                for table in tables:
                    try:
                        if not isinstance(table, dict):
                            continue
                            
                        table_rows = table.get("rows", [])
                        if not isinstance(table_rows, list):
                            continue
                            
                        table_matches = False
                        for row in table_rows:
                            try:
                                # Handle different row formats
                                if isinstance(row, list):
                                    # Row is a list of cell values (strings)
                                    row_text = " ".join([str(cell) for cell in row])
                                elif isinstance(row, dict):
                                    # Row is a dict with cells array
                                    cells = row.get("cells", [])
                                    if isinstance(cells, list):
                                        row_text = " ".join([str(cell.get("text", "")) if isinstance(cell, dict) else str(cell) for cell in cells])
                                    else:
                                        row_text = str(row)
                                else:
                                    row_text = str(row)
                                
                                if row_text and re.search(escaped_query, row_text, re.IGNORECASE):
                                    table_matches = True
                                    break
                            except Exception as e:
                                logger.warning(f"Error processing table row: {e}")
                                continue
                        
                        if table_matches:
                            matching_tables.append(table)
                    except Exception as e:
                        logger.warning(f"Error processing table: {e}")
                        continue
                
                # Build filtered content
                file_name_val = doc_content.get("file_name", "")
                if not isinstance(file_name_val, str):
                    file_name_val = ""
                    
                filtered_content = {
                    "file_name": file_name_val,
                    "paragraphs": matching_paragraphs,
                    "paragraph_count": len(matching_paragraphs),
                    "tables": matching_tables,
                    "table_count": len(matching_tables),
                    "total_characters": 0
                }
                
                if has_full_text_match:
                    filtered_content["full_text"] = full_text
                    filtered_content["total_characters"] = len(full_text)
        except Exception as e:
            logger.error(f"Error processing document content: {e}", exc_info=True)
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            raise
        
        return {
            "success": True,
            "data": {
                "document_number": doc_number,
                "document_name": doc_name,
                "document": filtered_content,
                "search_context": search_text,
                "matches_found": len(matching_paragraphs)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching within document: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error searching within document: {str(e)}")


@router.get("/presentations")
async def get_security_presentations(
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all security presentations from security_presentation collection.
    
    Returns a list of all presentations with presentation_number and presentation_name.
    """
    try:
        collection = db["security_presentation"]
        
        # Find all presentations
        cursor = collection.find({}).sort("presentation_number", 1)
        rows = await cursor.to_list(length=1000)
        
        presentations = []
        for row in rows:
            try:
                pres_number = row.get('presentation_number')
                pres_name = row.get('presentation_name', '')
                
                if pres_number is None:
                    logger.warning(f"Presentation missing presentation_number: {row.get('_id')}")
                    continue
                
                presentations.append({
                    "presentation_number": int(pres_number),
                    "presentation_name": str(pres_name)
                })
            except Exception as e:
                logger.error(f"Error processing presentation {row.get('_id', 'unknown')}: {e}", exc_info=True)
                continue
        
        return {
            "success": True,
            "data": {
                "presentations": presentations,
                "total_results": len(presentations)
            }
        }
        
    except Exception as e:
        logger.error(f"Error retrieving security presentations: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving security presentations: {str(e)}")


@router.get("/presentations/by-name/{presentation_name}")
async def get_security_presentation_by_name(
    presentation_name: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific security presentation by presentation name.
    
    Parameters:
    - presentation_name: Presentation name to retrieve (URL decoded)
    
    Returns the presentation with presentation_number, presentation_name, and presentation fields.
    """
    try:
        import urllib.parse
        # Decode URL-encoded presentation name
        decoded_name = urllib.parse.unquote(presentation_name)
        
        collection = db["security_presentation"]
        
        # Find document by presentation_name (exact match)
        row = await collection.find_one({"presentation_name": decoded_name})
        
        if not row:
            raise HTTPException(
                status_code=404, 
                detail=f"Presentation with name '{decoded_name}' not found"
            )
        
        pres_number = row.get('presentation_number')
        pres_name = row.get('presentation_name', '')
        pres_content = row.get('presentation', {})
        
        return {
            "success": True,
            "data": {
                "presentation_number": int(pres_number),
                "presentation_name": str(pres_name),
                "presentation": pres_content if isinstance(pres_content, dict) else {}
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving security presentation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving security presentation: {str(e)}")


@router.get("/presentations/{presentation_number}")
async def get_security_presentation(
    presentation_number: int,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get a specific security presentation by presentation number.
    
    Parameters:
    - presentation_number: Presentation number to retrieve
    
    Returns the presentation with presentation_number, presentation_name, and presentation fields.
    """
    try:
        collection = db["security_presentation"]
        
        # Find document by presentation_number
        row = await collection.find_one({"presentation_number": presentation_number})
        
        if not row:
            raise HTTPException(
                status_code=404, 
                detail=f"Presentation with number {presentation_number} not found"
            )
        
        pres_number = row.get('presentation_number')
        pres_name = row.get('presentation_name', '')
        pres_content = row.get('presentation', {})
        
        return {
            "success": True,
            "data": {
                "presentation_number": int(pres_number),
                "presentation_name": str(pres_name),
                "presentation": pres_content if isinstance(pres_content, dict) else {}
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving security presentation: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving security presentation: {str(e)}")


@router.get("/presentations/by-name/{presentation_name}/html5", response_class=HTMLResponse)
async def get_security_presentation_html5_by_name(
    presentation_name: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get security presentation as HTML5 by presentation name.
    Retrieves PPTX file from GridFS and converts it to HTML5.
    
    Parameters:
    - presentation_name: Presentation name to retrieve
    
    Returns HTML5 representation of the presentation.
    """
    try:
        import urllib.parse
        # Decode URL-encoded presentation name
        decoded_name = urllib.parse.unquote(presentation_name)
        
        collection = db["security_presentation"]
        
        # Find document by presentation_name
        row = await collection.find_one({"presentation_name": decoded_name})
        
        if not row:
            raise HTTPException(
                status_code=404, 
                detail=f"Presentation with name '{decoded_name}' not found"
            )
        
        pres_number = row.get('presentation_number')
        pres_name = row.get('presentation_name', '')
        
        # Try to get PPTX file from GridFS
        html5_content = None
        temp_pptx_path = None
        
        try:
            # Check if GridFS is available and PPTX file exists
            fs = motor_asyncio.AsyncIOMotorGridFSBucket(db, bucket_name='presentation_files')
            pptx_filename = f"presentation_{pres_number}.pptx"
            
            # Try to find PPTX file in GridFS
            try:
                grid_file = await fs.open_download_stream_by_name(pptx_filename)
                
                # Download PPTX to temporary file
                pptx_data = await grid_file.read()
                with tempfile.NamedTemporaryFile(suffix='.pptx', delete=False) as temp_pptx:
                    temp_pptx.write(pptx_data)
                    temp_pptx_path = temp_pptx.name
                
                # Convert PPTX to HTML5
                html5_content = convert_pptx_to_html5(temp_pptx_path)
                
            except Exception as grid_error:
                logger.info(f"PPTX file not found in GridFS: {grid_error}")
                
        except Exception as e:
            logger.warning(f"Could not access GridFS: {e}")
        
        finally:
            # Clean up temporary PPTX file
            if temp_pptx_path and os.path.exists(temp_pptx_path):
                try:
                    os.unlink(temp_pptx_path)
                except:
                    pass
        
        # If HTML5 conversion failed, return error
        if not html5_content:
            raise HTTPException(
                status_code=404,
                detail=f"PPTX file not found in GridFS for presentation '{decoded_name}'. Please upload the PPTX file to GridFS."
            )
        
        # Return HTML5 content
        return HTMLResponse(content=html5_content)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating HTML5: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating HTML5: {str(e)}")
