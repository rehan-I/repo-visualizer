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

# Import AI (optional)
try:
    import google.generativeai as genai
except ImportError:
    genai = None

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
        self.counter += 1
        return str(self.counter - 1)

id_gen = IDGenerator()
file_map = {}

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
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
    except:
        return dependencies
    
    # Python imports
    if file_path.suffix.lower() == '.py':
        import_pattern = r'^import\s+([\w.]+)'
        for match in re.finditer(import_pattern, content, re.MULTILINE):
            module = match.group(1).split('.')[0]
            dependencies.append(module)
        
        from_pattern = r'^from\s+([\w.]+)\s+import'
        for match in re.finditer(from_pattern, content, re.MULTILINE):
            module = match.group(1).split('.')[0]
            dependencies.append(module)
    
    # C++ includes
    if file_path.suffix.lower() in ['.cpp', '.cc', '.cxx', '.c', '.h', '.hpp']:
        include_pattern = r'#include\s+"([^"]+)"'
        for match in re.finditer(include_pattern, content):
            dependencies.append(match.group(1))
    
    return list(set(dependencies))

def build_tree(path: str, depth: int = 0):
    """Build hierarchical folder and file structure"""
    global id_gen, file_map
    
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
                    dependencies = extract_dependencies(item)
                    
                    file_node = {
                        "id": file_id,
                        "name": item.name,
                        "type": "file",
                        "fileType": get_file_type(item.name),
                        "lines": lines,
                        "size": file_size,
                        "path": str(item),
                        "dependencies": dependencies,
                    }
                    
                    file_map[item.name] = {
                        "id": file_id,
                        "path": str(item)
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
    """Find actual file dependencies in the tree"""
    dependencies = []
    
    if node.get('type') == 'file' and node.get('dependencies'):
        for dep in node['dependencies']:
            for fname, info in file_map.items():
                if dep.lower() in fname.lower() or fname.lower().startswith(dep.lower()):
                    dependencies.append({
                        "from": node['id'],
                        "to": info['id'],
                        "label": dep
                    })
                    break
    
    if node.get('children'):
        for child in node['children']:
            dependencies.extend(find_dependencies_in_tree(child))
    
    return dependencies

def scan_directory(path: str):
    """Scan directory and return hierarchical structure"""
    global id_gen, file_map
    id_gen = IDGenerator()
    file_map = {}
    
    path_obj = Path(path)
    
    if not path_obj.exists():
        return {"error": "Path does not exist", "tree": None}
    
    if not path_obj.is_dir():
        return {"error": "Path is not a directory", "tree": None}
    
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
        return {"error": str(e), "tree": None}

# API Routes
@app.post("/api/scan")
async def scan_repo(repo_path: str = "."):
    """Scan a repository"""
    result = scan_directory(repo_path)
    return result

@app.post("/api/ai-explain")
async def explain_file(file_path: str):
    """Get AI explanation of a file"""
    
    if not genai:
        return {
            "error": "genai not installed",
            "explanation": "Install with: pip install google-generativeai",
            "success": False
        }
    
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        return {
            "error": "API key not configured",
            "explanation": "Add GOOGLE_API_KEY to .env file",
            "success": False
        }
    
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