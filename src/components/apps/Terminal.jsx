import { useState } from 'react';
import styles from '../apps.module.css';

const INITIAL_TABS = [
  { id: 1, title: 'Windows PowerShell', prompt: 'PS C:\\Users\\Matthew\\Projects>' }
];

export default function Terminal({ themeMode }) {
  const [tabs, setTabs] = useState(INITIAL_TABS);
  const [activeTab, setActiveTab] = useState(1);

  const addTab = () => {
    const nextId = tabs.length ? Math.max(...tabs.map(tab => tab.id)) + 1 : 1;
    const newTab = { id: nextId, title: `PowerShell ${nextId}`, prompt: 'PS C:\\Users\\Matthew\\Projects>' };
    setTabs(prev => [...prev, newTab]);
    setActiveTab(nextId);
  };

  const closeTab = (id) => {
    setTabs(prev => {
      const remaining = prev.filter(tab => tab.id !== id);
      if (remaining.length === 0) {
        setActiveTab(1);
        return INITIAL_TABS;
      }

      if (activeTab === id) {
        const closingIndex = prev.findIndex(tab => tab.id === id);
        const nextTab = remaining[closingIndex] ?? remaining[remaining.length - 1];
        setActiveTab(nextTab.id);
      }

      return remaining;
    });
  };

  const currentTab = tabs.find(tab => tab.id === activeTab) || tabs[0];

  return (
    <div className={`${styles.terminalContainer} ${themeMode === 'dark' ? styles.terminalDark : ''}`}>
      <div className={styles.termTabs}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={styles.termTab}
            style={{ opacity: tab.id === activeTab ? 1 : 0.7, cursor: 'pointer' }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{'>'}_</span> {tab.title}
            <span
              className={styles.tabClose}
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); closeTab(tab.id); } }}
            >
              ×
            </span>
          </div>
        ))}
        <span
          style={{ color: '#888', marginLeft: '12px', cursor: 'pointer' }}
          onClick={addTab}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') addTab(); }}
        >
          +
        </span>
      </div>
      <div className={styles.termBody}>
        <p>{currentTab.title}</p>
        <p>Copyright (C) Microsoft Corporation. All rights reserved.</p>
        <br />
        <p>{currentTab.prompt} <span style={{ animation: 'blink 1s step-end infinite' }}>_</span></p>
      </div>
      <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
    </div>
  );
}