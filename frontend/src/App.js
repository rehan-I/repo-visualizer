import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:8000';

function App() {
  const [repoPath, setRepoPath] = useState('.');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  // Function to scan the repository
  const scanRepo = async () => {
    setLoading(true);
    setError('');
    setFiles([]);
    setSelectedFile(null);

    try {
      console.log('Sending request to:', `${API_BASE}/api/scan?repo_path=${repoPath}`);
      
      // Send request to backend
      const response = await axios.post(
        `${API_BASE}/api/scan?repo_path=${repoPath}`
      );

      console.log('Response received:', response.data);

      // Check if response has nodes
      if (!response.data || !response.data.nodes) {
        setError('Invalid response from server');
        return;
      }

      // Check if nodes array is empty
      if (response.data.nodes.length === 0) {
        setError('No files found in this directory. Try a different path.');
        return;
      }

      // Set files successfully
      setFiles(response.data.nodes);

    } catch (err) {
      console.error('Full error:', err);
      
      if (err.code === 'ERR_NETWORK') {
        setError('❌ Cannot connect to backend. Make sure backend is running: python main.py');
      } else if (err.response?.status === 404) {
        setError('❌ Path not found. Check your directory path.');
      } else if (err.response?.data?.detail) {
        setError('❌ ' + err.response.data.detail);
      } else {
        setError('❌ Error: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  // When user presses Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      scanRepo();
    }
  };

  return (
    <div style={styles.container}>
      {/* TOP HEADER SECTION */}
      <div style={styles.header}>
        <h1>📁 Repository Explorer</h1>
        <p>A simple tool to see all files in your project</p>
      </div>

      {/* INPUT SECTION */}
      <div style={styles.searchBox}>
        <input
          type="text"
          value={repoPath}
          onChange={(e) => setRepoPath(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter folder path (e.g., . or D:\project)"
          style={styles.input}
        />
        <button 
          onClick={scanRepo} 
          disabled={loading}
          style={styles.button}
        >
          {loading ? 'Scanning...' : 'Search'}
        </button>
      </div>

      {/* ERROR MESSAGE */}
      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}
      {files.length > 0 && (
        <div style={styles.successBox}>
          ✅ Found {files.length} files
        </div>
      )}

      {/* FILES DISPLAY */}
      {files && files.length > 0 && (
        <div style={styles.filesContainer}>
          <h2>Files in your project:</h2>

          <div style={styles.filesList}>
            {files.map((file) => (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                style={{
                  ...styles.fileCard,
                  backgroundColor: selectedFile?.id === file.id ? '#e3f2fd' : 'white',
                  borderColor: selectedFile?.id === file.id ? '#2196F3' : '#ddd',
                }}
              >
                <h3>📄 {file.label}</h3>
                <p>📍 Path: {file.path}</p>
                <p>📏 Lines: {file.lines || 0}</p>
                <p>💾 Size: {((file.size || 0) / 1024).toFixed(2)} KB</p>
              </div>
            ))}
          </div>

          {/* SHOW DETAILS WHEN FILE IS SELECTED */}
          {selectedFile && (
            <div style={styles.detailsBox}>
              <h3>Details of: {selectedFile.label}</h3>
              <p><strong>Full Path:</strong> {selectedFile.path}</p>
              <p><strong>File Type:</strong> {selectedFile.type || 'unknown'}</p>
              <p><strong>Lines of Code:</strong> {selectedFile.lines || 0}</p>
              <p><strong>File Size:</strong> {((selectedFile.size || 0) / 1024).toFixed(2)} KB</p>
            </div>
          )}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && files.length === 0 && !error && (
        <div style={styles.emptyBox}>
          <h2>👋 Ready to explore!</h2>
          <p>Enter a folder path and click "Search"</p>
          <p><strong>Examples:</strong></p>
          <ul>
            <li><code>.</code> - Current folder</li>
            <li><code>D:\repo-visualizer</code> - Full path</li>
            <li><code>D:\Users\MOHAMMED REHAN\Downloads</code> - Any folder</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// CSS Styles
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh',
    fontFamily: 'Arial, sans-serif',
  },

  header: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '30px',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '30px',
  },

  searchBox: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },

  input: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    fontFamily: 'monospace',
  },

  button: {
    padding: '12px 30px',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
  },

  errorBox: {
    padding: '15px',
    backgroundColor: '#ffebee',
    border: '2px solid #f44336',
    borderRadius: '6px',
    marginBottom: '20px',
    color: '#c62828',
  },

  successBox: {
    padding: '15px',
    backgroundColor: '#e8f5e9',
    border: '2px solid #4caf50',
    borderRadius: '6px',
    marginBottom: '20px',
    color: '#2e7d32',
  },

  filesContainer: {
    marginBottom: '30px',
  },

  filesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '15px',
    marginTop: '15px',
  },

  fileCard: {
    padding: '15px',
    backgroundColor: 'white',
    border: '2px solid #ddd',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },

  detailsBox: {
    padding: '20px',
    backgroundColor: 'white',
    border: '2px solid #2196F3',
    borderRadius: '8px',
    marginTop: '20px',
  },

  emptyBox: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginTop: '20px',
  },
};

export default App;