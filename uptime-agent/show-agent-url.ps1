Write-Host ""
Write-Host "=========================================="
Write-Host "  🚐 Agent URLs"
Write-Host "=========================================="
Write-Host ""

# Method 1: Try ngrok local API (port 4040)
$AGENT_URL = ""
try {
    $apiResponse = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
    if ($apiResponse.tunnels) {
        $agentTunnel = $apiResponse.tunnels | Where-Object { $_.name -eq "agent" -or $_.config.addr -like "*5000*" } | Select-Object -First 1
        if ($agentTunnel -and $agentTunnel.public_url) {
            $AGENT_URL = $agentTunnel.public_url
        }
    }
} catch {
    # API not available, continue to log parsing
}

# Method 2: Parse logs
if (-not $AGENT_URL) {
    $logs = docker logs van-ngrok 2>&1
    
    # Try to find any https ngrok URL
    $urlMatch = $logs | Select-String -Pattern 'https://[^\s]+\.ngrok[^\s]*' | Select-Object -First 1
    
    if ($urlMatch) {
        if ($urlMatch -match 'https://[^\s]+\.ngrok[^\s]*') {
            $AGENT_URL = $matches[0]
        }
    }
}

if (-not $AGENT_URL) {
    Write-Host "⏳ Waiting for ngrok to start..."
    Start-Sleep -Seconds 5
    
    # Retry API
    try {
        $apiResponse = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction SilentlyContinue
        if ($apiResponse.tunnels) {
            $agentTunnel = $apiResponse.tunnels | Where-Object { $_.name -eq "agent" -or $_.config.addr -like "*5000*" } | Select-Object -First 1
            if ($agentTunnel -and $agentTunnel.public_url) {
                $AGENT_URL = $agentTunnel.public_url
            }
        }
    } catch {}
    
    # Retry logs
    if (-not $AGENT_URL) {
        $logs = docker logs van-ngrok 2>&1
        $urlMatch = $logs | Select-String -Pattern 'https://[^\s]+\.ngrok[^\s]*' | Select-Object -First 1
        if ($urlMatch -and $urlMatch -match 'https://[^\s]+\.ngrok[^\s]*') {
            $AGENT_URL = $matches[0]
        }
    }
}

if (-not $AGENT_URL) {
    Write-Host "❌ Could not find agent ngrok URL automatically"
    Write-Host ""
    Write-Host "Please try these methods:"
    Write-Host ""
    Write-Host "Method 1: Check ngrok web interface"
    Write-Host "   Open: http://localhost:4040"
    Write-Host "   Look for the 'agent' tunnel URL"
    Write-Host ""
    Write-Host "Method 2: Check logs manually"
    Write-Host "   docker logs van-ngrok"
    Write-Host "   Look for any line containing 'https://' and '.ngrok'"
    Write-Host ""
    Write-Host "Method 3: Use ngrok API"
    Write-Host "   Invoke-RestMethod http://localhost:4040/api/tunnels"
    Write-Host ""
    exit 1
}

if ($AGENT_URL) {
    
    Write-Host "🔌 AGENT METRICS URL (for Prometheus targets.json):"
    Write-Host "   ${AGENT_URL}:443"
    Write-Host ""
    Write-Host "📝 Add this to main-dashboard/targets.json:"
    Write-Host ""
    Write-Host "{"
    Write-Host "  `"targets`": [`"${AGENT_URL}:443`"],"
    Write-Host "  `"labels`": {"
    Write-Host "    `"job`": `"vans`","
    Write-Host "    `"van_id`": `"YOUR_VAN_ID`""
    Write-Host "  }"
    Write-Host "}"
    Write-Host ""
    Write-Host "=========================================="
    Write-Host ""
    Write-Host "💡 After adding to targets.json, reload Prometheus:"
    Write-Host "   cd main-dashboard"
    Write-Host "   docker restart dashboard-prometheus"
    Write-Host ""
    Write-Host "=========================================="
} else {
    Write-Host "❌ Could not extract URL from logs"
    Write-Host "Full line: $agentLine"
}

