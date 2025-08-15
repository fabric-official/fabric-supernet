import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { FabricSidebar } from '@/components/FabricSidebar';
import { PluginManager } from '@/services/PluginManager';
import { SuperNetBackboard } from '@/plugins/supernet-backboard/SuperNetBackboard';
import { OpsDevices } from '@/plugins/supernet-backboard/OpsDevices';
import { OpsNetwork } from '@/plugins/supernet-backboard/OpsNetwork';
import { OpsCompliance } from '@/plugins/supernet-backboard/OpsCompliance';
import { OpsLicenses } from '@/plugins/supernet-backboard/OpsLicenses';
import { OpsLogs } from '@/plugins/supernet-backboard/OpsLogs';

export const FabricDashboard: React.FC = () => {
  const [pluginHost, setPluginHost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    try {
      const pluginManager = new PluginManager();
      const loadedPlugins = await pluginManager.loadPlugins();
      
      // Create a mock host for demo
      const mockHost = {
        version: '1.0.0',
        runtime: { invoke: async () => ({ ssids: ['FabricNet'], success: true }) },
        git: { read: async () => '{}', write: async () => {}, exists: async () => false },
        licenses: { list: async () => [] },
        provenance: { emit: async () => {} },
        security: { getCRL: async () => ({ revoked: [], updated_at: new Date().toISOString() }) },
        permissions: async () => []
      };
      
      setPluginHost(mockHost);
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-foreground">Loading Fabric Dashboard</h1>
          <p className="text-muted-foreground">Initializing secure plugin environment...</p>
        </div>
      </div>
    );
  }
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <FabricSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header with sidebar trigger */}
          <header className="h-14 flex items-center border-b border-border bg-card/50 px-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
            <div className="ml-4">
              <h1 className="text-lg font-semibold text-foreground">Fabric Dashboard Host</h1>
            </div>
          </header>
          
          {/* Main content */}
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<SuperNetBackboard host={pluginHost} />} />
              <Route path="/ops" element={<SuperNetBackboard host={pluginHost} />} />
              <Route path="/ops/devices" element={<OpsDevices host={pluginHost} />} />
              <Route path="/ops/network" element={<OpsNetwork host={pluginHost} />} />
              <Route path="/ops/compliance" element={<OpsCompliance host={pluginHost} />} />
              <Route path="/ops/licenses" element={<OpsLicenses host={pluginHost} />} />
              <Route path="/ops/logs" element={<OpsLogs host={pluginHost} />} />
            </Routes>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};