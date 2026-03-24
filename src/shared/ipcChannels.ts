export const IPC_CHANNELS = {
  // File system operations (Renderer → Main, invoke/handle)
  FS_READ_FILE: 'fs:readFile',
  FS_WRITE_FILE: 'fs:writeFile',
  FS_READ_DIR: 'fs:readDir',
  FS_WATCH_DIR: 'fs:watchDir',
  FS_UNWATCH_DIR: 'fs:unwatchDir',

  // File system events (Main → Renderer, send/on)
  FS_FILE_CHANGED: 'fs:fileChanged',
  FS_FILE_DELETED: 'fs:fileDeleted',
  FS_FILE_ADDED: 'fs:fileAdded',

  // Dialog (Renderer → Main, invoke/handle)
  DIALOG_OPEN_FOLDER: 'dialog:openFolder',
  DIALOG_SAVE_FILE: 'dialog:saveFile',

  // Application (bidirectional)
  APP_GET_RECENT_FOLDERS: 'app:getRecentFolders',
  APP_OPEN_FOLDER: 'app:openFolder',
  APP_SAVE: 'app:save',
  APP_TOGGLE_SIDEBAR: 'app:toggleSidebar',
  APP_TOGGLE_THEME: 'app:toggleTheme',
  APP_OPEN_SETTINGS: 'app:openSettings',
} as const;
