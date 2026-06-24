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

IGNORE_DIRS = {
    '.git', 'node_modules', '__pycache__', '.venv', 'venv', 'env', '.env',
    '.next', 'dist', 'build', '.idea', '.vscode', '.pytest_cache', 'egg-info',
    '.egg-info', 'site-packages', '.cache', 'target', 'out', 'bin', 'obj',
    'Debug', 'Release', '.gradle', '.m2', '.DS_Store', '.sass-cache',
    'bower_components', 'vendor', 'coverage', 'htmlcov', '.tox',
}

IGNORE_EXTENSIONS = {
    '.exe', '.dll', '.so', '.dylib', '.pyc', '.pyo', '.class',
    '.o', '.a', '.lib', '.obj', '.lock',
}

MAX_DEPTH = 8
MAX_FILES = 500

def should_ignore_dir(dirname):
    return dirname in IGNORE_DIRS

def should_ignore_file(filename):
    if filename.startswith('.'):
        return True
    ext = Path(filename).suffix.lower()
    return ext in IGNORE_EXTENSIONS

def get_file_type(filename):
    ext = Path(filename).suffix.lower()
    types = {
        'py': 'Python', 'js': 'JavaScript', 'jsx': 'JavaScript', 'ts': 'TypeScript',
        'tsx': 'TypeScript', 'java': 'Java', 'cpp': 'C++', 'c': 'C', 'h': 'C Header',
        'html': 'HTML', 'css': 'CSS', 'scss': 'SCSS', 'json': 'JSON', 'xml': 'XML',
        'yaml': 'YAML', 'yml': 'YAML', 'sql': 'SQL', 'rb': 'Ruby', 'go': 'Go',
        'rs': 'Rust', 'php': 'PHP', 'sh': 'Shell', 'bat': 'Batch',
        'md': 'Markdown', 'txt': 'Text', 'pdf': 'PDF', 'doc': 'Word', 'docx': 'Word',
        'xls': 'Excel', 'xlsx': 'Excel', 'mp4': 'Video', 'avi': 'Video', 'mov': 'Video',
        'mkv': 'Video', 'mp3': 'Audio', 'wav': 'Audio', 'flac': 'Audio',
        'jpg': 'Image', 'jpeg': 'Image', 'png': 'Image', 'gif': 'Image', 'svg': 'Image',
        'ico': 'Image', 'zip': 'Archive', 'rar': 'Archive', '7z': 'Archive',
        'tar': 'Archive', 'gz': 'Archive',
    }
    return types.get(ext, 'Other')

def build_tree(path: str, parent_id: str = "", depth: int = 0, file_count: list = None):
    """Build hierarchical folder and file structure"""
    
    if file_count is None:
        file_count = [0]
    
    if depth >= MAX_DEPTH or file_count[0] >= MAX_FILES:
        return None
    
    path_obj = Path(path)
    
    if not path_obj.exists() or not path_obj.is_dir():
        return None
    
    try:
        items = sorted(path_obj.iterdir(), key=lambda x: (not x.is_dir(), x.name))
    except PermissionError:
        return None
    
    children = []
    file_count_in_folder = 0
    
    for item in items:
        if file_count[0] >= MAX_FILES:
            break
        
        if item.name.startswith('.'):
            continue
        
        item_id = str(file_count[0])
        
        if item.is_dir():
            if not should_ignore_dir(item.name):
                subfolder = build_tree(str(item), item_id, depth + 1, file_count)
                if subfolder:
                    children.append(subfolder)
        else:
            if not should_ignore_file(item.name):
                try:
                    file_size = item.stat().st_size
                    if file_size > 50 * 1024 * 1024:
                        continue
                    
                    lines = 0
                    try:
                        with open(item, 'r', encoding='utf-8', errors='ignore') as f:
                            lines = len(f.readlines())
                    except:
                        pass
                    
                    file_node = {
                        "id": item_id,
                        "name": item.name,
                        "type": "file",
                        "fileType": get_file_type(item.name),
                        "lines": lines,
                        "size": file_size,
                        "path": str(item),
                    }
                    children.append(file_node)
                    file_count[0] += 1
                    file_count_in_folder += 1
                except:
                    pass
    
    node = {
        "id": parent_id if parent_id else "root",
        "name": path_obj.name or "Root",
        "type": "folder",
        "path": str(path_obj),
        "fileCount": file_count_in_folder,
        "children": children,
    }
    
    return node

def scan_directory(path: str):
    """Scan directory and return hierarchical structure"""
    path_obj = Path(path)
    
    if not path_obj.exists():
        return {"error": "Path does not exist", "tree": None}
    
    if not path_obj.is_dir():
        return {"error": "Path is not a directory", "tree": None}
    
    try:
        tree = build_tree(path)
        return {
            "tree": tree,
            "root": str(path_obj),
            "error": None
        }
    except Exception as e:
        return {"error": str(e), "tree": None}

@app.post("/api/scan")
async def scan_repo(repo_path: str = "."):
    result = scan_directory(repo_path)
    return result

@app.get("/api/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)