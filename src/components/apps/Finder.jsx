import { useState } from 'react';
import styles from '../apps.module.css';
import { APPS } from '../../constants/apps';
import Loader from '../Loader';

export default function Finder({ openWindow, themeMode }) {
  const [activeTab, setActiveTab] = useState('applications');
  const [loadedIcons, setLoadedIcons] = useState({});

  return (
    <div className={`${styles.appContainer} ${themeMode === 'dark' ? styles.darkApp : ''}`}>
      <div className={styles.sidebar}>
        <div 
          className={`${styles.sidebarItem} ${activeTab === 'desktop' ? styles.active : ''}`}
          onClick={() => setActiveTab('desktop')}
        >
          <span>🖥️</span> Desktop
        </div>
        <div 
          className={`${styles.sidebarItem} ${activeTab === 'applications' ? styles.active : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          <span>📱</span> Applications
        </div>
      </div>
      
      <div className={styles.mainArea}>
        {activeTab === 'desktop' && (
          <div style={{ color: '#888', textAlign: 'center', marginTop: '40px' }}>
            Desktop is empty
          </div>
        )}
        
        {activeTab === 'applications' && (
          <div className={styles.appGrid}>
            {APPS.map(app => (
              <div
                key={app.id}
                className={styles.appIconWrapper}
                onDoubleClick={() => openWindow(app.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openWindow(app.id); }}
              >
                <div className={styles.icon} style={{ padding: '10px' }}>
                  {typeof app.icon === 'string' && app.icon.startsWith('/') ? (
                    <>
                      {!loadedIcons[app.id] && <Loader compact className={styles.finderIconLoader} label={`Loading ${app.name} icon`} />}
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
                <span>{app.name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}