import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { FabricSidebar } from "./FabricSidebar"

export function DashboardLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <FabricSidebar />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-card flex items-center px-6">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-bold text-foreground">Fabric Dashboard Host</h1>
              <div className="h-4 w-px bg-border"></div>
              <div className="text-sm text-muted-foreground">SuperNet Backboard v1.0</div>
            </div>
            
            {/* Header Actions */}
            <div className="ml-auto flex items-center space-x-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                <div className="w-2 h-2 bg-tech-glow rounded-full animate-pulse"></div>
                <span className="text-xs text-tech-glow font-medium">FABRIC CONNECTED</span>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}