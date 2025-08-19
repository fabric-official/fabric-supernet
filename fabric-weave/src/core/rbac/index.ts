export interface RBAC {
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  getUserRoles: () => string[];
  getUserPermissions: () => string[];
}

interface Profile {
  role: string;
  permissions: string[];
}

export function createRBAC(profile: Profile | null): RBAC {
  return {
    hasPermission: (permission: string) => {
      if (!profile) return false;
      
      // Admin has all permissions
      if (profile.role === 'admin') return true;
      
      // Check specific permissions
      return profile.permissions.includes(permission);
    },
    hasRole: (role: string) => profile?.role === role,
    getUserRoles: () => profile ? [profile.role] : [],
    getUserPermissions: () => profile?.permissions || [],
  };
}