@echo off
echo PriceSlice Setup Script
echo ========================

REM Setup Backend
echo.
echo Setting up Backend...
cd backend
call npm install
if %errorlevel% neq 0 (
    echo Error installing backend dependencies
    exit /b 1
)
cd ..

REM Setup Frontend
echo.
echo Setting up Frontend...
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo Error installing frontend dependencies
    exit /b 1
)
cd ..

echo.
echo ========================
echo Setup complete!
echo.
echo To start the application:
echo 1. Configure your PostgreSQL database
echo 2. Create .env file in backend folder (copy from .env.example)
echo 3. Run: npm run dev
echo.
echo For more information, see README.md
