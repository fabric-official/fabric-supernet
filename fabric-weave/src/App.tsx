import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/core/auth/AuthProvider";
import { CtxProvider } from "@/core/utils/ctx";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "./dashboard/Dashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CtxProvider>
          <ProtectedRoute>
            <Toaster />
            <Sonner />
            <Dashboard />
          </ProtectedRoute>
        </CtxProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
