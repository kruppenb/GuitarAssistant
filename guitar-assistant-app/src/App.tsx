'use client';

import { useState } from 'react';
import { TabViewer } from './components/TabViewer/TabViewer';
import type { Tab } from './models/Tab';
import './App.css';

function App() {
  const [tab, setTab] = useState<Tab | null>(null);
  
  const handleLoadSample = async () => {
    try {
      const response = await fetch('/golden.json');
      if (!response.ok) {
        throw new Error('Failed to load sample tab');
      }
      const tabData = await response.json();
      setTab(tabData);
    } catch (error) {
      console.error('Error loading sample tab:', error);
      alert('Failed to load sample tab. Make sure golden.json is in the public folder.');
    }
  };
  
  const handleReset = () => {
    setTab(null);
  };
  
  return (
    <div className="app">
      <header className="app-header">
        <h1>🎸 Guitar Assistant</h1>
        <p className="subtitle">Learn guitar tabs with auto-scrolling and finger positions</p>
      </header>
      
      <main className="app-main">
        {tab ? (
          <>
            <button onClick={handleReset} className="reset-btn">
              ← Load Different Tab
            </button>
            <TabViewer tab={tab} />
          </>
        ) : (
          <div className="upload-container">
            <button onClick={handleLoadSample} className="sample-btn">
              Load Sample Tab (Golden)
            </button>
          </div>
        )}
      </main>
      
      <footer className="app-footer">
        <p>
          <strong>Controls:</strong> Use the play/pause button to auto-scroll. 
          Adjust speed from 25% to 200%. Use the position slider to jump to any measure.
        </p>
        <p className="finger-legend">
          <strong>Finger Colors:</strong> 
          <span style={{ color: '#3b82f6' }}>● 1 (Index)</span>
          <span style={{ color: '#10b981' }}>● 2 (Middle)</span>
          <span style={{ color: '#f59e0b' }}>● 3 (Ring)</span>
          <span style={{ color: '#ef4444' }}>● 4 (Pinky)</span>
        </p>
      </footer>
    </div>
  );
}

export default App;
