@echo off
echo Starting PriceSlice...
echo.

REM Start Predictor
echo Starting Predictor Server...
start cmd /k "cd predictor && uvicorn app:app --port 8001"

REM Start Backend
echo Starting Backend Server...
start cmd /k "cd backend && npm start"

REM Start Frontend  
echo Starting Frontend...
start cmd /k "cd frontend && npm start"

echo.
echo PriceSlice is starting:
echo - Backend: http://localhost:5000
echo - Frontend: http://localhost:3000
echo.
