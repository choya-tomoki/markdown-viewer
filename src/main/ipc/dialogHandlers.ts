import { ipcMain, dialog } from 'electron';
import type { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels';

export function registerDialogHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FOLDER, async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC_CHANNELS.DIALOG_SAVE_FILE, async (_event, defaultPath?: string) => {
    const result = await dialog.showSaveDialog(mainWindow, {
      defaultPath,
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    });
    if (result.canceled) return null;
    return result.filePath;
  });
}
