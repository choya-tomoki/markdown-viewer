import { useCallback } from 'react';
import { useFileTreeStore } from '../stores/fileTreeStore';
import { useTabStore } from '../stores/tabStore';

export function useFileOperations() {
  const setOpenedFolderPath = useFileTreeStore((s) => s.setOpenedFolderPath);
  const setTreeData = useFileTreeStore((s) => s.setTreeData);

  const openFolder = useCallback(async () => {
    const folderPath = await window.api.dialog.openFolder();
    if (folderPath) {
      setOpenedFolderPath(folderPath);
      const tree = await window.api.fs.readDir(folderPath);
      setTreeData(tree);
      await window.api.fs.watchDir(folderPath);
    }
  }, [setOpenedFolderPath, setTreeData]);

  const openFile = useCallback(async (filePath: string, fileName: string) => {
    try {
      const content = await window.api.fs.readFile(filePath);
      useTabStore.getState().openTab({
        id: filePath,
        name: fileName,
        filePath,
        content,
        isDirty: false,
      });
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }, []);

  const saveFile = useCallback(async (filePath: string, content: string) => {
    try {
      await window.api.fs.writeFile(filePath, content);
      useTabStore.getState().markTabClean(filePath);
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, []);

  return { openFolder, openFile, saveFile };
}
