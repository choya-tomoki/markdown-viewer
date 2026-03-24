import { app, BrowserWindow, session } from 'electron';
import path from 'node:path';
import { registerFileHandlers } from './ipc/fileHandlers';
import { registerDialogHandlers } from './ipc/dialogHandlers';
import { buildAppMenu } from './menu/appMenu';
import { FileWatcherManager } from './fileSystem/fileWatcher';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const fileWatcher = new FileWatcherManager();

const createWindow = (): BrowserWindow => {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, 'icon.png')
    : path.join(app.getAppPath(), 'resources', 'icon.png');

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
    titleBarStyle: 'default',
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Load the renderer
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  return mainWindow;
};

app.on('ready', () => {
  // Set Content Security Policy
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: file:; font-src 'self' data:",
        ],
      },
    });
  });

  const mainWindow = createWindow();

  // Register IPC handlers
  registerFileHandlers(fileWatcher, mainWindow);
  registerDialogHandlers(mainWindow);

  // Build application menu
  const menu = buildAppMenu(mainWindow);
  const { Menu } = require('electron');
  Menu.setApplicationMenu(menu);
});

app.on('window-all-closed', () => {
  fileWatcher.stopWatching();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Vite dev server URL declaration
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;
