import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './Launchpad.module.css';

const getAppIconSrc = (app, themeMode) => {
  if (!app) return null;
  return themeMode === 'light' && app.iconLight ? app.iconLight : app.icon;
};

const createEmptyFolderDraft = () => ({
  id: null,
  name: '',
  subtitle: '',
  appIds: []
});

export default function Launchpad({ open, onClose, themeMode, appLookup, folders, customFolders, groups, onOpenApp, requestedFolder, onSaveFolder, onDeleteFolder }) {
  const [query, setQuery] = useState('');
  const [activeFolderId, setActiveFolderId] = useState(null);
  const [isFolderEditorOpen, setIsFolderEditorOpen] = useState(false);
  const [folderDraft, setFolderDraft] = useState(createEmptyFolderDraft());
  const overlayRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setActiveFolderId(null);
      setIsFolderEditorOpen(false);
      setFolderDraft(createEmptyFolderDraft());
      return;
    }

    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timeoutId);
  }, [open]);

  useEffect(() => {
    if (!open || !requestedFolder?.folderId) return;

    setActiveFolderId(requestedFolder.folderId);
  }, [open, requestedFolder]);

  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        if (isFolderEditorOpen) {
          setIsFolderEditorOpen(false);
          return;
        }

        if (activeFolderId) {
          setActiveFolderId(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFolderId, isFolderEditorOpen, onClose, open]);

  const normalizedQuery = query.trim().toLowerCase();
  const matchesQuery = (text) => !normalizedQuery || text.toLowerCase().includes(normalizedQuery);
  const customFolderIds = new Set(customFolders.map(folder => folder.id));

  const visibleFolders = useMemo(() => folders.filter(folder => {
    const folderApps = folder.appIds.map(appId => appLookup[appId]).filter(Boolean);
    const folderText = [folder.name, folder.subtitle, ...folderApps.map(app => `${app.name} ${app.keywords?.join(' ') || ''}`)].join(' ');
    return matchesQuery(folderText);
  }), [appLookup, folders, normalizedQuery]);

  const visibleGroups = useMemo(() => groups
    .map(group => ({
      ...group,
      apps: group.appIds
        .map(appId => appLookup[appId])
        .filter(Boolean)
        .filter(app => matchesQuery(`${app.name} ${app.keywords?.join(' ') || ''}`))
    }))
    .filter(group => group.apps.length > 0 || matchesQuery(`${group.title} ${group.description}`)), [appLookup, groups, normalizedQuery]);

  if (!open) return null;

  const activeFolder = folders.find(folder => folder.id === activeFolderId);

  const openCreateFolder = () => {
    setFolderDraft(createEmptyFolderDraft());
    setIsFolderEditorOpen(true);
  };

  const openEditFolder = (folder) => {
    setFolderDraft({ id: folder.id, name: folder.name, subtitle: folder.subtitle, appIds: [...folder.appIds] });
    setIsFolderEditorOpen(true);
  };

  return (
    <div className={`${styles.overlay} ${styles[themeMode]}`} ref={overlayRef} onMouseDown={(event) => {
      if (event.target === overlayRef.current) {
        if (activeFolderId) {
          setActiveFolderId(null);
        } else {
          onClose();
        }
      }
    }}>
      <div className={styles.shell}>
        <div className={styles.header}>
          <div className={styles.headerCopy}>
            <span className={styles.kicker}>Launchpad</span>
            <h1>Apps, folders, and quick organization</h1>
            <p>Search, open apps, and build your own folders for the tools you use together.</p>
          </div>
          <div className={styles.headerActions}>
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={styles.searchInput}
              placeholder="Search apps and folders"
            />
            <button type="button" className={styles.createFolderButton} onClick={openCreateFolder}>
              New Folder
            </button>
          </div>
        </div>

        <section className={styles.folderStrip}>
          {visibleFolders.map(folder => (
            <button key={folder.id} type="button" className={styles.folderCard} onClick={() => setActiveFolderId(folder.id)}>
              <div className={styles.folderPreview}>
                {folder.appIds.slice(0, 4).map(appId => {
                  const app = appLookup[appId];
                  if (!app) return null;
                  const icon = getAppIconSrc(app, themeMode);
                  return typeof icon === 'string' && icon.startsWith('/') ? (
                    <img key={app.id} src={icon} alt={app.name} className={styles.folderIcon} />
                  ) : (
                    <span key={app.id} className={styles.folderEmoji}>{icon}</span>
                  );
                })}
              </div>
              <div className={styles.folderTitleRow}>
                <strong>{folder.name}</strong>
                {customFolderIds.has(folder.id) && <span className={styles.folderBadge}>Custom</span>}
              </div>
              <span>{folder.subtitle}</span>
            </button>
          ))}
        </section>

        <div className={styles.groups}>
          {visibleGroups.map(group => (
            <section key={group.id} className={styles.groupSection}>
              <div className={styles.groupHeader}>
                <h2>{group.title}</h2>
                <p>{group.description}</p>
              </div>
              <div className={styles.appGrid}>
                {group.apps.map(app => {
                  const icon = getAppIconSrc(app, themeMode);
                  return (
                    <button key={app.id} type="button" className={styles.appButton} onClick={() => onOpenApp(app.id)}>
                      <div className={styles.appIconWrap}>
                        {typeof icon === 'string' && icon.startsWith('/') ? (
                          <img src={icon} alt={app.name} className={styles.appIcon} />
                        ) : (
                          <span className={styles.appEmoji}>{icon}</span>
                        )}
                      </div>
                      <span>{app.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {activeFolder && (
        <div className={styles.folderDialogBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setActiveFolderId(null);
          }
        }}>
          <div className={styles.folderDialog}>
            <div className={styles.folderDialogHeader}>
              <div>
                <h3>{activeFolder.name}</h3>
                <p>{activeFolder.subtitle}</p>
              </div>
              <div className={styles.folderDialogActions}>
                {customFolderIds.has(activeFolder.id) && (
                  <>
                    <button type="button" className={styles.folderSecondaryButton} onClick={() => openEditFolder(activeFolder)}>Edit</button>
                    <button
                      type="button"
                      className={styles.folderDangerButton}
                      onClick={() => {
                        onDeleteFolder(activeFolder.id);
                        setActiveFolderId(null);
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
                <button type="button" className={styles.folderClose} onClick={() => setActiveFolderId(null)}>Close</button>
              </div>
            </div>
            <div className={styles.folderDialogGrid}>
              {activeFolder.appIds.map(appId => {
                const app = appLookup[appId];
                if (!app) return null;
                const icon = getAppIconSrc(app, themeMode);
                return (
                  <button key={app.id} type="button" className={styles.appButton} onClick={() => onOpenApp(app.id)}>
                    <div className={styles.appIconWrap}>
                      {typeof icon === 'string' && icon.startsWith('/') ? (
                        <img src={icon} alt={app.name} className={styles.appIcon} />
                      ) : (
                        <span className={styles.appEmoji}>{icon}</span>
                      )}
                    </div>
                    <span>{app.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isFolderEditorOpen && (
        <div className={styles.folderEditorBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            setIsFolderEditorOpen(false);
          }
        }}>
          <div className={styles.folderEditor}>
            <div className={styles.folderEditorHeader}>
              <div>
                <h3>{folderDraft.id ? 'Edit Folder' : 'Create Folder'}</h3>
                <p>Choose a name, subtitle, and the apps you want inside it.</p>
              </div>
              <button type="button" className={styles.folderClose} onClick={() => setIsFolderEditorOpen(false)}>Close</button>
            </div>

            <div className={styles.folderEditorFields}>
              <label className={styles.fieldLabel}>
                Folder name
                <input
                  value={folderDraft.name}
                  onChange={(event) => setFolderDraft(prev => ({ ...prev, name: event.target.value }))}
                  className={styles.fieldInput}
                  placeholder="Creative Tools"
                />
              </label>
              <label className={styles.fieldLabel}>
                Subtitle
                <input
                  value={folderDraft.subtitle}
                  onChange={(event) => setFolderDraft(prev => ({ ...prev, subtitle: event.target.value }))}
                  className={styles.fieldInput}
                  placeholder="Apps you use together"
                />
              </label>
            </div>

            <div className={styles.appPickerGrid}>
              {Object.values(appLookup).map(app => {
                const icon = getAppIconSrc(app, themeMode);
                const isSelected = folderDraft.appIds.includes(app.id);
                return (
                  <button
                    key={app.id}
                    type="button"
                    className={`${styles.appPickerCard} ${isSelected ? styles.appPickerCardSelected : ''}`}
                    onClick={() => setFolderDraft(prev => ({
                      ...prev,
                      appIds: isSelected
                        ? prev.appIds.filter(appId => appId !== app.id)
                        : [...prev.appIds, app.id]
                    }))}
                  >
                    <div className={styles.appPickerIconWrap}>
                      {typeof icon === 'string' && icon.startsWith('/') ? (
                        <img src={icon} alt={app.name} className={styles.appIcon} />
                      ) : (
                        <span className={styles.appEmoji}>{icon}</span>
                      )}
                    </div>
                    <strong>{app.name}</strong>
                  </button>
                );
              })}
            </div>

            <div className={styles.folderEditorFooter}>
              <button type="button" className={styles.folderSecondaryButton} onClick={() => setIsFolderEditorOpen(false)}>Cancel</button>
              <button
                type="button"
                className={styles.createFolderButton}
                disabled={!folderDraft.name.trim() || folderDraft.appIds.length === 0}
                onClick={() => {
                  onSaveFolder(folderDraft);
                  setIsFolderEditorOpen(false);
                }}
              >
                Save Folder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
