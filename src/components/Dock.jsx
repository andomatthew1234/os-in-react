import { useEffect, useState } from 'react';
import styles from './Dock.module.css';
import HoverPreview from './HoverPreview';
import { APPS, DOCK_ITEMS } from '../constants/apps';
import Loader from './Loader';

export default function Dock({ windows, openWindow, restoreWindow, bringToFront, quitApp, themeMode, dockSettings, toggleLaunchpad, launchpadOpen }) {
  const [hoveredApp, setHoveredApp] = useState(null);
  const [contextMenuApp, setContextMenuApp] = useState(null);
  const [loadedIcons, setLoadedIcons] = useState({});
  const [isDockVisible, setIsDockVisible] = useState(true);
  const dockItems = DOCK_ITEMS.map(item => item.type === 'app'
    ? { ...APPS.find(app => app.id === item.id), type: 'app' }
    : item
  ).filter(Boolean);

  useEffect(() => {
    if (!contextMenuApp) return undefined;

    const closeContextMenu = () => setContextMenuApp(null);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setContextMenuApp(null);
      }
    };

    window.addEventListener('click', closeContextMenu);
    window.addEventListener('contextmenu', closeContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('click', closeContextMenu);
      window.removeEventListener('contextmenu', closeContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [contextMenuApp]);

  useEffect(() => {
    if (!dockSettings?.autoHide) {
      setIsDockVisible(true);
      return undefined;
    }

    const handleMouseMove = (event) => {
      setIsDockVisible(event.clientY >= window.innerHeight - 72);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [dockSettings?.autoHide]);

  const handleAppClick = (appId) => {
    if (appId === 'launchpad') {
      toggleLaunchpad();
      setContextMenuApp(null);
      return;
    }

    const appWindows = windows.filter(w => w.appId === appId);
    const visibleWindows = appWindows.filter(w => !w.minimized);
    const minimizedWindows = appWindows.filter(w => w.minimized);

    if (visibleWindows.length > 0) {
      bringToFront(visibleWindows[visibleWindows.length - 1].id);
    } else if (minimizedWindows.length > 0) {
      restoreWindow(minimizedWindows[minimizedWindows.length - 1].id);
    } else {
      openWindow(appId);
    }

    setContextMenuApp(null);
  };

  const handleRightClick = (e, appId) => {
    e.preventDefault();
    setContextMenuApp(appId);
  };

  const handleMouseLeave = () => {
    setHoveredApp(null);
  };

  return (
    <div className={`${styles.dockContainer} ${dockSettings?.autoHide ? styles.autoHideEnabled : ''} ${isDockVisible ? styles.visible : styles.hidden}`}>
      <div className={`${styles.dock} ${styles[themeMode]}`}>
        {dockItems.map(app => {
          const isActive = app.id === 'launchpad' ? launchpadOpen : windows.some(w => w.appId === app.id);
          const isHovered = hoveredApp === app.id;
          const appIndex = dockItems.findIndex(item => item.id === app.id);
          const hoveredIndex = dockItems.findIndex(item => item.id === hoveredApp);
          const distance = hoveredIndex === -1 ? Infinity : Math.abs(appIndex - hoveredIndex);
          const magnificationScale = dockSettings?.magnification
            ? distance === 0 ? 1.28 : distance === 1 ? 1.16 : distance === 2 ? 1.07 : 1
            : 1;
          
          return (
            <div
              key={app.id}
              className={styles.dockItemWrapper}
              onMouseEnter={() => setHoveredApp(app.id)}
              onMouseLeave={handleMouseLeave}
            >
              {isHovered && app.type !== 'launcher' && (
                <HoverPreview 
                  app={app} 
                  windows={windows.filter(w => w.appId === app.id)} 
                  bringToFront={bringToFront} 
                />
              )}
              
              {contextMenuApp === app.id && app.type !== 'launcher' && (
                <div className={styles.contextMenu} onClick={(e) => e.stopPropagation()} onContextMenu={(e) => e.stopPropagation()}>
                  <div onClick={(e) => { 
                    e.stopPropagation(); 
                    openWindow(app.id); 
                    setContextMenuApp(null); 
                  }}>
                    New Window
                  </div>
                  {isActive && app.id !== 'finder' && (
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
                style={{ transform: `scale(${magnificationScale}) translateY(${magnificationScale > 1 ? -5 * (magnificationScale - 1) : 0}px)` }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAppClick(app.id);
                }}
                onContextMenu={(e) => {
                  e.stopPropagation();
                  handleRightClick(e, app.id);
                }}
              >
                {typeof app.icon === 'string' && app.icon.startsWith('/') ? (
                  <>
                    {!loadedIcons[app.id] && <Loader className={styles.iconLoader} compact label={`Loading ${app.name} icon`} />}
                    <img
                      src={themeMode === 'light' && app.iconLight ? app.iconLight : app.icon}
                      alt={app.name}
                      style={{ width: '30px', height: '30px', objectFit: 'contain', opacity: loadedIcons[app.id] ? 1 : 0 }}
                      onLoad={() => setLoadedIcons(prev => ({ ...prev, [app.id]: true }))}
                      onError={() => setLoadedIcons(prev => ({ ...prev, [app.id]: true }))}
                    />
                  </>
                ) : (
                  app.icon
                )}
              </div>
              
              {isActive && <div className={styles.activeDot} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}