import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:8000';

function App() {
  const [repoPath, setRepoPath] = useState('.');
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/api/scan?repo_path=${repoPath}`);
      setNodes(response.data.nodes);
      alert(`Found ${response.data.total_files} files!`);
    } catch (err) {
      setError('Error scanning repo: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Repository Visualizer</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={repoPath}
          onChange={(e) => setRepoPath(e.target.value)}
          placeholder="Enter repo path (e.g., . or D:\path\to\repo)"
          style={{
            padding: '10px',
            width: '400px',
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <button
          onClick={handleScan}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Scanning...' : 'Scan Repository'}
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {nodes.length > 0 && (
        <div>
          <h3>Found {nodes.length} Files</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '10px'
          }}>
            {nodes.map(node => (
              <div key={node.id} style={{
                border: '1px solid #ddd',
                padding: '10px',
                borderRadius: '4px',
                backgroundColor: '#f9f9f9'
              }}>
                <strong>{node.label}</strong>
                <p style={{ margin: '5px 0', fontSize: '12px' }}>
                  Lines: {node.lines}
                </p>
                <p style={{ margin: '5px 0', fontSize: '12px' }}>
                  Size: {(node.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;