import React, { useState } from 'react';
import styles from './Dock.module.css';
import HoverPreview from './HoverPreview';
import { APPS } from '../constants/apps';

export default function Dock({ windows, openWindow, bringToFront, quitApp }) {
  const [hoveredApp, setHoveredApp] = useState(null);
  const [contextMenuApp, setContextMenuApp] = useState(null);

  const handleAppClick = (appId) => {
    const appWindows = windows.filter(w => w.appId === appId);
    if (appWindows.length === 0) {
      openWindow(appId);
    } else {
      bringToFront(appWindows[appWindows.length - 1].id);
    }
    setContextMenuApp(null);
  };

  const handleRightClick = (e, appId) => {
    e.preventDefault();
    setContextMenuApp(appId);
  };

  // Close context menu if hovering away
  const handleMouseLeave = () => {
    setHoveredApp(null);
    setContextMenuApp(null);
  };

  return (
    <div className={styles.dockContainer}>
      <div className={styles.dock}>
        {APPS.map(app => {
          const isActive = windows.some(w => w.appId === app.id);
          const isHovered = hoveredApp === app.id;
          
          return (
            <div
              key={app.id}
              className={styles.dockItemWrapper}
              onMouseEnter={() => setHoveredApp(app.id)}
              onMouseLeave={handleMouseLeave}
            >
              {isHovered && (
                <HoverPreview 
                  app={app} 
                  windows={windows.filter(w => w.appId === app.id)} 
                  bringToFront={bringToFront} 
                />
              )}
              
              {contextMenuApp === app.id && (
                <div className={styles.contextMenu}>
                  <div onClick={(e) => { 
                    e.stopPropagation(); 
                    openWindow(app.id); 
                    setContextMenuApp(null); 
                  }}>
                    New Window
                  </div>
                  {isActive && (
                    <div style={{ color: '#ff3b30' }} onClick={(e) => {
                      e.stopPropagation();
                      quitApp(app.id);
                      setContextMenuApp(null);
                    }}>
                      Quit
                    </div>
                  )}
                </div>
              )}
              
              <div
                className={styles.icon}
                onClick={() => handleAppClick(app.id)}
                onContextMenu={(e) => handleRightClick(e, app.id)}
              >
                {app.icon}
              </div>
              
              {isActive && <div className={styles.activeDot} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}