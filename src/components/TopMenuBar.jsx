import React, { useState, useEffect } from 'react';
import styles from './TopMenuBar.module.css';
import Loader from './Loader';

const getMenusForApp = (focusedAppTitle, focusedAppId, menuActions) => {
  const windowItems = [
    { label: 'Minimize Window', action: menuActions.minimizeFocusedWindow },
    { label: 'Zoom Window', action: menuActions.maximizeFocusedWindow },
    { label: 'Center Window', action: menuActions.centerFocusedWindow },
    { divider: true },
    { label: 'Tile Left Half', action: () => menuActions.snapFocusedWindow('left') },
    { label: 'Tile Right Half', action: () => menuActions.snapFocusedWindow('right') },
    { label: 'Top Left Quarter', action: () => menuActions.snapFocusedWindow('topLeft') },
    { label: 'Top Right Quarter', action: () => menuActions.snapFocusedWindow('topRight') },
    { label: 'Tile Open Windows', action: menuActions.tileVisibleWindows }
  ];

  const appMenuItems = [
    { label: `New ${focusedAppTitle} Window`, action: menuActions.openNewWindow },
    { label: 'Close Window', action: menuActions.closeFocusedWindow }
  ];

  if (focusedAppId !== 'finder') {
    appMenuItems.push({ divider: true }, { label: `Quit ${focusedAppTitle}`, action: menuActions.quitFocusedApp });
  }

  const appMenu = {
    id: 'app',
    label: focusedAppTitle,
    items: appMenuItems
  };

  const menusByApp = {
    finder: [
      appMenu,
      { id: 'file', label: 'File', items: [{ label: 'New Finder Window', action: menuActions.openNewWindow }, { label: 'Tile Open Windows', action: menuActions.tileVisibleWindows }] },
      { id: 'go', label: 'Go', items: [{ label: 'Center Window', action: menuActions.centerFocusedWindow }] },
      { id: 'window', label: 'Window', items: windowItems }
    ],
    notes: [
      appMenu,
      { id: 'file', label: 'File', items: [{ label: 'New Writing Window', action: menuActions.openNewWindow }, { label: 'Close Window', action: menuActions.closeFocusedWindow }] },
      { id: 'format', label: 'Format', items: [{ label: 'Center Window', action: menuActions.centerFocusedWindow }, { label: 'Zoom Window', action: menuActions.maximizeFocusedWindow }] },
      { id: 'window', label: 'Window', items: windowItems }
    ],
    safari: [
      appMenu,
      { id: 'file', label: 'File', items: [{ label: 'New Safari Window', action: menuActions.openNewWindow }, { label: 'Close Window', action: menuActions.closeFocusedWindow }] },
      { id: 'bookmarks', label: 'Bookmarks', items: [{ label: 'Tile Left Half', action: () => menuActions.snapFocusedWindow('left') }, { label: 'Tile Right Half', action: () => menuActions.snapFocusedWindow('right') }] },
      { id: 'window', label: 'Window', items: windowItems }
    ],
    terminal: [
      appMenu,
      { id: 'shell', label: 'Shell', items: [{ label: 'New Terminal Window', action: menuActions.openNewWindow }, { label: 'Close Window', action: menuActions.closeFocusedWindow }] },
      { id: 'view', label: 'View', items: [{ label: 'Zoom Window', action: menuActions.maximizeFocusedWindow }, { label: 'Center Window', action: menuActions.centerFocusedWindow }] },
      { id: 'window', label: 'Window', items: windowItems }
    ],
    calculator: [
      appMenu,
      { id: 'file', label: 'File', items: [{ label: 'New Calculator Window', action: menuActions.openNewWindow }, { label: 'Close Window', action: menuActions.closeFocusedWindow }] },
      { id: 'view', label: 'View', items: [{ label: 'Top Left Quarter', action: () => menuActions.snapFocusedWindow('topLeft') }, { label: 'Top Right Quarter', action: () => menuActions.snapFocusedWindow('topRight') }] },
      { id: 'window', label: 'Window', items: windowItems }
    ],
    settings: [
      appMenu,
      { id: 'settings', label: 'Settings', items: [{ label: 'New Settings Window', action: menuActions.openNewWindow }, { label: 'Center Window', action: menuActions.centerFocusedWindow }] },
      { id: 'appearance', label: 'Appearance', items: [{ label: 'Zoom Window', action: menuActions.maximizeFocusedWindow }, { label: 'Tile Open Windows', action: menuActions.tileVisibleWindows }] },
      { id: 'window', label: 'Window', items: windowItems }
    ]
  };

  return menusByApp[focusedAppId] ?? [appMenu, { id: 'window', label: 'Window', items: windowItems }];
};

export default function TopMenuBar({ focusedAppTitle, focusedAppId, menuActions, themeMode, overlayState, onToggleSpotlight, onToggleControlCenter, systemActions, logoSrc }) {
  const [time, setTime] = useState(new Date());
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [isLogoLoaded, setIsLogoLoaded] = useState(false);
  const menus = getMenusForApp(focusedAppTitle, focusedAppId, menuActions);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close dropdown if clicking elsewhere
  useEffect(() => {
    const closeMenu = () => setActiveMenuId(null);
    if (activeMenuId) window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, [activeMenuId]);

  return (
    <div className={`${styles.bar} ${styles[themeMode]}`}>
      <div className={styles.left}>
        <div className={styles.menuContainer}>
          <button
            type="button"
            className={`${styles.logoButton} ${activeMenuId === 'system' ? styles.menuButtonActive : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(current => current === 'system' ? null : 'system');
            }}
            aria-label="Open system menu"
          >
            <div className={styles.logoWrap}>
              {!isLogoLoaded && <Loader compact className={styles.logoLoader} label="Loading logo" />}
              <img src={logoSrc} alt="Logo" className={styles.logo} onLoad={() => setIsLogoLoaded(true)} onError={() => setIsLogoLoaded(true)} style={{ opacity: isLogoLoaded ? 1 : 0 }} />
            </div>
          </button>
          {activeMenuId === 'system' && (
            <div className={styles.dropdown}>
              <button type="button" className={styles.menuItem} onClick={() => { systemActions.aboutThisMac(); setActiveMenuId(null); }}>About this Mac</button>
              <div className={styles.divider} />
              <button type="button" className={styles.menuItem} onClick={() => { systemActions.restart(); setActiveMenuId(null); }}>Restart</button>
              <button type="button" className={styles.menuItem} onClick={() => { systemActions.shutDown(); setActiveMenuId(null); }}>Shut down</button>
              <button type="button" className={styles.menuItem} onClick={() => { systemActions.lockScreen(); setActiveMenuId(null); }}>Lock screen</button>
              <div className={styles.divider} />
              <button type="button" className={`${styles.menuItem} ${styles.menuItemDanger}`} onClick={() => { systemActions.resetThisMac(); setActiveMenuId(null); }}>Reset this Mac</button>
            </div>
          )}
        </div>
        {menus.map(menu => (
          <div
            key={menu.id}
            className={styles.menuContainer}
            onMouseEnter={() => {
              if (activeMenuId) setActiveMenuId(menu.id);
            }}
          >
            <button
              type="button"
              className={`${styles.menuButton} ${menu.id === 'app' ? styles.appName : ''} ${activeMenuId === menu.id ? styles.menuButtonActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(current => current === menu.id ? null : menu.id);
              }}
            >
              {menu.label}
            </button>

            {activeMenuId === menu.id && (
              <div className={styles.dropdown}>
                {menu.items.map((item, index) => item.divider ? (
                  <div key={`${menu.id}-divider-${index}`} className={styles.divider} />
                ) : (
                  <button
                    key={`${menu.id}-${item.label}`}
                    type="button"
                    className={styles.menuItem}
                    onClick={() => {
                      item.action();
                      setActiveMenuId(null);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.right}>
        <button
          type="button"
          className={`${styles.utilityButton} ${overlayState?.spotlight ? styles.utilityButtonActive : ''}`}
          onClick={onToggleSpotlight}
          aria-label="Open Spotlight"
        >
          <span className={styles.searchGlyph} />
        </button>
        <button
          type="button"
          className={`${styles.utilityButton} ${overlayState?.controlCenter ? styles.utilityButtonActive : ''}`}
          onClick={onToggleControlCenter}
          aria-label="Open Control Centre"
        >
          <span className={styles.controlGlyph}>
            <span />
            <span />
            <span />
            <span />
          </span>
        </button>
        <span>🔋 100%</span>
        <span>{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  );
}