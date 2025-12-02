@echo off
echo.
echo ==========================================
echo   Agent URLs
echo ==========================================
echo.

REM Extract agent ngrok URL from logs
docker logs van-ngrok 2>&1 | findstr /C:"started tunnel" | findstr /C:"agent" > temp_ngrok.txt

if not exist temp_ngrok.txt (
    echo Waiting for ngrok to start...
    timeout /t 5 /nobreak >nul
    docker logs van-ngrok 2>&1 | findstr /C:"started tunnel" | findstr /C:"agent" > temp_ngrok.txt
)

for /f "tokens=*" %%a in (temp_ngrok.txt) do (
    set "line=%%a"
    echo !line! | findstr /R "https://.*\.ngrok[^ ]*" > temp_url.txt
)

if exist temp_url.txt (
    for /f "tokens=*" %%b in (temp_url.txt) do (
        set "url_line=%%b"
        for /f "tokens=2 delims==" %%c in ("!url_line!") do (
            set "AGENT_URL=%%c"
            set "AGENT_URL=!AGENT_URL: =!"
        )
    )
)

del temp_ngrok.txt temp_url.txt 2>nul

if "%AGENT_URL%"=="" (
    echo Could not find agent ngrok URL automatically.
    echo.
    echo Please check manually:
    echo    docker logs van-ngrok
    echo.
    echo Look for a line containing "started tunnel" and "agent"
    echo Copy the URL (should look like: https://xxxxx.ngrok-free.app)
    echo.
    exit /b 1
)

echo AGENT METRICS URL (for Prometheus targets.json):
echo    %AGENT_URL%:443
echo.
echo Add this to main-dashboard/targets.json:
echo.
echo {
echo   "targets": ["%AGENT_URL%:443"],
echo   "labels": {
echo     "job": "vans",
echo     "van_id": "YOUR_VAN_ID"
echo   }
echo }
echo.
echo ==========================================
echo.
echo After adding to targets.json, reload Prometheus:
echo    cd main-dashboard
echo    docker restart dashboard-prometheus
echo.
echo ==========================================
pause

