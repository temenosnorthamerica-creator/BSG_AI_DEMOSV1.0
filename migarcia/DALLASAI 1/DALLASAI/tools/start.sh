#!/bin/bash

##############################################################################
# BSG Demo Platform - Unified Startup Script
# This script starts all components of the BSG Demo Platform
##############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
BACKEND_PORT=8000
FRONTEND_PORT=3000

# Log file for background processes
LOG_DIR="logs"
mkdir -p "$LOG_DIR"

##############################################################################
# Helper Functions
##############################################################################

print_header() {
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  BSG Demo Platform - Startup${NC}"
    echo -e "${CYAN}========================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if a port is in use
port_in_use() {
    if command_exists lsof; then
        lsof -i :"$1" >/dev/null 2>&1
    elif command_exists netstat; then
        netstat -tuln | grep ":$1 " >/dev/null 2>&1
    else
        # Fallback: try to connect to the port
        (echo >/dev/tcp/localhost/"$1") >/dev/null 2>&1
    fi
}

# Kill process on a specific port
kill_port() {
    local port=$1
    print_info "Checking for processes on port $port..."

    if port_in_use "$port"; then
        print_warning "Port $port is in use. Attempting to free it..."

        if command_exists lsof; then
            lsof -ti :"$port" | xargs kill -9 2>/dev/null || true
        elif command_exists fuser; then
            fuser -k "$port"/tcp 2>/dev/null || true
        else
            print_warning "Could not automatically kill process on port $port"
            print_warning "Please manually stop any process using port $port"
            return 1
        fi

        sleep 2

        if port_in_use "$port"; then
            print_error "Failed to free port $port"
            return 1
        else
            print_success "Port $port freed"
        fi
    else
        print_success "Port $port is available"
    fi
}

##############################################################################
# Dependency Checks
##############################################################################

check_dependencies() {
    print_info "Checking dependencies..."

    local missing_critical=()
    local missing_optional=()

    # Check for Node.js and npm (required for frontend)
    if ! command_exists node; then
        missing_critical+=("node")
    fi

    if ! command_exists npm; then
        missing_critical+=("npm")
    fi

    # Check for Python (optional - only needed if backend exists)
    local has_python=false
    if command_exists python3 || command_exists python; then
        # Verify it's not just the Windows Store stub
        if python3 --version >/dev/null 2>&1 || python --version >/dev/null 2>&1; then
            has_python=true
        fi
    fi

    if ! $has_python; then
        missing_optional+=("python3")
    fi

    # Check for pip (optional - only needed if backend exists)
    if ! command_exists pip3 && ! command_exists pip; then
        missing_optional+=("pip3")
    fi

    # Only fail if critical dependencies are missing
    if [ ${#missing_critical[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_critical[*]}"
        echo ""
        echo "Please install the missing dependencies:"
        echo "  - Node.js and npm: https://nodejs.org/"
        exit 1
    fi

    print_success "Core dependencies are installed (Node.js, npm)"

    # Warn about optional dependencies
    if [ ${#missing_optional[@]} -ne 0 ]; then
        print_warning "Optional dependencies not found: ${missing_optional[*]}"
        print_info "Install Python 3 if you plan to run the backend"
    fi
}

##############################################################################
# Docker/Podman Compose Services
##############################################################################

start_docker_services() {
    # The develop branch uses MongoDB (Azure Cosmos DB) which is expected to be running externally
    # No separate database container is defined in docker-compose.yml
    print_info "Database: Using external MongoDB (default: localhost:27017)"
    print_info "Set DATABASE_URL environment variable to use a different MongoDB instance"
    return 0
}

##############################################################################
# Backend Startup
##############################################################################

start_backend() {
    if [ ! -d "$BACKEND_DIR" ]; then
        print_warning "Backend directory not found, skipping backend"
        return 1
    fi

    print_info "Starting backend..."

    # Check for Python files
    if [ -z "$(find "$BACKEND_DIR" -name '*.py' -not -path '*/\.*' | head -1)" ]; then
        print_warning "No Python files found in backend directory, skipping backend"
        return 1
    fi

    # Free the backend port
    kill_port "$BACKEND_PORT" || return 1

    # Determine Python command
    local PYTHON_CMD="python3"
    if ! command_exists python3; then
        PYTHON_CMD="python"
    fi

    # Check for virtual environment
    if [ -f "$BACKEND_DIR/venv/bin/activate" ]; then
        print_info "Using virtual environment"
        source "$BACKEND_DIR/venv/bin/activate"
    elif [ -f "$BACKEND_DIR/.venv/bin/activate" ]; then
        print_info "Using virtual environment"
        source "$BACKEND_DIR/.venv/bin/activate"
    fi

    # Install dependencies if requirements.txt exists
    if [ -f "$BACKEND_DIR/requirements.txt" ]; then
        print_info "Checking and installing backend dependencies..."
        
        # Check if pip is available
        local PIP_CMD="pip3"
        if ! command_exists pip3; then
            PIP_CMD="pip"
        fi
        
        # Check for missing packages and install them
        print_info "Installing/updating Python packages from requirements.txt..."
        if $PIP_CMD install --upgrade -r "$BACKEND_DIR/requirements.txt" 2>&1 | grep -q "ERROR"; then
            print_warning "Some packages may have failed to install. Check output above."
        else
            print_success "All backend dependencies are installed"
        fi
    fi

    # Start the backend server
    cd "$BACKEND_DIR"

    # Try different startup methods
    if [ -f "main.py" ]; then
        print_info "Starting backend with main.py..."
        $PYTHON_CMD main.py > "../$LOG_DIR/backend.log" 2>&1 &
        BACKEND_PID=$!
    elif [ -f "app.py" ]; then
        print_info "Starting backend with app.py..."
        $PYTHON_CMD app.py > "../$LOG_DIR/backend.log" 2>&1 &
        BACKEND_PID=$!
    elif command_exists uvicorn; then
        print_info "Starting backend with uvicorn..."
        uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload > "../$LOG_DIR/backend.log" 2>&1 &
        BACKEND_PID=$!
    else
        print_warning "No known backend entry point found (main.py, app.py, or uvicorn)"
        cd ..
        return 1
    fi

    echo $BACKEND_PID > "../$LOG_DIR/backend.pid"
    cd ..

    # Wait a moment and check if it started
    sleep 2
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        print_success "Backend started (PID: $BACKEND_PID)"
        print_info "Backend URL: http://localhost:$BACKEND_PORT"
        print_info "Backend logs: $LOG_DIR/backend.log"
        return 0
    else
        print_error "Backend failed to start. Check $LOG_DIR/backend.log for details"
        return 1
    fi
}

##############################################################################
# Frontend Startup
##############################################################################

start_frontend() {
    if [ ! -d "$FRONTEND_DIR" ]; then
        print_warning "Frontend directory not found, skipping frontend"
        return 1
    fi

    print_info "Starting frontend..."

    # Check for package.json
    if [ ! -f "$FRONTEND_DIR/package.json" ]; then
        print_warning "No package.json found in frontend directory, skipping frontend"
        return 1
    fi

    # Free the frontend port
    kill_port "$FRONTEND_PORT" || return 1

    cd "$FRONTEND_DIR"

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_info "Installing frontend dependencies..."
        npm install
    fi

    # Start the frontend server
    print_info "Starting frontend dev server..."
    npm run dev > "../$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > "../$LOG_DIR/frontend.pid"
    cd ..

    # Wait a moment and check if it started
    sleep 2
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        print_success "Frontend started (PID: $FRONTEND_PID)"
        print_info "Frontend URL: http://localhost:$FRONTEND_PORT"
        print_info "Frontend logs: $LOG_DIR/frontend.log"
        return 0
    else
        print_error "Frontend failed to start. Check $LOG_DIR/frontend.log for details"
        return 1
    fi
}

##############################################################################
# Cleanup on Exit
##############################################################################

cleanup() {
    echo ""
    print_info "Shutting down services..."

    # Kill backend
    if [ -f "$LOG_DIR/backend.pid" ]; then
        BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill $BACKEND_PID 2>/dev/null || true
            print_success "Backend stopped"
        fi
        rm "$LOG_DIR/backend.pid"
    fi

    # Kill frontend
    if [ -f "$LOG_DIR/frontend.pid" ]; then
        FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill $FRONTEND_PID 2>/dev/null || true
            print_success "Frontend stopped"
        fi
        rm "$LOG_DIR/frontend.pid"
    fi

    echo ""
    print_success "All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

##############################################################################
# Main Execution
##############################################################################

main() {
    print_header

    # Check dependencies
    check_dependencies
    echo ""

    # Start Docker services if available
    start_docker_services
    echo ""

    # Start backend
    BACKEND_STARTED=false
    if start_backend; then
        BACKEND_STARTED=true
    fi
    echo ""

    # Start frontend
    FRONTEND_STARTED=false
    if start_frontend; then
        FRONTEND_STARTED=true
    fi
    echo ""

    # Summary
    echo -e "${CYAN}========================================${NC}"
    echo -e "${CYAN}  Services Status${NC}"
    echo -e "${CYAN}========================================${NC}"

    if [ "$BACKEND_STARTED" = true ]; then
        print_success "Backend:  http://localhost:$BACKEND_PORT"
    else
        print_warning "Backend:  Not running"
    fi

    if [ "$FRONTEND_STARTED" = true ]; then
        print_success "Frontend: http://localhost:$FRONTEND_PORT"
    else
        print_warning "Frontend: Not running"
    fi

    echo ""
    print_info "Press Ctrl+C to stop all services"
    echo ""

    # Keep script running and tail logs
    if [ "$FRONTEND_STARTED" = true ]; then
        print_info "Showing frontend logs (Ctrl+C to stop):"
        echo -e "${CYAN}========================================${NC}"
        tail -f "$LOG_DIR/frontend.log"
    elif [ "$BACKEND_STARTED" = true ]; then
        print_info "Showing backend logs (Ctrl+C to stop):"
        echo -e "${CYAN}========================================${NC}"
        tail -f "$LOG_DIR/backend.log"
    else
        print_error "No services started. Please check the errors above."
        exit 1
    fi
}

# Run main function
main
