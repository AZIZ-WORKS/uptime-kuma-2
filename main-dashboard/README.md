# Main Dashboard

Central monitoring dashboard for all OB vans.

## Quick Start (Recommended)

This will automatically build, start, and display the URLs:

### Windows:
```bash
start.bat
```

### Linux/Mac/Git Bash:
```bash
bash start.sh
```

## Alternative: Manual Start + Show URLs

If you prefer to use docker compose directly:

```bash
# Start services
docker compose up -d --build

# Then show the URLs (after ~10 seconds)
bash show-urls.sh        # Linux/Mac/Git Bash
# or
show-urls.bat            # Windows CMD
```

## Getting URLs Anytime

If you need to see the ngrok URLs again after starting:

**Windows:**
```bash
show-urls.bat
```

**Linux/Mac:**
```bash
./show-urls.sh
```

Or manually:
```bash
docker logs dashboard-ngrok 2>&1 | grep "started tunnel"
```

## Access

1. **Frontend URL**: Open in any browser from anywhere
2. **Backend URL**: Use in van's `.env` file

### First Time Setup:
1. Open the **Frontend URL** in your browser
2. When prompted, enter the **Backend URL**
3. Login with:
   - Username: `admin`
   - Password: `admin123`

### Update Van Configuration:
On each OB van, update `uptime-agent/.env` with the **Backend URL**:
```env
DASHBOARD_API_URL=https://xxxxx.ngrok-free.app
DASHBOARD_WS_URL=https://xxxxx.ngrok-free.app
```

Then restart the van agent:
```bash
cd uptime-agent
docker compose down
docker compose up -d --build
```

## Services

- **Backend**: API server (port 4000)
- **Frontend**: Web UI (port 5173)
- **Ngrok**: Public tunnels for both services

## Notes

- Ngrok URLs change every time you restart the services
- Free ngrok tier has some limitations (WebSocket connections may be unreliable)
- The dashboard uses REST API fallback for reliability

