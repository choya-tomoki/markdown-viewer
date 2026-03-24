# Markdown Viewer - Claude Code Guide

## Project Overview
Electron-based Markdown viewer/editor application with WYSIWYG editing capabilities.

## Tech Stack
- **Runtime**: Electron v41 (electron-forge + Vite)
- **Frontend**: React 19 + TypeScript
- **Editor**: Milkdown (ProseMirror + Remark based WYSIWYG Markdown editor)
- **File Tree**: react-arborist (virtualized tree component)
- **State Management**: Zustand
- **Styling**: github-markdown-css + Shiki (syntax highlighting)
- **File Watching**: chokidar v5
- **Tab DnD**: @dnd-kit/core + @dnd-kit/sortable

## Architecture
- **Main Process** (`src/main/`): Electron main process - handles file system operations, window management, native dialogs, file watching via chokidar. No direct DOM access.
- **Preload** (`src/preload/`): Bridge between main and renderer via contextBridge. Exposes typed API only.
- **Renderer** (`src/renderer/`): React application - UI components, Milkdown editor, state management.
- **Shared** (`src/shared/`): TypeScript types shared between processes.

## Key Conventions
- Always use TypeScript strict mode
- Use functional React components with hooks only (no class components)
- State management through Zustand stores (src/renderer/stores/)
- IPC communication must go through the preload bridge - never expose raw ipcRenderer
- File system operations ONLY in main process, accessed via IPC invoke/handle pattern
- Use async/await for all asynchronous operations
- CSS Modules for component-specific styles, global styles in src/renderer/styles/

## Security Rules (CRITICAL)
- nodeIntegration must be false
- contextIsolation must be true
- Never expose Node.js APIs directly to renderer
- Validate all file paths in IPC handlers
- Use Content Security Policy headers

## File Naming Conventions
- Components: PascalCase (e.g., `FileTree.tsx`, `TabBar.tsx`)
- Stores: camelCase with 'Store' suffix (e.g., `tabStore.ts`, `fileTreeStore.ts`)
- Hooks: camelCase with 'use' prefix (e.g., `useFileTree.ts`, `useEditor.ts`)
- Types: PascalCase in `.ts` files (e.g., `types/FileNode.ts`)
- IPC handlers: camelCase grouped by domain (e.g., `ipc/fileSystemHandlers.ts`)

## Build & Run Commands
- `npm start` - Start development server
- `npm run package` - Package for current platform
- `npm run make` - Create distributable
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## Important Dependencies
- @milkdown/kit - Core Milkdown editor kit
- @milkdown/react - React integration for Milkdown
- @milkdown/crepe - Pre-configured Milkdown setup (evaluate if needed)
- @milkdown/plugin-listener - Editor state change listener
- react-arborist - File tree component
- zustand - State management
- chokidar - File system watching (main process only)
- github-markdown-css - Markdown content styling
- shiki - Syntax highlighting for code blocks
- @dnd-kit/core, @dnd-kit/sortable - Drag and drop for tabs

## Testing
- Use Vitest for unit tests
- Use Playwright for E2E tests (Electron support)
- Test files alongside source: `Component.test.tsx`

## Common Patterns

### Adding a new IPC handler
1. Define types in `src/shared/ipc.ts`
2. Add handler in `src/main/ipc/`
3. Expose through `src/preload/index.ts`
4. Create hook in `src/renderer/hooks/` to consume

### Adding a new component
1. Create component file in appropriate `src/renderer/components/` subdirectory
2. Create CSS module alongside: `Component.module.css`
3. Add to parent component

### Adding a Zustand store
1. Create store in `src/renderer/stores/`
2. Export typed hooks from the store file
3. Use in components via the exported hook
