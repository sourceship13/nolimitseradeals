#!/bin/bash

# Mac Network Configuration Script
# Configures Mac to allow incoming connections for React Native development

echo "🔧 Configuring Mac for React Native physical device connections..."
echo ""

# Check if backend server is running
echo "1. Checking if backend server is running..."
if lsof -i :8080 > /dev/null 2>&1; then
    echo "   ✅ Server found running on port 8080"
    echo "   Process details:"
    lsof -i :8080
else
    echo "   ❌ No server running on port 8080"
    echo "   💡 Make sure to start your backend server first!"
fi
echo ""

# Check firewall status
echo "2. Checking Mac Firewall status..."
FIREWALL_STATUS=$(sudo /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate)
echo "   $FIREWALL_STATUS"
echo ""

# Check if port 8080 is accessible
echo "3. Testing port 8080 accessibility..."
if nc -z localhost 8080; then
    echo "   ✅ Port 8080 is accessible locally"
else
    echo "   ❌ Port 8080 is not accessible"
fi
echo ""

# Get network info
echo "4. Network Configuration:"
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
echo "   Mac IP Address: $IP"
echo "   Network Interface:"
ifconfig | grep -A 1 "inet $IP"
echo ""

echo "📋 MANUAL CONFIGURATION STEPS:"
echo ""
echo "🛡️  FIREWALL SETTINGS:"
echo "   1. System Preferences → Security & Privacy → Firewall"
echo "   2. Click 'Turn Off Firewall' (temporary for development)"
echo "   OR"
echo "   2. Click 'Firewall Options'"
echo "   3. Click '+' to add your backend app/port"
echo "   4. Select 'Allow incoming connections'"
echo ""
echo "🌐 NETWORK SETTINGS:"
echo "   1. Ensure both Mac and phone on same WiFi network"
echo "   2. Your Mac IP: $IP"
echo "   3. Phone should connect to: http://$IP:8080"
echo ""
echo "🚀 BACKEND SERVER:"
echo "   Start with: npm start (or your start command)"
echo "   Verify at: http://localhost:8080"
echo "   Test external: http://$IP:8080"
echo ""

# Test external accessibility
echo "5. Testing external port access..."
echo "   You can test this from another device:"
echo "   curl http://$IP:8080/health"
echo ""