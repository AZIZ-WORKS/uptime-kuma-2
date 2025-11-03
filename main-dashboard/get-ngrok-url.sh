#!/bin/bash
# Get the current ngrok URL and display it
docker logs dashboard-ngrok 2>&1 | grep "started tunnel" | tail -n1 | grep -oP 'https://[a-z0-9]+\.ngrok-free\.app'

