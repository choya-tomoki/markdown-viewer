import { useEffect } from 'react';
import { FileTree } from './FileTree';
import { useFileTreeStore } from '../../stores/fileTreeStore';
import { useFileOperations } from '../../hooks/useFileOperations';
import './Sidebar.css';

export function Sidebar() {
  const openedFolderPath = useFileTreeStore((s) => s.openedFolderPath);
  const treeData = useFileTreeStore((s) => s.treeData);
  const setTreeData = useFileTreeStore((s) => s.setTreeData);
  const { openFolder } = useFileOperations();

  useEffect(() => {
    const cleanup = window.api.app.onOpenFolder(openFolder);
    return cleanup;
  }, [openFolder]);

  // Watch for file system changes
  useEffect(() => {
    if (!openedFolderPath) return;

    const refreshTree = async () => {
      const tree = await window.api.fs.readDir(openedFolderPath);
      setTreeData(tree);
    };

    const c1 = window.api.fs.onFileChanged(refreshTree);
    const c2 = window.api.fs.onFileAdded(refreshTree);
    const c3 = window.api.fs.onFileDeleted(refreshTree);

    return () => { c1(); c2(); c3(); };
  }, [openedFolderPath, setTreeData]);

  if (!openedFolderPath) {
    return (
      <div className="sidebar-empty">
        <div className="sidebar-empty-content">
          <p>フォルダが開かれていません</p>
          <button className="open-folder-btn" onClick={openFolder}>
            フォルダを開く
          </button>
        </div>
      </div>
    );
  }

  const folderName = openedFolderPath.split(/[/\\]/).pop() || openedFolderPath;

  return (
    <div className="sidebar-content">
      <div className="sidebar-header">
        <span className="sidebar-title" title={openedFolderPath}>{folderName}</span>
      </div>
      <div className="sidebar-tree">
        <FileTree data={treeData} />
      </div>
    </div>
  );
}
