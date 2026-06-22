import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

const API_BASE = 'http://localhost:8000';

function FileDetails({ file }) {
  return (
    <div style={styles.detailsBox}>
      <h3>{file.label}</h3>
      <p style={styles.fullPath}>{file.full_path}</p>
    </div>
  );
}

function App() {
  const [repoPath, setRepoPath] = useState('.');
  const [allFiles, setAllFiles] = useState([]);
  const [displayFiles, setDisplayFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Function to get file extension
  const getFileExtension = (filename) => {
    return filename.split('.').pop().toLowerCase();
  };

  // Function to get file type
  const getFileType = (filename) => {
    const ext = getFileExtension(filename);
    const types = {
      'py': 'Python',
      'js': 'JavaScript',
      'jsx': 'JavaScript',
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'yml': 'YAML',
      'md': 'Markdown',
      'txt': 'Text',
      'sql': 'SQL',
    };
    return types[ext] || 'Other';
  };

  // Get unique file types from all files
  const getUniqueFileTypes = () => {
    const types = new Set();
    allFiles.forEach(file => {
      types.add(getFileType(file.label));
    });
    return Array.from(types).sort();
  };

  // Filter files
  const filterFiles = (filterType) => {
    setSelectedFilter(filterType);
    let filtered = allFiles;

    // Apply filter
    if (filterType !== 'all') {
      filtered = allFiles.filter(file => getFileType(file.label) === filterType);
    }

    // Apply sort
    applySort(filtered, sortBy);
  };

  // Apply sort
  const applySort = (filesToSort, sortOption) => {
    let sorted = [...filesToSort];

    if (sortOption === 'name') {
      sorted.sort((a, b) => a.label.localeCompare(b.label));
    } else if (sortOption === 'size-desc') {
      sorted.sort((a, b) => b.size - a.size);
    } else if (sortOption === 'size-asc') {
      sorted.sort((a, b) => a.size - b.size);
    } else if (sortOption === 'lines-desc') {
      sorted.sort((a, b) => b.lines - a.lines);
    } else if (sortOption === 'lines-asc') {
      sorted.sort((a, b) => a.lines - b.lines);
    }

    setDisplayFiles(sorted);
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    let filtered = allFiles;

    // Apply current filter
    if (selectedFilter !== 'all') {
      filtered = allFiles.filter(file => getFileType(file.label) === selectedFilter);
    }

    applySort(filtered, newSort);
  };

  // Scan repository
  const scanRepo = async () => {
    setLoading(true);
    setError('');
    setAllFiles([]);
    setDisplayFiles([]);
    setSelectedFile(null);
    setSelectedFilter('all');
    setSortBy('name');

    try {
      console.log('Scanning:', repoPath);
      
      const response = await axios.post(
        `${API_BASE}/api/scan?repo_path=${repoPath}`
      );

      console.log('Response:', response.data);

      if (!response.data || !response.data.nodes) {
        setError('Invalid response from server');
        return;
      }

      if (response.data.nodes.length === 0) {
        setError('No files found in this directory. Try a different path.');
        return;
      }

      setAllFiles(response.data.nodes);
      setDisplayFiles(response.data.nodes.sort((a, b) => a.label.localeCompare(b.label)));

    } catch (err) {
      console.error('Error:', err);
      
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to backend. Make sure backend is running: python main.py');
      } else if (err.response?.status === 404) {
        setError('Path not found. Check your directory path.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Error: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  // When user presses Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      scanRepo();
    }
  };

  const fileTypes = getUniqueFileTypes();
  const stats = {
    total: allFiles.length,
    totalSize: (allFiles.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(2),
    totalLines: allFiles.reduce((sum, f) => sum + f.lines, 0),
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1>Repository Explorer</h1>
        <p>View and filter your codebase files</p>
      </div>

      {/* Search Box */}
      <div style={styles.searchBox}>
        <input
          type="text"
          value={repoPath}
          onChange={(e) => setRepoPath(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter folder path"
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

      {/* Error Message */}
      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      {/* Success Message */}
      {allFiles.length > 0 && (
        <div style={styles.successBox}>
          Found {allFiles.length} files
        </div>
      )}

      {/* Stats and Filters */}
      {allFiles.length > 0 && (
        <div>
          {/* Stats */}
          <div style={styles.statsBox}>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Files:</span>
              <span style={styles.statValue}>{stats.total}</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Size:</span>
              <span style={styles.statValue}>{stats.totalSize} KB</span>
            </div>
            <div style={styles.statItem}>
              <span style={styles.statLabel}>Total Lines:</span>
              <span style={styles.statValue}>{stats.totalLines}</span>
            </div>
          </div>

          {/* Filter Buttons */}
          <div style={styles.filterSection}>
            <h3>Filter by File Type:</h3>
            <div style={styles.filterButtons}>
              <button
                onClick={() => filterFiles('all')}
                style={{
                  ...styles.filterButton,
                  backgroundColor: selectedFilter === 'all' ? '#2196F3' : '#e0e0e0',
                  color: selectedFilter === 'all' ? 'white' : 'black',
                }}
              >
                All Types
              </button>
              {fileTypes.map(type => (
                <button
                  key={type}
                  onClick={() => filterFiles(type)}
                  style={{
                    ...styles.filterButton,
                    backgroundColor: selectedFilter === type ? '#2196F3' : '#e0e0e0',
                    color: selectedFilter === type ? 'white' : 'black',
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Options */}
          <div style={styles.sortSection}>
            <h3>Sort by:</h3>
            <div style={styles.sortButtons}>
              <button
                onClick={() => handleSortChange('name')}
                style={{
                  ...styles.sortButton,
                  backgroundColor: sortBy === 'name' ? '#4CAF50' : '#e0e0e0',
                  color: sortBy === 'name' ? 'white' : 'black',
                }}
              >
                Name
              </button>
              <button
                onClick={() => handleSortChange('size-desc')}
                style={{
                  ...styles.sortButton,
                  backgroundColor: sortBy === 'size-desc' ? '#4CAF50' : '#e0e0e0',
                  color: sortBy === 'size-desc' ? 'white' : 'black',
                }}
              >
                Size (Large to Small)
              </button>
              <button
                onClick={() => handleSortChange('size-asc')}
                style={{
                  ...styles.sortButton,
                  backgroundColor: sortBy === 'size-asc' ? '#4CAF50' : '#e0e0e0',
                  color: sortBy === 'size-asc' ? 'white' : 'black',
                }}
              >
                Size (Small to Large)
              </button>
              <button
                onClick={() => handleSortChange('lines-desc')}
                style={{
                  ...styles.sortButton,
                  backgroundColor: sortBy === 'lines-desc' ? '#4CAF50' : '#e0e0e0',
                  color: sortBy === 'lines-desc' ? 'white' : 'black',
                }}
              >
                Lines (High to Low)
              </button>
              <button
                onClick={() => handleSortChange('lines-asc')}
                style={{
                  ...styles.sortButton,
                  backgroundColor: sortBy === 'lines-asc' ? '#4CAF50' : '#e0e0e0',
                  color: sortBy === 'lines-asc' ? 'white' : 'black',
                }}
              >
                Lines (Low to High)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Files Display */}
      {displayFiles && displayFiles.length > 0 && (
        <div style={styles.filesContainer}>
          <h2>Files ({displayFiles.length}):</h2>

          <div style={styles.filesList}>
            {displayFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                style={{
                  ...styles.fileCard,
                  backgroundColor: selectedFile?.id === file.id ? '#e3f2fd' : 'white',
                  borderColor: selectedFile?.id === file.id ? '#2196F3' : '#ddd',
                }}
              >
                <h3>{file.label}</h3>
                <p>Type: {getFileType(file.label)}</p>
                <p>Path: {file.path}</p>
                <p>Lines: {file.lines || 0}</p>
                <p>Size: {((file.size || 0) / 1024).toFixed(2)} KB</p>
              </div>
            ))}
          </div>

          {/* File Details */}
          {selectedFile && (
            <FileDetails file={selectedFile} />
            
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && allFiles.length === 0 && !error && (
        <div style={styles.emptyBox}>
          <h2>Ready to explore your code</h2>
          <p>Enter a folder path and click "Search"</p>
          <p>Examples:</p>
          <ul>
            <li>. (current folder)</li>
            <li>D:\repo-visualizer</li>
            <li>C:\Users\YourName\Downloads</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Styles
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

  statsBox: {
    display: 'flex',
    gap: '20px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  statItem: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },

  statLabel: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '5px',
  },

  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#2196F3',
  },

  filterSection: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  filterButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },

  filterButton: {
    padding: '8px 15px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },

  sortSection: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  sortButtons: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },

  sortButton: {
    padding: '8px 15px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    transition: 'all 0.2s',
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
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  detailsBox: {
    padding: '20px',
    backgroundColor: 'white',
    border: '2px solid #2196F3',
    borderRadius: '8px',
    marginTop: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  emptyBox: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginTop: '20px',
  },
  detailsBox: {
    padding: '20px',
    backgroundColor: 'white',
    border: '2px solid #2196F3',
    borderRadius: '8px',
    marginTop: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  fullPath: {
    marginTop: '10px',
    color: '#666',
    fontFamily: 'monospace',
    fontSize: '13px',
    wordBreak: 'break-all',
    margin: '10px 0 0 0',
  }
  
};

export default App;