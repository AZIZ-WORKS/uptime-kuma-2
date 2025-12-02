@echo off
echo ==========================================
echo   Starting Main Dashboard
echo ==========================================
echo.

REM Build and start all services
docker compose up -d --build

echo.
echo Waiting for ngrok tunnels to start...
timeout /t 8 /nobreak >nul

echo.
echo ==========================================
echo   Dashboard URLs
echo ==========================================
echo.

REM Extract URLs from ngrok logs
for /f "tokens=*" %%i in ('docker logs dashboard-ngrok 2^>^&1 ^| findstr /C:"started tunnel" ^| findstr /C:"frontend"') do (
    set "line=%%i"
    setlocal enabledelayedexpansion
    for /f "tokens=2 delims==" %%a in ("!line!") do (
        for /f "tokens=1" %%b in ("%%a") do (
            set FRONTEND_URL=%%b
        )
    )
    endlocal & set FRONTEND_URL=%FRONTEND_URL%
)

for /f "tokens=*" %%i in ('docker logs dashboard-ngrok 2^>^&1 ^| findstr /C:"started tunnel" ^| findstr /C:"backend"') do (
    set "line=%%i"
    setlocal enabledelayedexpansion
    for /f "tokens=2 delims==" %%a in ("!line!") do (
        for /f "tokens=1" %%b in ("%%a") do (
            set BACKEND_URL=%%b
        )
    )
    endlocal & set BACKEND_URL=%BACKEND_URL%
)

echo FRONTEND (Open in browser):
docker logs dashboard-ngrok 2>&1 | findstr /C:"started tunnel" | findstr /C:"frontend"
echo.

echo BACKEND (For van's .env):
docker logs dashboard-ngrok 2>&1 | findstr /C:"started tunnel" | findstr /C:"backend"
echo.

echo ==========================================
echo.
echo First time setup:
echo   1. Open the frontend URL in your browser
echo   2. When prompted, enter the backend URL
echo   3. Login: admin / admin123
echo.
echo ==========================================

pause

