import React from 'react';
import styles from './HoverPreview.module.css';

export default function HoverPreview({ app, windows, bringToFront }) {
  // If 0 or 1 window is open, just show the standard tooltip with the app name
  if (windows.length <= 1) {
    return <div className={styles.tooltip}>{app.name}</div>;
  }

  // If multiple windows are open, show the multi-window preview grid
  return (
    <div className={styles.previewContainer}>
      {windows.map((w, i) => (
        <div key={w.id} className={styles.previewCard} onClick={() => bringToFront(w.id)}>
          <div className={styles.previewTitle}>{w.title} - Instance {i + 1}</div>
          <div className={styles.previewBody}>Click to focus</div>
        </div>
      ))}
    </div>
  );
}