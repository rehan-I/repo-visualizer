from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

# Initialize FastAPI app FIRST
app = FastAPI()

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


import google.generativeai as genai


# Constants
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

MAX_DEPTH = 10

# Global state
class IDGenerator:
    def __init__(self):
        self.counter = 0
    
    def get_id(self):
        current = self.counter
        self.counter += 1
        return str(current)

id_gen = IDGenerator()
file_map = {}  # Maps filename -> {id, path}
all_files = {}  # Maps id -> {name, path, type}

# Helper functions
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

def extract_dependencies(file_path: Path):
    """Extract imports/includes from a file"""
    dependencies = []
    
    
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read(5000)  # Read first 5000 chars

    
    # Python imports - import x, from x import y
    if file_path.suffix.lower() == '.py':
        # import module
        import_pattern = r'^import\s+([\w.]+)'
        for match in re.finditer(import_pattern, content, re.MULTILINE):
            module = match.group(1).split('.')[0]
            dependencies.append(module)
        
        # from module import x
        from_pattern = r'^from\s+([\w.]+)\s+import'
        for match in re.finditer(from_pattern, content, re.MULTILINE):
            module = match.group(1).split('.')[0]
            dependencies.append(module)
    
    # C/C++ includes - #include "file.h" or #include <file.h>
    if file_path.suffix.lower() in ['.cpp', '.cc', '.cxx', '.c', '.h', '.hpp']:
        # #include "filename"
        include_pattern = r'#include\s*[<"]([^>"]+)[>"]'
        for match in re.finditer(include_pattern, content):
            include_file = match.group(1)
            dependencies.append(include_file)
    
    # JavaScript/TypeScript imports
    if file_path.suffix.lower() in ['.js', '.jsx', '.ts', '.tsx']:
        # import x from 'y'
        js_import = r"import\s+.*?\s+from\s+['\"]([^'\"]+)['\"]"
        for match in re.finditer(js_import, content):
            dependencies.append(match.group(1))
        
        # require('x')
        require_pattern = r"require\s*\(\s*['\"]([^'\"]+)['\"]\s*\)"
        for match in re.finditer(require_pattern, content):
            dependencies.append(match.group(1))
    
    return list(set(dependencies))  # Remove duplicates

def scan_directory(path: str):
    """Scan directory and return hierarchical structure with dependencies"""
    global id_gen, file_map, all_files
    
    id_gen = IDGenerator()
    file_map = {}
    all_files = {}
    
    path_obj = Path(path)
    
    if not path_obj.exists():
        return {"error": "Path does not exist", "tree": None, "dependencies": []}
    
    if not path_obj.is_dir():
        return {"error": "Path is not a directory", "tree": None, "dependencies": []}
    
    try:
        tree = build_tree(path)
        dependencies = find_dependencies_in_tree(tree) if tree else []
        
        # DEBUG: Print what we found
        print(f"\n=== DEPENDENCY SCAN RESULTS ===")
        print(f"Files found: {len(file_map)}")
        print(f"File map: {file_map}")
        print(f"Dependencies found: {len(dependencies)}")
        if dependencies:
            print(f"Dependencies: {dependencies}")
        print(f"==============================\n")
        
        return {
            "tree": tree,
            "dependencies": dependencies,
            "root": str(path_obj),
            "error": None
        }
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e), "tree": None, "dependencies": []}
    
def build_tree(path: str, depth: int = 0):
    """Build hierarchical folder and file structure"""
    global id_gen, file_map, all_files
    
    if depth >= MAX_DEPTH:
        return None
    
    path_obj = Path(path)
    
    if not path_obj.exists() or not path_obj.is_dir():
        return None
    
    try:
        items = sorted(path_obj.iterdir(), key=lambda x: (not x.is_dir(), x.name))
    except PermissionError:
        return None
    
    folder_id = id_gen.get_id()
    children = []
    
    for item in items:
        if item.name.startswith('.'):
            continue
        
        if item.is_dir():
            if not should_ignore_dir(item.name):
                subfolder = build_tree(str(item), depth + 1)
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
                    
                    file_id = id_gen.get_id()
                    file_type = get_file_type(item.name)
                    dependencies = extract_dependencies(item)
                    
                    file_node = {
                        "id": file_id,
                        "name": item.name,
                        "type": "file",
                        "fileType": file_type,
                        "lines": lines,
                        "size": file_size,
                        "path": str(item),
                        "dependencies": dependencies,
                    }
                    
                    # Store file info for dependency matching
                    file_map[item.name] = {
                        "id": file_id,
                        "path": str(item)
                    }
                    all_files[file_id] = {
                        "name": item.name,
                        "path": str(item),
                        "type": file_type
                    }
                    
                    children.append(file_node)
                except:
                    pass
    
    folder_node = {
        "id": folder_id,
        "name": path_obj.name or "Root",
        "type": "folder",
        "path": str(path_obj),
        "children": children,
    }
    
    return folder_node

def find_dependencies_in_tree(node):
    """Find actual file dependencies in the tree and create edges"""
    dependencies = []
    
    # If this is a file with dependencies
    if node.get('type') == 'file' and node.get('dependencies'):
        from_id = node['id']
        
        for dep in node['dependencies']:
            # Try to find matching file
            dep_lower = dep.lower()
            
            # Direct match: look for exact filename
            for fname, info in file_map.items():
                fname_lower = fname.lower()
                
                # Check if dependency matches this file
                if (dep_lower == fname_lower or 
                    dep_lower == fname_lower.replace('.py', '') or
                    dep_lower == fname_lower.replace('.js', '') or
                    dep_lower == fname_lower.replace('.ts', '') or
                    dep_lower == fname_lower.replace('.h', '') or
                    dep_lower == fname_lower.replace('.cpp', '') or
                    dep_lower in fname_lower or
                    fname_lower.startswith(dep_lower)):
                    
                    to_id = info['id']
                    
                    # Don't create self-loops
                    if from_id != to_id:
                        dependencies.append({
                            "from": from_id,
                            "to": to_id,
                            "label": dep
                        })
                    break
    
    # Recursively check children
    if node.get('children'):
        for child in node['children']:
            dependencies.extend(find_dependencies_in_tree(child))
    
    return dependencies

def scan_directory(path: str):
    """Scan directory and return hierarchical structure with dependencies"""
    global id_gen, file_map, all_files
    
    id_gen = IDGenerator()
    file_map = {}
    all_files = {}
    
    path_obj = Path(path)
    
    if not path_obj.exists():
        return {"error": "Path does not exist", "tree": None, "dependencies": []}
    
    if not path_obj.is_dir():
        return {"error": "Path is not a directory", "tree": None, "dependencies": []}
    
    try:
        tree = build_tree(path)
        dependencies = find_dependencies_in_tree(tree) if tree else []
        
        return {
            "tree": tree,
            "dependencies": dependencies,
            "root": str(path_obj),
            "error": None
        }
    except Exception as e:
        print(f"Error: {e}")
        return {"error": str(e), "tree": None, "dependencies": []}

# API Routes
@app.post("/api/scan")
async def scan_repo(repo_path: str = "."):
    """Scan a repository"""
    result = scan_directory(repo_path)
    return result

@app.post("/api/ai-explain")
async def explain_file(file_path: str):
    """Get AI explanation of a file"""
    
   
    
    api_key = os.getenv('GOOGLE_API_KEY')
    
    
    try:
        path_obj = Path(file_path)
        if not path_obj.exists() or not path_obj.is_file():
            return {"error": "File not found", "success": False}
        
        with open(path_obj, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read(2000)
        
        if not content.strip():
            return {"explanation": "File is empty or binary", "success": True}
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-3.5-flash')
        
        prompt = f"""Explain what this code file does in 2-3 simple sentences.
Be brief and non-technical. Focus on PURPOSE.

File: {path_obj.name}

Code:
{content}

Explanation:"""
        

        
        response = model.generate_content(prompt)
        
        return {
            "explanation": response.text,
            "file": path_obj.name,
            "success": True
        }
    
    except Exception as e:
        print(f"AI Error: {e}")
        return {
            "error": str(e),
            "explanation": "Could not generate explanation",
            "success": False
        }

@app.get("/api/health")
async def health():
    """Health check"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)