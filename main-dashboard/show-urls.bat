@echo off
echo.
echo ==========================================
echo   Dashboard URLs
echo ==========================================
echo.

timeout /t 3 /nobreak >nul

echo FRONTEND (Open in browser):
docker logs dashboard-ngrok 2>&1 | findstr /C:"started tunnel" | findstr /C:"frontend" | findstr /C:"url="
echo.

echo BACKEND (For van's .env):
docker logs dashboard-ngrok 2>&1 | findstr /C:"started tunnel" | findstr /C:"backend" | findstr /C:"url="
echo.

echo ==========================================
echo.
echo First time setup:
echo   1. Open the frontend URL above in your browser
echo   2. When prompted, enter the backend URL above
echo   3. Login: admin / admin123
echo.
echo Update van's .env with the BACKEND URL above:
echo   DASHBOARD_API_URL=https://xxxxx.ngrok-free.app
echo   DASHBOARD_WS_URL=https://xxxxx.ngrok-free.app
echo.
echo ==========================================

