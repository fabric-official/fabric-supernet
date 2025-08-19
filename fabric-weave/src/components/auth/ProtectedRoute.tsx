import { useAuth } from '@/core/auth/AuthProvider';
import { LoginForm } from './LoginForm';
import { useCtx } from '@/core/utils/ctx';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: string[];
  requiredRole?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  requiredRole 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const ctx = useCtx();
  
  if (!ctx) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background">
        <div className="text-center space-y-6 p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 shadow-2xl">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-muted border-t-primary mx-auto shadow-lg"></div>
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-primary/30 animate-ping mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">Initializing System</h3>
            <p className="text-muted-foreground">Setting up your secure environment...</p>
          </div>
          <div className="flex space-x-1 justify-center">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>
    );
  }
  
  const { rbac } = ctx;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-mutedForeground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // Check role requirement
  if (requiredRole && !rbac.hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-mutedForeground">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  // Check permission requirements
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      rbac.hasPermission(permission)
    );

    if (!hasAllPermissions) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-mutedForeground">You don't have permission to access this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}