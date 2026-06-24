import React, { useState } from 'react';

function TreeVisualization({ tree, onFolderClick }) {
  if (!tree) {
    return <div>No data</div>;
  }

  return (
    <div style={styles.treeContainer}>
      <TreeNode 
        node={tree} 
        depth={0}
        onFolderClick={onFolderClick}
      />
    </div>
  );
}

function TreeNode({ node, depth, onFolderClick }) {
  const [expanded, setExpanded] = useState(depth < 2); // Expand first 2 levels

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div style={{ marginLeft: `${depth * 20}px` }}>
      <div
        style={{
          ...styles.nodeItem,
          backgroundColor: depth % 2 === 0 ? '#f9f9f9' : '#fff',
          padding: '12px',
          marginBottom: '4px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          cursor: 'pointer',
        }}
        onClick={() => onFolderClick(node)}
      >
        {/* Expand/Collapse Button */}
        <span
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          style={{
            display: 'inline-block',
            width: '20px',
            marginRight: '8px',
            fontWeight: 'bold',
            color: hasChildren ? '#333' : '#ccc',
            cursor: hasChildren ? 'pointer' : 'default',
          }}
        >
          {hasChildren ? (expanded ? '▼' : '▶') : '●'}
        </span>

        {/* Folder Icon and Name */}
        <span style={{ fontWeight: 'bold', marginRight: '10px' }}>
          📁 {node.name}
        </span>

        {/* Stats */}
        <span style={styles.stats}>
          {node.fileCount > 0 && (
            <span>Files: {node.fileCount}</span>
          )}
          {node.childFolders > 0 && (
            <span style={{ marginLeft: '10px' }}>
              Folders: {node.childFolders}
            </span>
          )}
        </span>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {node.children.map((child, idx) => (
            <TreeNode
              key={idx}
              node={child}
              depth={depth + 1}
              onFolderClick={onFolderClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  treeContainer: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    border: '2px solid #ddd',
    maxHeight: '700px',
    overflowY: 'auto',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  nodeItem: {
    display: 'flex',
    alignItems: 'center',
    fontFamily: 'Arial, sans-serif',
    fontSize: '13px',
  },

  stats: {
    fontSize: '11px',
    color: '#666',
    marginLeft: 'auto',
    paddingLeft: '20px',
  },
};

export default TreeVisualization;