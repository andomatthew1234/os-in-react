import React, { useState } from 'react';
import styles from '../apps.module.css';
import Loader from '../Loader';
import { withBase } from '../../utils/paths';

export default function Safari({ themeMode }) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={`${styles.safariApp} ${themeMode === 'dark' ? styles.darkApp : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div className={styles.safariToolbar}>
        <span style={{ cursor: 'pointer', color: themeMode === 'dark' ? '#ccc' : '#999' }}>◀</span>
        <span style={{ cursor: 'pointer', color: themeMode === 'dark' ? '#ccc' : '#999' }}>▶</span>
        <div className={styles.urlBar}>
          🔒 {withBase('safari/index.html')}
        </div>
      </div>
      <div className={styles.iframeShell}>
        {isLoading && (
          <div className={styles.iframeLoaderOverlay}>
            <Loader label="Loading Safari" />
          </div>
        )}
      <iframe 
        src={withBase('safari/index.html')} 
        className={styles.iframe}
        title="Safari Browser"
        onLoad={() => setIsLoading(false)}
      />
      </div>
    </div>
  );
}