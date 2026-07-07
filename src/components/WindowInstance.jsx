import React, { useRef, useState, useEffect } from 'react';
import styles from './WindowInstance.module.css';

export default function WindowInstance({ windowData, isFocused, bringToFront, closeWindow, updatePosition }) {
  const { id, title, x, y, width, height, zIndex } = windowData;
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    bringToFront();
    setIsDragging(true);
    
    dragOffset.current = {
      x: e.clientX - x,
      y: e.clientY - y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;

      // --- BOUNDARY LOCKING LOGIC (LOOSENED) ---
      // Top boundary (Menu Bar = 28px) - Strictly lock this so the title bar isn't lost underneath
      const MIN_Y = 28;
      // Bottom boundary - Allow sliding down, but leave at least 40px of the title bar visible
      const MAX_Y = window.innerHeight - 40; 
      // Left boundary - Allow sliding off left, leave at least 50px of the right edge visible
      const MIN_X = -width + 50;
      // Right boundary - Allow sliding off right, leave at least 50px of the left edge visible
      const MAX_X = window.innerWidth - 50;

      // Apply locks
      newX = Math.max(MIN_X, Math.min(newX, MAX_X));
      newY = Math.max(MIN_Y, Math.min(newY, MAX_Y));

      updatePosition(newX, newY);
    };

    const handleMouseUp = () => {
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
  }, [isDragging, width, height, updatePosition]);

  return (
    <div
      className={`${styles.window} ${isFocused ? styles.focused : ''}`}
      style={{ left: x, top: y, width, height, zIndex }}
      onMouseDownCapture={bringToFront}
    >
      <div className={styles.titleBar} onMouseDown={handleMouseDown}>
        <div className={styles.controls}>
          <div className={styles.closeBtn} onClick={(e) => { e.stopPropagation(); closeWindow(); }} />
          <div className={styles.minBtn} />
          <div className={styles.maxBtn} />
        </div>
        <div className={styles.title}>{title}</div>
      </div>
      
      <div className={styles.content}>
        <h2>Welcome to {title}</h2>
        <p>This is a dummy window container representing a native macOS application.</p>
        <p>Because of our strict boundary controls, it is physically impossible for you to drag this window completely off the screen or under the menu bar. Try it!</p>
      </div>
    </div>
  );
}