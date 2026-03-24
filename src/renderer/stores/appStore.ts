import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface AppState {
  sidebarVisible: boolean;
  sidebarWidth: number;
  theme: Theme;
  fontFamily: string;
  fontSize: number;
  recentFolders: string[];
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  addRecentFolder: (path: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarVisible: true,
      sidebarWidth: 260,
      theme: 'light',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
      fontSize: 16,
      recentFolders: [],

      toggleSidebar: () =>
        set((state) => ({ sidebarVisible: !state.sidebarVisible })),

      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      setTheme: (theme) => set({ theme }),

      setFontFamily: (font) => set({ fontFamily: font }),

      setFontSize: (size) => set({ fontSize: size }),

      addRecentFolder: (path) =>
        set((state) => {
          const filtered = state.recentFolders.filter((f) => f !== path);
          return {
            recentFolders: [path, ...filtered].slice(0, 10),
          };
        }),
    }),
    {
      name: 'markdown-viewer-app-settings',
    }
  )
);
