#!/bin/bash
# Verify that Prometheus is getting data from the agent, not main dashboard

echo "=========================================="
echo "  Verifying Agent Data"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

echo "1. Checking Prometheus target status..."
TARGET_STATUS=$(docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets 2>/dev/null | python -m json.tool 2>/dev/null | grep -A 3 "prometheus-proxy" | grep "health" | head -1)

if echo "$TARGET_STATUS" | grep -q "up"; then
    echo "   ✅ Prometheus target is UP"
else
    echo "   ❌ Prometheus target is DOWN"
    echo "   Error: $(docker compose exec prometheus wget -qO- http://localhost:9090/api/v1/targets 2>/dev/null | python -m json.tool 2>/dev/null | grep -A 3 "prometheus-proxy" | grep "lastError" | head -1)"
    echo ""
    echo "   ⚠️  ACTION REQUIRED: Restart agent's ngrok container on the VAN machine:"
    echo "      cd uptime-agent"
    echo "      docker compose restart van-ngrok"
    exit 1
fi

echo ""
echo "2. Checking location data..."
LOCATION_DATA=$(docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=van_location_info{van_id=\"van1\"}" 2>/dev/null | python -m json.tool 2>/dev/null)

if echo "$LOCATION_DATA" | grep -q "result.*\[\]"; then
    echo "   ⚠️  No location data found"
    echo "   Wait 30-60 seconds for Prometheus to scrape, then run this script again"
    exit 1
fi

CITY=$(echo "$LOCATION_DATA" | grep -o '"city":"[^"]*"' | cut -d'"' -f4)
COUNTRY=$(echo "$LOCATION_DATA" | grep -o '"country":"[^"]*"' | cut -d'"' -f4)
IP=$(echo "$LOCATION_DATA" | grep -o '"public_ip":"[^"]*"' | cut -d'"' -f4)
INSTANCE=$(echo "$LOCATION_DATA" | grep -o '"instance":"[^"]*"' | cut -d'"' -f4)

echo "   Location: $CITY, $COUNTRY"
echo "   Public IP: $IP"
echo "   Instance: $INSTANCE"

if [ "$INSTANCE" != "prometheus-proxy:8081" ]; then
    echo ""
    echo "   ❌ ERROR: Data is NOT coming from prometheus-proxy!"
    echo "   Instance should be 'prometheus-proxy:8081' but got '$INSTANCE'"
    exit 1
fi

echo ""
echo "3. Checking speedtest data..."
SPEEDTEST=$(docker compose exec prometheus wget -qO- "http://localhost:9090/api/v1/query?query=van_speedtest_download_mbps{van_id=\"van1\"}" 2>/dev/null | python -m json.tool 2>/dev/null)

if echo "$SPEEDTEST" | grep -q "result.*\[\]"; then
    echo "   ⚠️  No speedtest data found yet"
else
    DOWNLOAD=$(echo "$SPEEDTEST" | grep -o '"value":\[[^]]*\]' | cut -d',' -f2 | tr -d ']')
    echo "   Current Download: ${DOWNLOAD} Mbps"
fi

echo ""
echo "=========================================="
echo "  Verification Complete"
echo "=========================================="
echo ""
echo "⚠️  IMPORTANT: Verify the location and IP match the AGENT (van),"
echo "   NOT the main dashboard location!"
echo ""
echo "If the location/IP is wrong:"
echo "1. Restart agent's ngrok: cd uptime-agent && docker compose restart van-ngrok"
echo "2. Clear Prometheus data: docker compose stop prometheus && docker compose rm -f prometheus && docker volume rm main-dashboard_prometheus-data && docker compose up -d prometheus"
echo "3. Wait 60 seconds and refresh dashboard"
