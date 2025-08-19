export interface ApiClient {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, data?: any): Promise<T>;
  put<T>(path: string, data?: any): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

export function createApi(baseUrl: string): ApiClient {
  const request = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  return {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, data?: any) => 
      request<T>(path, { method: 'POST', body: JSON.stringify(data) }),
    put: <T>(path: string, data?: any) => 
      request<T>(path, { method: 'PUT', body: JSON.stringify(data) }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  };
}

// Mock data for development
export const mockDevices = [
  { id: '1', name: 'Router-Main', type: 'router', status: 'online', ip: '192.168.1.1' },
  { id: '2', name: 'Switch-01', type: 'switch', status: 'online', ip: '192.168.1.10' },
  { id: '3', name: 'AP-Kitchen', type: 'access_point', status: 'offline', ip: '192.168.1.20' },
];

export const mockWifiNetworks = [
  { id: '1', ssid: 'Fabric-Main', frequency: '5GHz', signal: -45, connected: 12 },
  { id: '2', ssid: 'Fabric-Guest', frequency: '2.4GHz', signal: -62, connected: 3 },
  { id: '3', ssid: 'Fabric-IoT', frequency: '5GHz', signal: -38, connected: 28 },
];

export const mockTreasuryData = [
  { date: '2024-01', balance: 125000, income: 15000, expenses: 8200 },
  { date: '2024-02', balance: 131800, income: 16800, expenses: 9200 },
  { date: '2024-03', balance: 139400, income: 17600, expenses: 10000 },
];