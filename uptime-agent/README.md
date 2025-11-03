# uptime-agent

Agent for OB vans. Runs alongside Uptime Kuma, exposes /status and /wake, and streams realtime updates to the main dashboard via Socket.IO.

## Environment
Create a .env next to docker-compose.yml with:
- DASHBOARD_WS_URL
- VAN_ID
- UPDATE_INTERVAL (default 10000)
- NGROK_AUTHTOKEN (optional)
- AGENT_PUBLIC_URL (optional)

## Usage
- Run: ./kuma-start.sh
- Services started: Kuma (3001), Agent (5000), ngrok (tunnel to agent)

## API
- GET /status → Returns last status payload and triggers a fresh poll
- POST /wake { mac } → Triggers Wake-on-LAN for MAC address

## Realtime events
- agent:hello { vanId, agentApiUrl }
- agent:update { vanId, status, uptime, latency, timestamp }
- agent:wake { mac }

