import { useEffect, useMemo, useState } from 'react';
import styles from './LockScreen.module.css';
import Loader from './Loader';

const SETTINGS_STORAGE_KEY = 'temp_os_settings';

const formatDate = (date) => date.toLocaleDateString([], {
  weekday: 'short',
  month: 'short',
  day: 'numeric'
});

const formatTime = (date) => date.toLocaleTimeString([], {
  hour: 'numeric',
  minute: '2-digit'
});

const getInitials = (name) => {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return 'U';
  if (tokens.length === 1) return tokens[0].slice(0, 2).toUpperCase();
  return `${tokens[0][0]}${tokens[tokens.length - 1][0]}`.toUpperCase();
};

const readUserAccount = () => {
  if (typeof window === 'undefined') {
    return { username: '', password: '' };
  }

  try {
    const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!stored) return { username: '', password: '' };
    const parsed = JSON.parse(stored);
    return {
      username: parsed?.userAccount?.username?.trim() || '',
      password: parsed?.userAccount?.password ?? ''
    };
  } catch {
    return { username: '', password: '' };
  }
};

export default function LockScreen({ backgroundUrl, backgroundReady = false, onUnlock }) {
  const [now, setNow] = useState(() => new Date());
  const [account, setAccount] = useState(() => readUserAccount());
  const [isBackgroundLoaded, setIsBackgroundLoaded] = useState(backgroundReady);
  const [password, setPassword] = useState('');
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [setupForm, setSetupForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const hasAccount = Boolean(account.username.trim() || account.password);
  const displayName = hasAccount ? account.username.trim() || 'User' : 'User';
  const initials = useMemo(() => getInitials(displayName), [displayName]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (backgroundReady) {
      setIsBackgroundLoaded(true);
      return undefined;
    }

    if (!backgroundUrl) {
      setIsBackgroundLoaded(true);
      return undefined;
    }

    setIsBackgroundLoaded(false);
    const image = new Image();
    image.onload = () => setIsBackgroundLoaded(true);
    image.onerror = () => setIsBackgroundLoaded(true);
    image.src = backgroundUrl;
    return undefined;
  }, [backgroundReady, backgroundUrl]);

  const persistAccount = (nextAccount) => {
    try {
      const currentSettings = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
      window.localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          ...currentSettings,
          userAccount: nextAccount
        })
      );
      setAccount(nextAccount);
      return true;
    } catch {
      return false;
    }
  };

  const submitPassword = (event) => {
    event.preventDefault();

    if (password === account.password) {
      setError('');
      onUnlock();
      return;
    }

    setError('Incorrect password');
  };

  const submitFirstLogin = (event) => {
    event.preventDefault();

    const username = setupForm.username.trim();
    if (!username || !setupForm.password) {
      setError('Choose a username and password to continue.');
      return;
    }

    const nextAccount = {
      username,
      password: setupForm.password
    };

    const saved = persistAccount(nextAccount);
    if (!saved) {
      setError('Unable to save your account.');
      return;
    }

    setError('');
    onUnlock();
  };

  return (
    <div
      className={styles.lockScreen}
      style={{ backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined }}
    >
      {!isBackgroundLoaded && (
        <div className={styles.lockLoaderOverlay}>
          <Loader label="Loading lock screen wallpaper" />
        </div>
      )}
      <div className={styles.wallpaperTint} />
      <div className={styles.topStatus}>
        <span>U.S.</span>
        <span className={styles.statusDots}>◦◦</span>
      </div>

      <div className={styles.clockBlock}>
        <p className={styles.date}>{formatDate(now)}</p>
        <h1 className={styles.time}>{formatTime(now)}</h1>
      </div>

      <div className={styles.accountBlock}>
        <div className={styles.avatarShell}>
          <div className={styles.avatar}>{initials}</div>
        </div>
        <h2 className={styles.username}>{displayName}</h2>

        {hasAccount ? (
          <>
            <p className={styles.prompt}>Enter password</p>

            <form className={styles.passwordForm} onSubmit={submitPassword}>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (error) setError('');
                }}
                className={styles.passwordInput}
                placeholder="Password"
                autoFocus
              />
              <button type="submit" className={styles.unlockButton} aria-label="Unlock">
                →
              </button>
            </form>
          </>
        ) : isCreatingAccount ? (
          <form className={styles.setupForm} onSubmit={submitFirstLogin}>
            <p className={styles.prompt}>Create your local sign-in</p>
            <input
              type="text"
              value={setupForm.username}
              onChange={(event) => {
                setSetupForm(prev => ({ ...prev, username: event.target.value }));
                if (error) setError('');
              }}
              className={styles.passwordInput}
              placeholder="Username"
              autoFocus
            />
            <input
              type="password"
              value={setupForm.password}
              onChange={(event) => {
                setSetupForm(prev => ({ ...prev, password: event.target.value }));
                if (error) setError('');
              }}
              className={styles.passwordInput}
              placeholder="Password"
            />
            <div className={styles.setupActions}>
              <button type="submit" className={styles.signInButton}>Save and Sign In</button>
            </div>
          </form>
        ) : (
          <div className={styles.firstLoginActions}>
            <p className={styles.prompt}>Create a local account to unlock this Mac.</p>
            <button
              type="button"
              className={styles.signInButton}
              onClick={() => {
                setIsCreatingAccount(true);
                setError('');
              }}
            >
              Sign In
            </button>
          </div>
        )}

        {error && <p className={styles.errorText}>{error}</p>}
      </div>
    </div>
  );
}