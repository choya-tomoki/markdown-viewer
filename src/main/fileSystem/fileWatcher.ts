import chokidar from 'chokidar';
import type { FSWatcher } from 'chokidar';
import type { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels';

export class FileWatcherManager {
  private watcher: FSWatcher | null = null;

  async startWatching(dirPath: string, window: BrowserWindow): Promise<void> {
    this.stopWatching();

    this.watcher = chokidar.watch(dirPath, {
      ignored: /(^|[\/\\])(\.|node_modules)/,
      persistent: true,
      ignoreInitial: true,
      depth: 10,
    });

    this.watcher
      .on('change', (filePath: string) => {
        if (!window.isDestroyed()) {
          window.webContents.send(IPC_CHANNELS.FS_FILE_CHANGED, { filePath });
        }
      })
      .on('unlink', (filePath: string) => {
        if (!window.isDestroyed()) {
          window.webContents.send(IPC_CHANNELS.FS_FILE_DELETED, { filePath });
        }
      })
      .on('add', (filePath: string) => {
        if (!window.isDestroyed()) {
          window.webContents.send(IPC_CHANNELS.FS_FILE_ADDED, { filePath });
        }
      });
  }

  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
