#!/bin/bash

# Start Backend
echo "Starting Backend..."
cd backend
if [ -f "venv/bin/activate" ]; then
    source venv/bin/activate
fi
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
cd ..
echo "Backend started (PID: $BACKEND_PID)"
echo "Backend URL: http://localhost:8000"

# Start Frontend
echo "Starting Frontend..."
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
cd ..
echo "Frontend started (PID: $FRONTEND_PID)"
echo "Frontend URL: http://localhost:3000"

echo ""
echo "Services started successfully!"
echo "Backend logs: logs/backend.log"
echo "Frontend logs: logs/frontend.log"
echo ""
echo "To stop services, run: bash stop.sh"

