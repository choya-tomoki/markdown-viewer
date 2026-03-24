# Markdown Viewer 設計書

## 1. 概要

### 1.1 アプリケーション名

**Markdown Viewer**

### 1.2 目的とゴール

Markdown Viewer は、Electron ベースのデスクトップアプリケーションであり、Markdown ファイルを WYSIWYG 形式でレンダリング表示・編集することを目的とする。Typora のようなシームレスな編集体験を提供しつつ、オープンな技術スタックで新規に実装する。

主なゴール:

- Markdown ファイルをレンダリング済みの状態で表示する（ソースコードとのサイドバイサイド表示は行わない）
- レンダリングビュー上で直接 WYSIWYG 編集を可能にする
- フォルダ/ファイルツリーによるプロジェクト単位のファイル管理
- タブインターフェースによる複数ファイルの同時操作
- ファイルの保存機能

### 1.3 ターゲットユーザー

- Markdown を日常的に使用するソフトウェアエンジニア
- 技術ドキュメントを作成・管理するテクニカルライター
- ノートやメモを Markdown で管理するナレッジワーカー
- シンプルで高速な Markdown エディタを求めるすべてのユーザー

### 1.4 既存アプリケーションとの比較

| アプリ | 特徴 | 本アプリとの差異 |
|--------|------|------------------|
| Typora | WYSIWYG の Gold Standard、クローズドソース、$14.99 | 本アプリはオープンな技術スタックで同等の UX を目指す |
| Mark Text | 最も近いオープンソース実装、独自 Muya エディタ使用 | 2022年以降開発が停滞。本アプリは Milkdown を採用し活発なエコシステムを活用 |
| Obsidian | Live Preview モード（ハイブリッド方式）、優れたタブ/ツリー | 本アプリは完全な WYSIWYG レンダリングビューを提供 |

---

## 2. アーキテクチャ

### 2.1 全体アーキテクチャ図

```
┌─────────────────────────────────────────────────────────────────┐
│                        Electron Application                      │
│                                                                   │
│  ┌──────────────────────┐       ┌──────────────────────────────┐ │
│  │    Main Process       │       │     Renderer Process          │ │
│  │                        │       │                                │ │
│  │  ┌────────────────┐  │  IPC  │  ┌──────────────────────────┐ │ │
│  │  │ Window Manager │  │◄─────►│  │      React Application    │ │ │
│  │  └────────────────┘  │       │  │                            │ │ │
│  │  ┌────────────────┐  │       │  │  ┌────────┐ ┌──────────┐ │ │ │
│  │  │  File System    │  │       │  │  │Sidebar │ │  TabBar  │ │ │ │
│  │  │  Operations     │  │       │  │  └────────┘ └──────────┘ │ │ │
│  │  └────────────────┘  │       │  │  ┌──────────────────────┐ │ │ │
│  │  ┌────────────────┐  │       │  │  │  Milkdown Editor     │ │ │ │
│  │  │   chokidar      │  │       │  │  │  (WYSIWYG)          │ │ │ │
│  │  │  File Watcher   │  │       │  │  └──────────────────────┘ │ │ │
│  │  └────────────────┘  │       │  │  ┌──────────────────────┐ │ │ │
│  │  ┌────────────────┐  │       │  │  │    StatusBar         │ │ │ │
│  │  │  App Menu       │  │       │  │  └──────────────────────┘ │ │ │
│  │  └────────────────┘  │       │  │                            │ │ │
│  │  ┌────────────────┐  │       │  │  ┌──────────────────────┐ │ │ │
│  │  │  Dialog Manager │  │       │  │  │  Zustand Stores      │ │ │ │
│  │  └────────────────┘  │       │  │  └──────────────────────┘ │ │ │
│  └──────────────────────┘       │  └──────────────────────────┘ │ │
│              │                    │              │                  │ │
│              │                    │     Preload Script              │ │
│              │                    │  ┌──────────────────────────┐ │ │
│              └───────────────────►│  │   contextBridge API      │ │ │
│                                   │  │   (型安全な IPC Bridge)   │ │ │
│                                   │  └──────────────────────────┘ │ │
│                                   └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  File System     │
│  (OS)            │
└─────────────────┘
```

### 2.2 プロセスモデル

Electron アプリケーションは以下の2つのプロセスで構成される。

#### メインプロセス (Main Process)

- Node.js ランタイム上で動作
- OS のファイルシステムへの直接アクセス権を持つ
- ウィンドウの作成と管理を担当
- アプリケーションメニューの構築
- ネイティブダイアログ（フォルダ選択、ファイル保存）の表示
- chokidar によるファイル監視
- IPC ハンドラの登録と応答

#### レンダラプロセス (Renderer Process)

- Chromium 上で動作する React アプリケーション
- UI の描画とユーザーインタラクションの処理
- Milkdown エディタによる WYSIWYG 編集
- Zustand による状態管理
- Preload スクリプト経由でのみメインプロセスと通信

### 2.3 IPC 通信パターン

本アプリケーションでは以下の3つの IPC 通信パターンを使用する。

```
パターン1: Request-Response (invoke/handle)
──────────────────────────────────────────
Renderer ──invoke──► Main Process
         ◄─result──

  用途: ファイル読み込み、ディレクトリ一覧取得、ダイアログ表示

パターン2: One-Way (send/on)
──────────────────────────────────────────
Main Process ──send──► Renderer

  用途: ファイル変更通知、ファイル削除通知

パターン3: Event-Based (on/send)
──────────────────────────────────────────
Renderer ──send──► Main Process

  用途: ファイル監視の開始/停止
```

### 2.4 データフロー図

```
ユーザー操作                  Renderer                Main Process             File System
    │                           │                         │                        │
    │  フォルダを開く           │                         │                        │
    ├──────────────────────────►│                         │                        │
    │                           │  dialog:openFolder      │                        │
    │                           ├────────────────────────►│                        │
    │                           │                         │  OS Dialog             │
    │                           │                         ├───────────────────────►│
    │                           │                         │◄───────────────────────┤
    │                           │  folderPath             │                        │
    │                           │◄────────────────────────┤                        │
    │                           │  fs:readDir             │                        │
    │                           ├────────────────────────►│                        │
    │                           │                         │  readdir               │
    │                           │                         ├───────────────────────►│
    │                           │                         │◄───────────────────────┤
    │                           │  treeData               │                        │
    │                           │◄────────────────────────┤                        │
    │  ツリー更新表示           │                         │                        │
    │◄──────────────────────────┤                         │                        │
    │                           │  fs:watchDir            │                        │
    │                           ├────────────────────────►│                        │
    │                           │                         │  chokidar.watch()      │
    │                           │                         ├───────────────────────►│
    │                           │                         │                        │
    │  ファイルをクリック       │                         │                        │
    ├──────────────────────────►│                         │                        │
    │                           │  fs:readFile            │                        │
    │                           ├────────────────────────►│                        │
    │                           │                         │  readFile              │
    │                           │                         ├───────────────────────►│
    │                           │                         │◄───────────────────────┤
    │                           │  content                │                        │
    │                           │◄────────────────────────┤                        │
    │  Markdown 表示            │                         │                        │
    │◄──────────────────────────┤                         │                        │
    │                           │                         │                        │
    │  編集 → 保存 (Ctrl+S)    │                         │                        │
    ├──────────────────────────►│                         │                        │
    │                           │  fs:writeFile           │                        │
    │                           ├────────────────────────►│                        │
    │                           │                         │  writeFile             │
    │                           │                         ├───────────────────────►│
    │                           │                         │◄───────────────────────┤
    │                           │  success                │                        │
    │                           │◄────────────────────────┤                        │
    │  保存完了表示             │                         │                        │
    │◄──────────────────────────┤                         │                        │
```

---

## 3. 技術スタック

### 3.1 コア技術一覧

| レイヤー | 技術 | バージョン | 選定理由 |
|----------|------|-----------|----------|
| フレームワーク | Electron | v41 | クロスプラットフォームデスクトップアプリの標準 |
| ビルドツール | electron-forge | 最新 | Electron 公式ツールチェーン |
| バンドラー | Vite | 最新 | 高速なビルドと HMR |
| UI フレームワーク | React | v19 | コンポーネントベース UI、豊富なエコシステム |
| 言語 | TypeScript | v5 | 型安全性によるバグ防止、開発効率向上 |
| WYSIWYG エディタ | Milkdown | @milkdown/kit, @milkdown/react | ProseMirror ベース、ネイティブ Markdown ラウンドトリップ、ヘッドレス/カスタマイズ可能 |
| Markdown パイプライン | remark/unified | Milkdown 内部利用 | AST サポート、200以上のプラグイン |
| ファイルツリー | react-arborist | 最新 | 仮想化、VS Code ライクな操作、ドラッグ&ドロップ、キーボードナビゲーション |
| ファイル監視 | chokidar | v5 | 実績豊富、クロスプラットフォーム対応 |
| Markdown CSS | github-markdown-css | 最新 | GitHub 準拠のスタイリング、テーマバリアント、ダークモード対応 |
| シンタックスハイライト | Shiki | 最新 | VS Code 品質のハイライト、インラインスタイル、遅延読み込み |
| タブ UI | カスタム React コンポーネント | - | @dnd-kit によるドラッグ並び替え |
| 状態管理 | Zustand | 最新 | 軽量、シンプルな API、React との親和性 |
| ドラッグ&ドロップ | @dnd-kit | 最新 | アクセシブル、高性能 |

### 3.2 依存パッケージ一覧

#### 本番依存 (dependencies)

```json
{
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "@milkdown/kit": "^7.x",
  "@milkdown/react": "^7.x",
  "@milkdown/plugin-listener": "^7.x",
  "@milkdown/plugin-prism": "^7.x",
  "react-arborist": "^3.x",
  "zustand": "^5.x",
  "@dnd-kit/core": "^6.x",
  "@dnd-kit/sortable": "^10.x",
  "chokidar": "^5.x",
  "github-markdown-css": "^5.x",
  "shiki": "^3.x"
}
```

#### 開発依存 (devDependencies)

```json
{
  "@electron-forge/cli": "^7.x",
  "@electron-forge/maker-squirrel": "^7.x",
  "@electron-forge/maker-zip": "^7.x",
  "@electron-forge/maker-deb": "^7.x",
  "@electron-forge/plugin-vite": "^7.x",
  "electron": "^41.x",
  "typescript": "^5.x",
  "@types/react": "^19.x",
  "@types/react-dom": "^19.x",
  "vite": "^6.x",
  "@vitejs/plugin-react": "^4.x"
}
```

---

## 4. プロジェクト構造

```
markdown-viewer/
├── src/
│   ├── main/                        # Electron メインプロセス
│   │   ├── index.ts                 # メインエントリポイント（BrowserWindow 生成）
│   │   ├── ipc/                     # IPC ハンドラ
│   │   │   ├── index.ts             # 全 IPC ハンドラの登録
│   │   │   ├── fileHandlers.ts      # ファイル操作系ハンドラ
│   │   │   └── dialogHandlers.ts    # ダイアログ系ハンドラ
│   │   ├── fileSystem/              # ファイルシステム操作
│   │   │   ├── fileOperations.ts    # 読み書き操作
│   │   │   ├── directoryReader.ts   # ディレクトリ再帰読み込み
│   │   │   └── fileWatcher.ts       # chokidar ファイル監視
│   │   └── menu/                    # アプリケーションメニュー
│   │       └── appMenu.ts           # メニューバー定義
│   │
│   ├── preload/                     # プリロードスクリプト
│   │   └── index.ts                 # contextBridge API 定義
│   │
│   ├── renderer/                    # React アプリケーション
│   │   ├── index.html               # HTML エントリポイント
│   │   ├── main.tsx                 # React エントリポイント
│   │   ├── App.tsx                  # ルートコンポーネント
│   │   ├── components/              # UI コンポーネント
│   │   │   ├── Sidebar/             # ファイルツリーサイドバー
│   │   │   │   ├── Sidebar.tsx      # サイドバーコンテナ
│   │   │   │   ├── FileTree.tsx     # react-arborist ファイルツリー
│   │   │   │   ├── FileTreeNode.tsx # ツリーノードカスタムレンダラ
│   │   │   │   └── Sidebar.css      # サイドバースタイル
│   │   │   ├── TabBar/              # タブ管理
│   │   │   │   ├── TabBar.tsx       # タブバーコンテナ
│   │   │   │   ├── Tab.tsx          # 個別タブコンポーネント
│   │   │   │   └── TabBar.css       # タブバースタイル
│   │   │   ├── Editor/              # Milkdown エディタ
│   │   │   │   ├── Editor.tsx       # エディタコンテナ
│   │   │   │   ├── MilkdownEditor.tsx # Milkdown 初期化・設定
│   │   │   │   ├── editorPlugins.ts # カスタムプラグイン設定
│   │   │   │   └── Editor.css       # エディタスタイル
│   │   │   └── StatusBar/           # ステータスバー
│   │   │       ├── StatusBar.tsx    # ステータスバーコンポーネント
│   │   │       └── StatusBar.css    # ステータスバースタイル
│   │   ├── stores/                  # Zustand ストア
│   │   │   ├── fileTreeStore.ts     # ファイルツリー状態
│   │   │   ├── tabStore.ts          # タブ状態
│   │   │   ├── editorStore.ts       # エディタ状態
│   │   │   └── appStore.ts          # アプリ全体設定
│   │   ├── hooks/                   # カスタム React フック
│   │   │   ├── useFileOperations.ts # ファイル操作フック
│   │   │   ├── useKeyboardShortcuts.ts # キーボードショートカット
│   │   │   └── useTheme.ts          # テーマ切り替え
│   │   ├── styles/                  # グローバルスタイル
│   │   │   ├── global.css           # グローバル CSS
│   │   │   ├── variables.css        # CSS カスタムプロパティ
│   │   │   └── themes/              # テーマ定義
│   │   │       ├── light.css        # ライトテーマ
│   │   │       └── dark.css         # ダークテーマ
│   │   └── types/                   # Renderer 側 TypeScript 型定義
│   │       └── window.d.ts          # window.api 型拡張
│   │
│   └── shared/                      # プロセス間共有型定義
│       ├── ipcChannels.ts           # IPC チャンネル名定数
│       ├── fileTypes.ts             # ファイル/ディレクトリ関連の型
│       └── appTypes.ts              # アプリケーション共通型
│
├── resources/                       # アプリアイコン等の静的リソース
│   ├── icon.png                     # アプリアイコン (1024x1024)
│   ├── icon.ico                     # Windows 用アイコン
│   └── icon.icns                    # macOS 用アイコン
│
├── .claude/                         # Claude Code 設定
├── package.json                     # プロジェクト設定・依存関係
├── forge.config.ts                  # Electron Forge 設定
├── tsconfig.json                    # TypeScript 設定（ベース）
├── vite.main.config.ts              # Vite 設定（メインプロセス）
├── vite.preload.config.ts           # Vite 設定（プリロード）
└── vite.renderer.config.ts          # Vite 設定（レンダラ）
```

---

## 5. コンポーネント設計

### 5.1 メインプロセス (Main Process)

#### 5.1.1 ウィンドウ管理 (`src/main/index.ts`)

```typescript
// BrowserWindow の作成と設定
function createWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    titleBarStyle: 'default',
    show: false, // ready-to-show で表示（フリッカー防止）
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  return mainWindow;
}
```

責務:
- `BrowserWindow` の生成とライフサイクル管理
- ウィンドウの閉じる前の未保存確認
- ウィンドウサイズ・位置の保存と復元

#### 5.1.2 ファイルシステム操作 (`src/main/fileSystem/`)

**fileOperations.ts**

```typescript
import { readFile, writeFile } from 'node:fs/promises';

export async function readFileContent(filePath: string): Promise<string> {
  // パスのバリデーション
  // UTF-8 でファイル読み込み
  return await readFile(filePath, { encoding: 'utf-8' });
}

export async function writeFileContent(
  filePath: string,
  content: string
): Promise<void> {
  // パスのバリデーション
  // アトミック書き込み（一時ファイル経由）
  await writeFile(filePath, content, { encoding: 'utf-8' });
}
```

**directoryReader.ts**

```typescript
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { TreeNode } from '../../shared/fileTypes';

export async function readDirectoryRecursive(
  dirPath: string,
  depth: number = 0,
  maxDepth: number = 10
): Promise<TreeNode[]> {
  // 再帰的にディレクトリを読み込み、TreeNode 配列を返す
  // .md ファイルとディレクトリのみをフィルタリング
  // 隠しファイル/フォルダ（.git 等）を除外
  // maxDepth で無限再帰を防止
}
```

**fileWatcher.ts**

```typescript
import { watch, type FSWatcher } from 'chokidar';
import type { BrowserWindow } from 'electron';

export class FileWatcherManager {
  private watcher: FSWatcher | null = null;

  async startWatching(
    dirPath: string,
    window: BrowserWindow
  ): Promise<void> {
    this.stopWatching();

    this.watcher = watch(dirPath, {
      ignored: /(^|[\/\\])\../, // 隠しファイルを無視
      persistent: true,
      ignoreInitial: true,
      depth: 10,
    });

    this.watcher
      .on('change', (filePath) => {
        window.webContents.send('fs:fileChanged', { filePath });
      })
      .on('unlink', (filePath) => {
        window.webContents.send('fs:fileDeleted', { filePath });
      })
      .on('add', (filePath) => {
        window.webContents.send('fs:fileAdded', { filePath });
      });
  }

  stopWatching(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}
```

#### 5.1.3 IPC ハンドラ (`src/main/ipc/`)

```typescript
import { ipcMain, dialog } from 'electron';
import { readFileContent, writeFileContent } from '../fileSystem/fileOperations';
import { readDirectoryRecursive } from '../fileSystem/directoryReader';
import { IPC_CHANNELS } from '../../shared/ipcChannels';

export function registerFileHandlers(): void {
  ipcMain.handle(IPC_CHANNELS.FS_READ_FILE, async (_event, filePath: string) => {
    return await readFileContent(filePath);
  });

  ipcMain.handle(IPC_CHANNELS.FS_WRITE_FILE, async (_event, filePath: string, content: string) => {
    await writeFileContent(filePath, content);
  });

  ipcMain.handle(IPC_CHANNELS.FS_READ_DIR, async (_event, dirPath: string) => {
    return await readDirectoryRecursive(dirPath);
  });
}

export function registerDialogHandlers(window: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FOLDER, async () => {
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle(IPC_CHANNELS.DIALOG_SAVE_FILE, async (_event, defaultPath?: string) => {
    const result = await dialog.showSaveDialog(window, {
      defaultPath,
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }],
    });
    if (result.canceled) return null;
    return result.filePath;
  });
}
```

#### 5.1.4 アプリケーションメニュー (`src/main/menu/appMenu.ts`)

```typescript
import { Menu, type MenuItemConstructorOptions } from 'electron';

export function buildAppMenu(window: BrowserWindow): Menu {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'ファイル',
      submenu: [
        {
          label: 'フォルダを開く...',
          accelerator: 'CmdOrCtrl+Shift+O',
          click: () => window.webContents.send('app:openFolder'),
        },
        { type: 'separator' },
        {
          label: '保存',
          accelerator: 'CmdOrCtrl+S',
          click: () => window.webContents.send('app:save'),
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
          click: () => window.webContents.send('app:toggleSidebar'),
        },
        { type: 'separator' },
        {
          label: 'テーマ切り替え',
          click: () => window.webContents.send('app:toggleTheme'),
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
```

### 5.2 プリロードスクリプト (Preload Script)

#### `src/preload/index.ts`

```typescript
import { contextBridge, ipcRenderer } from 'electron';
import type { TreeNode } from '../shared/fileTypes';

/**
 * Renderer プロセスに公開する API の定義。
 * contextBridge を通じて window.api としてアクセス可能になる。
 */
const api = {
  // ファイルシステム操作
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

    // ファイルシステムイベントのリスナー登録
    onFileChanged: (callback: (filePath: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: { filePath: string }) => {
        callback(data.filePath);
      };
      ipcRenderer.on('fs:fileChanged', listener);
      return () => ipcRenderer.removeListener('fs:fileChanged', listener);
    },

    onFileDeleted: (callback: (filePath: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: { filePath: string }) => {
        callback(data.filePath);
      };
      ipcRenderer.on('fs:fileDeleted', listener);
      return () => ipcRenderer.removeListener('fs:fileDeleted', listener);
    },

    onFileAdded: (callback: (filePath: string) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, data: { filePath: string }) => {
        callback(data.filePath);
      };
      ipcRenderer.on('fs:fileAdded', listener);
      return () => ipcRenderer.removeListener('fs:fileAdded', listener);
    },
  },

  // ダイアログ操作
  dialog: {
    openFolder: (): Promise<string | null> =>
      ipcRenderer.invoke('dialog:openFolder'),

    saveFile: (defaultPath?: string): Promise<string | null> =>
      ipcRenderer.invoke('dialog:saveFile', defaultPath),
  },

  // アプリケーション操作
  app: {
    getRecentFolders: (): Promise<string[]> =>
      ipcRenderer.invoke('app:getRecentFolders'),

    onOpenFolder: (callback: () => void) => {
      ipcRenderer.on('app:openFolder', callback);
      return () => ipcRenderer.removeListener('app:openFolder', callback);
    },

    onSave: (callback: () => void) => {
      ipcRenderer.on('app:save', callback);
      return () => ipcRenderer.removeListener('app:save', callback);
    },

    onToggleSidebar: (callback: () => void) => {
      ipcRenderer.on('app:toggleSidebar', callback);
      return () => ipcRenderer.removeListener('app:toggleSidebar', callback);
    },

    onToggleTheme: (callback: () => void) => {
      ipcRenderer.on('app:toggleTheme', callback);
      return () => ipcRenderer.removeListener('app:toggleTheme', callback);
    },
  },
} as const;

// 型エクスポート（Renderer 側の型定義用）
export type ElectronAPI = typeof api;

// contextBridge で安全に公開
contextBridge.exposeInMainWorld('api', api);
```

#### Renderer 側の型定義 (`src/renderer/types/window.d.ts`)

```typescript
import type { ElectronAPI } from '../../preload/index';

declare global {
  interface Window {
    api: ElectronAPI;
  }
}
```

### 5.3 レンダラプロセス (Renderer Process)

#### 5.3.1 アプリケーションレイアウト

```
┌──────────────────────────────────────────────────────────┐
│  Menu Bar (native)                                        │
├──────────┬───────────────────────────────────────────────┤
│          │  Tab1 │ Tab2 │ Tab3                   [+]     │
│  File    ├───────────────────────────────────────────────┤
│  Tree    │                                               │
│          │  # 見出し                                     │
│  Side    │                                               │
│  bar     │  本文テキストがここに表示されます。           │
│          │                                               │
│  -------│  - リスト項目 1                                │
│          │  - リスト項目 2                                │
│  README  │                                               │
│  docs/   │  ```javascript                                │
│    api   │  const hello = "world";                       │
│    guide │  ```                                          │
│          │                                               │
├──────────┴───────────────────────────────────────────────┤
│  📄 /path/to/file.md  │  UTF-8  │  1,234 文字           │
└──────────────────────────────────────────────────────────┘
```

#### 5.3.2 App コンポーネント (`src/renderer/App.tsx`)

```tsx
import { Sidebar } from './components/Sidebar/Sidebar';
import { TabBar } from './components/TabBar/TabBar';
import { Editor } from './components/Editor/Editor';
import { StatusBar } from './components/StatusBar/StatusBar';
import { useAppStore } from './stores/appStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import './styles/global.css';

export function App() {
  const { sidebarVisible, sidebarWidth } = useAppStore();
  useKeyboardShortcuts();

  return (
    <div className="app-container">
      {sidebarVisible && (
        <aside className="sidebar" style={{ width: sidebarWidth }}>
          <Sidebar />
        </aside>
      )}
      <main className="main-content">
        <TabBar />
        <Editor />
      </main>
      <StatusBar />
    </div>
  );
}
```

#### 5.3.3 Sidebar コンポーネント (`src/renderer/components/Sidebar/`)

**Sidebar.tsx**

```tsx
import { useEffect } from 'react';
import { FileTree } from './FileTree';
import { useFileTreeStore } from '../../stores/fileTreeStore';

export function Sidebar() {
  const { openedFolderPath, treeData, setTreeData, setOpenedFolderPath } = useFileTreeStore();

  const handleOpenFolder = async () => {
    const folderPath = await window.api.dialog.openFolder();
    if (folderPath) {
      setOpenedFolderPath(folderPath);
      const tree = await window.api.fs.readDir(folderPath);
      setTreeData(tree);
      await window.api.fs.watchDir(folderPath);
    }
  };

  useEffect(() => {
    // メニューからの「フォルダを開く」イベントを処理
    const cleanup = window.api.app.onOpenFolder(handleOpenFolder);
    return cleanup;
  }, []);

  // ファイルシステム変更時のツリー更新
  useEffect(() => {
    if (!openedFolderPath) return;

    const cleanupChanged = window.api.fs.onFileChanged(async () => {
      const tree = await window.api.fs.readDir(openedFolderPath);
      setTreeData(tree);
    });

    const cleanupAdded = window.api.fs.onFileAdded(async () => {
      const tree = await window.api.fs.readDir(openedFolderPath);
      setTreeData(tree);
    });

    const cleanupDeleted = window.api.fs.onFileDeleted(async () => {
      const tree = await window.api.fs.readDir(openedFolderPath);
      setTreeData(tree);
    });

    return () => {
      cleanupChanged();
      cleanupAdded();
      cleanupDeleted();
    };
  }, [openedFolderPath]);

  if (!openedFolderPath) {
    return (
      <div className="sidebar-empty">
        <button onClick={handleOpenFolder}>フォルダを開く</button>
      </div>
    );
  }

  return <FileTree data={treeData} />;
}
```

**FileTree.tsx** - react-arborist ベースのファイルツリー

```tsx
import { Tree } from 'react-arborist';
import { FileTreeNode } from './FileTreeNode';
import { useTabStore } from '../../stores/tabStore';
import type { TreeNode } from '../../../shared/fileTypes';

interface FileTreeProps {
  data: TreeNode[];
}

export function FileTree({ data }: FileTreeProps) {
  const { openTab } = useTabStore();

  const handleSelect = async (nodes: TreeNode[]) => {
    const node = nodes[0];
    if (node && !node.isFolder) {
      const content = await window.api.fs.readFile(node.filePath);
      openTab({
        id: node.filePath,
        name: node.name,
        filePath: node.filePath,
        content,
        isDirty: false,
      });
    }
  };

  return (
    <Tree
      data={data}
      onSelect={handleSelect}
      rowHeight={28}
      indent={16}
      padding={8}
    >
      {FileTreeNode}
    </Tree>
  );
}
```

#### 5.3.4 TabBar コンポーネント (`src/renderer/components/TabBar/`)

**TabBar.tsx**

```tsx
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Tab } from './Tab';
import { useTabStore } from '../../stores/tabStore';

export function TabBar() {
  const { tabs, activeTabId, setActiveTab, closeTab, reorderTabs } = useTabStore();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderTabs(String(active.id), String(over.id));
    }
  };

  const handleMouseDown = (tabId: string, event: React.MouseEvent) => {
    // 中クリックで閉じる
    if (event.button === 1) {
      event.preventDefault();
      closeTab(tabId);
    }
  };

  return (
    <div className="tab-bar">
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={tabs.map(t => t.id)} strategy={horizontalListSortingStrategy}>
          {tabs.map((tab) => (
            <Tab
              key={tab.id}
              tab={tab}
              isActive={tab.id === activeTabId}
              onClick={() => setActiveTab(tab.id)}
              onClose={() => closeTab(tab.id)}
              onMouseDown={(e) => handleMouseDown(tab.id, e)}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
```

**Tab.tsx**

```tsx
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { TabData } from '../../../shared/appTypes';

interface TabProps {
  tab: TabData;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

export function Tab({ tab, isActive, onClick, onClose, onMouseDown }: TabProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: tab.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`tab ${isActive ? 'tab--active' : ''}`}
      onClick={onClick}
      onMouseDown={onMouseDown}
      {...attributes}
      {...listeners}
    >
      <span className="tab__name">
        {tab.isDirty && <span className="tab__dirty-indicator" />}
        {tab.name}
      </span>
      <button
        className="tab__close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ×
      </button>
    </div>
  );
}
```

#### 5.3.5 Editor コンポーネント (`src/renderer/components/Editor/`)

**Editor.tsx**

```tsx
import { MilkdownEditor } from './MilkdownEditor';
import { useTabStore } from '../../stores/tabStore';

export function Editor() {
  const { activeTab, updateTabContent, markTabDirty } = useTabStore();

  if (!activeTab) {
    return (
      <div className="editor-empty">
        <p>ファイルを選択して開いてください</p>
      </div>
    );
  }

  const handleChange = (markdown: string) => {
    updateTabContent(activeTab.id, markdown);
    markTabDirty(activeTab.id);
  };

  return (
    <div className="editor-container">
      <MilkdownEditor
        key={activeTab.id}  // タブ切り替え時にエディタを再マウント
        content={activeTab.content}
        onChange={handleChange}
      />
    </div>
  );
}
```

**MilkdownEditor.tsx**

```tsx
import { useEffect } from 'react';
import { MilkdownProvider } from '@milkdown/react';
import { Editor, rootCtx, defaultValueCtx } from '@milkdown/kit/core';
import { commonmark } from '@milkdown/kit/preset/commonmark';
import { gfm } from '@milkdown/kit/preset/gfm';
import { history } from '@milkdown/kit/plugin/history';
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener';
import { useEditor } from '@milkdown/react';

interface MilkdownEditorProps {
  content: string;
  onChange: (markdown: string) => void;
}

function MilkdownEditorInner({ content, onChange }: MilkdownEditorProps) {
  const { get } = useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root);
        ctx.set(defaultValueCtx, content);
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
          onChange(markdown);
        });
      })
      .use(commonmark)
      .use(gfm)
      .use(history)
      .use(listener)
  );

  return <div className="milkdown-editor" ref={/* Milkdown ref */} />;
}

export function MilkdownEditor(props: MilkdownEditorProps) {
  return (
    <MilkdownProvider>
      <MilkdownEditorInner {...props} />
    </MilkdownProvider>
  );
}
```

#### 5.3.6 StatusBar コンポーネント (`src/renderer/components/StatusBar/`)

```tsx
import { useTabStore } from '../../stores/tabStore';

export function StatusBar() {
  const { activeTab } = useTabStore();

  if (!activeTab) {
    return <div className="status-bar" />;
  }

  const charCount = activeTab.content.length;

  return (
    <div className="status-bar">
      <span className="status-bar__file-path">{activeTab.filePath}</span>
      <span className="status-bar__encoding">UTF-8</span>
      <span className="status-bar__char-count">{charCount.toLocaleString()} 文字</span>
    </div>
  );
}
```

### 5.4 状態管理 (State Management)

全状態管理は Zustand を使用する。各ストアは単一責任の原則に従い分割する。

#### 5.4.1 fileTreeStore

```typescript
import { create } from 'zustand';
import type { TreeNode } from '../../shared/fileTypes';

interface FileTreeState {
  // 状態
  openedFolderPath: string | null;
  treeData: TreeNode[];
  selectedFilePath: string | null;

  // アクション
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
```

#### 5.4.2 tabStore

```typescript
import { create } from 'zustand';
import type { TabData } from '../../shared/appTypes';

interface TabState {
  // 状態
  tabs: TabData[];
  activeTabId: string | null;

  // 算出プロパティ
  activeTab: TabData | undefined;

  // アクション
  openTab: (tab: TabData) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  markTabDirty: (tabId: string) => void;
  markTabClean: (tabId: string) => void;
  reorderTabs: (fromId: string, toId: string) => void;
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  get activeTab() {
    const state = get();
    return state.tabs.find((t) => t.id === state.activeTabId);
  },

  openTab: (tab) =>
    set((state) => {
      // 既に開いている場合はアクティブにするだけ
      const existing = state.tabs.find((t) => t.id === tab.id);
      if (existing) {
        return { activeTabId: tab.id };
      }
      return {
        tabs: [...state.tabs, tab],
        activeTabId: tab.id,
      };
    }),

  closeTab: (tabId) =>
    set((state) => {
      const index = state.tabs.findIndex((t) => t.id === tabId);
      const newTabs = state.tabs.filter((t) => t.id !== tabId);
      let newActiveId = state.activeTabId;

      if (state.activeTabId === tabId) {
        // 閉じたタブがアクティブだった場合、隣のタブをアクティブに
        if (newTabs.length > 0) {
          const newIndex = Math.min(index, newTabs.length - 1);
          newActiveId = newTabs[newIndex].id;
        } else {
          newActiveId = null;
        }
      }

      return { tabs: newTabs, activeTabId: newActiveId };
    }),

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  updateTabContent: (tabId, content) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, content } : t
      ),
    })),

  markTabDirty: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, isDirty: true } : t
      ),
    })),

  markTabClean: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((t) =>
        t.id === tabId ? { ...t, isDirty: false } : t
      ),
    })),

  reorderTabs: (fromId, toId) =>
    set((state) => {
      const tabs = [...state.tabs];
      const fromIndex = tabs.findIndex((t) => t.id === fromId);
      const toIndex = tabs.findIndex((t) => t.id === toId);
      const [moved] = tabs.splice(fromIndex, 1);
      tabs.splice(toIndex, 0, moved);
      return { tabs };
    }),
}));
```

#### 5.4.3 editorStore

```typescript
import { create } from 'zustand';

interface EditorState {
  // 各ファイルのスクロール位置を保持（タブ切り替え時に復元）
  scrollPositions: Record<string, number>;

  setScrollPosition: (filePath: string, position: number) => void;
  getScrollPosition: (filePath: string) => number;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  scrollPositions: {},

  setScrollPosition: (filePath, position) =>
    set((state) => ({
      scrollPositions: { ...state.scrollPositions, [filePath]: position },
    })),

  getScrollPosition: (filePath) => get().scrollPositions[filePath] ?? 0,
}));
```

#### 5.4.4 appStore

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface AppState {
  // 状態
  sidebarVisible: boolean;
  sidebarWidth: number;
  theme: Theme;
  recentFolders: string[];

  // アクション
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  addRecentFolder: (path: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarVisible: true,
      sidebarWidth: 260,
      theme: 'light',
      recentFolders: [],

      toggleSidebar: () =>
        set((state) => ({ sidebarVisible: !state.sidebarVisible })),

      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light',
        })),

      setTheme: (theme) => set({ theme }),

      addRecentFolder: (path) =>
        set((state) => {
          const filtered = state.recentFolders.filter((f) => f !== path);
          return {
            recentFolders: [path, ...filtered].slice(0, 10), // 最大10件
          };
        }),
    }),
    {
      name: 'markdown-viewer-app-settings',
    }
  )
);
```

---

## 6. IPC API 設計

### 6.1 チャンネル定数定義 (`src/shared/ipcChannels.ts`)

```typescript
/**
 * IPC チャンネル名を一元管理する定数オブジェクト。
 * メインプロセスとプリロードスクリプトの両方から参照する。
 */
export const IPC_CHANNELS = {
  // ファイルシステム操作 (Renderer → Main, invoke/handle)
  FS_READ_FILE: 'fs:readFile',
  FS_WRITE_FILE: 'fs:writeFile',
  FS_READ_DIR: 'fs:readDir',
  FS_WATCH_DIR: 'fs:watchDir',
  FS_UNWATCH_DIR: 'fs:unwatchDir',

  // ファイルシステムイベント (Main → Renderer, send/on)
  FS_FILE_CHANGED: 'fs:fileChanged',
  FS_FILE_DELETED: 'fs:fileDeleted',
  FS_FILE_ADDED: 'fs:fileAdded',

  // ダイアログ (Renderer → Main, invoke/handle)
  DIALOG_OPEN_FOLDER: 'dialog:openFolder',
  DIALOG_SAVE_FILE: 'dialog:saveFile',

  // アプリケーション (双方向)
  APP_GET_RECENT_FOLDERS: 'app:getRecentFolders',
  APP_OPEN_FOLDER: 'app:openFolder',
  APP_SAVE: 'app:save',
  APP_TOGGLE_SIDEBAR: 'app:toggleSidebar',
  APP_TOGGLE_THEME: 'app:toggleTheme',
} as const;
```

### 6.2 チャンネル一覧と通信方向

| チャンネル | 方向 | パターン | パラメータ | 戻り値 | 説明 |
|-----------|------|---------|-----------|--------|------|
| `fs:readFile` | Renderer → Main | invoke/handle | `filePath: string` | `string` | ファイル内容の読み込み |
| `fs:writeFile` | Renderer → Main | invoke/handle | `filePath: string, content: string` | `void` | ファイル内容の書き込み |
| `fs:readDir` | Renderer → Main | invoke/handle | `dirPath: string` | `TreeNode[]` | ディレクトリの再帰読み込み |
| `fs:watchDir` | Renderer → Main | invoke/handle | `dirPath: string` | `void` | ディレクトリ監視の開始 |
| `fs:unwatchDir` | Renderer → Main | invoke/handle | なし | `void` | ディレクトリ監視の停止 |
| `fs:fileChanged` | Main → Renderer | send/on | `{ filePath: string }` | - | ファイル変更通知 |
| `fs:fileDeleted` | Main → Renderer | send/on | `{ filePath: string }` | - | ファイル削除通知 |
| `fs:fileAdded` | Main → Renderer | send/on | `{ filePath: string }` | - | ファイル追加通知 |
| `dialog:openFolder` | Renderer → Main | invoke/handle | なし | `string \| null` | フォルダ選択ダイアログ |
| `dialog:saveFile` | Renderer → Main | invoke/handle | `defaultPath?: string` | `string \| null` | ファイル保存ダイアログ |
| `app:getRecentFolders` | Renderer → Main | invoke/handle | なし | `string[]` | 最近のフォルダ履歴取得 |
| `app:openFolder` | Main → Renderer | send/on | なし | - | メニューからフォルダを開く |
| `app:save` | Main → Renderer | send/on | なし | - | メニューから保存 |
| `app:toggleSidebar` | Main → Renderer | send/on | なし | - | サイドバー表示切替 |
| `app:toggleTheme` | Main → Renderer | send/on | なし | - | テーマ切替 |

### 6.3 共有型定義 (`src/shared/fileTypes.ts`)

```typescript
/**
 * ファイルツリーのノードを表す型
 */
export interface TreeNode {
  /** 一意な識別子（フルパス） */
  id: string;
  /** ファイル/フォルダ名 */
  name: string;
  /** フルパス */
  filePath: string;
  /** フォルダかどうか */
  isFolder: boolean;
  /** 子ノード（フォルダの場合） */
  children?: TreeNode[];
}
```

### 6.4 共有型定義 (`src/shared/appTypes.ts`)

```typescript
/**
 * タブのデータ構造
 */
export interface TabData {
  /** 一意な識別子（ファイルパス） */
  id: string;
  /** 表示名（ファイル名） */
  name: string;
  /** ファイルのフルパス */
  filePath: string;
  /** ファイル内容（Markdown テキスト） */
  content: string;
  /** 未保存の変更があるかどうか */
  isDirty: boolean;
}
```

---

## 7. 機能一覧

### 7.1 Phase 1 (MVP)

MVP では Markdown ファイルの閲覧と基本的な編集に必要な最小限の機能を実装する。

| # | 機能 | 説明 | 優先度 |
|---|------|------|--------|
| 1 | フォルダを開く | OS ダイアログでフォルダを選択し、ファイルツリーに表示 | 必須 |
| 2 | ファイルツリー表示 | .md ファイルとフォルダの階層表示、展開/折りたたみ | 必須 |
| 3 | ファイルを開く | ツリーでファイルをクリックしてタブで開く | 必須 |
| 4 | Markdown レンダリング | WYSIWYG 形式で Markdown をレンダリング表示 | 必須 |
| 5 | インプレース編集 | レンダリングビュー上で直接 Markdown を編集 | 必須 |
| 6 | タブ管理 | タブの開閉、切り替え、未保存インジケーター | 必須 |
| 7 | ファイル保存 | Ctrl+S でアクティブファイルを保存 | 必須 |
| 8 | コードブロックハイライト | Shiki によるシンタックスハイライト | 必須 |
| 9 | GFM サポート | テーブル、タスクリスト、取り消し線等の GFM 拡張 | 必須 |
| 10 | ライト/ダークテーマ | テーマ切り替え、設定の永続化 | 必須 |
| 11 | ファイル監視 | 外部変更の検知とツリー/エディタの更新 | 必須 |
| 12 | サイドバー表示切替 | Ctrl+B でサイドバーの表示/非表示を切り替え | 必須 |
| 13 | 未保存確認ダイアログ | ウィンドウを閉じる際の未保存ファイル確認 | 必須 |

### 7.2 Phase 2 (拡張機能)

MVP 完成後に段階的に追加する機能。

| # | 機能 | 説明 | 優先度 |
|---|------|------|--------|
| 14 | ファイル内検索 | Ctrl+F でファイル内のテキスト検索 | 高 |
| 15 | 検索と置換 | Ctrl+H でテキスト置換 | 高 |
| 16 | タブのドラッグ並び替え | ドラッグ&ドロップでタブ順序を変更 | 高 |
| 17 | 画像プレビュー | Markdown 内の画像をインラインプレビュー | 高 |
| 18 | 画像の貼り付け | クリップボードから画像を貼り付け | 中 |
| 19 | PDF エクスポート | 現在のファイルを PDF に書き出し | 中 |
| 20 | HTML エクスポート | 現在のファイルを HTML に書き出し | 中 |
| 21 | 目次サイドバー | Markdown の見出しから目次を自動生成 | 中 |
| 22 | 最近のファイル/フォルダ | 最近開いたフォルダの履歴表示 | 中 |
| 23 | キーボードショートカットのカスタマイズ | ショートカットキーの変更 | 低 |
| 24 | サイドバーからのファイル作成/削除 | 右クリックメニューでファイル操作 | 中 |
| 25 | 分割ビュー | エディタを左右に分割して表示（オプション） | 低 |
| 26 | 数式レンダリング | KaTeX/MathJax による数式表示 | 低 |
| 27 | Mermaid 図表 | Mermaid 記法による図表レンダリング | 低 |
| 28 | スペルチェック | 英語/日本語のスペルチェック | 低 |

---

## 8. セキュリティ設計

### 8.1 Electron セキュリティ原則

本アプリケーションは Electron のセキュリティベストプラクティスに従い、以下の原則を適用する。

#### 8.1.1 プロセス分離

```typescript
// BrowserWindow 設定
webPreferences: {
  contextIsolation: true,    // コンテキスト分離を有効化
  nodeIntegration: false,    // Node.js 統合を無効化
  sandbox: true,             // サンドボックスを有効化
  preload: preloadPath,      // プリロードスクリプトのみ許可
}
```

- **contextIsolation: true** - Renderer プロセスの JavaScript コンテキストをプリロードスクリプトから分離する。Renderer は `window.api` を通じてのみ安全に API にアクセスできる。
- **nodeIntegration: false** - Renderer プロセスから Node.js API への直接アクセスを禁止する。
- **sandbox: true** - Renderer プロセスをサンドボックス化し、OS リソースへの直接アクセスを制限する。

#### 8.1.2 Content Security Policy (CSP)

```typescript
// メインプロセスで CSP ヘッダーを設定
session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  callback({
    responseHeaders: {
      ...details.responseHeaders,
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self' 'unsafe-inline'",  // Milkdown/Shiki のインラインスタイル用
        "img-src 'self' data: file:",         // ローカル画像の表示用
        "font-src 'self'",
      ].join('; '),
    },
  });
});
```

#### 8.1.3 IPC メッセージバリデーション

```typescript
// メインプロセス側で全 IPC メッセージを検証
ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  // 型チェック
  if (typeof filePath !== 'string') {
    throw new Error('Invalid parameter: filePath must be a string');
  }

  // パストラバーサル防止
  const resolved = path.resolve(filePath);
  if (!isPathAllowed(resolved)) {
    throw new Error('Access denied: path is outside allowed directories');
  }

  return await readFileContent(resolved);
});
```

#### 8.1.4 ファイルパスサニタイズ

```typescript
import path from 'node:path';

// 許可されたディレクトリのリスト
let allowedDirectories: string[] = [];

export function setAllowedDirectory(dirPath: string): void {
  allowedDirectories = [path.resolve(dirPath)];
}

export function isPathAllowed(targetPath: string): boolean {
  const resolved = path.resolve(targetPath);
  return allowedDirectories.some((dir) => resolved.startsWith(dir));
}
```

### 8.2 セキュリティチェックリスト

| # | 項目 | 状態 | 説明 |
|---|------|------|------|
| 1 | contextIsolation | 必須 | Renderer とプリロードのコンテキスト分離 |
| 2 | nodeIntegration: false | 必須 | Renderer からの Node.js API アクセス禁止 |
| 3 | sandbox: true | 必須 | Renderer プロセスのサンドボックス化 |
| 4 | CSP ヘッダー設定 | 必須 | XSS 攻撃の防止 |
| 5 | IPC 入力バリデーション | 必須 | 不正なパラメータの検証 |
| 6 | パストラバーサル防止 | 必須 | 許可外ディレクトリへのアクセス防止 |
| 7 | webSecurity: true (デフォルト) | 必須 | Same-origin ポリシーの維持 |
| 8 | allowRunningInsecureContent: false | 必須 | HTTP コンテンツのロード禁止 |
| 9 | remote モジュール無効化 | 必須 | @electron/remote を使用しない |
| 10 | shell.openExternal の制限 | 推奨 | 外部 URL を開く際のバリデーション |

---

## 9. 実装フェーズ計画

MVP の実装を10のステップに分割する。各ステップは独立してテスト可能な単位とする。

### Step 1: プロジェクトスキャフォールディング

**目標**: electron-forge + Vite + React + TypeScript のプロジェクト基盤構築

**作業内容**:
- `npm init electron-app@latest markdown-viewer -- --template=vite-typescript` でプロジェクト生成
- React と関連パッケージのインストール
- Vite 設定ファイルの調整（React プラグイン追加）
- TypeScript 設定の最適化
- プロジェクト構造（ディレクトリ）の作成
- 基本的な React コンポーネント（App.tsx）の確認

**完了条件**: `npm start` で空の Electron ウィンドウが React で描画される

### Step 2: メインプロセス - ウィンドウ作成と基本 IPC

**目標**: BrowserWindow の設定とセキュリティ基盤

**作業内容**:
- BrowserWindow のセキュリティ設定（contextIsolation, sandbox 等）
- ウィンドウサイズ・位置の設定
- ready-to-show イベントによる表示制御
- 基本的な IPC ハンドラの登録構造

**完了条件**: セキュリティ設定済みのウィンドウが表示され、IPC の基盤が動作する

### Step 3: プリロードスクリプト - API ブリッジ

**目標**: 型安全な contextBridge API の構築

**作業内容**:
- contextBridge を使用した API 公開
- 全 IPC チャンネルのブリッジ実装
- Renderer 側の型定義（window.d.ts）
- IPC チャンネル定数の定義（shared/ipcChannels.ts）

**完了条件**: Renderer から `window.api` 経由で IPC 通信が行える

### Step 4: サイドバー - ファイルツリーコンポーネント

**目標**: フォルダ選択とファイルツリーの表示

**作業内容**:
- react-arborist のインストールと設定
- ファイルツリーコンポーネントの実装
- フォルダ選択ダイアログとの連携
- ディレクトリ再帰読み込み（メインプロセス側）
- .md ファイルのフィルタリング
- ツリーノードのカスタムレンダリング（アイコン等）
- fileTreeStore の実装

**完了条件**: フォルダを選択してファイルツリーが表示される

### Step 5: タブバー - タブ管理

**目標**: VS Code ライクなタブインターフェース

**作業内容**:
- TabBar コンポーネントの実装
- Tab コンポーネントの実装
- tabStore の実装（開閉、切り替え、並び替え）
- 未保存インジケーター表示
- 中クリックによるタブクローズ
- Ctrl+Tab によるタブ切り替え
- タブバーの CSS スタイリング

**完了条件**: ファイルクリックでタブが開き、タブ操作が正しく動作する

### Step 6: エディタ - Milkdown 統合

**目標**: WYSIWYG Markdown エディタの実装

**作業内容**:
- Milkdown のインストール（@milkdown/kit, @milkdown/react）
- MilkdownEditor コンポーネントの実装
- commonmark プリセットの適用
- GFM プリセットの適用（テーブル、タスクリスト等）
- history プラグイン（Undo/Redo）の適用
- listener プラグインによる変更検知
- editorStore の実装
- タブ切り替え時のエディタ内容更新

**完了条件**: Markdown が WYSIWYG でレンダリングされ、編集が可能

### Step 7: ファイル操作 - 読み書き・監視

**目標**: ファイルの読み書きと外部変更の検知

**作業内容**:
- ファイル読み込みハンドラの実装
- ファイル書き込みハンドラの実装
- Ctrl+S による保存機能の実装
- chokidar によるファイル監視の実装
- 外部変更時のツリー更新
- 外部変更時のエディタ内容更新
- 未保存確認ダイアログの実装
- パスバリデーションとセキュリティチェック

**完了条件**: ファイルの読み書きが正しく動作し、外部変更が検知される

### Step 8: スタイリング - github-markdown-css + Shiki

**目標**: GitHub 品質の Markdown 表示とコードハイライト

**作業内容**:
- github-markdown-css の適用
- Shiki のインストールと設定
- コードブロックのシンタックスハイライト
- Milkdown エディタのスタイルカスタマイズ
- レイアウトの CSS（フレックスボックスによる3カラム風レイアウト）
- サイドバーのリサイズ対応

**完了条件**: Markdown が GitHub 風にレンダリングされ、コードブロックがハイライトされる

### Step 9: テーマサポート (ライト/ダーク)

**目標**: ライト/ダークテーマの切り替え

**作業内容**:
- CSS カスタムプロパティによるテーマ変数定義
- ライトテーマの CSS
- ダークテーマの CSS
- テーマ切り替えロジック（appStore）
- github-markdown-css のテーマバリアント対応
- OS テーマに連動するオプション
- テーマ設定の永続化（Zustand persist）
- アプリケーションメニューへのテーマ切り替え追加

**完了条件**: ライト/ダークテーマの切り替えが動作し、設定が保存される

### Step 10: テストとポリッシュ

**目標**: 品質向上と細部の調整

**作業内容**:
- エッジケースの処理（空ファイル、巨大ファイル、バイナリファイル等）
- エラーハンドリングの統一
- ローディング状態の UI 表示
- アプリケーションメニューの完成
- キーボードショートカットの全体テスト
- クロスプラットフォームテスト（Windows, macOS, Linux）
- パフォーマンスの確認と最適化
- アプリアイコンの設定

**完了条件**: MVP として安定して動作し、主要ユースケースが問題なく実行できる

### 実装タイムライン概要

```
Step 1  ████░░░░░░░░░░░░░░░░  プロジェクト基盤
Step 2  ░░████░░░░░░░░░░░░░░  ウィンドウ + IPC
Step 3  ░░░░████░░░░░░░░░░░░  プリロード API
Step 4  ░░░░░░██████░░░░░░░░  サイドバー
Step 5  ░░░░░░░░██████░░░░░░  タブバー
Step 6  ░░░░░░░░░░██████░░░░  エディタ (Milkdown)
Step 7  ░░░░░░░░░░░░████░░░░  ファイル操作
Step 8  ░░░░░░░░░░░░░░████░░  スタイリング
Step 9  ░░░░░░░░░░░░░░░░██░░  テーマ
Step 10 ░░░░░░░░░░░░░░░░░░██  ポリッシュ
```

各ステップは前のステップの完了に依存するが、Step 4（サイドバー）と Step 5（タブバー）は部分的に並行して作業可能である。Step 8（スタイリング）と Step 9（テーマ）も密接に関連するため連続して実装する。
