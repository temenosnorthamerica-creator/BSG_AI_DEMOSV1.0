"""
Grafana Authentication API
Handles auto-login and redirects to Grafana dashboards
"""
from fastapi import APIRouter, Response
from fastapi.responses import HTMLResponse, RedirectResponse
import httpx
import logging
import re

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/grafana-auth", tags=["grafana-auth"])

GRAFANA_URL = "https://transactwb.temenos.com/grafana"
GRAFANA_DASHBOARD_URL = "https://transactwb.temenos.com/grafana/d/mrtS77BGz/channel-transaction-summary?orgId=1"
GRAFANA_USERNAME = "admin"
GRAFANA_PASSWORD = "m@rk!V@123"

# Import the grafana_proxy authentication function to reuse it
from app.api.grafana_proxy import get_authenticated_client, session_cookies as proxy_session_cookies

# Verify credentials are exactly as specified
if GRAFANA_USERNAME != "admin":
    logger.error(f"CRITICAL: Username is '{GRAFANA_USERNAME}', expected 'admin'")
if GRAFANA_PASSWORD != "m@rk!V@123":
    logger.error(f"CRITICAL: Password mismatch! Expected 'm@rk!V@123'")
    logger.error(f"Password actual value: '{GRAFANA_PASSWORD}'")
    logger.error(f"Password length: {len(GRAFANA_PASSWORD)}")
    logger.error(f"Password bytes: {GRAFANA_PASSWORD.encode('utf-8')}")


@router.get("/auto-login", response_class=HTMLResponse)
async def auto_login():
    """
    Provides an auto-login page that redirects to the proxy dashboard endpoint.
    The proxy handles authentication server-side to avoid CORS issues.
    """
    # Redirect to proxy dashboard which handles authentication server-side
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <title>Grafana Auto-Login</title>
  <meta http-equiv="refresh" content="0; url=/api/v1/grafana-auth/proxy-dashboard">
  <script>
    window.location.href = '/api/v1/grafana-auth/proxy-dashboard';
  </script>
</head>
<body>
  <p>Redirecting to Grafana dashboard...</p>
</body>
</html>
    """
    return HTMLResponse(content=html_content)


@router.get("/proxy-dashboard")
async def proxy_dashboard():
    """
    Server-side proxy that authenticates with Grafana and serves the dashboard.
    This bypasses CORS issues by handling authentication on the server.
    Reuses the grafana_proxy authentication mechanism.
    """
    try:
        # Try to use the existing grafana_proxy authentication first
        logger.info("Attempting to use grafana_proxy authentication...")
        try:
            proxy_client = await get_authenticated_client()
            if proxy_session_cookies:
                logger.info(f"Found {len(proxy_session_cookies)} session cookies from grafana_proxy")
                
                # Try to fetch dashboard using proxy client and cookies
                dashboard_response = await proxy_client.get(
                    "/d/mrtS77BGz/channel-transaction-summary",
                    params={"orgId": "1"},
                    cookies=proxy_session_cookies
                )
                
                if dashboard_response.status_code == 200:
                    logger.info("Successfully fetched dashboard using grafana_proxy authentication!")
                    content = dashboard_response.text
                    # Replace URLs to go through proxy
                    content = content.replace(
                        f'"{GRAFANA_URL}',
                        f'"/api/v1/grafana-proxy'
                    )
                    content = content.replace(
                        f"'{GRAFANA_URL}",
                        f"'/api/v1/grafana-proxy"
                    )
                    return HTMLResponse(content=content)
                else:
                    logger.warning(f"grafana_proxy authentication exists but dashboard fetch failed: {dashboard_response.status_code}")
            else:
                logger.warning("No session cookies found in grafana_proxy")
        except Exception as e:
            logger.warning(f"Could not use grafana_proxy authentication: {e}")
        
        # Fallback: Try our own authentication
        logger.info("Falling back to direct authentication...")
        
        # Use the same client configuration as grafana_proxy
        async with httpx.AsyncClient(
            base_url=GRAFANA_URL,
            follow_redirects=True,  # Follow redirects like grafana_proxy does
            timeout=30.0,
            verify=False  # Disable SSL verification
        ) as client:
            # Step 1: Get the login page first (like grafana_proxy does)
            logger.info("Getting Grafana login page (like grafana_proxy.py)...")
            login_page_response = await client.get("/login")
            logger.info(f"Login page status: {login_page_response.status_code}")
            
            # Step 2: Authenticate using the API endpoint (EXACT same as grafana_proxy.py)
            logger.info("Authenticating with Grafana API...")
            logger.info(f"Using credentials: username='{GRAFANA_USERNAME}', password length={len(GRAFANA_PASSWORD)}")
            logger.info(f"Password (first 3 chars): '{GRAFANA_PASSWORD[:3]}...' (to verify special characters)")
            
            # Verify credentials are set correctly
            if GRAFANA_USERNAME != "admin":
                logger.error(f"ERROR: Username mismatch! Expected 'admin', got '{GRAFANA_USERNAME}'")
            if GRAFANA_PASSWORD != "m@rk!V@123":
                logger.error(f"ERROR: Password mismatch! Expected 'm@rk!V@123', got '{GRAFANA_PASSWORD}'")
            
            # Try authentication with different methods
            login_response = None
            auth_success = False
            
            # Method 1: Basic Authentication (HTTP Basic Auth)
            try:
                import base64
                logger.info("Trying Basic Authentication...")
                credentials = f"{GRAFANA_USERNAME}:{GRAFANA_PASSWORD}"
                encoded_credentials = base64.b64encode(credentials.encode()).decode()
                
                login_response = await client.post(
                    "/api/login",
                    headers={
                        "Authorization": f"Basic {encoded_credentials}",
                        "Content-Type": "application/json",
                        "Accept": "application/json",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                        "Referer": f"{GRAFANA_URL}/login",
                    },
                    cookies=initial_cookies
                )
                
                if login_response.status_code == 200:
                    auth_success = True
                    logger.info("Authentication successful with Basic Auth")
                else:
                    logger.warning(f"Basic Auth failed: {login_response.status_code}")
                    logger.warning(f"Response: {login_response.text[:200]}")
            except Exception as e:
                logger.warning(f"Basic Auth error: {e}")
            
            # PRIMARY METHOD: Use EXACT same approach as grafana_proxy.py
            # This should work if grafana_proxy works
            logger.info("Authenticating with Grafana API (EXACT same as grafana_proxy.py)...")
            logger.info(f"Credentials: user='{GRAFANA_USERNAME}', password length={len(GRAFANA_PASSWORD)}")
            logger.info(f"Password verification: starts with '{GRAFANA_PASSWORD[:3]}', ends with '{GRAFANA_PASSWORD[-3:]}'")
            logger.info(f"Password bytes (hex): {GRAFANA_PASSWORD.encode('utf-8').hex()}")
            
            # Verify password matches exactly
            expected_password = "m@rk!V@123"
            if GRAFANA_PASSWORD != expected_password:
                logger.error(f"PASSWORD MISMATCH!")
                logger.error(f"Expected: '{expected_password}' (bytes: {expected_password.encode('utf-8')})")
                logger.error(f"Got:      '{GRAFANA_PASSWORD}' (bytes: {GRAFANA_PASSWORD.encode('utf-8')})")
                logger.error(f"Expected hex: {expected_password.encode('utf-8').hex()}")
                logger.error(f"Got hex:      {GRAFANA_PASSWORD.encode('utf-8').hex()}")
            
            login_response = await client.post(
                "/api/login",
                json={"user": GRAFANA_USERNAME, "password": GRAFANA_PASSWORD},
                headers={
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                }
                # Note: grafana_proxy.py doesn't send cookies or extra headers
            )
            
            logger.info(f"Login response status: {login_response.status_code}")
            logger.info(f"Login response: {login_response.text[:200]}")
            logger.info(f"Login response headers: {dict(login_response.headers)}")
            
            auth_success = login_response.status_code == 200
            
            if auth_success:
                logger.info("✓ Authentication successful!")
            else:
                logger.error(f"✗ Authentication failed: {login_response.status_code}")
                logger.error(f"Response: {login_response.text[:500]}")
                
                # If 401, the credentials are definitely wrong or account is restricted
                if login_response.status_code == 401:
                    logger.error("=" * 80)
                    logger.error("CRITICAL: Grafana returned 401 Unauthorized")
                    logger.error("This means:")
                    logger.error("  1. The credentials are INCORRECT, OR")
                    logger.error("  2. The account is locked/disabled, OR")
                    logger.error("  3. IP restrictions are in place, OR")
                    logger.error("  4. API login is disabled for this account")
                    logger.error("=" * 80)
            
            # If primary method failed, try alternatives (but they likely won't work either)
            if not auth_success:
                logger.warning("Primary authentication method failed. Trying alternatives...")
            
            # Method 3: Form-encoded data
            if not auth_success:
                try:
                    logger.info("Trying form-encoded format...")
                    login_response = await client.post(
                        "/api/login",
                        data={
                            "user": GRAFANA_USERNAME,
                            "password": GRAFANA_PASSWORD
                        },
                        headers={
                            "Content-Type": "application/x-www-form-urlencoded",
                            "Accept": "application/json",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                            "Referer": f"{GRAFANA_URL}/login",
                        },
                        cookies=initial_cookies
                    )
                    
                    if login_response.status_code == 200:
                        auth_success = True
                        logger.info("Authentication successful with form-encoded format")
                    else:
                        logger.warning(f"Form-encoded format failed: {login_response.status_code}")
                        logger.warning(f"Response: {login_response.text[:200]}")
                except Exception as e:
                    logger.warning(f"Form-encoded format error: {e}")
            
            # Method 4: Try with "username" instead of "user"
            if not auth_success:
                try:
                    logger.info("Trying with 'username' field...")
                    login_response = await client.post(
                        "/api/login",
                        json={"username": GRAFANA_USERNAME, "password": GRAFANA_PASSWORD},
                        headers={
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                            "Referer": f"{GRAFANA_URL}/login",
                        },
                        cookies=initial_cookies
                    )
                    
                    if login_response.status_code == 200:
                        auth_success = True
                        logger.info("Authentication successful with 'username' field")
                    else:
                        logger.warning(f"'username' field format failed: {login_response.status_code}")
                        logger.warning(f"Response: {login_response.text[:200]}")
                except Exception as e:
                    logger.warning(f"'username' field format error: {e}")
            
            # Method 5: Try HTML form login endpoint with CSRF token
            if not auth_success:
                try:
                    logger.info("Trying HTML form login endpoint (/login) with CSRF token...")
                    
                    # Build form data with CSRF token if available
                    form_data = {
                        "user": GRAFANA_USERNAME,
                        "password": GRAFANA_PASSWORD,
                    }
                    
                    # Add CSRF token if found
                    if csrf_token:
                        form_data["csrfToken"] = csrf_token
                        logger.info("Including CSRF token in form data")
                    
                    # Also try common CSRF field names
                    if csrf_token:
                        form_data["_csrf"] = csrf_token
                    
                    login_response = await client.post(
                        "/login",
                        data=form_data,
                        headers={
                            "Content-Type": "application/x-www-form-urlencoded",
                            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                            "Referer": f"{GRAFANA_URL}/login",
                            "Origin": GRAFANA_URL,
                        },
                        cookies=initial_cookies,
                        follow_redirects=False
                    )
                    
                    logger.info(f"Form login response status: {login_response.status_code}")
                    logger.info(f"Form login response headers: {dict(login_response.headers)}")
                    
                    # Form login might redirect on success (302) or return 200
                    if login_response.status_code in [200, 302]:
                        # Check if we got redirected away from login page (success)
                        location = login_response.headers.get("location", "")
                        if "login" not in location.lower() or login_response.status_code == 200:
                            auth_success = True
                            logger.info("Authentication successful with HTML form login")
                        else:
                            logger.warning(f"HTML form login redirected back to login: {location}")
                    else:
                        logger.warning(f"HTML form login failed: {login_response.status_code}")
                        logger.warning(f"Response: {login_response.text[:500]}")
                except Exception as e:
                    logger.warning(f"HTML form login error: {e}")
            
            # If all methods failed, use the last response for error reporting
            if not login_response:
                raise Exception("Failed to get any login response from Grafana")
            
            logger.info(f"Login response status: {login_response.status_code}")
            logger.info(f"Login response headers: {dict(login_response.headers)}")
            logger.info(f"Login response text (first 500 chars): {login_response.text[:500]}")
            
            # Get session cookies from login response
            session_cookies = {}
            if login_response.cookies:
                for cookie_name, cookie_value in login_response.cookies.items():
                    session_cookies[cookie_name] = cookie_value
                    logger.info(f"Got session cookie: {cookie_name}")
            
            # Check Set-Cookie headers as well
            set_cookie_headers = login_response.headers.get_list("set-cookie")
            if set_cookie_headers:
                logger.info(f"Found {len(set_cookie_headers)} Set-Cookie headers")
                for cookie_header in set_cookie_headers:
                    logger.info(f"Set-Cookie: {cookie_header[:100]}")
            
            if not auth_success or login_response.status_code != 200:
                error_msg = login_response.text[:500]
                logger.error(f"Authentication failed: {login_response.status_code}")
                logger.error(f"Response: {error_msg}")
                
                # Log credential verification
                logger.error(f"CREDENTIAL VERIFICATION:")
                logger.error(f"  Username: '{GRAFANA_USERNAME}' (expected: 'admin')")
                logger.error(f"  Password length: {len(GRAFANA_PASSWORD)} (expected: 10)")
                logger.error(f"  Password starts with: '{GRAFANA_PASSWORD[:3]}' (expected: 'm@r')")
                logger.error(f"  Password ends with: '{GRAFANA_PASSWORD[-3:]}' (expected: '123')")
                logger.error(f"  Password bytes: {GRAFANA_PASSWORD.encode('utf-8')}")
                
                # Try to parse error message
                try:
                    import json
                    error_json = json.loads(error_msg)
                    error_message = error_json.get("message", "Unknown error")
                except:
                    error_message = error_msg
                
                # Provide helpful error message
                if login_response.status_code == 401:
                    help_text = "Grafana returned 'Unauthorized'. This usually means:<br>" \
                               "1. The username or password is incorrect<br>" \
                               "2. The account may be locked or disabled<br>" \
                               "3. IP restrictions may be in place<br><br>" \
                               "Please verify the credentials work by logging in manually at the Grafana login page."
                elif "bad login data" in error_msg.lower():
                    help_text = "Grafana returned 'bad login data'. This suggests the login form format is incorrect.<br>" \
                               "Please verify the credentials work by logging in manually."
                else:
                    help_text = f"Error: {error_message}"
                
                return HTMLResponse(
                    content=f"""
                    <html>
                    <head>
                        <title>Grafana Authentication Failed</title>
                        <style>
                            body {{ font-family: Arial, sans-serif; padding: 40px; text-align: center; max-width: 600px; margin: 0 auto; }}
                            h1 {{ color: #d32f2f; }}
                            .error {{ background: #ffebee; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: left; }}
                            .info {{ background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: left; }}
                            a {{ color: #1976d2; text-decoration: none; display: inline-block; margin: 10px; padding: 10px 20px; background: #1976d2; color: white; border-radius: 5px; }}
                            a:hover {{ background: #1565c0; }}
                        </style>
                    </head>
                    <body>
                        <h1>Authentication Failed</h1>
                        <div class="error">
                            <p><strong>Status:</strong> {login_response.status_code}</p>
                            <p><strong>Error:</strong> {error_message}</p>
                        </div>
                        <div class="info">
                            <p>{help_text}</p>
                        </div>
                        <div>
                            <a href="{GRAFANA_URL}/login" target="_blank">Go to Grafana Login Page</a>
                            <a href="{GRAFANA_DASHBOARD_URL}" target="_blank">Try Opening Dashboard Directly</a>
                        </div>
                    </body>
                    </html>
                    """,
                    status_code=401
                )
            
            logger.info("Authentication successful! Fetching dashboard...")
            
            # Step 3: Fetch the dashboard page with authenticated session
            dashboard_response = await client.get(
                "/d/mrtS77BGz/channel-transaction-summary",
                params={"orgId": "1"},
                cookies=session_cookies,
                headers={
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Referer": f"{GRAFANA_URL}/login",
                },
                follow_redirects=True
            )
            
            logger.info(f"Dashboard response status: {dashboard_response.status_code}")
            
            if dashboard_response.status_code == 200:
                # Return the dashboard HTML
                content = dashboard_response.text
                
                # Replace Grafana URLs to go through our proxy for API calls
                content = content.replace(
                    f'"{GRAFANA_URL}',
                    f'"/api/v1/grafana-proxy'
                )
                content = content.replace(
                    f"'{GRAFANA_URL}",
                    f"'/api/v1/grafana-proxy"
                )
                
                # Also replace in href and src attributes
                content = content.replace(
                    f'href="{GRAFANA_URL}',
                    f'href="/api/v1/grafana-proxy'
                )
                content = content.replace(
                    f"href='{GRAFANA_URL}",
                    f"href='/api/v1/grafana-proxy"
                )
                content = content.replace(
                    f'src="{GRAFANA_URL}',
                    f'src="/api/v1/grafana-proxy'
                )
                content = content.replace(
                    f"src='{GRAFANA_URL}",
                    f"src='/api/v1/grafana-proxy"
                )
                
                logger.info("Dashboard loaded successfully!")
                return HTMLResponse(content=content)
            else:
                logger.error(f"Failed to fetch dashboard: {dashboard_response.status_code}")
                logger.error(f"Dashboard response: {dashboard_response.text[:500]}")
                return HTMLResponse(
                    content=f"""
                    <html>
                    <head>
                        <title>Dashboard Load Failed</title>
                        <style>
                            body {{ font-family: Arial, sans-serif; padding: 40px; text-align: center; }}
                            h1 {{ color: #d32f2f; }}
                            a {{ color: #1976d2; text-decoration: none; }}
                        </style>
                    </head>
                    <body>
                        <h1>Dashboard Load Failed</h1>
                        <p>Could not load Grafana dashboard. Status: {dashboard_response.status_code}</p>
                        <p><a href="{GRAFANA_DASHBOARD_URL}">Open Grafana Directly</a></p>
                    </body>
                    </html>
                    """,
                    status_code=dashboard_response.status_code
                )
                
    except httpx.HTTPError as e:
        logger.error(f"HTTP error proxying dashboard: {e}", exc_info=True)
        return HTMLResponse(
            content=f"""
            <html>
            <head>
                <title>Connection Error</title>
                <style>
                    body {{ font-family: Arial, sans-serif; padding: 40px; text-align: center; }}
                    h1 {{ color: #d32f2f; }}
                    a {{ color: #1976d2; text-decoration: none; }}
                </style>
            </head>
            <body>
                <h1>Connection Error</h1>
                <p>Could not connect to Grafana: {str(e)}</p>
                <p><a href="{GRAFANA_DASHBOARD_URL}">Open Grafana Directly</a></p>
            </body>
            </html>
            """,
            status_code=502
        )
    except Exception as e:
        logger.error(f"Error proxying dashboard: {e}", exc_info=True)
        return HTMLResponse(
            content=f"""
            <html>
            <head>
                <title>Error</title>
                <style>
                    body {{ font-family: Arial, sans-serif; padding: 40px; text-align: center; }}
                    h1 {{ color: #d32f2f; }}
                    a {{ color: #1976d2; text-decoration: none; }}
                </style>
            </head>
            <body>
                <h1>Error</h1>
                <p>An error occurred: {str(e)}</p>
                <p><a href="{GRAFANA_DASHBOARD_URL}">Open Grafana Directly</a></p>
            </body>
            </html>
            """,
            status_code=500
        )


@router.get("/launch")
async def launch_grafana():
    """
    Redirect endpoint that opens Grafana login page
    """
    return RedirectResponse(url=f"{GRAFANA_URL}/login")
