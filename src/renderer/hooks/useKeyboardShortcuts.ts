import { useEffect } from 'react';
import { useTabStore } from '../stores/tabStore';
import { useAppStore } from '../stores/appStore';

export function useKeyboardShortcuts() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const toggleTheme = useAppStore((s) => s.toggleTheme);

  useEffect(() => {
    const handleSave = async () => {
      const activeTab = useTabStore.getState().getActiveTab();
      if (activeTab && activeTab.isDirty) {
        try {
          await window.api.fs.writeFile(activeTab.filePath, activeTab.content);
          useTabStore.getState().markTabClean(activeTab.id);
        } catch (err) {
          console.error('Failed to save file:', err);
        }
      }
    };

    // Listen for menu-triggered events
    const cleanupSave = window.api.app.onSave(handleSave);
    const cleanupToggleSidebar = window.api.app.onToggleSidebar(toggleSidebar);
    const cleanupToggleTheme = window.api.app.onToggleTheme(toggleTheme);

    return () => {
      cleanupSave();
      cleanupToggleSidebar();
      cleanupToggleTheme();
    };
  }, [toggleSidebar, toggleTheme]);
}
