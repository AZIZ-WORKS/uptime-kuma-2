#!/bin/bash
echo ""
echo "=========================================="
echo "  🚀 Dashboard URLs"
echo "=========================================="
echo ""

# Extract URLs from ngrok logs
FRONTEND_URL=$(docker logs dashboard-ngrok 2>&1 | grep "started tunnel" | grep "frontend" | grep -oP 'url=\K[^ ]+' | head -n1)
BACKEND_URL=$(docker logs dashboard-ngrok 2>&1 | grep "started tunnel" | grep "backend" | grep -oP 'url=\K[^ ]+' | head -n1)

if [ -z "$FRONTEND_URL" ] || [ -z "$BACKEND_URL" ]; then
    echo "⏳ Ngrok tunnels not ready yet. Waiting..."
    sleep 5
    FRONTEND_URL=$(docker logs dashboard-ngrok 2>&1 | grep "started tunnel" | grep "frontend" | grep -oP 'url=\K[^ ]+' | head -n1)
    BACKEND_URL=$(docker logs dashboard-ngrok 2>&1 | grep "started tunnel" | grep "backend" | grep -oP 'url=\K[^ ]+' | head -n1)
fi

echo "📱 FRONTEND (Open in browser):"
echo "   $FRONTEND_URL"
echo ""
echo "🔌 BACKEND (For van's .env):"
echo "   $BACKEND_URL"
echo ""
echo "=========================================="
echo ""
echo "💡 First time setup:"
echo "   1. Open the frontend URL in your browser"
echo "   2. When prompted, enter the backend URL"
echo "   3. Login: admin / admin123"
echo ""
echo "📝 Update van's .env with:"
echo "   DASHBOARD_API_URL=$BACKEND_URL"
echo "   DASHBOARD_WS_URL=$BACKEND_URL"
echo ""
echo "=========================================="

