"""
Grafana Proxy API
Proxies requests to Grafana to bypass CORS restrictions with session management
"""
from fastapi import APIRouter, Request, Response, HTTPException, Cookie
from fastapi.responses import StreamingResponse, RedirectResponse
import httpx
from typing import Optional, Dict
import logging
from http.cookies import SimpleCookie

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/grafana-proxy", tags=["grafana-proxy"])

GRAFANA_BASE_URL = "https://transactwb.temenos.com/grafana"
GRAFANA_USERNAME = "admin"
GRAFANA_PASSWORD = "m@rk!V@123"

# Shared HTTP client with session management
grafana_client: Optional[httpx.AsyncClient] = None
session_cookies: Dict[str, str] = {}


async def get_authenticated_client() -> httpx.AsyncClient:
    """Get or create an authenticated Grafana client with session cookies"""
    global grafana_client, session_cookies

    if grafana_client is None or not session_cookies:
        # Create client
        grafana_client = httpx.AsyncClient(
            base_url=GRAFANA_BASE_URL,
            follow_redirects=True,
            timeout=30.0,
            verify=False  # Disable SSL verification if needed
        )

        # Perform login to get session cookies
        try:
            logger.info("Authenticating with Grafana...")

            # First, get the login page to get any initial cookies
            login_page = await grafana_client.get("/login")
            logger.info(f"Login page status: {login_page.status_code}")

            # Try multiple login approaches
            # Approach 1: JSON login
            login_response = await grafana_client.post(
                "/api/login",  # Use the API endpoint
                json={"user": GRAFANA_USERNAME, "password": GRAFANA_PASSWORD},
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                }
            )

            logger.info(f"Login response status: {login_response.status_code}")
            logger.info(f"Login response: {login_response.text[:200]}")

            # Store session cookies
            if login_response.cookies:
                for cookie_name, cookie_value in login_response.cookies.items():
                    session_cookies[cookie_name] = cookie_value
                logger.info(f"Stored {len(session_cookies)} session cookies")

            # Also check response headers for Set-Cookie
            if 'set-cookie' in login_response.headers:
                logger.info("Additional cookies found in headers")

        except Exception as e:
            logger.error(f"Failed to authenticate with Grafana: {e}", exc_info=True)

    return grafana_client


@router.get("/{path:path}")
async def proxy_get(path: str, request: Request):
    """Proxy GET requests to Grafana with session cookies"""
    global session_cookies

    try:
        client = await get_authenticated_client()

        # Build the full URL
        url = f"/{path}"
        if request.url.query:
            url = f"{url}?{request.url.query}"

        logger.info(f"Proxying GET request to: {url}")

        # Prepare headers with session cookies
        headers = {
            "Accept": request.headers.get("Accept", "*/*"),
            "User-Agent": request.headers.get("User-Agent", "Mozilla/5.0"),
            "Referer": GRAFANA_BASE_URL,
        }

        # Forward the request with session cookies
        response = await client.get(
            url,
            headers=headers,
            cookies=session_cookies
        )

        logger.info(f"Response status: {response.status_code}")

        # Update session cookies if new ones are received
        if response.cookies:
            for cookie_name, cookie_value in response.cookies.items():
                session_cookies[cookie_name] = cookie_value

        # Prepare response headers
        response_headers = dict(response.headers)

        # Remove problematic headers that prevent iframe embedding
        response_headers.pop("content-encoding", None)
        response_headers.pop("transfer-encoding", None)
        response_headers.pop("content-length", None)
        response_headers.pop("x-frame-options", None)  # Allow iframe embedding
        response_headers.pop("content-security-policy", None)  # Remove CSP restrictions
        response_headers.pop("strict-transport-security", None)

        # Add CORS headers
        response_headers["Access-Control-Allow-Origin"] = "*"
        response_headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response_headers["Access-Control-Allow-Headers"] = "*"
        response_headers["Access-Control-Allow-Credentials"] = "true"

        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers,
            media_type=response.headers.get("content-type", "text/html")
        )

    except httpx.HTTPError as e:
        logger.error(f"HTTP error proxying request: {e}", exc_info=True)
        raise HTTPException(status_code=502, detail=f"Proxy error: {str(e)}")
    except Exception as e:
        logger.error(f"Error proxying request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal proxy error: {str(e)}")


@router.post("/{path:path}")
async def proxy_post(path: str, request: Request):
    """Proxy POST requests to Grafana with session cookies"""
    global session_cookies

    try:
        client = await get_authenticated_client()

        # Get request body
        body = await request.body()

        logger.info(f"Proxying POST request to: /{path}")

        # Forward the request with session cookies
        response = await client.post(
            f"/{path}",
            content=body,
            headers={
                "Content-Type": request.headers.get("Content-Type", "application/json"),
                "Accept": request.headers.get("Accept", "*/*"),
                "User-Agent": "Mozilla/5.0",
                "Referer": GRAFANA_BASE_URL,
            },
            cookies=session_cookies
        )

        # Update session cookies if new ones are received
        if response.cookies:
            for cookie_name, cookie_value in response.cookies.items():
                session_cookies[cookie_name] = cookie_value

        # Prepare response headers
        response_headers = dict(response.headers)
        response_headers.pop("content-encoding", None)
        response_headers.pop("transfer-encoding", None)
        response_headers.pop("content-length", None)
        response_headers.pop("x-frame-options", None)
        response_headers.pop("content-security-policy", None)
        response_headers.pop("strict-transport-security", None)

        response_headers["Access-Control-Allow-Origin"] = "*"
        response_headers["Access-Control-Allow-Credentials"] = "true"

        return Response(
            content=response.content,
            status_code=response.status_code,
            headers=response_headers,
            media_type=response.headers.get("content-type", "application/json")
        )

    except Exception as e:
        logger.error(f"Error proxying POST request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Proxy error: {str(e)}")


@router.options("/{path:path}")
async def proxy_options(path: str):
    """Handle OPTIONS requests for CORS"""
    return Response(
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@router.on_event("shutdown")
async def shutdown_client():
    """Close the HTTP client on shutdown"""
    global grafana_client
    if grafana_client is not None:
        await grafana_client.aclose()
        grafana_client = None
