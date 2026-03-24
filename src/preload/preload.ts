import { contextBridge, ipcRenderer } from 'electron';
import type { TreeNode } from '../shared/fileTypes';

const api = {
  fs: {
    readFile: (filePath: string): Promise<string> =>
      ipcRenderer.invoke('fs:readFile', filePath),
    writeFile: (filePath: string, content: string): Promise<void> =>
      ipcRenderer.invoke('fs:writeFile', filePath, content),
    readDir: (dirPath: string): Promise<TreeNode[]> =>
      ipcRenderer.invoke('fs:readDir', dirPath),
    watchDir: (dirPath: string): Promise<void> =>
      ipcRenderer.invoke('fs:watchDir', dirPath),
    unwatchDir: (): Promise<void> =>
      ipcRenderer.invoke('fs:unwatchDir'),
    onFileChanged: (callback: (filePath: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: { filePath: string }) => {
        callback(data.filePath);
      };
      ipcRenderer.on('fs:fileChanged', listener);
      return () => { ipcRenderer.removeListener('fs:fileChanged', listener); };
    },
    onFileDeleted: (callback: (filePath: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: { filePath: string }) => {
        callback(data.filePath);
      };
      ipcRenderer.on('fs:fileDeleted', listener);
      return () => { ipcRenderer.removeListener('fs:fileDeleted', listener); };
    },
    onFileAdded: (callback: (filePath: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: { filePath: string }) => {
        callback(data.filePath);
      };
      ipcRenderer.on('fs:fileAdded', listener);
      return () => { ipcRenderer.removeListener('fs:fileAdded', listener); };
    },
  },
  dialog: {
    openFolder: (): Promise<string | null> =>
      ipcRenderer.invoke('dialog:openFolder'),
    saveFile: (defaultPath?: string): Promise<string | null> =>
      ipcRenderer.invoke('dialog:saveFile', defaultPath),
  },
  app: {
    onOpenFolder: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('app:openFolder', listener);
      return () => { ipcRenderer.removeListener('app:openFolder', listener); };
    },
    onSave: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('app:save', listener);
      return () => { ipcRenderer.removeListener('app:save', listener); };
    },
    onToggleSidebar: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('app:toggleSidebar', listener);
      return () => { ipcRenderer.removeListener('app:toggleSidebar', listener); };
    },
    onToggleTheme: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('app:toggleTheme', listener);
      return () => { ipcRenderer.removeListener('app:toggleTheme', listener); };
    },
    onOpenSettings: (callback: () => void) => {
      const listener = () => callback();
      ipcRenderer.on('app:openSettings', listener);
      return () => { ipcRenderer.removeListener('app:openSettings', listener); };
    },
  },
} as const;

export type ElectronAPI = typeof api;

contextBridge.exposeInMainWorld('api', api);
