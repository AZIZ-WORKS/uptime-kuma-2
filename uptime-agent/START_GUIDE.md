# How to Start the Uptime Agent

## Quick Start (Windows)

### Step 1: Navigate to the uptime-agent directory
```powershell
cd uptime-agent
```

### Step 2: Create/Edit the `.env` file

Create a file named `.env` in the `uptime-agent` directory with:

```env
# Required: Dashboard WebSocket URL
DASHBOARD_WS_URL=http://your-dashboard-url:4000
# Or if using ngrok:
# DASHBOARD_WS_URL=https://your-dashboard-ngrok-url.ngrok-free.app

# Required: Unique van identifier
VAN_ID=van1

# Optional: Update intervals
UPDATE_INTERVAL=10000
GEOLOCATION_INTERVAL=600000

# Optional: Ngrok token (if using ngrok)
NGROK_AUTHTOKEN=your_ngrok_token_here
```

**Important:** Replace `your-dashboard-url` with your actual dashboard URL:
- If dashboard is on same network: `http://192.168.x.x:4000`
- If dashboard uses ngrok: `https://your-dashboard-ngrok.ngrok-free.app`

### Step 3: Start the Agent

**Option A: Using the batch file (Easiest)**
```cmd
start-agent.bat
```

**Option B: Using Docker Compose directly**
```powershell
docker compose up -d --build
```

**Option C: Using the shell script (if you have Git Bash/WSL)**
```bash
./kuma-start.sh
```

## Verify It's Running

### Check running containers:
```powershell
docker ps
```

You should see:
- `kuma` (port 3001)
- `uptime-agent` (port 5000)
- `van-ngrok` (port 4040)

### Check logs:
```powershell
docker compose logs -f
```

Press `Ctrl+C` to stop viewing logs.

### Check individual service logs:
```powershell
# Agent logs
docker logs uptime-agent

# Ngrok logs
docker logs van-ngrok

# Kuma logs
docker logs kuma
```

## Get Your Agent URL

After starting, get your agent's public URL:

**Method 1: Web Interface (Easiest)**
1. Open: http://localhost:4040
2. Find the tunnel named "agent"
3. Copy the URL

**Method 2: Using script**
```cmd
show-agent-url.bat
```

**Method 3: PowerShell**
```powershell
.\show-agent-url.ps1
```

## Troubleshooting

### "docker compose" command not found
- Make sure Docker Desktop is installed and running
- Try `docker-compose` (with hyphen) instead of `docker compose`

### Services won't start
1. Check Docker is running: `docker ps`
2. Check for port conflicts (3001, 5000, 4040)
3. Check logs: `docker compose logs`

### Agent not connecting to dashboard
1. Verify `DASHBOARD_WS_URL` in `.env` is correct
2. Check agent logs: `docker logs uptime-agent`
3. Look for "✓ Connected to dashboard" message

### Ngrok not working
1. Check `NGROK_AUTHTOKEN` is set in `.env` (if using ngrok)
2. Check ngrok logs: `docker logs van-ngrok`
3. Verify ngrok.yml is configured correctly

## Stopping the Agent

```powershell
docker compose down
```

Or to stop and remove volumes:
```powershell
docker compose down -v
```

## Restarting the Agent

```powershell
docker compose restart
```

Or restart specific service:
```powershell
docker restart uptime-agent
docker restart van-ngrok
docker restart kuma
```

## Next Steps

After starting the agent:

1. **Get the agent URL** (see above)
2. **Add to Prometheus targets** on the dashboard server:
   - Edit `main-dashboard/targets.json`
   - Add your agent URL
   - Reload Prometheus: `docker restart dashboard-prometheus`

3. **Verify connection**:
   - Check dashboard shows your van
   - Check Grafana map shows location (after ~10 seconds)

