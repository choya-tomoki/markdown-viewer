import type { NodeRendererProps } from 'react-arborist';
import type { TreeNode } from '../../../shared/fileTypes';

export function FileTreeNode({ node, style, dragHandle }: NodeRendererProps<TreeNode>) {
  const data = node.data;

  return (
    <div
      className={`file-tree-node ${node.isSelected ? 'selected' : ''}`}
      style={style}
      ref={dragHandle}
      onClick={() => node.isInternal ? node.toggle() : node.activate()}
    >
      <span className="file-tree-icon">
        {data.isFolder ? (node.isOpen ? '\u{1F4C2}' : '\u{1F4C1}') : '\u{1F4C4}'}
      </span>
      <span className="file-tree-name">{data.name}</span>
    </div>
  );
}
