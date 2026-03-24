import { create } from 'zustand';
import type { TreeNode } from '../../shared/fileTypes';

interface FileTreeState {
  openedFolderPath: string | null;
  treeData: TreeNode[];
  selectedFilePath: string | null;
  setOpenedFolderPath: (path: string | null) => void;
  setTreeData: (data: TreeNode[]) => void;
  setSelectedFile: (filePath: string | null) => void;
  reset: () => void;
}

export const useFileTreeStore = create<FileTreeState>((set) => ({
  openedFolderPath: null,
  treeData: [],
  selectedFilePath: null,
  setOpenedFolderPath: (path) => set({ openedFolderPath: path }),
  setTreeData: (data) => set({ treeData: data }),
  setSelectedFile: (filePath) => set({ selectedFilePath: filePath }),
  reset: () => set({ openedFolderPath: null, treeData: [], selectedFilePath: null }),
}));
