#!/bin/bash

##############################################################################
# BSG Demo Platform - Stop Script
# This script stops all running components of the BSG Demo Platform
##############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

LOG_DIR="logs"
BACKEND_PORT=8000
FRONTEND_PORT=3000

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Kill process on a specific port
kill_port() {
    local port=$1
    local service=$2

    if command_exists lsof; then
        local pids=$(lsof -ti :"$port" 2>/dev/null)
        if [ -n "$pids" ]; then
            echo "$pids" | xargs kill -9 2>/dev/null
            print_success "$service stopped (port $port)"
            return 0
        fi
    elif command_exists fuser; then
        if fuser -k "$port"/tcp 2>/dev/null; then
            print_success "$service stopped (port $port)"
            return 0
        fi
    fi

    return 1
}

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  BSG Demo Platform - Stop Services${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

STOPPED_ANY=false

# Stop backend using PID file
if [ -f "$LOG_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID 2>/dev/null
        print_success "Backend stopped (PID: $BACKEND_PID)"
        STOPPED_ANY=true
    fi
    rm "$LOG_DIR/backend.pid"
fi

# Stop frontend using PID file
if [ -f "$LOG_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID 2>/dev/null
        print_success "Frontend stopped (PID: $FRONTEND_PID)"
        STOPPED_ANY=true
    fi
    rm "$LOG_DIR/frontend.pid"
fi

# Also try to stop by port (in case PID files are missing)
if kill_port "$BACKEND_PORT" "Backend"; then
    STOPPED_ANY=true
fi

if kill_port "$FRONTEND_PORT" "Frontend"; then
    STOPPED_ANY=true
fi

# Stop Docker/Podman services if present
if [ -f "docker-compose.yml" ]; then
    COMPOSE_CMD=""

    # Try Podman first
    if command_exists podman; then
        if podman compose version >/dev/null 2>&1; then
            COMPOSE_CMD="podman compose"
        elif command_exists podman-compose; then
            COMPOSE_CMD="podman-compose"
        fi
    fi

    # Fall back to Docker
    if [ -z "$COMPOSE_CMD" ] && command_exists docker; then
        if docker compose version >/dev/null 2>&1; then
            COMPOSE_CMD="docker compose"
        elif command_exists docker-compose; then
            COMPOSE_CMD="docker-compose"
        fi
    fi

    # Stop services if compose command is available
    if [ -n "$COMPOSE_CMD" ]; then
        if $COMPOSE_CMD ps --quiet 2>/dev/null | grep -q .; then
            print_info "Stopping database services..."
            $COMPOSE_CMD down
            print_success "Database services stopped"
            STOPPED_ANY=true
        fi
    fi
fi

echo ""
if [ "$STOPPED_ANY" = true ]; then
    print_success "All services stopped successfully"
else
    print_warning "No running services found"
fi
