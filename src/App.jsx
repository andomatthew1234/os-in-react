import React, { useState } from 'react';
import styles from './App.module.css';
import TopMenuBar from './components/TopMenuBar';
import Dock from './components/Dock';
import WindowContainer from './components/WindowContainer';
import { APPS } from './constants/apps';

export default function App() {
  const [windows, setWindows] = useState([]);
  const [focusedWindowId, setFocusedWindowId] = useState(null);

  const bringToFront = (id) => {
    setFocusedWindowId(id);
    setWindows(prev => {
      const maxZ = Math.max(0, ...prev.map(w => w.zIndex));
      return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w);
    });
  };

  const openWindow = (appId) => {
    const app = APPS.find(a => a.id === appId);
    const id = `win-${Date.now()}`;
    const maxZ = Math.max(0, ...windows.map(w => w.zIndex));
    
    const newWindow = {
      id,
      appId,
      title: app.name,
      x: window.innerWidth / 2 - 250 + (windows.length * 20),
      y: window.innerHeight / 2 - 150 + (windows.length * 20),
      width: 500,
      height: 350,
      zIndex: maxZ + 1
    };
    
    setWindows(prev => [...prev, newWindow]);
    setFocusedWindowId(id);
  };

  const closeWindow = (id) => {
    setWindows(prev => prev.filter(w => w.id !== id));
  };

  const quitApp = (appId) => {
    setWindows(prev => prev.filter(w => w.appId !== appId));
    
    // Clear focus if the focused window belonged to the closed app
    const focusedWindow = windows.find(w => w.id === focusedWindowId);
    if (focusedWindow && focusedWindow.appId === appId) {
      setFocusedWindowId(null);
    }
  };

  const updateWindowPosition = (id, x, y) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y } : w));
  };

  const focusedApp = windows.find(w => w.id === focusedWindowId);
  const focusedAppTitle = focusedApp?.title || 'Finder';
  const focusedAppId = focusedApp?.appId || 'finder';

  return (
    <div className={styles.desktop}>
      <TopMenuBar 
        focusedAppTitle={focusedAppTitle} 
        focusedAppId={focusedAppId} 
        quitApp={quitApp} 
      />
      <WindowContainer
        windows={windows}
        focusedWindowId={focusedWindowId}
        bringToFront={bringToFront}
        closeWindow={closeWindow}
        updateWindowPosition={updateWindowPosition}
      />
      <Dock 
        windows={windows} 
        openWindow={openWindow} 
        bringToFront={bringToFront} 
        quitApp={quitApp}
      />
    </div>
  );
}