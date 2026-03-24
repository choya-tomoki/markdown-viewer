import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

let allowedDirectories: string[] = [];

export function setAllowedDirectory(dirPath: string): void {
  allowedDirectories = [path.resolve(dirPath)];
}

export function isPathAllowed(targetPath: string): boolean {
  if (allowedDirectories.length === 0) return true;
  const resolved = path.resolve(targetPath);
  return allowedDirectories.some((dir) => resolved.startsWith(dir + path.sep) || resolved === dir);
}

export async function readFileContent(filePath: string): Promise<string> {
  const resolved = path.resolve(filePath);
  return await readFile(resolved, { encoding: 'utf-8' });
}

export async function writeFileContent(filePath: string, content: string): Promise<void> {
  const resolved = path.resolve(filePath);
  await writeFile(resolved, content, { encoding: 'utf-8' });
}
