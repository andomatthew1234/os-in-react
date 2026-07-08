import { useRef, useState, useEffect } from 'react';
import styles from './WindowInstance.module.css';

// Import our newly created app components
import Finder from './apps/Finder';
import Notes from './apps/Notes';
import Safari from './apps/Safari';
import Terminal from './apps/Terminal';
import Calculator from './apps/Calculator';
import Settings from './apps/Settings';

export default function WindowInstance({ windowData, isFocused, bringToFront, closeWindow, updatePosition, updateBounds, applySnapTarget, showSnapPreview, clearSnapPreview, minimizeWindow, maximizeWindow, openWindow, backgroundSelection, updateBackgroundSelection, themeMode, updateThemeMode, dockSettings, updateDockSettings, requestedSettingsPane, notesCommand }) {
  const { appId, title, x, y, width, height, zIndex, maximized } = windowData;
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isAppearing, setIsAppearing] = useState(true);
  const dragOffset = useRef({ x: 0, y: 0 });
  const snapTargetRef = useRef(null);
  const resizeStart = useRef({
    mouseX: 0,
    mouseY: 0,
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    direction: 'bottomRight'
  });

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => setIsAppearing(false));
    return () => window.cancelAnimationFrame(animationFrame);
  }, []);

  const getSnapTarget = (pointerX, pointerY) => {
    const edgeThreshold = 32;
    const topThreshold = 48;
    const nearLeft = pointerX <= edgeThreshold;
    const nearRight = pointerX >= window.innerWidth - edgeThreshold;
    const nearTop = pointerY <= topThreshold;
    const nearBottom = pointerY >= window.innerHeight - edgeThreshold;

    if (nearTop && nearLeft) return 'topLeft';
    if (nearTop && nearRight) return 'topRight';
    if (nearBottom && nearLeft) return 'bottomLeft';
    if (nearBottom && nearRight) return 'bottomRight';
    if (nearTop) return 'maximize';
    if (nearLeft) return 'left';
    if (nearRight) return 'right';
    return null;
  };

  const handleMouseDown = (e) => {
    bringToFront();
    if (maximized) return;
    clearSnapPreview();
    snapTargetRef.current = null;
    setIsDragging(true);
    
    dragOffset.current = {
      x: e.clientX - x,
      y: e.clientY - y
    };
  };

  const handleResizeMouseDown = (direction, e) => {
    e.stopPropagation();
    bringToFront();
    setIsDragging(false);
    setIsResizing(true);
    clearSnapPreview();

    resizeStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      x,
      y,
      width,
      height,
      direction
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;

      const MIN_Y = 28;
      const MAX_Y = window.innerHeight - 40; 
      const MIN_X = -width + 50;
      const MAX_X = window.innerWidth - 50;

      newX = Math.max(MIN_X, Math.min(newX, MAX_X));
      newY = Math.max(MIN_Y, Math.min(newY, MAX_Y));

      updatePosition(newX, newY);

      const nextSnapTarget = getSnapTarget(e.clientX, e.clientY);
      snapTargetRef.current = nextSnapTarget;

      if (nextSnapTarget) {
        showSnapPreview(nextSnapTarget);
      } else {
        clearSnapPreview();
      }
    };

    const handleMouseUp = () => {
      if (snapTargetRef.current) {
        applySnapTarget(snapTargetRef.current);
      } else {
        clearSnapPreview();
      }

      snapTargetRef.current = null;
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [applySnapTarget, clearSnapPreview, isDragging, showSnapPreview, updatePosition, width, height]);

  useEffect(() => {
    const handleResizeMove = (e) => {
      if (!isResizing) return;

      const start = resizeStart.current;
      const direction = start.direction.toLowerCase();
      const deltaX = e.clientX - start.mouseX;
      const deltaY = e.clientY - start.mouseY;

      let nextX = start.x;
      let nextY = start.y;
      let nextWidth = start.width;
      let nextHeight = start.height;

      if (direction.includes('right')) {
        nextWidth = start.width + deltaX;
      }
      if (direction.includes('left')) {
        nextWidth = start.width - deltaX;
        nextX = start.x + deltaX;
      }
      if (direction.includes('bottom')) {
        nextHeight = start.height + deltaY;
      }
      if (direction.includes('top')) {
        nextHeight = start.height - deltaY;
        nextY = start.y + deltaY;
      }

      updateBounds({ x: nextX, y: nextY, width: nextWidth, height: nextHeight }, start.direction);
    };

    const handleResizeUp = () => setIsResizing(false);

    if (isResizing) {
      window.addEventListener('mousemove', handleResizeMove);
      window.addEventListener('mouseup', handleResizeUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeUp);
    };
  }, [isResizing, updateBounds]);

  // Render the correct app based on the ID passed from the Dock
  const renderAppContent = () => {
    switch (appId) {
      case 'finder': return <Finder openWindow={openWindow} themeMode={themeMode} />;
      case 'notes': return <Notes themeMode={themeMode} notesCommand={notesCommand} />;
      case 'safari': return <Safari themeMode={themeMode} />;
      case 'terminal': return <Terminal themeMode={themeMode} />;
      case 'calculator': return <Calculator themeMode={themeMode} />;
      case 'settings': return <Settings backgroundSelection={backgroundSelection} updateBackgroundSelection={updateBackgroundSelection} themeMode={themeMode} updateThemeMode={updateThemeMode} dockSettings={dockSettings} updateDockSettings={updateDockSettings} requestedPane={requestedSettingsPane} />;
      default: return <div style={{ padding: '24px' }}>App not found</div>;
    }
  };

  return (
    <div
      className={`${styles.window} ${styles[themeMode]} ${isFocused ? styles.focused : ''} ${isDragging || isResizing ? styles.moving : ''} ${isAppearing ? styles.appearing : ''}`}
      style={{ left: x, top: y, width, height, zIndex }}
      onMouseDownCapture={bringToFront}
    >
      <div className={styles.titleBar} onMouseDown={handleMouseDown}>
        <div className={styles.controls}>
          <div className={styles.closeBtn} onClick={(e) => { e.stopPropagation(); closeWindow(); }} />
          <div className={styles.minBtn} onClick={(e) => { e.stopPropagation(); minimizeWindow(); }} />
          <div className={styles.maxBtn} onClick={(e) => { e.stopPropagation(); maximizeWindow(); }} />
        </div>
        <div className={styles.title}>{title}</div>
      </div>
      
      <div className={styles.content}>
        {renderAppContent()}
      </div>
      {!maximized && (
        <>
          <div className={`${styles.resizeZone} ${styles.top}`} onMouseDown={(e) => handleResizeMouseDown('top', e)} />
          <div className={`${styles.resizeZone} ${styles.right}`} onMouseDown={(e) => handleResizeMouseDown('right', e)} />
          <div className={`${styles.resizeZone} ${styles.bottom}`} onMouseDown={(e) => handleResizeMouseDown('bottom', e)} />
          <div className={`${styles.resizeZone} ${styles.left}`} onMouseDown={(e) => handleResizeMouseDown('left', e)} />
          <div className={`${styles.resizeZone} ${styles.topLeft}`} onMouseDown={(e) => handleResizeMouseDown('topLeft', e)} />
          <div className={`${styles.resizeZone} ${styles.topRight}`} onMouseDown={(e) => handleResizeMouseDown('topRight', e)} />
          <div className={`${styles.resizeZone} ${styles.bottomLeft}`} onMouseDown={(e) => handleResizeMouseDown('bottomLeft', e)} />
          <div className={`${styles.resizeZone} ${styles.bottomRight}`} onMouseDown={(e) => handleResizeMouseDown('bottomRight', e)} />
        </>
      )}
    </div>
  );
}