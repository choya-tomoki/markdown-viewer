import { Menu, type BrowserWindow, type MenuItemConstructorOptions } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipcChannels';

export function buildAppMenu(window: BrowserWindow): Electron.Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'ファイル',
      submenu: [
        {
          label: 'フォルダを開く...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => window.webContents.send(IPC_CHANNELS.APP_OPEN_FOLDER),
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => window.webContents.send(IPC_CHANNELS.APP_SAVE),
        },
        { type: 'separator' },
        { role: 'quit', label: '終了' },
      ],
    },
    {
      label: '編集',
      submenu: [
        { role: 'undo', label: '元に戻す' },
        { role: 'redo', label: 'やり直し' },
        { type: 'separator' },
        { role: 'cut', label: '切り取り' },
        { role: 'copy', label: 'コピー' },
        { role: 'paste', label: '貼り付け' },
        { role: 'selectAll', label: 'すべて選択' },
      ],
    },
    {
      label: '表示',
      submenu: [
        {
          label: 'サイドバーの表示/非表示',
          accelerator: 'CmdOrCtrl+B',
          click: () => window.webContents.send(IPC_CHANNELS.APP_TOGGLE_SIDEBAR),
        },
        { type: 'separator' },
        {
          label: '設定...',
          accelerator: 'CmdOrCtrl+,',
          click: () => window.webContents.send(IPC_CHANNELS.APP_OPEN_SETTINGS),
        },
        {
          label: 'テーマ切り替え',
          click: () => window.webContents.send(IPC_CHANNELS.APP_TOGGLE_THEME),
        },
        { type: 'separator' },
        { role: 'zoomIn', label: '拡大' },
        { role: 'zoomOut', label: '縮小' },
        { role: 'resetZoom', label: 'ズームリセット' },
        { type: 'separator' },
        { role: 'toggleDevTools', label: '開発者ツール' },
      ],
    },
  ];

  return Menu.buildFromTemplate(template);
}
