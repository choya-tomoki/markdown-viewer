# Markdown Viewer

Electron ベースの WYSIWYG Markdown ビューワー / エディタです。
VS Code のようなサイドバイサイド表示ではなく、**レンダリング済みの Markdown を直接表示・編集**できます。

![Electron](https://img.shields.io/badge/Electron-41-47848F?logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

## ダウンロード

| プラットフォーム | ダウンロード |
|:---:|:---:|
| **Windows x64** | [**Markdown Viewer Setup.exe**](https://github.com/choya-tomoki/markdown-viewer/releases/download/v1.0.0/Markdown.Viewer-1.0.0.Setup.exe) |

> その他のプラットフォーム（macOS / Linux）は今後のリリースで対応予定です。

## 特徴

- **WYSIWYG 編集** — レンダリング済みの Markdown をそのまま編集。ソースコードを見る必要はありません
- **ファイルツリー** — フォルダを開いて `.md` ファイルを一覧表示
- **タブインターフェース** — 複数ファイルをタブで同時に開き、ドラッグで並び替え可能
- **ダーク / ライトテーマ** — ワンクリックで切り替え、設定は自動保存
- **フォントカスタマイズ** — フォント種類とサイズを自由に変更
- **ファイル監視** — 外部で変更されたファイルを自動検知して反映
- **GFM サポート** — テーブル、タスクリスト、取り消し線など GitHub Flavored Markdown に対応

## スクリーンショット

```
┌──────────┬───────────────────────────────────────────────┐
│          │  README.md │ guide.md │                        │
│  File    ├───────────────────────────────────────────────┤
│  Tree    │                                               │
│          │  # 見出し                                     │
│  Side    │                                               │
│  bar     │  本文テキストがここに表示されます。           │
│          │  **太字** や *斜体* もレンダリング済み。      │
│  -------│                                               │
│  README  │  - リスト項目 1                               │
│  docs/   │  - リスト項目 2                               │
│    api   │                                               │
│    guide │  ```js                                        │
│          │  const hello = "world";                       │
│          │  ```                                          │
├──────────┴───────────────────────────────────────────────┤
│  /path/to/file.md  │  UTF-8  │  1,234 文字              │
└──────────────────────────────────────────────────────────┘
```

## クイックスタート

### インストーラーで使う

1. [Setup.exe をダウンロード](https://github.com/choya-tomoki/markdown-viewer/releases/download/v1.0.0/Markdown.Viewer-1.0.0.Setup.exe)
2. ダウンロードしたファイルを実行
3. アプリが起動したら `Ctrl+Shift+O` でフォルダを開く

### ソースから実行する

```bash
git clone https://github.com/choya-tomoki/markdown-viewer.git
cd markdown-viewer
npm install
npm start
```

## キーボードショートカット

| ショートカット | 操作 |
|:---|:---|
| `Ctrl+Shift+O` | フォルダを開く |
| `Ctrl+S` | ファイルを保存 |
| `Ctrl+B` | サイドバーの表示 / 非表示 |
| `Ctrl+,` | 設定パネルを開く |
| `Ctrl+Z` | 元に戻す |
| `Ctrl+Shift+Z` | やり直し |
| `Ctrl+Tab` | 次のタブに切り替え |

## 設定

`Ctrl+,` または メニュー → 表示 → 設定 で設定パネルを開けます。

### テーマ
- **ライト** / **ダーク** をボタンで切り替え

### フォント
- **フォント種類**: システムフォント、Noto Sans JP、Yu Gothic、Meiryo、MS Gothic、明朝体、Monospace から選択
- **フォントサイズ**: 10px 〜 32px で調整可能

設定はローカルストレージに自動保存され、次回起動時も維持されます。

## 技術スタック

| レイヤー | 技術 |
|:---|:---|
| フレームワーク | Electron 41 + electron-forge + Vite |
| UI | React 19 + TypeScript 5 |
| エディタ | Milkdown (ProseMirror + Remark) |
| ファイルツリー | react-arborist |
| 状態管理 | Zustand |
| タブ DnD | @dnd-kit |
| ファイル監視 | chokidar |

## プロジェクト構造

```
src/
├── main/              # Electron メインプロセス
│   ├── index.ts       # エントリポイント
│   ├── fileSystem/    # ファイル操作・監視
│   ├── ipc/           # IPC ハンドラ
│   └── menu/          # アプリケーションメニュー
├── preload/           # contextBridge API
├── renderer/          # React アプリケーション
│   ├── components/    # UI コンポーネント
│   ├── stores/        # Zustand ストア
│   ├── hooks/         # カスタムフック
│   └── styles/        # CSS・テーマ
└── shared/            # プロセス間共有型定義
```

## ビルド

```bash
# 開発サーバー起動
npm start

# パッケージング（現在のプラットフォーム向け）
npm run package

# インストーラー作成
npm run make
```

## ライセンス

MIT
