export interface TreeNode {
  id: string;
  name: string;
  filePath: string;
  isFolder: boolean;
  children?: TreeNode[];
}
