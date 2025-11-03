#!/usr/bin/env sh
set -e

echo "Starting Uptime Kuma, agent, and ngrok..."
docker compose up -d --build

echo "Done. Use 'docker compose logs -f' to watch logs."



