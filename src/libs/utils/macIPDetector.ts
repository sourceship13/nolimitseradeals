import { Platform } from 'react-native';

/**
 * Mac Network IP Detection Utility
 * Helps physical devices connect to localhost backend running on Mac
 */
class MacIPDetector {
  private static cachedIP: string | null = null;
  private static readonly COMMON_PORTS = [8080, 3000, 4000, 5000, 8000];

  /**
   * Detect Mac's local network IP by testing common addresses
   * This works by trying to reach typical local IP ranges
   */
  static async detectMacIP(): Promise<string | null> {
    if (this.cachedIP) {
      return this.cachedIP;
    }

    // Common local IP patterns to test
    const ipPatterns = [
      '192.168.1',   // Most common home router range
      '192.168.0',   // Alternative common range  
      '192.168.26',  // Your current network range
      '10.0.0',      // Some corporate networks
      '172.16.0',    // Private network range
    ];

    for (const pattern of ipPatterns) {
      // Test a few IPs in each range (usually router assigns 2-254)
      const testIPs = [
        `${pattern}.8`,   // Your current IP
        `${pattern}.1`,   // Router
        `${pattern}.2`,   // Common first device
        `${pattern}.10`,  // Common static IP
        `${pattern}.100`, // Common range
      ];

      for (const ip of testIPs) {
        const result = await this.testIPConnection(ip);
        if (result) {
          this.cachedIP = ip;
          return ip;
        }
      }
    }

    return null;
  }

  /**
   * Test if an IP address has a server running
   */
  private static async testIPConnection(ip: string): Promise<boolean> {
    for (const port of this.COMMON_PORTS) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000); // Quick 2s timeout

        const response = await fetch(`http://${ip}:${port}/health`, {
          method: 'HEAD',
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Expected - most IPs won't have servers
      }
    }

    return false;
  }

  /**
   * Test a specific IP and port combination
   */
  static async testSpecificEndpoint(ip: string, port: number = 8080): Promise<{
    reachable: boolean;
    responseTime?: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`http://${ip}:${port}/health`, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const responseTime = Date.now() - startTime;

      return {
        reachable: response.ok,
        responseTime,
      };
    } catch (error) {
      return {
        reachable: false,
        error: (error as Error)?.message || 'Connection failed',
      };
    }
  }

  /**
   * Get the configured physical device URL
   */
  static getPhysicalDeviceURL(port: number = 8080): string {
    // Use the detected or configured IP
    const ip = this.cachedIP || '192.168.26.8'; // Fallback to your current IP
    return `http://${ip}:${port}`;
  }

  /**
   * Clear cached IP (for retesting)
   */
  static clearCache(): void {
    this.cachedIP = null;
  }

  /**
   * Manually set IP (for manual configuration)
   */
  static setManualIP(ip: string): void {
    this.cachedIP = ip;
  }

  /**
   * Get all network interface suggestions for manual setup
   */
  static getNetworkSuggestions(): string[] {
    return [
      '192.168.26.8', // Your current IP
      '192.168.1.X',   // Common home network
      '192.168.0.X',   // Alternative common
      '10.0.0.X',      // Corporate networks
      'localhost',     // Fallback
    ];
  }
}

export default MacIPDetector;

// Helper function to get the current physical device localhost URL
export const getPhysicalLocalhostURL = (port: number = 8080): string => {
  return MacIPDetector.getPhysicalDeviceURL(port);
};