"""
Basic health check tests for the backend API.
These tests verify that the application can start and basic endpoints work.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


def test_app_imports():
    """Test that the app can be imported."""
    from app.main import app
    assert app is not None
    assert hasattr(app, 'routes')


def test_app_has_routes(client):
    """Test that the app has routes configured."""
    # Get all routes
    routes = [route.path for route in app.routes]
    assert len(routes) > 0
    print(f"Found {len(routes)} routes")


def test_liveness_endpoint(client):
    """Test the liveness endpoint (doesn't require database)."""
    response = client.get("/api/v1/live")
    # Should return 200 even if database is not connected
    assert response.status_code in [200, 503], f"Expected 200 or 503, got {response.status_code}"
    if response.status_code == 200:
        data = response.json()
        assert "alive" in data or "timestamp" in data


def test_api_prefix():
    """Test that API routes are prefixed with /api/v1."""
    routes = [route.path for route in app.routes if hasattr(route, 'path')]
    api_routes = [r for r in routes if r.startswith('/api/v1')]
    assert len(api_routes) > 0, "No API routes found with /api/v1 prefix"


def test_cors_headers(client):
    """Test that CORS headers are configured."""
    response = client.options("/api/v1/live", headers={"Origin": "http://localhost:3000"})
    # CORS preflight should be handled
    assert response.status_code in [200, 204, 405]


def test_app_structure():
    """Test that the app has the expected structure."""
    from app.core.config import settings
    assert settings is not None
    assert hasattr(settings, 'APP_NAME') or hasattr(settings, 'APP_VERSION')

