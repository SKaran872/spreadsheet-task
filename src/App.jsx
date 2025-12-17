import { useState, useMemo, useCallback, memo } from 'react';
import { evaluate } from 'mathjs';
import './App.css';

// --- OPTIMIZATION: Memoized Cell Component ---
// This ensures only the cell being edited re-renders, not the whole grid.
const Cell = memo(({ cellId, cellData, isFocused, onChange, onFocus, onBlur }) => {
  const displayValue = isFocused ? (cellData.formula || "") : (cellData.value || "");
  
  // Dynamic style for errors
  const style = {
    color: (cellData.value === "#CIRCULAR" || cellData.value === "#ERROR") ? "red" : "black"
  };

  return (
    <input
      className="cell-input"
      type="text"
      value={displayValue}
      onChange={(e) => onChange(cellId, e.target.value)}
      onFocus={() => onFocus(cellId)}
      onBlur={() => onBlur(cellId)}
      style={style}
    />
  );
});

function App() {
  // Dynamic Grid Sizes
  const [cols, setCols] = useState(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]);
  const [rows, setRows] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

  // Data State
  const [cells, setCells] = useState({});
  const [focusedCell, setFocusedCell] = useState(null);

  // Undo/Redo History Stack
  const [history, setHistory] = useState([{}]); // Start with empty state
  const [historyIndex, setHistoryIndex] = useState(0);

  // --- 1. Math & Cycle Engine (Logic) ---
  const calculateFormula = (formula, currentCells) => {
    if (!formula.toString().startsWith("=")) return formula;
    let expression = formula.substring(1).toUpperCase();
    const cellRefs = expression.match(/[A-Z]+[0-9]+/g) || []; // Updated Regex for larger grids

    for (let cellRef of cellRefs) {
      const cellValue = currentCells[cellRef]?.value || 0;
      if (cellValue === "#ERROR" || cellValue === "#CIRCULAR") return "#ERROR";
      expression = expression.replace(cellRef, cellValue);
    }
    try {
      return evaluate(expression);
    } catch {
      return "#ERROR";
    }
  };

  const hasCircularDependency = (startCell, targetCell, allCells) => {
    if (startCell === targetCell) return true;
    const dependents = allCells[startCell]?.dependencies || [];
    for (let dependent of dependents) {
      if (hasCircularDependency(dependent, targetCell, allCells)) return true;
    }
    return false;
  };

  const updateCellAndDependents = (startCellId, newFormula, allCells) => {
    const parents = newFormula.toString().startsWith("=")
      ? newFormula.toUpperCase().match(/[A-Z]+[0-9]+/g) || []
      : [];

    // Cycle Check
    for (let parent of parents) {
      if (hasCircularDependency(startCellId, parent, allCells)) {
        return { 
          ...allCells, 
          [startCellId]: { value: "#CIRCULAR", formula: newFormula, dependencies: allCells[startCellId]?.dependencies || [] } 
        };
      }
    }

    const computedValue = calculateFormula(newFormula, allCells);
    
    let updatedCells = { 
      ...allCells, 
      [startCellId]: { 
        value: computedValue, 
        formula: newFormula, 
        dependencies: allCells[startCellId]?.dependencies || [] 
      } 
    };

    parents.forEach(parent => {
       if(!updatedCells[parent]) updatedCells[parent] = { value: "", formula: "", dependencies: [] };
       if(!updatedCells[parent].dependencies.includes(startCellId)) {
         updatedCells[parent].dependencies.push(startCellId);
       }
    });

    const children = updatedCells[startCellId].dependencies;
    children.forEach(childId => {
      const childData = updatedCells[childId];
      if (childData) {
        const childResult = updateCellAndDependents(childId, childData.formula, updatedCells);
        updatedCells = { ...updatedCells, ...childResult };
      }
    });

    return updatedCells;
  };

  // --- 2. History Manager (Undo/Redo) ---
  const saveToHistory = (newCells) => {
    // If we are in the middle of the stack (did undo), chop off the future
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCells);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCells(history[historyIndex - 1]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCells(history[historyIndex + 1]);
    }
  };

  // --- 3. Interaction Handlers ---
  
  // Use useCallback to keep reference stable for memoized children
  const handleInputChange = useCallback((cellId, text) => {
    setCells(prev => ({
      ...prev,
      [cellId]: { ...prev[cellId], formula: text, value: text }
    }));
  }, []);

  const handleBlur = useCallback((cellId) => {
    setFocusedCell(null);
    setCells((currentCells) => {
      const formula = currentCells[cellId]?.formula || "";
      const finalState = updateCellAndDependents(cellId, formula, currentCells);
      
      // Save to History only on Blur (Commit)
      saveToHistory(finalState);
      return finalState;
    });
  }, [history, historyIndex]); // Dependencies for history

  const handleFocus = useCallback((cellId) => {
    setFocusedCell(cellId);
  }, []);

  // --- 4. Dynamic Grid Helpers ---
  const addColumn = () => {
    const nextChar = String.fromCharCode(65 + cols.length); // A, B, C...
    setCols([...cols, nextChar]);
  };

  const addRow = () => {
    setRows([...rows, rows.length + 1]);
  };

  return (
    <div className="app-container">
      <h1>Spreadsheet Project</h1>
      
      <div className="toolbar">
        <button onClick={handleUndo} disabled={historyIndex === 0}>↩ Undo</button>
        <button onClick={handleRedo} disabled={historyIndex === history.length - 1}>↪ Redo</button>
        <button onClick={addColumn}>+ Add Column</button>
        <button onClick={addRow}>+ Add Row</button>
      </div>

      <div 
        className="spreadsheet-grid"
        // Dynamically set columns based on 'cols' state
        style={{ gridTemplateColumns: `50px repeat(${cols.length}, 100px)` }}
      >
        <div className="header-col"></div>
        {cols.map((col) => <div key={col} className="header-col">{col}</div>)}
        
        {rows.map((row) => (
          <>
            <div key={row} className="header-row">{row}</div>
            {cols.map((col) => {
              const cellId = `${col}${row}`;
              return (
                <Cell 
                  key={cellId}
                  cellId={cellId}
                  cellData={cells[cellId] || {}}
                  isFocused={focusedCell === cellId}
                  onChange={handleInputChange}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
              );
            })}
          </>
        ))}
      </div>
    </div>
  );
}

export default App;