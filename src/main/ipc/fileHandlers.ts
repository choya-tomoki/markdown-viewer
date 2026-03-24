import { ipcMain } from 'electron';
import type { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels';
import { readFileContent, writeFileContent, setAllowedDirectory } from '../fileSystem/fileOperations';
import { readDirectoryRecursive } from '../fileSystem/directoryReader';
import { FileWatcherManager } from '../fileSystem/fileWatcher';

export function registerFileHandlers(fileWatcher: FileWatcherManager, mainWindow: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.FS_READ_FILE, async (_event, filePath: string) => {
    if (typeof filePath !== 'string') {
      throw new Error('Invalid parameter: filePath must be a string');
    }
    return await readFileContent(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.FS_WRITE_FILE, async (_event, filePath: string, content: string) => {
    if (typeof filePath !== 'string' || typeof content !== 'string') {
      throw new Error('Invalid parameters');
    }
    await writeFileContent(filePath, content);
  });

  ipcMain.handle(IPC_CHANNELS.FS_READ_DIR, async (_event, dirPath: string) => {
    if (typeof dirPath !== 'string') {
      throw new Error('Invalid parameter: dirPath must be a string');
    }
    return await readDirectoryRecursive(dirPath);
  });

  ipcMain.handle(IPC_CHANNELS.FS_WATCH_DIR, async (_event, dirPath: string) => {
    if (typeof dirPath !== 'string') {
      throw new Error('Invalid parameter: dirPath must be a string');
    }
    setAllowedDirectory(dirPath);
    await fileWatcher.startWatching(dirPath, mainWindow);
  });

  ipcMain.handle(IPC_CHANNELS.FS_UNWATCH_DIR, async () => {
    fileWatcher.stopWatching();
  });
}
