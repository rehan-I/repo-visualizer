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

const nodeTypes = {};

function Visualization({ files, onNodeClick }) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Create nodes from files
  React.useEffect(() => {
    if (!files || files.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // Create nodes in a circular layout
    const nodesList = files.map((file, index) => {
      const angle = (index / files.length) * 2 * Math.PI;
      const radius = Math.min(500, files.length * 20);
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      return {
        id: file.id,
        data: {
          label: (
            <div style={{ textAlign: 'center', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {file.label.substring(0, 15)}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.8 }}>
                {file.type}
              </div>
              <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '2px' }}>
                {file.lines} LOC
              </div>
            </div>
          ),
        },
        position: { x, y },
        style: {
          background: getColorByType(file.type),
          color: 'white',
          border: '2px solid #333',
          borderRadius: '8px',
          padding: '10px',
          minWidth: '80px',
          minHeight: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '12px',
        },
      };
    });

    setNodes(nodesList);
    setEdges([]);
  }, [files, setNodes, setEdges]);

  const handleNodeClick = useCallback((event, node) => {
    const file = files.find(f => f.id === node.id);
    if (file && onNodeClick) {
      onNodeClick(file);
    }
  }, [files, onNodeClick]);

  return (
    <div style={{ width: '100%', height: '600px', border: '2px solid #ddd', borderRadius: '8px' }}>
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

// Color by file type
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
  };
  return colors[type] || '#757575';
}

export default Visualization;