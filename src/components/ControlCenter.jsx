import { useEffect, useRef, useState } from 'react';
import styles from './ControlCenter.module.css';

export default function ControlCenter({ open, themeMode, dockSettings, onClose, onLock, onToggleTheme, updateDockSettings }) {
  const [soundLevel, setSoundLevel] = useState(68);
  const [displayLevel, setDisplayLevel] = useState(76);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className={styles.layer} onMouseDown={(event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose();
      }
    }}>
      <div ref={panelRef} className={`${styles.panel} ${styles[themeMode]}`}>
        <div className={styles.grid}>
          <section className={`${styles.module} ${styles.largeModule}`}>
            <div className={styles.connectivityTileRow}>
              <button type="button" className={`${styles.actionTile} ${styles.tileActive}`}>
                <span className={styles.tileGlyph}>Wi</span>
                <span className={styles.tileLabel}>Wi-Fi</span>
                <small>On</small>
              </button>
              <button type="button" className={`${styles.actionTile} ${styles.tileActive}`}>
                <span className={styles.tileGlyph}>B</span>
                <span className={styles.tileLabel}>Bluetooth</span>
                <small>On</small>
              </button>
              <button type="button" className={styles.actionTile}>
                <span className={styles.tileGlyph}>A</span>
                <span className={styles.tileLabel}>AirDrop</span>
                <small>Contacts Only</small>
              </button>
              <button type="button" className={styles.actionTile}>
                <span className={styles.tileGlyph}>F</span>
                <span className={styles.tileLabel}>Focus</span>
                <small>Do Not Disturb</small>
              </button>
            </div>
          </section>

          <section className={styles.module}>
            <div className={styles.moduleTitle}>Display</div>
            <button type="button" className={`${styles.inlineControl} ${styles.inlineControlWide}`} onClick={onToggleTheme}>
              <span className={styles.inlineGlyph}>{themeMode === 'dark' ? 'L' : 'D'}</span>
              <span>{themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
            </button>
            <div className={styles.sliderStack}>
              <label className={styles.sliderLabel} htmlFor="control-centre-display">Brightness</label>
              <input
                id="control-centre-display"
                type="range"
                min="0"
                max="100"
                value={displayLevel}
                onChange={(event) => setDisplayLevel(Number(event.target.value))}
                className={styles.slider}
              />
            </div>
          </section>

          <section className={styles.module}>
            <div className={styles.moduleTitle}>Sound</div>
            <div className={styles.sliderStack}>
              <label className={styles.sliderLabel} htmlFor="control-centre-sound">Output Volume</label>
              <input
                id="control-centre-sound"
                type="range"
                min="0"
                max="100"
                value={soundLevel}
                onChange={(event) => setSoundLevel(Number(event.target.value))}
                className={styles.slider}
              />
            </div>
          </section>

          <section className={styles.module}>
            <div className={styles.moduleTitle}>Now Playing</div>
            <div className={styles.nowPlayingCard}>
              <div className={styles.albumArt}>DQ</div>
              <div>
                <strong>Dancing Queen</strong>
                <span>ABBA</span>
              </div>
            </div>
          </section>

          <section className={`${styles.module} ${styles.wideModule}`}>
            <div className={styles.moduleTitle}>Desktop and Dock</div>
            <div className={styles.toggleList}>
              <button type="button" className={styles.inlineControl} onClick={() => updateDockSettings({ magnification: !dockSettings?.magnification })}>
                <span className={styles.inlineGlyph}>{dockSettings?.magnification ? 'On' : 'Off'}</span>
                <span>Dock magnification</span>
              </button>
              <button type="button" className={styles.inlineControl} onClick={() => updateDockSettings({ autoHide: !dockSettings?.autoHide })}>
                <span className={styles.inlineGlyph}>{dockSettings?.autoHide ? 'On' : 'Off'}</span>
                <span>Automatically hide Dock</span>
              </button>
            </div>
          </section>

          <section className={`${styles.module} ${styles.quickActions}`}>
            <button type="button" className={styles.quickButton} onClick={onLock}>
              <span className={styles.quickGlyph}>Lock</span>
              <span>Lock Screen</span>
            </button>
            <button type="button" className={styles.quickButton}>
              <span className={styles.quickGlyph}>KB</span>
              <span>Keyboard Brightness</span>
            </button>
            <button type="button" className={styles.quickButton}>
              <span className={styles.quickGlyph}>ACC</span>
              <span>Accessibility</span>
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
