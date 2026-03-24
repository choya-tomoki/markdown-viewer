import { MilkdownEditor } from './MilkdownEditor';
import { useTabStore } from '../../stores/tabStore';
import './Editor.css';

export function Editor() {
  const tabs = useTabStore((s) => s.tabs);
  const activeTabId = useTabStore((s) => s.activeTabId);
  const updateTabContent = useTabStore((s) => s.updateTabContent);
  const markTabDirty = useTabStore((s) => s.markTabDirty);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  if (!activeTab) {
    return (
      <div className="editor-empty">
        <div className="editor-empty-content">
          <h2>Markdown Viewer</h2>
          <p>左のサイドバーからファイルを選択して開いてください</p>
          <p className="editor-empty-shortcut">Ctrl+Shift+O でフォルダを開く</p>
        </div>
      </div>
    );
  }

  const handleChange = (markdown: string) => {
    if (markdown !== activeTab.content) {
      updateTabContent(activeTab.id, markdown);
      markTabDirty(activeTab.id);
    }
  };

  return (
    <div className="editor-container">
      <MilkdownEditor
        key={activeTab.id}
        content={activeTab.content}
        onChange={handleChange}
      />
    </div>
  );
}
