import { useEffect, useRef, useState } from 'react';
import styles from './Spotlight.module.css';

const renderResultIcon = (result) => {
  if (result.iconSrc) {
    return <img src={result.iconSrc} alt="" className={styles.resultIconImage} />;
  }

  return result.icon;
};

export default function Spotlight({ open, query, onQueryChange, onClose, themeMode, results }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const overlayRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setActiveIndex(0);
      return;
    }

    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, results]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveIndex(prev => Math.min(prev + 1, Math.max(results.length - 1, 0)));
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveIndex(prev => Math.max(prev - 1, 0));
      }

      if (event.key === 'Enter' && results[activeIndex]) {
        event.preventDefault();
        results[activeIndex].action();
      }

      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex, onClose, open, results]);

  if (!open) return null;

  return (
    <div className={styles.overlay} ref={overlayRef} onMouseDown={(event) => {
      if (event.target === overlayRef.current) {
        onClose();
      }
    }}>
      <div className={`${styles.panel} ${styles[themeMode]}`}>
        <div className={styles.searchRow}>
          <span className={styles.searchIcon} />
          <input
            ref={inputRef}
            className={styles.input}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search notes, apps, settings, and actions"
          />
        </div>

        <div className={styles.results}>
          {results.length === 0 && (
            <div className={styles.emptyState}>
              <strong>No results</strong>
              <span>Try app names, note titles, settings, or actions like lock screen.</span>
            </div>
          )}

          {results.map((result, index) => (
            <button
              key={result.id}
              type="button"
              className={`${styles.resultButton} ${index === activeIndex ? styles.resultActive : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={result.action}
            >
              <div className={styles.resultIcon}>{renderResultIcon(result)}</div>
              <div className={styles.resultMeta}>
                <strong>{result.title}</strong>
                <span>{result.subtitle}</span>
              </div>
              <div className={styles.resultKind}>{result.kind}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
