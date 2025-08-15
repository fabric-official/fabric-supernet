declare global {
  interface Window { fabric: { invoke: (channel: string, data?: any, capabilities?: string[]) => Promise<any>; }; }
}
export {};
