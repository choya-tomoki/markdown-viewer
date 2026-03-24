import { Tree } from 'react-arborist';
import { FileTreeNode } from './FileTreeNode';
import { useFileOperations } from '../../hooks/useFileOperations';
import { useFileTreeStore } from '../../stores/fileTreeStore';
import type { TreeNode } from '../../../shared/fileTypes';

interface FileTreeProps {
  data: TreeNode[];
}

export function FileTree({ data }: FileTreeProps) {
  const { openFile } = useFileOperations();
  const setSelectedFile = useFileTreeStore((s) => s.setSelectedFile);

  const handleActivate = (node: any) => {
    const item = node.data as TreeNode;
    if (!item.isFolder) {
      setSelectedFile(item.filePath);
      openFile(item.filePath, item.name);
    }
  };

  return (
    <Tree
      data={data}
      onActivate={handleActivate}
      rowHeight={28}
      indent={16}
      padding={8}
      openByDefault={false}
      width="100%"
      height={600}
      idAccessor="id"
      childrenAccessor="children"
    >
      {FileTreeNode}
    </Tree>
  );
}
