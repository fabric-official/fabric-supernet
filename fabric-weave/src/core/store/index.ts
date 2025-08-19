import { create } from 'zustand';

interface AppState {
  notifications: any[];
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  addNotification: (notification: any) => void;
  removeNotification: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  notifications: [],
  sidebarCollapsed: false,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  addNotification: (notification) => 
    set((state) => ({ notifications: [...state.notifications, notification] })),
  removeNotification: (id) => 
    set((state) => ({ notifications: state.notifications.filter(n => n.id !== id) })),
}));

export type AppStore = typeof useAppStore;
export const AppStoreAPI = useAppStore;