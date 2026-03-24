import { useTabStore } from '../../stores/tabStore';
import { useAppStore } from '../../stores/appStore';
import './StatusBar.css';

export function StatusBar() {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const theme = useAppStore((s) => s.theme);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="status-bar">
      <div className="status-bar__left">
        {activeTab && (
          <>
            <span className="status-bar__file-path" title={activeTab.filePath}>
              {activeTab.filePath}
            </span>
            {activeTab.isDirty && <span className="status-bar__modified">変更あり</span>}
          </>
        )}
      </div>
      <div className="status-bar__right">
        <span className="status-bar__encoding">UTF-8</span>
        {activeTab && (
          <span className="status-bar__char-count">
            {activeTab.content.length.toLocaleString()} 文字
          </span>
        )}
        <span className="status-bar__theme">{theme === 'light' ? '☀️ Light' : '🌙 Dark'}</span>
      </div>
    </div>
  );
}
