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

function Visualization({ tree, dependencies, onNodeClick }) {
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

    function traverse(node, level = 0, index = 0, parentChildren = 1) {
      const nodeId = node.id;
      
      // Better spacing: 
      // - level determines X (depth)
      // - index determines Y (position among siblings)
      // - spread children wider to avoid overlap
      const xSpacing = 350;  // Space between levels
      const ySpacing = 180;  // Space between siblings
      
      const x = level * xSpacing;
      const y = index * ySpacing;

      const isFolder = node.type === 'folder';
      
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
              {!isFolder && (
                <div style={{ fontSize: '8px', opacity: 0.6, marginTop: '2px' }}>
                  {node.lines} LOC
                </div>
              )}
            </div>
          ),
          path: node.path,
          fileType: node.fileType,
          lines: node.lines,
          size: node.size,
        },
        position: { x, y },
        style: {
          background: isFolder ? '#FF9800' : getColorByType(node.fileType || 'Other'),
          color: 'white',
          border: '2px solid #333',
          borderRadius: '8px',
          padding: '10px',
          minWidth: '130px',
          minHeight: '110px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontWeight: 'bold',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        },
      };
      
      nodesList.push(nodeObj);

      // Folder-to-child edges (solid gray)
      if (node.children && node.children.length > 0) {
        node.children.forEach((child, idx) => {
          traverse(child, level + 1, idx, node.children.length);
          edgesList.push({
            id: `${nodeId}-${child.id}`,
            source: nodeId,
            target: child.id,
            animated: false,
            style: {
              stroke: '#999',
              strokeWidth: 1,
            }
          });
        });
      }
    }

    traverse(tree);
    
    // Add DEPENDENCY edges (red dashed - Hidden Relationships!)
    if (dependencies && dependencies.length > 0) {
      dependencies.forEach((dep, idx) => {
        edgesList.push({
          id: `dep-${dep.from}-${dep.to}-${idx}`,
          source: dep.from,
          target: dep.to,
          animated: true,
          style: {
            stroke: '#f44336',
            strokeDasharray: '5,5',
            strokeWidth: 2,
          },
          label: dep.label,
          labelStyle: {
            backgroundColor: '#fff',
            color: '#f44336',
            fontSize: '10px',
            fontWeight: 'bold',
            padding: '2px 4px',
            borderRadius: '3px',
            border: '1px solid #f44336'
          }
        });
      });
    }
    
    setNodes(nodesList);
    setEdges(edgesList);
  }, [tree, dependencies, setNodes, setEdges]);

  const handleNodeClick = useCallback((event, node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  return (
    <div style={{ width: '100%', height: '700px', border: '2px solid #ddd', borderRadius: '8px', backgroundColor: '#fafafa' }}>
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