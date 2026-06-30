# Repository Structure Analysis and Visualization System


A comprehensive tool to analyze, visualize, and understand complex codebases by detecting file relationships, showing dependency graphs, and providing AI-powered code explanations. 

---

## Features

* **Interactive Visualization:** Explore your codebase using a drag-and-drop React Flow canvas that displays files grouped by their folder structure.
* **Relationship Detection:** Automatically extracts and visualizes dependencies across 40+ languages (e.g., Python `import`, C++ `#include`) without executing the code.
* **AI Code Explanations:** Click on any file to instantly generate a plain-English summary of its function using Google Gemini AI.
* **File Metrics:** Quickly spot complex files with on-node displays of Lines of Code (LOC), file size, and file type.
* **Smart Explorer:** Toggle to an explorer view for real-time search by filename, type filtering, and sorting.

---

##  Tech Stack

* **Backend:** Python 3.8+, FastAPI, Uvicorn, Google Genai.
* **Frontend:** React 18.2+, React Flow, Axios.

---

## Getting Started

### Prerequisites
* Python 3.8 or higher.
* Node.js 14+ and npm.
* A free Google Gemini API key.

## Installation instructions
 
### Backend Setup
 
```bash
cd backend
 
# Create virtual environment
python -m venv venv
 
# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
 
# Install dependencies
pip install -r requirements.txt
```
 
### Frontend Setup
 
```bash
cd ../frontend
 
# Install dependencies
npm install
```
 
### Configure API Key
 
Create `backend/.env`:
```
GOOGLE_API_KEY=your_api_key_here
```
 
Get your free API key from: https://aistudio.google.com/app/apikey
 
---
 
## Running the Application
 
### Terminal 1: Start Backend
 
```bash
cd backend
venv\Scripts\activate
python main.py
```
 
**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```
 
### Terminal 2: Start Frontend
 
```bash
cd frontend
npm start
```
 
**Expected output:**
```
Compiled successfully!
Local: http://localhost:3000
```
 
Open browser: **http://localhost:3000**
 
---
 
## How to Use
 
1. **Scan a Repository:** Enter folder path and click "Scan"
   - Windows: `D:\my-project` or `D:\`
   - Linux/Mac: `/home/user/projects` or `.`
2. **View Visualization:** Click "Visualization" tab
   - Orange = Folders
   - Colored = Files (color = language type)
   - Drag nodes, zoom with +/-, click files for details
3. **Check Imports:** Scroll to "Imports & Includes Found" panel
   - Shows what each file imports
   - Format: `[LANGUAGE] importName`
   - Example: `[PYTHON] import numpy` or `[JAVASCRIPT] import react`
4. **Get AI Explanations:** Click any file → Click "Explain with AI"
   - Get instant 2-3 sentence summary
   - Works for all 40+ languages
5. **Search & Filter:** Click "Explorer" tab
   - Real-time search by filename
   - Filter by file type
   - Sort by name, size, or LOC
---
 
## Supported Languages
 
Python, JavaScript, TypeScript, C/C++, Java, Go, Ruby, PHP, Rust, HTML, CSS, JSON, Markdown, and 25+ more languages.
 
---
 
## Configuration
 
### Backend Settings (`backend/main.py`)
 
```python
MAX_DEPTH = 10                    # Maximum folder depth
IGNORE_DIRS = {'.git', 'node_modules', '__pycache__', ...}
IGNORE_EXTENSIONS = {'.exe', '.dll', '.pyc', ...}
```
 
### Frontend Settings (`frontend/src/App.js`)
 
```javascript
const API_BASE = 'http://localhost:8000';
```
 
---
 
## Testing
 
### Test Case 1: Basic Scanning
```
Scan folder → Verify structure loads correctly
```
 
### Test Case 2: Visualization
```
- Zoom with +/- buttons
- Drag nodes around
- Verify no overlapping
- Click MiniMap
```
 
### Test Case 3: File Details
```
- Click file node
- Check name, path, type, LOC, size
- Click "Explain with AI"
- Verify 2-3 sentence explanation
```
 
### Test Case 4: Import Detection
```
- Scan Python project → See [PYTHON] imports
- Scan C++ project → See [C++] includes
- Scan JS project → See [JAVASCRIPT] imports
```
 
### Test Case 5: Explorer View
```
- Search filename → Real-time filtering
- Filter by type → Show only that type
- Sort by name/LOC → Proper sorting
```
 
---
 

 
## Additional Features

- **Automatic tree layout** - Prevents node overlap even with 1000+ files
- **Efficient scanning** - 500ms-2s for typical projects
- **Error handling** - Graceful failures with user messages
- **Input validation** - Path validation, safe file reading
- **Keyboard shortcuts** - Zoom, pan, deselect
- **Responsive UI** - Works on different screen sizes
- **Professional styling** - Clean, modern interface

 
## Demo Video:
- **Google drive link** - https://drive.google.com/file/d/1mNb3cRCFiL1_iOFIul77dzMRLu1us66_/view?usp=sharing
