import React, { useState } from 'react';
import axios from 'axios';
import Visualization from './Visualization';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('explorer'); // 'explorer' or 'visualization'

  // Get file type
  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    const types = {
      'py': 'Python',
      'js': 'JavaScript',
      'jsx': 'JavaScript',
      'ts': 'TypeScript',
      'tsx': 'TypeScript',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'h': 'C Header',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'json': 'JSON',
      'xml': 'XML',
      'yaml': 'YAML',
      'yml': 'YAML',
      'sql': 'SQL',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'php': 'PHP',
      'sh': 'Shell',
      'bat': 'Batch',
      'md': 'Markdown',
      'txt': 'Text',
      'pdf': 'PDF',
      'doc': 'Word',
      'docx': 'Word',
      'xls': 'Excel',
      'xlsx': 'Excel',
      'mp4': 'Video',
      'avi': 'Video',
      'mov': 'Video',
      'mkv': 'Video',
      'mp3': 'Audio',
      'wav': 'Audio',
      'flac': 'Audio',
      'jpg': 'Image',
      'jpeg': 'Image',
      'png': 'Image',
      'gif': 'Image',
      'svg': 'Image',
      'ico': 'Image',
      'zip': 'Archive',
      'rar': 'Archive',
      '7z': 'Archive',
      'tar': 'Archive',
      'gz': 'Archive',
    };
    return types[ext] || 'Other';
  };

  // Get unique file types
  const getUniqueFileTypes = () => {
    const types = new Set();
    allFiles.forEach(file => {
      types.add(getFileType(file.label));
    });
    return Array.from(types).sort();
  };

  // Perform search with all filters
  const performSearch = (query, filterType, sortOption) => {
    let filtered = allFiles;

    if (filterType !== 'all') {
      filtered = filtered.filter(file => getFileType(file.label) === filterType);
    }

    if (query.trim() !== '') {
      filtered = filtered.filter(file =>
        file.label.toLowerCase().includes(query.toLowerCase())
      );
    }

    let sorted = [...filtered];
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

  const handleSearchChange = (query) => {
    setSearchQuery(query);
    performSearch(query, selectedFilter, sortBy);
  };

  const handleFilterChange = (filterType) => {
    setSelectedFilter(filterType);
    performSearch(searchQuery, filterType, sortBy);
  };

  const handleSortChange = (sortOption) => {
    setSortBy(sortOption);
    performSearch(searchQuery, selectedFilter, sortOption);
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
    setSearchQuery('');

    try {
      const response = await axios.post(
        `${API_BASE}/api/scan?repo_path=${repoPath}`
      );

      if (!response.data || !response.data.nodes) {
        setError('Invalid response from server');
        return;
      }

      if (response.data.nodes.length === 0) {
        setError('No files found in this directory');
        return;
      }

      setAllFiles(response.data.nodes);
      setDisplayFiles(response.data.nodes.sort((a, b) => a.label.localeCompare(b.label)));

    } catch (err) {
      console.error('Error:', err);
      if (err.code === 'ERR_NETWORK') {
        setError('Cannot connect to backend');
      } else {
        setError('Error: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

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
        <p>Visualize and analyze your codebase</p>
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

      {/* Error */}
      {error && <div style={styles.errorBox}>{error}</div>}

      {/* Success */}
      {allFiles.length > 0 && (
        <div style={styles.successBox}>
          Found {allFiles.length} files
        </div>
      )}

      {/* View Mode Toggle */}
      {allFiles.length > 0 && (
        <div style={styles.viewToggle}>
          <button
            onClick={() => setViewMode('explorer')}
            style={{
              ...styles.toggleButton,
              backgroundColor: viewMode === 'explorer' ? '#2196F3' : '#e0e0e0',
              color: viewMode === 'explorer' ? 'white' : 'black',
            }}
          >
            Explorer View
          </button>
          <button
            onClick={() => setViewMode('visualization')}
            style={{
              ...styles.toggleButton,
              backgroundColor: viewMode === 'visualization' ? '#2196F3' : '#e0e0e0',
              color: viewMode === 'visualization' ? 'white' : 'black',
            }}
          >
            Visualization View
          </button>
        </div>
      )}

      {/* VISUALIZATION VIEW */}
      {viewMode === 'visualization' && allFiles.length > 0 && (
        <div>
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

          <h2>Interactive File Graph</h2>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>
            Drag files around, zoom in/out. Click a file to see details.
          </p>

          <Visualization 
            files={allFiles} 
            onNodeClick={setSelectedFile}
          />

          {selectedFile && (
            <FileDetails file={selectedFile} />
          )}
        </div>
      )}

      {/* EXPLORER VIEW */}
      {viewMode === 'explorer' && allFiles.length > 0 && (
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

          {/* Filter */}
          <div style={styles.filterSection}>
            <h3>Filter by Type:</h3>
            <div style={styles.filterButtons}>
              <button
                onClick={() => handleFilterChange('all')}
                style={{
                  ...styles.filterButton,
                  backgroundColor: selectedFilter === 'all' ? '#2196F3' : '#e0e0e0',
                  color: selectedFilter === 'all' ? 'white' : 'black',
                }}
              >
                All
              </button>
              {fileTypes.map(type => (
                <button
                  key={type}
                  onClick={() => handleFilterChange(type)}
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

          {/* Sort */}
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
                Size (Large)
              </button>
              <button
                onClick={() => handleSortChange('lines-desc')}
                style={{
                  ...styles.sortButton,
                  backgroundColor: sortBy === 'lines-desc' ? '#4CAF50' : '#e0e0e0',
                  color: sortBy === 'lines-desc' ? 'white' : 'black',
                }}
              >
                Lines (High)
              </button>
            </div>
          </div>

          {/* Search */}
          <div style={styles.searchFilesSection}>
            <h3>Search Files:</h3>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Type filename..."
              style={styles.searchInput}
            />
            {searchQuery && (
              <p style={styles.searchResults}>
                Found {displayFiles.length} file(s)
              </p>
            )}
          </div>

          {/* Files */}
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
                    <p>Lines: {file.lines || 0}</p>
                    <p>Size: {((file.size || 0) / 1024).toFixed(2)} KB</p>
                  </div>
                ))}
              </div>

              {selectedFile && (
                <FileDetails file={selectedFile} />
              )}
            </div>
          )}

          {displayFiles.length === 0 && allFiles.length > 0 && (
            <div style={styles.noResultsBox}>
              <p>No files found matching your search.</p>
            </div>
          )}
        </div>
      )}

      {/* Empty */}
      {!loading && allFiles.length === 0 && !error && (
        <div style={styles.emptyBox}>
          <h2>Ready to explore</h2>
          <p>Enter folder path and click Search</p>
        </div>
      )}
    </div>
  );
}

// Styles
const styles = {
  container: {
    maxWidth: '1400px',
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

  viewToggle: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },

  toggleButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '13px',
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
    marginTop: '10px',
  },

  filterButton: {
    padding: '8px 15px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
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
    marginTop: '10px',
  },

  sortButton: {
    padding: '8px 15px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },

  searchFilesSection: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    marginBottom: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },

  searchInput: {
    width: '100%',
    padding: '12px',
    fontSize: '14px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    marginTop: '10px',
    boxSizing: 'border-box',
  },

  searchResults: {
    marginTop: '10px',
    color: '#666',
    fontSize: '13px',
  },

  filesContainer: {
    marginBottom: '30px',
  },

  filesList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
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

  fullPath: {
    marginTop: '10px',
    color: '#666',
    fontFamily: 'monospace',
    fontSize: '13px',
    wordBreak: 'break-all',
  },

  noResultsBox: {
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '8px',
    textAlign: 'center',
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