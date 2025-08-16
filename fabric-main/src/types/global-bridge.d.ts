export {};

declare global {
  interface Window {
    fab?: {
      // Wi-Fi
      scanWifi?: () => Promise<any>;
      joinWifi?: (args: { ssid: string; psk?: string }) => Promise<{ success: boolean; error?: string }>;

      // Devices
      listDevices?: () => Promise<any>;
      enrollDevice?: (args: { fp: string; name: string; role: string }) => Promise<{ success: boolean; error?: string }>;

      // Agents
      startAgent?: (args: { agentId: string; deviceFp: string }) => Promise<{ success: boolean; error?: string }>;
      stopAgent?: (args: { agentId: string; deviceFp: string }) => Promise<{ success: boolean; error?: string }>;
      updateAgent?: (args: { agentId: string; deviceFp: string }) => Promise<{ success: boolean; error?: string }>;

      // License / Policy / Attest
      activateLicense?: (args: { licId: string; pkg: string; deviceFp: string }) => Promise<{ success: boolean; error?: string }>;
      verifyPolicy?: (args: { deviceFp: string }) => Promise<any>;
      verifyAttestation?: (args: { artifactPath: string }) => Promise<any>;
      getPolicy?: (args: { id: string }) => Promise<any>;
    };
    fabric?: {
      invoke: (channel: string, data?: any, capabilities?: string[]) => Promise<any>;
    };
  }
}
