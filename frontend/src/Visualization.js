import React, { useCallback } from 'react';
import ReactFlow, {
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

    // Spacing configuration
    const LEVEL_HEIGHT = 250;   // Vertical space between levels
    const SIBLING_DISTANCE = 150; // Horizontal space between siblings
    const SUBTREE_DISTANCE = 200; // Horizontal space between subtrees

    // Calculate positions using tree layout algorithm
    function calculateLayout(node) {
      // Leaf node
      if (!node.children || node.children.length === 0) {
        node.width = SIBLING_DISTANCE;
        node.x = 0;
        return;
      }

      // Process all children first
      node.children.forEach(child => {
        calculateLayout(child);
      });

      // Calculate positions for children
      let currentX = 0;
      let maxChildWidth = 0;

      node.children.forEach((child, index) => {
        if (index > 0) {
          currentX += SUBTREE_DISTANCE; // Space between subtrees
        }
        
        child.x = currentX;
        currentX += child.width;
        maxChildWidth = Math.max(maxChildWidth, child.width);
      });

      // Position this node at center of children
      const totalChildrenWidth = currentX;
      node.width = Math.max(totalChildrenWidth, SIBLING_DISTANCE);
      
      // Center the node above its children
      let childrenCenterX = 0;
      if (node.children.length > 0) {
        const firstChildX = node.children[0].x;
        const lastChildX = node.children[node.children.length - 1].x;
        childrenCenterX = (firstChildX + lastChildX) / 2;
      }
      
      node.x = childrenCenterX - SIBLING_DISTANCE / 2;
    }

    // Apply layout calculation
    calculateLayout(tree);

    // Create nodes and edges with calculated positions
    function traverse(node, level = 0, absoluteX = 0) {
      const nodeId = node.id;
      const x = absoluteX + node.x;
      const y = level * LEVEL_HEIGHT;

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

      // Create edges to children
      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => {
          traverse(child, level + 1, absoluteX + node.x);
          
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