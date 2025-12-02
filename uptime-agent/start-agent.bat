@echo off
echo.
echo ==========================================
echo   Starting Uptime Agent
echo ==========================================
echo.

REM Check if .env exists
if not exist .env (
    echo WARNING: .env file not found!
    echo.
    echo Please create a .env file with:
    echo   DASHBOARD_WS_URL=http://your-dashboard-url:4000
    echo   VAN_ID=van1
    echo.
    echo Press any key to continue anyway or Ctrl+C to cancel...
    pause >nul
)

echo Starting services (Kuma, Agent, ngrok)...
docker compose up -d --build

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo   Services started successfully!
    echo ==========================================
    echo.
    echo Services running:
    echo   - Uptime Kuma: http://localhost:3001
    echo   - Agent API: http://localhost:5000
    echo   - Ngrok Web UI: http://localhost:4040
    echo.
    echo To view logs:
    echo   docker compose logs -f
    echo.
    echo To get agent URL:
    echo   show-agent-url.bat
    echo   OR
    echo   Open http://localhost:4040 in browser
    echo.
) else (
    echo.
    echo ERROR: Failed to start services
    echo Check Docker is running and try again
    echo.
)

pause

