import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from '../apps.module.css';
import Loader from '../Loader';
import { withBase } from '../../utils/paths';

export default function Notes({ themeMode, notesCommand }) {
  const iframeRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncThemeToIframe = useCallback(() => {
    if (!iframeRef.current?.contentWindow) return;

    iframeRef.current.contentWindow.postMessage(
      { type: 'temp_os_theme', theme: themeMode },
      window.location.origin
    );
  }, [themeMode]);

  useEffect(() => {
    syncThemeToIframe();
  }, [syncThemeToIframe]);

  useEffect(() => {
    if (!notesCommand?.type || !iframeRef.current?.contentWindow) return;

    iframeRef.current.contentWindow.postMessage(notesCommand, window.location.origin);
  }, [notesCommand]);

  return (
    <div className={`${styles.safariApp} ${themeMode === 'dark' ? styles.darkApp : ''}`} style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      <div className={styles.safariToolbar}>
        <span style={{ color: themeMode === 'dark' ? '#ccc' : '#999' }}>📝</span>
        <div className={styles.urlBar}>Cognito Write</div>
      </div>
      <div className={styles.iframeShell}>
        {isLoading && (
          <div className={styles.iframeLoaderOverlay}>
            <Loader label="Loading Cognito Write" />
          </div>
        )}
      <iframe
        ref={iframeRef}
        src={withBase('notes/index.html')}
        className={styles.iframe}
        title="Cognito Write"
        onLoad={() => {
          syncThemeToIframe();
          if (notesCommand?.type && iframeRef.current?.contentWindow) {
            iframeRef.current.contentWindow.postMessage(notesCommand, window.location.origin);
          }
          setIsLoading(false);
        }}
      />
      </div>
    </div>
  );
}
