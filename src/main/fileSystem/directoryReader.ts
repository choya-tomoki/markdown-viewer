import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { TreeNode } from '../../shared/fileTypes';

const IGNORED_DIRS = new Set(['.git', '.svn', '.hg', 'node_modules', '.vscode', '.idea', '.vite', 'dist', 'out']);

export async function readDirectoryRecursive(
  dirPath: string,
  depth: number = 0,
  maxDepth: number = 10
): Promise<TreeNode[]> {
  if (depth > maxDepth) return [];

  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const nodes: TreeNode[] = [];

    for (const entry of entries) {
      // Skip hidden files/dirs (except .md files)
      if (entry.name.startsWith('.') && !entry.name.endsWith('.md')) continue;
      if (IGNORED_DIRS.has(entry.name)) continue;

      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        const children = await readDirectoryRecursive(fullPath, depth + 1, maxDepth);
        // Only include directories that contain .md files (directly or in subdirs)
        if (children.length > 0) {
          nodes.push({
            id: fullPath,
            name: entry.name,
            filePath: fullPath,
            isFolder: true,
            children,
          });
        }
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
        nodes.push({
          id: fullPath,
          name: entry.name,
          filePath: fullPath,
          isFolder: false,
        });
      }
    }

    // Sort: folders first, then files, alphabetically within each group
    nodes.sort((a, b) => {
      if (a.isFolder && !b.isFolder) return -1;
      if (!a.isFolder && b.isFolder) return 1;
      return a.name.localeCompare(b.name);
    });

    return nodes;
  } catch {
    return [];
  }
}
