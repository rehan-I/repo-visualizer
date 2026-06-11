from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def scan_directory(path: str):
    """Scan directory and create node/edge structure"""
    path_obj = Path(path)
    
    if not path_obj.exists():
        return {"error": "Path does not exist"}
    
    nodes = []
    node_id = 0
    
    ignore_dirs = {'.git', 'node_modules', '__pycache__', '.env', 'venv', '.next', 'dist', '.idea', '.vscode'}
    
    for root, dirs, files in os.walk(path_obj):
        dirs[:] = [d for d in dirs if d not in ignore_dirs]
        
        for file in files:
            if file.startswith('.'):
                continue
                
            file_path = Path(root) / file
            
            try:
                file_size = file_path.stat().st_size
                lines = 0
                try:
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        lines = len(f.readlines())
                except:
                    pass
                
                relative_path = file_path.relative_to(path_obj)
                
                nodes.append({
                    "id": str(node_id),
                    "label": file,
                    "path": str(relative_path),
                    "size": file_size,
                    "lines": lines,
                    "type": "file"
                })
                
                node_id += 1
            except Exception as e:
                print(f"Error processing {file}: {e}")
    
    return {
        "nodes": nodes,
        "edges": [],
        "total_files": len(nodes)
    }

@app.post("/api/scan")
async def scan_repo(repo_path: str = "."):
    """Scan a repository and return structure"""
    result = scan_directory(repo_path)
    return result

@app.get("/api/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Backend is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)