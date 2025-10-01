#!/bin/bash

# Optional: Install NetInfo for enhanced network detection
echo "🔧 Installing @react-native-netinfo/netinfo..."

# Install the package
npm install @react-native-netinfo/netinfo

# Install iOS pods (if using iOS)
echo "📱 Installing iOS pods..."
cd ios && pod install && cd ..

echo "✅ NetInfo installation complete!"
echo ""
echo "🎯 NetInfo provides:"
echo "   • Real-time network state monitoring"  
echo "   • WiFi vs Cellular detection"
echo "   • Internet reachability testing"
echo "   • Automatic localhost vs cloud decisions"
echo ""
echo "🔄 Restart Metro bundler and rebuild app to use NetInfo"