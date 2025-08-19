declare global {
  interface Window {
    FabricInstaller: {
      install: (tgzAbsPath: string) => Promise<any>;
      uninstall: (pluginId: string) => Promise<any>;
      saveBinaryToDisk: (data: ArrayBuffer, filename: string) => Promise<string>;
    };
  }
}
export {};
