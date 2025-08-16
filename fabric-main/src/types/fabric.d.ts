declare global {
  interface Window {
    fabric?: {
      invoke: (channel: string, data?: any, capabilities?: string[]) => Promise<any>;
    };
    fab?: {
      // Wi-Fi
      scanWifi?: () => Promise<any>;
      joinWifi?: (args: { ssid: string; psk?: string }) => Promise<{ success: boolean; error?: string }>;

      // Policy
      getPolicy?: (args: { id: string }) => Promise<any>;
      verifyPolicy?: (args: { deviceFp: string }) => Promise<{ diagnostics: any[]; ok: boolean; error?: string }>;

      // Devices
      listDevices?: () => Promise<any>;
      enrollDevice?: (args: { fp: string; name: string; role: string }) => Promise<{ success: boolean; error?: string }>;

      // Agents
      startAgent?: (args: { agentId: string; deviceFp: string }) => Promise<{ success: boolean; error?: string }>;
      stopAgent?: (args: { agentId: string; deviceFp: string }) => Promise<{ success: boolean; error?: string }>;
      updateAgent?: (args: { agentId: string; deviceFp: string }) => Promise<{ success: boolean; error?: string }>;

      // Attestation
      verifyAttestation?: (args: { artifactPath: string }) => Promise<{ verified: boolean; attestation?: any; error?: string }>;

      // License
      activateLicense?: (args: { licId: string; pkg: string; deviceFp: string }) => Promise<{ success: boolean; error?: string }>;
    };
  }
}
export {};



