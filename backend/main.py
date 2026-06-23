from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Folders to ignore
IGNORE_DIRS = {
    '.git', 'node_modules', '__pycache__', '.venv', 'venv', 'env', '.env',
    '.next', 'dist', 'build', '.idea', '.vscode', '.pytest_cache', 'egg-info',
    '.egg-info', 'site-packages', '.cache', 'target', 'out', 'bin', 'obj',
    'Debug', 'Release', '.gradle', '.m2', 'node_modules_backup', '.DS_Store',
    '.sass-cache', 'bower_components', 'vendor', 'coverage', 'htmlcov', '.tox',
}

# File extensions to ignore

IGNORE_EXTENSIONS = {
    '.exe', '.dll', '.so', '.dylib', '.pyc', '.pyo', '.class',
    '.o', '.a', '.lib', '.obj', '.lock',
}

MAX_FILES = 5000
MAX_SCAN_DEPTH = 10

def should_ignore_dir(dirname):
    return dirname in IGNORE_DIRS

def should_ignore_file(filename):
    if filename.startswith('.'):
        return True
    ext = Path(filename).suffix.lower()
    if ext in IGNORE_EXTENSIONS:
        return True
    return False

def get_file_type(filename):
    ext = Path(filename).suffix.lower()
    types = {
        '.py': 'Python',
        '.js': 'JavaScript',
        '.jsx': 'JavaScript',
        '.ts': 'TypeScript',
        '.tsx': 'TypeScript',
        '.java': 'Java',
        '.cpp': 'C++',
        '.c': 'C',
        '.h': 'C Header',
        '.html': 'HTML',
        '.css': 'CSS',
        '.scss': 'SCSS',
        '.json': 'JSON',
        '.xml': 'XML',
        '.yaml': 'YAML',
        '.yml': 'YAML',
        '.md': 'Markdown',
        '.txt': 'Text',
        '.sql': 'SQL',
        '.rb': 'Ruby',
        '.go': 'Go',
        '.rs': 'Rust',
        '.php': 'PHP',
        '.sh': 'Shell',
        '.bat': 'Batch',
    }
    return types.get(ext, 'Other')

def scan_directory(path: str):
    """Scan directory and return file list"""
    path_obj = Path(path)
    
    if not path_obj.exists():
        return {"error": "Path does not exist", "nodes": [], "edges": []}
    
    if not path_obj.is_dir():
        return {"error": "Path is not a directory", "nodes": [], "edges": []}
    
    nodes = []
    node_id = 0
    scanned_files = 0
    
    try:
        for root, dirs, files in os.walk(path_obj):
            depth = len(Path(root).relative_to(path_obj).parts)
            if depth > MAX_SCAN_DEPTH:
                continue
            
            dirs[:] = [d for d in dirs if not should_ignore_dir(d)]
            
            if scanned_files >= MAX_FILES:
                break
            
            for file in files:
                if scanned_files >= MAX_FILES:
                    break
                
                if should_ignore_file(file):
                    continue
                
                file_path = Path(root) / file
                
                try:
                    stat = file_path.stat()
                    file_size = stat.st_size
                    
                    if file_size > 50 * 1024 * 1024:
                        continue
                    
                    lines = 0
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = len(f.readlines())
                    except:
                        pass
                    
                    relative_path = file_path.relative_to(path_obj)
                    
                    node = {
                        "id": str(node_id),
                        "label": file,
                        "path": str(relative_path).replace('\\', '/'),
                        "size": file_size,
                        "lines": lines,
                        "type": get_file_type(file),
                        "full_path": str(file_path)
                    }
                    
                    nodes.append(node)
                    node_id += 1
                    scanned_files += 1
                    
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
                    continue
    
    except Exception as e:
        return {"error": f"Error scanning directory: {str(e)}", "nodes": [], "edges": []}
    
    return {
        "nodes": nodes,
        "edges": [],
        "total_files": len(nodes),
        "scanned_files": scanned_files,
        "max_reached": scanned_files >= MAX_FILES
    }

@app.post("/api/scan")
async def scan_repo(repo_path: str = "."):
    """Scan a repository"""
    result = scan_directory(repo_path)
    return result



@app.get("/api/health")
async def health():
    return {"status": "healthy", "message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)