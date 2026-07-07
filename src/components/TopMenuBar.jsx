import React, { useState, useEffect } from 'react';
import styles from './TopMenuBar.module.css';

export default function TopMenuBar({ focusedAppTitle, focusedAppId, quitApp }) {
  const [time, setTime] = useState(new Date());
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown if clicking elsewhere
  useEffect(() => {
    const closeMenu = () => setShowMenu(false);
    if (showMenu) window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [showMenu]);

  const handleAppClick = (e) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  return (
    <div className={styles.bar}>
      <div className={styles.left}>
        <span className={styles.apple}></span>
        
        <div className={styles.menuContainer}>
          <span className={styles.appName} onClick={handleAppClick}>
            {focusedAppTitle}
          </span>
          
          {showMenu && focusedAppId !== 'finder' && (
            <div className={styles.dropdown}>
              <div onClick={() => { quitApp(focusedAppId); setShowMenu(false); }}>
                Quit {focusedAppTitle}
              </div>
            </div>
          )}
        </div>

        <span>File</span>
        <span>Edit</span>
        <span>View</span>
        <span>Help</span>
      </div>
      <div className={styles.right}>
        <span>🔋 100%</span>
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}