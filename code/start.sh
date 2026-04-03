#!/bin/bash

echo "Starting PriceSlice..."
echo ""

# Start Backend in background
echo "Starting Backend Server..."
cd backend && npm start &
BACKEND_PID=$!

# Start Frontend
echo "Starting Frontend..."
cd ../frontend && npm start &
FRONTEND_PID=$!

echo ""
echo "PriceSlice is starting:"
echo "- Backend: http://localhost:5000"
echo "- Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

wait
