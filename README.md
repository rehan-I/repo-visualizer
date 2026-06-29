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

## How It Works
### Backend Architecture
The Python backend uses static analysis to scan your files and automatically extract dependency declarations (like import or #include) without executing any code. It also manages requests to the Google Gemini API to generate instant, plain-English summaries of your code.  
### Frontend Interface
The React frontend transforms the backend data into an interactive, drag-and-drop React Flow canvas. It visualizes your folder structure and file dependencies with color-coded nodes and connecting lines, allowing you to click any file to view its metrics and AI-generated explanation.  

---

##  Usage

* Start the backend server from the backend directory using `python main.py` (runs on `http://0.0.0.0:8000`).
* Start the frontend development server from the frontend directory using `npm start` (runs on `http://localhost:3000`).
* Open your browser, enter a local folder path (e.g., `.`), and click "Scan" to generate your codebase visualization.

