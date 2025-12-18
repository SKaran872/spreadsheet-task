# React Spreadsheet Engine

A high-performance, functional spreadsheet application built with React. This project implements a reactive calculation engine capable of handling formulas, cell dependencies, and circular reference detection, similar to Excel or Google Sheets.

## 🔗 Live Demo
 https://spreadsheet-task-sub.netlify.app/

---

## 🚀 Features

### Core Functionality
- **Formula Evaluation:** Supports mathematical expressions using standard operators (e.g., `=A1+B2*3`).
- **Dependency Graph:** Automatically updates downstream cells when a referenced cell changes (e.g., updating `A1` triggers updates in `B1` and `C1`).
- **Cycle Detection:** Implements a Depth-First Search (DFS) algorithm to detect and block circular references (e.g., `A1` referencing `B1` referencing `A1`) to prevent infinite loops.
- **Error Handling:** Gracefully handles invalid formulas and errors with clear indicators (`#ERROR`, `#CIRCULAR`).

### 🏆 Bonus Features (Completed)
- **Time Travel (Undo/Redo):** Complete history stack allows users to undo and redo changes state-by-state.
- **Dynamic Grid:** Users can extend the grid dynamically by adding columns and rows beyond the default size.
- **Performance Optimization:** Implemented `React.memo` and `useCallback` to ensure only affected cells re-render, optimizing performance for larger grids.

---

## 🛠️ Tech Stack
- **Frontend:** React, Vite
- **Logic:** Custom Graph algorithms for dependency resolution
- **Math Library:** `mathjs` (for safe expression parsing)
- **Styling:** CSS3 (Grid & Flexbox)

---

## ⚙️ Installation & Running

Follow these steps to run the project locally:

1. **Clone the repository:**
   ```bash
   git clone <YOUR_GITHUB_REPO_LINK>
   cd spreadsheet-task
