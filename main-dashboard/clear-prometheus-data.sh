#!/bin/bash
# Clear Prometheus data to remove stale metrics
# This ensures only fresh data from the agent is shown

echo "=========================================="
echo "  Clearing Prometheus Data"
echo "=========================================="
echo ""
echo "⚠️  This will delete ALL Prometheus metrics!"
echo "   Only fresh data from the agent will remain."
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."

cd "$(dirname "$0")"

echo ""
echo "1. Stopping Prometheus..."
docker compose stop prometheus

echo ""
echo "2. Removing Prometheus data volume..."
docker volume rm dashboard-prometheus-data 2>/dev/null || true
docker volume rm main-dashboard_prometheus-data 2>/dev/null || true

echo ""
echo "3. Starting Prometheus..."
docker compose up -d prometheus

echo ""
echo "4. Waiting for Prometheus to initialize..."
sleep 5

echo ""
echo "5. Checking Prometheus targets..."
docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets | grep -o '"health":"[^"]*"' | head -1

echo ""
echo "=========================================="
echo "  ✅ Prometheus data cleared!"
echo "=========================================="
echo ""
echo "Prometheus will now only show fresh data from the agent."
echo "Wait 30-60 seconds for the first scrape, then refresh your dashboard."
