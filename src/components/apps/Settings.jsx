import { useEffect, useState } from 'react';
import styles from '../apps.module.css';
import { BACKGROUND_OPTIONS, BACKGROUNDS } from '../../constants/backgrounds';
import Loader from '../Loader';

const SETTINGS_STORAGE_KEY = 'temp_os_settings';

export default function Settings({ backgroundSelection, updateBackgroundSelection, themeMode, updateThemeMode, dockSettings, updateDockSettings, requestedPane }) {
  const [activeItem, setActiveItem] = useState(() => {
    if (typeof window === 'undefined') return 'general';

    try {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) return 'general';
      const parsed = JSON.parse(stored);
      return parsed?.activeItem ?? 'general';
    } catch {
      return 'general';
    }
  });
  const [accountForm, setAccountForm] = useState(() => {
    if (typeof window === 'undefined') {
      return { username: '', password: '' };
    }

    try {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) return { username: '', password: '' };
      const parsed = JSON.parse(stored);
      return {
        username: parsed?.userAccount?.username ?? '',
        password: parsed?.userAccount?.password ?? ''
      };
    } catch {
      return { username: '', password: '' };
    }
  });
  const [saveMessage, setSaveMessage] = useState('');
  const [loadedThumbnails, setLoadedThumbnails] = useState({});

  useEffect(() => {
    BACKGROUND_OPTIONS.forEach(option => {
      option.variants.forEach(variant => {
        const variantUrl = BACKGROUNDS[option.id]?.variants[variant.id];
        const key = `${option.id}:${variant.id}`;
        if (!variantUrl || loadedThumbnails[key]) return;

        const image = new Image();
        image.onload = () => setLoadedThumbnails(prev => ({ ...prev, [key]: true }));
        image.onerror = () => setLoadedThumbnails(prev => ({ ...prev, [key]: true }));
        image.src = variantUrl;
      });
    });
  }, [loadedThumbnails]);

  useEffect(() => {
    if (!requestedPane?.paneId) return;

    setActiveItem(requestedPane.paneId);
    persistSettings({ activeItem: requestedPane.paneId });
  }, [requestedPane]);

  const settingsItems = [
    { id: 'account', label: 'User Accounts', icon: '👤' },
    { id: 'desktopDock', label: 'Desktop and Dock', icon: '🖥️' },
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'sound', label: 'Sound', icon: '🔊' },
    { id: 'appearance', label: 'Appearance', icon: '👁️' },
    { id: 'privacy', label: 'Privacy & Security', icon: '🔒' }
  ];

  const activeContent = {
    account: {
      title: 'User Accounts',
      message: 'Set the local username and password that will be used by the lock screen later.'
    },
    desktopDock: {
      title: 'Desktop & Dock',
      message: 'Adjust Dock behavior, including magnification and auto-hide.'
    },
    general: {
      title: 'General Settings',
      message: 'Adjust standard system options and discover new features.'
    },
    sound: {
      title: 'Sound',
      message: 'Enable or disable sound output, alert volume, and device settings.'
    },
    appearance: {
      title: 'Appearance',
      message: 'Switch between light and dark mode and customize your desktop look.'
    },
    privacy: {
      title: 'Privacy & Security',
      message: 'Manage your permissions, security settings, and privacy controls.'
    }
  };

  const persistSettings = (updates) => {
    try {
      const currentSettings = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({ ...currentSettings, ...updates })
      );
      return true;
    } catch {
      return false;
    }
  };

  const saveUserAccount = () => {
    const saved = persistSettings({
      userAccount: {
        username: accountForm.username.trim(),
        password: accountForm.password
      }
    });

    setSaveMessage(saved ? 'Account saved locally.' : 'Unable to save account settings.');
  };

  const renderDesktopDockSection = () => {
    return (
      <div className={styles.settingsPanel}>
        <div className={styles.settingsCard}>
          <h3>Dock</h3>
          <p className={styles.settingsCardText}>
            Choose whether the Dock magnifies icons on hover and whether it hides until your pointer reaches the bottom edge.
          </p>

          <div className={styles.preferenceRow}>
            <div>
              <strong>Magnification</strong>
              <p className={styles.preferenceHint}>Enlarge nearby Dock icons as you hover over them.</p>
            </div>
            <button
              type="button"
              className={`${styles.preferenceToggle} ${dockSettings?.magnification ? styles.preferenceToggleActive : ''}`}
              onClick={() => updateDockSettings({ magnification: !dockSettings?.magnification })}
            >
              <span className={styles.preferenceKnob} />
            </button>
          </div>

          <div className={styles.preferenceRow}>
            <div>
              <strong>Automatically hide and show the Dock</strong>
              <p className={styles.preferenceHint}>Hide the Dock until the pointer reaches the bottom of the screen.</p>
            </div>
            <button
              type="button"
              className={`${styles.preferenceToggle} ${dockSettings?.autoHide ? styles.preferenceToggleActive : ''}`}
              onClick={() => updateDockSettings({ autoHide: !dockSettings?.autoHide })}
            >
              <span className={styles.preferenceKnob} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderAppearanceSection = () => {
    return (
      <div style={{ marginTop: '16px' }}>
        <p className={styles.themeSectionText}>
          Choose a wallpaper and variant. Light / Dark mode applies to Mojave and Slide. Rectangle Curves uses color variants.
        </p>
        <div className={styles.themeToggle}>
          <button
            type="button"
            className={`${styles.themeToggleButton} ${themeMode === 'light' ? styles.active : ''}`}
            onClick={() => updateThemeMode('light')}
          >
            Light
          </button>
          <button
            type="button"
            className={`${styles.themeToggleButton} ${themeMode === 'dark' ? styles.active : ''}`}
            onClick={() => updateThemeMode('dark')}
          >
            Dark
          </button>
        </div>
        <div className={styles.wallpaperGrid}>
          {BACKGROUND_OPTIONS.map(option => {
            const isSelectedBackground = option.id === backgroundSelection.id;
            return (
              <div
                key={option.id}
                className={`${styles.wallpaperOption} ${isSelectedBackground ? styles.activeWallpaper : ''}`}
              >
                <div className={styles.wallpaperHeader}>
                  <div>
                    <strong>{option.label}</strong>
                    <div className={styles.wallpaperType}>{option.type === 'lightdark' ? 'Light / Dark variant' : 'Color variant'}</div>
                  </div>
                  {isSelectedBackground && <span className={styles.selectedLabel}>Selected</span>}
                </div>

                <div className={styles.wallpaperVariants}>
                  {option.variants.map(variant => {
                    const isSelectedVariant = backgroundSelection.id === option.id && backgroundSelection.variant === variant.id;
                    const variantUrl = BACKGROUNDS[option.id]?.variants[variant.id];
                    const thumbnailKey = `${option.id}:${variant.id}`;
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => updateBackgroundSelection(option.id, variant.id)}
                        className={`${styles.variantButton} ${isSelectedVariant ? styles.activeVariantButton : ''}`}
                      >
                        <div
                          className={styles.variantPreview}
                          style={{
                            backgroundImage: loadedThumbnails[thumbnailKey] && variantUrl ? `url(${variantUrl})` : undefined
                          }}
                        >
                          {!loadedThumbnails[thumbnailKey] && <Loader compact className={styles.thumbnailLoader} label={`Loading ${variant.label} wallpaper preview`} />}
                        </div>
                        <div style={{ fontWeight: isSelectedVariant ? 600 : 500 }}>{variant.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderUserAccountsSection = () => {
    const displayName = accountForm.username.trim() || 'User';
    const initials = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() ?? '')
      .join('') || 'U';

    return (
      <div className={styles.accountShell}>
        <div className={styles.accountColumns}>
          <aside className={styles.accountSidebarPanel}>
            <div className={styles.accountListHeader}>Current User</div>
            <div className={styles.accountListCard}>
              <div className={`${styles.accountListItem} ${styles.accountListItemSelected}`}>
                <div className={styles.accountMiniAvatar}>{initials}</div>
                <div className={styles.accountMiniMeta}>
                  <strong>{displayName}</strong>
                  <span>Admin</span>
                </div>
                <span className={styles.accountMiniBadge}>i</span>
              </div>
            </div>

            <div className={styles.accountListHeader}>Groups</div>
            <div className={styles.accountListCard}>
              <div className={styles.accountListItem}>
                <div className={styles.accountGroupIcon}>👥</div>
                <div className={styles.accountMiniMeta}>
                  <strong>Staff</strong>
                  <span>Shared access</span>
                </div>
              </div>
            </div>

            <button type="button" className={styles.accountAddButton} disabled>
              Add Account…
            </button>
          </aside>

          <div className={styles.accountDetailPanel}>
            <div className={styles.accountHeader}>
              <div className={styles.accountLargeAvatarShell}>
                <div className={styles.accountLargeAvatar}>{initials}</div>
              </div>
              <div className={styles.accountHeaderCopy}>
                <h3>{displayName}</h3>
                <p className={styles.accountRole}>Administrator</p>
                <p className={styles.accountSecondaryMeta}>These credentials are stored in localStorage and will be reused by the lock screen.</p>
              </div>
            </div>

            <div className={styles.accountFormGrid}>
              <div className={styles.accountRow}>
                <label className={styles.accountRowLabel} htmlFor="settings-username">Full name</label>
                <div className={styles.accountRowControl}>
                  <input
                    id="settings-username"
                    type="text"
                    className={styles.settingsInput}
                    value={accountForm.username}
                    onChange={(event) => {
                      setAccountForm(prev => ({ ...prev, username: event.target.value }));
                      if (saveMessage) setSaveMessage('');
                    }}
                    placeholder="User"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className={styles.accountRow}>
                <span className={styles.accountRowLabel}>Account type</span>
                <div className={styles.accountFieldValue}>Administrator</div>
              </div>

              <div className={styles.accountRow}>
                <label className={styles.accountRowLabel} htmlFor="settings-password">Password</label>
                <div className={styles.accountRowControl}>
                  <input
                    id="settings-password"
                    type="password"
                    className={styles.settingsInput}
                    value={accountForm.password}
                    onChange={(event) => {
                      setAccountForm(prev => ({ ...prev, password: event.target.value }));
                      if (saveMessage) setSaveMessage('');
                    }}
                    placeholder="Set account password"
                    autoComplete="current-password"
                  />
                </div>
              </div>

              <div className={styles.accountRow}>
                <span className={styles.accountRowLabel}>Apple Account</span>
                <div className={styles.accountFieldValue}>Not connected</div>
              </div>
            </div>

            <div className={styles.accountSaveRow}>
              <button type="button" className={styles.primarySettingsButton} onClick={saveUserAccount}>
                Save Changes
              </button>
              {saveMessage && <span className={styles.settingsStatusText}>{saveMessage}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.appContainer} ${themeMode === 'dark' ? styles.darkApp : ''}`}>
      <div className={styles.sidebar}>
        <div className={styles.profile}>
          <div className={styles.profilePic}>🧑‍💻</div>
          <div className={styles.profileInfo}>
            <h4>{accountForm.username.trim() || 'Matthew Anderson'}</h4>
            <p>Apple ID, iCloud, Media</p>
          </div>
        </div>
        
        <div className={styles.sidebarItem}>
          <span style={{ background: '#007aff', color: 'white', padding: '2px', borderRadius: '4px' }}>📶</span> Wi-Fi
        </div>
        <div className={styles.sidebarItem}>
          <span style={{ background: '#007aff', color: 'white', padding: '2px', borderRadius: '4px' }}>ᛒ</span> Bluetooth
        </div>
        
        <div style={{ height: '12px' }}></div>
        
        {settingsItems.map(item => (
          <div
            key={item.id}
            className={`${styles.sidebarItem} ${item.id === activeItem ? styles.active : ''}`}
            onClick={() => {
              setActiveItem(item.id);
              persistSettings({ activeItem: item.id });
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span style={{ background: item.id === 'general' ? '#8e8e93' : item.id === 'sound' ? '#ff3b30' : item.id === 'appearance' ? '#000' : item.id === 'account' ? '#5ac8fa' : item.id === 'desktopDock' ? '#4f7cff' : '#007aff', color: 'white', padding: '2px', borderRadius: '4px' }}>{item.icon}</span>
            {item.label}
          </div>
        ))}
      </div>
      
      <div className={styles.mainArea}>
        <h2>{activeContent[activeItem].title}</h2>
        <p style={{ color: themeMode === 'dark' ? '#ccc' : '#666' }}>{activeContent[activeItem].message}</p>
        {activeItem === 'general' && (
          <button style={{ marginTop: '20px', padding: '10px 16px', borderRadius: '10px', border: '1px solid #ccc', cursor: 'pointer' }} onClick={() => setActiveItem('sound')}>
            Go to Sound Settings
          </button>
        )}
        {activeItem === 'account' && renderUserAccountsSection()}
        {activeItem === 'desktopDock' && renderDesktopDockSection()}
        {activeItem === 'appearance' && renderAppearanceSection()}
      </div>
    </div>
  );
}
