import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TabBar } from './components/TabBar/TabBar';
import { Editor } from './components/Editor/Editor';
import { StatusBar } from './components/StatusBar/StatusBar';
import { SettingsPanel } from './components/SettingsPanel/SettingsPanel';
import { useAppStore } from './stores/appStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTheme } from './hooks/useTheme';
import './styles/global.css';

export function App() {
  const sidebarVisible = useAppStore((s) => s.sidebarVisible);
  const sidebarWidth = useAppStore((s) => s.sidebarWidth);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useKeyboardShortcuts();
  useTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const cleanup = window.api.app.onOpenSettings(() => setSettingsOpen(true));
    return cleanup;
  }, []);

  return (
    <div className="app-root">
      <div className="app-container">
        {sidebarVisible && (
          <aside className="sidebar" style={{ width: sidebarWidth }}>
            <Sidebar />
          </aside>
        )}
        <main className="main-content">
          <TabBar />
          <Editor />
        </main>
      </div>
      <StatusBar />
      {settingsOpen && <SettingsPanel onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
