import React, { useCallback } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

function Visualization({ tree, onNodeClick }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  React.useEffect(() => {
    if (!tree) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const nodesList = [];
    const edgesList = [];

    function traverse(node, level = 0, index = 0) {
      const nodeId = node.id;
      const x = level * 300;
      const y = index * 150;

      // Check if it's a folder - MUST match backend
      const isFolder = node.type === 'folder';
      
      console.log(`Node: ${node.name}, Type: ${node.type}, IsFolder: ${isFolder}`);

      const nodeObj = {
        id: nodeId,
        data: {
          label: (
            <div style={{ textAlign: 'center', fontSize: '11px' }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                {isFolder ? '📁' : '📄'}
              </div>
              <div style={{ fontWeight: 'bold', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {node.name}
              </div>
              {!isFolder && node.fileType && (
                <div style={{ fontSize: '9px', opacity: 0.7 }}>
                  {node.fileType}
                </div>
              )}
            </div>
          ),
          path: node.path,
        },
        position: { x, y },
        style: {
          background: isFolder ? '#FF9800' : getColorByType(node.fileType || 'Other'),
          color: 'white',
          border: '2px solid #333',
          borderRadius: '8px',
          padding: '10px',
          minWidth: '120px',
          minHeight: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontWeight: 'bold',
        },
      };
      
      nodesList.push(nodeObj);

      if (node.children && node.children.length > 0) {
        node.children.forEach((child, idx) => {
          traverse(child, level + 1, idx);
          edgesList.push({
            id: `${nodeId}-${child.id}`,
            source: nodeId,
            target: child.id,
            animated: false,
          });
        });
      }
    }

    traverse(tree);
    console.log('Total nodes:', nodesList.length);
    console.log('Nodes:', nodesList);
    
    setNodes(nodesList);
    setEdges(edgesList);
  }, [tree, setNodes, setEdges]);

  const handleNodeClick = useCallback((event, node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  return (
    <div style={{ width: '100%', height: '700px', border: '2px solid #ddd', borderRadius: '8px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        fitView
      >
        <Background color="#aaa" gap={16} />
        <Controls />
        <MiniMap style={{ backgroundColor: '#f0f0f0' }} />
      </ReactFlow>
    </div>
  );
}

function getColorByType(type) {
  const colors = {
    'Python': '#3776ab',
    'JavaScript': '#f1e05a',
    'TypeScript': '#2b7a0b',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'JSON': '#292929',
    'Markdown': '#083fa1',
    'Text': '#858585',
    'Video': '#ff5722',
    'Image': '#4caf50',
    'Audio': '#ff9800',
    'PDF': '#f44336',
    'Archive': '#9c27b0',
    'Other': '#757575',
  };
  return colors[type] || '#757575';
}

export default Visualization;