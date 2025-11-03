# BFA Monitoring System

Two apps:
- uptime-agent (runs in each OB van)
- main-dashboard (runs in office)

## Prereqs
- Docker + Docker Compose
- Ngrok token (optional)

## Quick start

### Office (main-dashboard)
1) Environment:
- JWT_SECRET=<secret>
- ADMIN_PASSWORD=admin123
- VITE_API_URL=http://localhost:4000
- VITE_WS_URL=http://localhost:4000

2) Run:
```
cd main-dashboard
docker compose up -d --build
```
Backend: http://localhost:4000, Frontend: http://localhost:5173

Login: admin / admin123

### OB Van (uptime-agent)
1) Environment:
- DASHBOARD_WS_URL=http://<office-public-host>:4000
- VAN_ID=van1
- UPDATE_INTERVAL=10000
- NGROK_AUTHTOKEN=<token> (optional)
- AGENT_PUBLIC_URL=<agent public URL if using ngrok>

2) Run:
```
cd uptime-agent
./kuma-start.sh
```

## Realtime
- Agent → dashboard via Socket.IO (agent:hello, agent:update)
- Dashboard stores to SQLite and broadcasts dashboard:update

## Wake-on-LAN
- Frontend Vans → backend → agent via HTTP /wake if public URL known, otherwise via Socket.IO wake
