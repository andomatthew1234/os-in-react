import { useState, useEffect, useMemo } from 'react';
import styles from './App.module.css';
import LockScreen from './components/LockScreen';
import Loader from './components/Loader';
import TopMenuBar from './components/TopMenuBar';
import Dock from './components/Dock';
import WindowContainer from './components/WindowContainer';
import Launchpad from './components/Launchpad';
import Spotlight from './components/Spotlight';
import ControlCenter from './components/ControlCenter';
import { APPS, LAUNCHPAD_FOLDERS, LAUNCHPAD_GROUPS, SEARCHABLE_SETTINGS } from './constants/apps';
import { BACKGROUNDS, BACKGROUND_OPTIONS } from './constants/backgrounds';
import { withBase } from './utils/paths';

const SETTINGS_STORAGE_KEY = 'temp_os_settings';
const WINDOW_SESSION_STORAGE_KEY = 'temp_os_window_session';
const LAUNCHPAD_FOLDERS_STORAGE_KEY = 'temp_os_launchpad_folders';
const MENU_BAR_HEIGHT = 28;
const WINDOW_MARGIN = 20;
const WINDOW_GAP = 12;
const STARTUP_SPLASH_MIN_MS = 1500;

const COGNITO_STORAGE_KEY = 'cognito_app_data_v7';

const normalizeSearchText = (value) => String(value ?? '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const getStoredCognitoData = () => {
  if (typeof window === 'undefined') {
    return { notes: {}, documents: {} };
  }

  try {
    return JSON.parse(window.localStorage.getItem(COGNITO_STORAGE_KEY) || '{"notes":{},"documents":{}}');
  } catch {
    return { notes: {}, documents: {} };
  }
};

const getSearchTextScore = (query, value) => {
  if (!query) return 1;
  if (!value) return 0;

  const normalizedValue = normalizeSearchText(value).toLowerCase();
  if (normalizedValue === query) return 120;
  if (normalizedValue.startsWith(query)) return 90;
  if (normalizedValue.includes(query)) return 64;
  return 0;
};

const getTokenSearchScore = (query, value) => {
  if (!query || !value) return 0;

  const normalizedQuery = normalizeSearchText(query).toLowerCase();
  const normalizedValue = normalizeSearchText(value).toLowerCase();
  const queryTerms = normalizedQuery.split(' ').filter(Boolean);
  if (queryTerms.length === 0) return 0;

  const matchedTerms = queryTerms.filter(term => normalizedValue.includes(term));
  if (matchedTerms.length === 0) return 0;

  return 26 + matchedTerms.length * 14 + (matchedTerms.length === queryTerms.length ? 24 : 0);
};

const getSearchScore = (query, value) => Math.max(
  getSearchTextScore(query, value),
  getTokenSearchScore(query, value)
);

const getMatchedExcerpt = (value, query, maxLength = 120) => {
  const normalizedValue = normalizeSearchText(value);
  if (!normalizedValue) return '';

  const normalizedQuery = normalizeSearchText(query).toLowerCase();
  const queryTerms = normalizedQuery.split(' ').filter(Boolean);
  const matchIndex = queryTerms
    .map(term => normalizedValue.toLowerCase().indexOf(term))
    .filter(index => index >= 0)
    .sort((a, b) => a - b)[0];

  if (matchIndex === undefined) {
    return normalizedValue.slice(0, maxLength);
  }

  const start = Math.max(0, matchIndex - 28);
  const end = Math.min(normalizedValue.length, start + maxLength);
  const prefix = start > 0 ? '... ' : '';
  const suffix = end < normalizedValue.length ? ' ...' : '';
  return `${prefix}${normalizedValue.slice(start, end)}${suffix}`;
};

const readStoredLaunchpadFolders = () => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(LAUNCHPAD_FOLDERS_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter(folder => folder?.id && folder?.name && Array.isArray(folder?.appIds))
      : [];
  } catch {
    return [];
  }
};

const buildCognitoSearchResults = (query) => {
  const appData = getStoredCognitoData();
  const notes = Object.values(appData?.notes ?? {}).map(note => ({
    id: `note:${note.id}`,
    title: note.title || 'Untitled note',
    subtitle: (note.content || '').trim().slice(0, 120) || 'Cognito Write note',
    keywords: `${note.title || ''} ${note.content || ''}`,
    type: 'note',
    noteId: note.id,
    score: Math.max(
      getSearchScore(query, note.title),
      getSearchScore(query, note.content)
    )
  }));

  const documents = Object.values(appData?.documents ?? {}).map(doc => {
    const plainTextContent = normalizeSearchText(doc.content || '');

    return {
      id: `doc:${doc.id}`,
      title: doc.title || 'Untitled document',
      subtitle: getMatchedExcerpt(plainTextContent, query) || 'Cognito Write document',
      keywords: `${doc.title || ''} ${plainTextContent}`,
      type: 'document',
      docId: doc.id,
      icon: doc.icon || '📄',
      score: Math.max(
        getSearchScore(query, doc.title),
        getSearchScore(query, plainTextContent)
      )
    };
  });

  return [...notes, ...documents];
};

const getAppIconSource = (app, themeMode) => {
  if (!app) return null;
  const selectedIcon = themeMode === 'light' && app.iconLight ? app.iconLight : app.icon;
  return typeof selectedIcon === 'string' && selectedIcon.startsWith('/') ? selectedIcon : null;
};

const mergeStoredSettings = (updates) => {
  if (typeof window === 'undefined') return;

  try {
    const currentSettings = JSON.parse(window.localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify({ ...currentSettings, ...updates })
    );
  } catch {
    // ignore localStorage write errors
  }
};

const getAppDefaultSize = (appId) => {
  const appSizes = {
    finder: { width: 720, height: 520 },
    notes: { width: 900, height: 620 },
    safari: { width: 760, height: 520 },
    terminal: { width: 620, height: 440 },
    calculator: { width: 500, height: 560 },
    settings: { width: 780, height: 560 }
  };

  return appSizes[appId] ?? { width: 500, height: 350 };
};

const getWindowConstraints = (appId) => ({
  minWidth: appId === 'calculator' ? 380 : appId === 'settings' ? 560 : 420,
  minHeight: appId === 'calculator' ? 460 : 300
});

const getDesktopBounds = () => ({
  x: WINDOW_MARGIN,
  y: MENU_BAR_HEIGHT + 12,
  width: window.innerWidth - WINDOW_MARGIN * 2,
  height: window.innerHeight - MENU_BAR_HEIGHT - 12 - WINDOW_MARGIN
});

const clampWindowFrame = (windowData) => {
  const desktopBounds = getDesktopBounds();
  const constraints = getWindowConstraints(windowData.appId);

  const width = Math.max(constraints.minWidth, Math.min(windowData.width, desktopBounds.width));
  const height = Math.max(constraints.minHeight, Math.min(windowData.height, desktopBounds.height));
  const x = Math.max(-width + 50, Math.min(windowData.x, window.innerWidth - 50));
  const y = Math.max(MENU_BAR_HEIGHT, Math.min(windowData.y, window.innerHeight - 40));

  return {
    ...windowData,
    width,
    height,
    x,
    y
  };
};

const getCenteredWindowFrame = (appId, index) => {
  const desktopBounds = getDesktopBounds();
  const defaultSize = getAppDefaultSize(appId);
  const width = Math.min(defaultSize.width, desktopBounds.width);
  const height = Math.min(defaultSize.height, desktopBounds.height);
  const offset = index * 20;

  return {
    width,
    height,
    x: Math.min(
      Math.max(desktopBounds.x + offset, desktopBounds.x + (desktopBounds.width - width) / 2 + offset),
      window.innerWidth - width - WINDOW_MARGIN
    ),
    y: Math.min(
      Math.max(desktopBounds.y + offset, desktopBounds.y + (desktopBounds.height - height) / 2 + offset),
      window.innerHeight - height - WINDOW_MARGIN
    )
  };
};

const getSnapFrame = (target) => {
  const desktopBounds = getDesktopBounds();
  const halfWidth = (desktopBounds.width - WINDOW_GAP) / 2;
  const halfHeight = (desktopBounds.height - WINDOW_GAP) / 2;
  const leftX = desktopBounds.x;
  const rightX = desktopBounds.x + halfWidth + WINDOW_GAP;
  const topY = desktopBounds.y;
  const bottomY = desktopBounds.y + halfHeight + WINDOW_GAP;

  switch (target) {
    case 'maximize':
      return { ...desktopBounds };
    case 'left':
      return { x: leftX, y: topY, width: halfWidth, height: desktopBounds.height };
    case 'right':
      return { x: rightX, y: topY, width: halfWidth, height: desktopBounds.height };
    case 'topLeft':
      return { x: leftX, y: topY, width: halfWidth, height: halfHeight };
    case 'topRight':
      return { x: rightX, y: topY, width: halfWidth, height: halfHeight };
    case 'bottomLeft':
      return { x: leftX, y: bottomY, width: halfWidth, height: halfHeight };
    case 'bottomRight':
      return { x: rightX, y: bottomY, width: halfWidth, height: halfHeight };
    default:
      return null;
  }
};

const readStoredWindowSession = () => {
  if (typeof window === 'undefined') {
    return { windows: [], focusedWindowId: null };
  }

  try {
    const stored = window.localStorage.getItem(WINDOW_SESSION_STORAGE_KEY);
    if (!stored) return { windows: [], focusedWindowId: null };

    const parsed = JSON.parse(stored);
    const knownAppIds = new Set(APPS.map(app => app.id));
    const restoredWindows = Array.isArray(parsed?.windows)
      ? parsed.windows
        .filter(item => knownAppIds.has(item.appId))
        .map(item => clampWindowFrame({
          ...item,
          minimized: Boolean(item.minimized),
          maximized: Boolean(item.maximized),
          prevBounds: item.prevBounds ?? null,
          snapTarget: item.snapTarget ?? null
        }))
      : [];

    const focusedWindowId = restoredWindows.some(item => item.id === parsed?.focusedWindowId)
      ? parsed.focusedWindowId
      : restoredWindows.at(-1)?.id ?? null;

    return { windows: restoredWindows, focusedWindowId };
  } catch {
    return { windows: [], focusedWindowId: null };
  }
};

export default function App() {
  const [bootStartedAt, setBootStartedAt] = useState(() => Date.now());
  const [windows, setWindows] = useState(() => readStoredWindowSession().windows);
  const [focusedWindowId, setFocusedWindowId] = useState(() => readStoredWindowSession().focusedWindowId);
  const [hasCompletedDesktopBoot, setHasCompletedDesktopBoot] = useState(false);
  const [bootPhase, setBootPhase] = useState('splash');
  const [snapPreview, setSnapPreview] = useState(null);
  const [parallaxOffset, setParallaxOffset] = useState({ x: 0, y: 0 });
  const [isBackgroundLoaded, setIsBackgroundLoaded] = useState(false);
  const [desktopPreloadProgress, setDesktopPreloadProgress] = useState(0);
  const [startupLogoSrc, setStartupLogoSrc] = useState(withBase('app_icons/apple.webp'));
  const [themeTransition, setThemeTransition] = useState(null);
  const [launchpadOpen, setLaunchpadOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const [systemDialog, setSystemDialog] = useState(null);
  const [spotlightQuery, setSpotlightQuery] = useState('');
  const [launchpadFolderRequest, setLaunchpadFolderRequest] = useState(null);
  const [customLaunchpadFolders, setCustomLaunchpadFolders] = useState(() => readStoredLaunchpadFolders());
  const [requestedSettingsPane, setRequestedSettingsPane] = useState(null);
  const [notesCommand, setNotesCommand] = useState(null);
  const [backgroundSelection, setBackgroundSelection] = useState(() => {
    if (typeof window === 'undefined') {
      return { id: 'mojave', variant: 'light' };
    }

    try {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) return { id: 'mojave', variant: 'light' };
      const parsed = JSON.parse(stored);
      return parsed?.backgroundSelection ?? { id: 'mojave', variant: 'light' };
    } catch {
      return { id: 'mojave', variant: 'light' };
    }
  });

  const [themeMode, setThemeMode] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }

    try {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) return 'light';
      const parsed = JSON.parse(stored);
      return parsed?.themeMode ?? 'light';
    } catch {
      return 'light';
    }
  });
  const [dockSettings, setDockSettings] = useState(() => {
    if (typeof window === 'undefined') {
      return { magnification: true, autoHide: false };
    }

    try {
      const stored = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (!stored) return { magnification: true, autoHide: false };
      const parsed = JSON.parse(stored);
      return {
        magnification: parsed?.dockSettings?.magnification ?? true,
        autoHide: parsed?.dockSettings?.autoHide ?? false
      };
    } catch {
      return { magnification: true, autoHide: false };
    }
  });

  const bringToFront = (id) => {
    setFocusedWindowId(id);
    setWindows(prev => {
      const maxZ = Math.max(0, ...prev.map(w => w.zIndex));
      return prev.map(w => w.id === id ? { ...w, zIndex: maxZ + 1 } : w);
    });
  };

  const updateBackgroundSelection = (id, variant) => {
    setBackgroundSelection({ id, variant });
  };

  const updateThemeMode = (mode) => {
    if (mode === themeMode) return;

    setThemeTransition({ from: themeMode, to: mode, reveal: false, key: Date.now() });
    setThemeMode(mode);
    const option = BACKGROUND_OPTIONS.find(opt => opt.id === backgroundSelection.id);
    if (option?.type === 'lightdark') {
      setBackgroundSelection(prev => ({ id: prev.id, variant: mode }));
    }
  };

  const updateDockSettings = (updates) => {
    setDockSettings(prev => ({ ...prev, ...updates }));
  };

  const closeOverlays = () => {
    setLaunchpadOpen(false);
    setSpotlightOpen(false);
    setControlCenterOpen(false);
    setLaunchpadFolderRequest(null);
    setSpotlightQuery('');
  };

  const closeSystemDialog = () => setSystemDialog(null);

  useEffect(() => {
    mergeStoredSettings({ backgroundSelection, themeMode });
  }, [backgroundSelection, themeMode]);

  useEffect(() => {
    mergeStoredSettings({ dockSettings });
  }, [dockSettings]);

  useEffect(() => {
    if (!themeTransition) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      setThemeTransition(current => (current ? { ...current, reveal: true } : current));
    });
    const timeoutId = window.setTimeout(() => setThemeTransition(null), 560);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [themeTransition]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LAUNCHPAD_FOLDERS_STORAGE_KEY, JSON.stringify(customLaunchpadFolders));
    } catch {
      // ignore localStorage write errors
    }
  }, [customLaunchpadFolders]);

  useEffect(() => {
    const currentBackground = BACKGROUNDS[backgroundSelection.id];
    const nextBackgroundUrl = currentBackground?.variants[backgroundSelection.variant] ?? Object.values(currentBackground?.variants ?? {})[0];

    if (!nextBackgroundUrl) {
      setIsBackgroundLoaded(true);
      return;
    }

    setIsBackgroundLoaded(false);
    const image = new Image();
    image.onload = () => setIsBackgroundLoaded(true);
    image.onerror = () => setIsBackgroundLoaded(true);
    image.src = nextBackgroundUrl;
  }, [backgroundSelection, themeMode]);

  useEffect(() => {
    if (bootPhase === 'splash' && isBackgroundLoaded) {
      const elapsed = Date.now() - bootStartedAt;
      const remaining = Math.max(0, STARTUP_SPLASH_MIN_MS - elapsed);

      const timeoutId = window.setTimeout(() => setBootPhase('lock'), remaining);
      return () => window.clearTimeout(timeoutId);
    }

    return undefined;
  }, [bootPhase, bootStartedAt, isBackgroundLoaded]);

  useEffect(() => {
    if (bootPhase !== 'shutdown') return undefined;

    const wake = () => {
      setBootStartedAt(Date.now());
      setHasCompletedDesktopBoot(false);
      setDesktopPreloadProgress(0);
      setBootPhase('splash');
    };

    window.addEventListener('keydown', wake, { once: true });
    return () => window.removeEventListener('keydown', wake);
  }, [bootPhase]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        WINDOW_SESSION_STORAGE_KEY,
        JSON.stringify({ windows, focusedWindowId })
      );
    } catch {
      // ignore localStorage write errors
    }
  }, [windows, focusedWindowId]);

  useEffect(() => {
    const handleResize = () => {
      setWindows(prev => prev.map(windowData => {
        if (windowData.maximized) {
          return {
            ...windowData,
            ...getSnapFrame('maximize')
          };
        }

        if (windowData.snapTarget) {
          const snapFrame = getSnapFrame(windowData.snapTarget);
          if (!snapFrame) {
            return clampWindowFrame({ ...windowData, snapTarget: null });
          }

          return {
            ...windowData,
            ...snapFrame
          };
        }

        return clampWindowFrame(windowData);
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (bootPhase !== 'desktop') return undefined;

    const handleKeyDown = (event) => {
      const metaKey = event.metaKey || event.ctrlKey;

      if (metaKey && event.code === 'Space') {
        event.preventDefault();
        setLaunchpadOpen(false);
        setControlCenterOpen(false);
        setSpotlightOpen(prev => !prev);
        if (spotlightOpen) {
          setSpotlightQuery('');
        }
        return;
      }

      if (event.key === 'F4') {
        event.preventDefault();
        setSpotlightOpen(false);
        setControlCenterOpen(false);
        setLaunchpadOpen(prev => !prev);
        return;
      }

      if (event.altKey && event.code === 'Space') {
        event.preventDefault();
        setSpotlightOpen(false);
        setControlCenterOpen(false);
        setLaunchpadOpen(prev => !prev);
        return;
      }

      if (event.key === 'Escape') {
        closeOverlays();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bootPhase, spotlightOpen]);

  const getTopVisibleWindowId = (windowList, excludeId = null) => windowList
    .filter(item => !item.minimized && item.id !== excludeId)
    .sort((a, b) => b.zIndex - a.zIndex)[0]?.id ?? null;

  const openWindow = (appId) => {
    const app = APPS.find(a => a.id === appId);
    if (!app) return;

    const id = `win-${Date.now()}`;
    const maxZ = Math.max(0, ...windows.map(w => w.zIndex));
    const frame = getCenteredWindowFrame(appId, windows.length);

    const newWindow = {
      id,
      appId,
      title: app.name,
      ...frame,
      zIndex: maxZ + 1,
      minimized: false,
      maximized: false,
      prevBounds: null,
      snapTarget: null
    };

    setWindows(prev => [...prev, newWindow]);
    setFocusedWindowId(id);
  };

  const activateApp = (appId) => {
    const appWindows = windows.filter(windowData => windowData.appId === appId);
    const visibleWindows = appWindows.filter(windowData => !windowData.minimized);
    const minimizedWindows = appWindows.filter(windowData => windowData.minimized);

    if (visibleWindows.length > 0) {
      bringToFront(visibleWindows[visibleWindows.length - 1].id);
      return;
    }

    if (minimizedWindows.length > 0) {
      restoreWindow(minimizedWindows[minimizedWindows.length - 1].id);
      return;
    }

    openWindow(appId);
  };

  const minimizeWindow = (id) => {
    setWindows(prev => {
      const next = prev.map(w => w.id === id ? { ...w, minimized: true } : w);
      setFocusedWindowId(getTopVisibleWindowId(next, id));
      return next;
    });
  };

  const restoreWindow = (id) => {
    setWindows(prev => {
      const maxZ = Math.max(0, ...prev.map(w => w.zIndex));
      return prev.map(w => w.id === id ? { ...w, minimized: false, zIndex: maxZ + 1 } : w);
    });
    setFocusedWindowId(id);
  };

  const maximizeWindow = (id) => {
    setWindows(prev => {
      const maxZ = Math.max(0, ...prev.map(w => w.zIndex));
      return prev.map(w => {
        if (w.id !== id) return w;
        if (w.maximized) {
          const { x, y, width, height } = w.prevBounds ?? w;
          return {
            ...w,
            maximized: false,
            x,
            y,
            width,
            height,
            prevBounds: null,
            snapTarget: null,
            zIndex: maxZ + 1
          };
        }

        return {
          ...w,
          maximized: true,
          prevBounds: w.prevBounds ?? { x: w.x, y: w.y, width: w.width, height: w.height },
          ...getSnapFrame('maximize'),
          snapTarget: 'maximize',
          zIndex: maxZ + 1
        };
      });
    });
    setFocusedWindowId(id);
  };

  const closeWindow = (id) => {
    setWindows(prev => {
      const next = prev.filter(w => w.id !== id);
      setFocusedWindowId(getTopVisibleWindowId(next));
      return next;
    });
  };

  const quitApp = (appId) => {
    if (appId === 'finder') {
      return;
    }

    setWindows(prev => {
      const next = prev.filter(w => w.appId !== appId);
      setFocusedWindowId(getTopVisibleWindowId(next));
      return next;
    });
  };

  const updateWindowPosition = (id, x, y) => {
    setWindows(prev => prev.map(w => w.id === id ? { ...w, x, y, maximized: false, snapTarget: null } : w));
  };

  const updateWindowBounds = (id, nextBounds, direction = 'bottomRight') => {
    setWindows(prev => prev.map(w => {
      if (w.id !== id) return w;

      const minWidth = w.appId === 'calculator' ? 380 : 420;
      const minHeight = w.appId === 'calculator' ? 460 : 300;
      const normalizedDirection = direction.toLowerCase();
      const maxWidth = window.innerWidth - 20;
      const maxHeight = window.innerHeight - 40;

      const baseX = nextBounds?.x ?? w.x;
      const baseY = nextBounds?.y ?? w.y;
      const baseWidth = nextBounds?.width ?? w.width;
      const baseHeight = nextBounds?.height ?? w.height;

      let width = Math.max(minWidth, Math.min(baseWidth, maxWidth));
      let height = Math.max(minHeight, Math.min(baseHeight, maxHeight));

      let x = baseX;
      let y = baseY;

      if (normalizedDirection.includes('left')) {
        const rightEdge = baseX + baseWidth;
        x = rightEdge - width;
      }

      if (normalizedDirection.includes('top')) {
        const bottomEdge = baseY + baseHeight;
        y = bottomEdge - height;
      }

      const clampedX = Math.max(-width + 50, Math.min(x, window.innerWidth - 50));
      const clampedY = Math.max(28, Math.min(y, window.innerHeight - 40));

      return {
        ...w,
        width,
        height,
        x: clampedX,
        y: clampedY,
        maximized: false,
        prevBounds: null,
        snapTarget: null
      };
    }));
  };

  const applySnapTarget = (id, target) => {
    const frame = getSnapFrame(target);
    if (!frame) return;

    setWindows(prev => {
      const maxZ = Math.max(0, ...prev.map(windowData => windowData.zIndex));
      return prev.map(windowData => {
        if (windowData.id !== id) return windowData;

        return {
          ...windowData,
          ...frame,
          minimized: false,
          maximized: target === 'maximize',
          prevBounds: windowData.prevBounds ?? { x: windowData.x, y: windowData.y, width: windowData.width, height: windowData.height },
          snapTarget: target,
          zIndex: maxZ + 1
        };
      });
    });

    setFocusedWindowId(id);
    setSnapPreview(null);
  };

  const centerWindow = (id) => {
    setWindows(prev => prev.map(windowData => {
      if (windowData.id !== id) return windowData;

      const desktopBounds = getDesktopBounds();
      return {
        ...windowData,
        x: desktopBounds.x + (desktopBounds.width - windowData.width) / 2,
        y: desktopBounds.y + (desktopBounds.height - windowData.height) / 2,
        maximized: false,
        snapTarget: null,
        prevBounds: null
      };
    }));
  };

  const tileVisibleWindows = () => {
    const visibleWindows = windows
      .filter(windowData => !windowData.minimized)
      .sort((a, b) => a.zIndex - b.zIndex);

    if (visibleWindows.length === 0) return;

    const desktopBounds = getDesktopBounds();
    const nextFrames = new Map();

    if (visibleWindows.length === 1) {
      nextFrames.set(visibleWindows[0].id, getSnapFrame('maximize'));
    } else if (visibleWindows.length === 2) {
      nextFrames.set(visibleWindows[0].id, getSnapFrame('left'));
      nextFrames.set(visibleWindows[1].id, getSnapFrame('right'));
    } else if (visibleWindows.length === 3) {
      nextFrames.set(visibleWindows[0].id, getSnapFrame('left'));
      nextFrames.set(visibleWindows[1].id, getSnapFrame('topRight'));
      nextFrames.set(visibleWindows[2].id, getSnapFrame('bottomRight'));
    } else {
      const columns = Math.ceil(Math.sqrt(visibleWindows.length));
      const rows = Math.ceil(visibleWindows.length / columns);
      const cellWidth = (desktopBounds.width - WINDOW_GAP * (columns - 1)) / columns;
      const cellHeight = (desktopBounds.height - WINDOW_GAP * (rows - 1)) / rows;

      visibleWindows.forEach((windowData, index) => {
        const column = index % columns;
        const row = Math.floor(index / columns);

        nextFrames.set(windowData.id, {
          x: desktopBounds.x + column * (cellWidth + WINDOW_GAP),
          y: desktopBounds.y + row * (cellHeight + WINDOW_GAP),
          width: cellWidth,
          height: cellHeight
        });
      });
    }

    setWindows(prev => prev.map(windowData => {
      const frame = nextFrames.get(windowData.id);
      if (!frame) return windowData;

      return {
        ...windowData,
        ...frame,
        maximized: false,
        snapTarget: null,
        prevBounds: windowData.prevBounds ?? { x: windowData.x, y: windowData.y, width: windowData.width, height: windowData.height }
      };
    }));
  };

  const showSnapPreview = (id, target) => {
    if (!target) {
      setSnapPreview(prev => (prev?.id === id ? null : prev));
      return;
    }

    const frame = getSnapFrame(target);
    if (!frame) return;

    setSnapPreview({ id, target, ...frame });
  };

  const clearSnapPreview = () => setSnapPreview(null);

  const handleDesktopMouseMove = (event) => {
    const xRatio = event.clientX / window.innerWidth - 0.5;
    const yRatio = event.clientY / window.innerHeight - 0.5;
    const dampedX = Math.abs(xRatio) < 0.045 ? 0 : xRatio;
    const dampedY = Math.abs(yRatio) < 0.045 ? 0 : yRatio;

    setParallaxOffset({
      x: dampedX * 7,
      y: dampedY * 5
    });
  };

  const handleDesktopMouseLeave = () => {
    setParallaxOffset({ x: 0, y: 0 });
  };

  const openSettingsPane = (paneId) => {
    mergeStoredSettings({ activeItem: paneId });
    setRequestedSettingsPane({ paneId, token: Date.now() });
    activateApp('settings');
    closeOverlays();
  };

  const openCognitoItem = (command) => {
    setNotesCommand({ ...command, token: Date.now() });
    activateApp('notes');
    closeOverlays();
  };

  const lockDesktop = () => {
    closeOverlays();
    setBootPhase('lock');
  };

  const rebootSystem = () => {
    closeOverlays();
    closeSystemDialog();
    setWindows([]);
    setFocusedWindowId(null);
    setLaunchpadFolderRequest(null);
    setNotesCommand(null);
    setRequestedSettingsPane(null);
    setDesktopPreloadProgress(0);
    setHasCompletedDesktopBoot(false);
    setBootStartedAt(Date.now());
    setBootPhase('splash');
  };

  const shutDownSystem = () => {
    closeOverlays();
    closeSystemDialog();
    setWindows([]);
    setFocusedWindowId(null);
    setLaunchpadFolderRequest(null);
    setNotesCommand(null);
    setRequestedSettingsPane(null);
    setDesktopPreloadProgress(0);
    setHasCompletedDesktopBoot(false);
    setBootPhase('shutdown');
  };

  const resetThisMac = () => {
    if (typeof window !== 'undefined') {
      [
        SETTINGS_STORAGE_KEY,
        WINDOW_SESSION_STORAGE_KEY,
        LAUNCHPAD_FOLDERS_STORAGE_KEY,
        COGNITO_STORAGE_KEY,
        'last_view_v7'
      ].forEach(key => window.localStorage.removeItem(key));
    }

    setBackgroundSelection({ id: 'mojave', variant: 'light' });
    setThemeMode('light');
    setDockSettings({ magnification: true, autoHide: false });
    setCustomLaunchpadFolders([]);
    setNotesCommand(null);
    setRequestedSettingsPane(null);
    rebootSystem();
  };

  const openAboutThisMac = () => {
    closeOverlays();
    setSystemDialog({ type: 'about' });
  };

  const confirmResetThisMac = () => {
    closeOverlays();
    setSystemDialog({
      type: 'confirmReset',
      title: 'Reset this Mac?',
      message: 'This will permanently erase your Cognito Write files, local account, Launchpad folders, desktop preferences, and saved window session from this browser.',
      confirmLabel: 'Erase and Restart'
    });
  };

  const combinedLaunchpadFolders = useMemo(
    () => [...LAUNCHPAD_FOLDERS, ...customLaunchpadFolders],
    [customLaunchpadFolders]
  );

  const saveLaunchpadFolder = (folder) => {
    setCustomLaunchpadFolders(prev => {
      const nextFolder = {
        id: folder.id ?? `custom-folder-${Date.now()}`,
        name: folder.name.trim(),
        subtitle: folder.subtitle.trim() || 'Custom app folder',
        appIds: Array.from(new Set(folder.appIds)).filter(appId => APPS.some(app => app.id === appId)),
        isCustom: true
      };

      const existingIndex = prev.findIndex(item => item.id === nextFolder.id);
      if (existingIndex === -1) {
        return [...prev, nextFolder];
      }

      const nextFolders = [...prev];
      nextFolders[existingIndex] = nextFolder;
      return nextFolders;
    });
  };

  const deleteLaunchpadFolder = (folderId) => {
    setCustomLaunchpadFolders(prev => prev.filter(folder => folder.id !== folderId));
    setLaunchpadFolderRequest(null);
  };

  const preloadImage = (src) => new Promise(resolve => {
    if (!src) {
      resolve();
      return;
    }

    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });

  const preloadRequest = (resource) => fetch(resource, { credentials: 'same-origin' })
    .then(() => undefined)
    .catch(() => undefined);

  const preloadDesktopSession = async () => {
    const currentBackground = BACKGROUNDS[backgroundSelection.id];
    const nextBackgroundUrl = currentBackground?.variants[backgroundSelection.variant] ?? Object.values(currentBackground?.variants ?? {})[0];
    const iconUrls = APPS.flatMap(app => [app.icon, app.iconLight]).filter(url => typeof url === 'string' && url.startsWith('/'));
    const imageUrls = Array.from(new Set([
      nextBackgroundUrl,
      withBase('app_icons/loader.gif'),
      withBase('app_icons/logo.ico'),
      withBase('app_icons/apple.webp'),
      ...iconUrls
    ].filter(Boolean)));

    const resourcePromises = [
      ...imageUrls.map(preloadImage),
      preloadRequest(withBase('notes/index.html')),
      preloadRequest(withBase('safari/index.html'))
    ];

    const startedAt = Date.now();
    let completed = 0;
    const total = resourcePromises.length || 1;

    const updateProgress = () => {
      const assetProgress = completed / total;
      const timedProgress = Math.min((Date.now() - startedAt) / 3000, 1);
      const nextProgress = Math.min(0.96, Math.max(assetProgress * 0.92, timedProgress * 0.96));
      setDesktopPreloadProgress(nextProgress);
    };

    updateProgress();
    const timer = window.setInterval(updateProgress, 100);

    await Promise.allSettled(resourcePromises.map(promise => promise.finally(() => {
      completed += 1;
      updateProgress();
    })));

    const remaining = Math.max(0, 3000 - (Date.now() - startedAt));
    if (remaining > 0) {
      await new Promise(resolve => window.setTimeout(resolve, remaining));
    }

    window.clearInterval(timer);
    setDesktopPreloadProgress(1);
  };

  const handleUnlock = async () => {
    if (hasCompletedDesktopBoot) {
      setBootPhase('desktop');
      return;
    }

    setBootPhase('desktopLoading');
    setDesktopPreloadProgress(0);
    await preloadDesktopSession();
    setHasCompletedDesktopBoot(true);
    window.setTimeout(() => setBootPhase('desktop'), 80);
  };

  const appLookup = useMemo(
    () => Object.fromEntries(APPS.map(app => [app.id, app])),
    []
  );

  const spotlightResults = useMemo(() => {
    const query = spotlightQuery.trim().toLowerCase();
    const appResults = APPS.map(app => ({
      id: `app:${app.id}`,
      kind: 'App',
      title: app.name,
      subtitle: `${app.keywords?.join(', ') || 'Application'} in Launchpad`,
      icon: app.icon,
      iconSrc: getAppIconSource(app, themeMode),
      score: Math.max(
        getSearchTextScore(query, app.name),
        getSearchTextScore(query, app.keywords?.join(' '))
      ),
      action: () => {
        activateApp(app.id);
        closeOverlays();
      }
    }));

    const folderResults = combinedLaunchpadFolders.map(folder => ({
      id: `folder:${folder.id}`,
      kind: 'Folder',
      title: folder.name,
      subtitle: folder.subtitle,
      icon: '[]',
      score: Math.max(
        getSearchScore(query, folder.name),
        getSearchScore(query, folder.subtitle),
        getSearchScore(query, folder.appIds.map(appId => appLookup[appId]?.name || '').join(' '))
      ),
      action: () => {
        setControlCenterOpen(false);
        setSpotlightOpen(false);
        setLaunchpadFolderRequest({ folderId: folder.id, token: Date.now() });
        setLaunchpadOpen(true);
      }
    }));

    const settingsResults = SEARCHABLE_SETTINGS.map(item => ({
      id: `settings:${item.id}`,
      kind: 'Setting',
      title: item.label,
      subtitle: item.description,
      icon: 'S',
      score: Math.max(
        getSearchTextScore(query, item.label),
        getSearchTextScore(query, item.keywords?.join(' ')),
        getSearchTextScore(query, item.description)
      ),
      action: () => openSettingsPane(item.id)
    }));

    const quickActions = [
      {
        id: 'quick:launchpad',
        kind: 'Action',
        title: 'Open Launchpad',
        subtitle: 'Browse grouped apps and folders.',
        icon: 'L',
        score: Math.max(getSearchScore(query, 'launchpad browse apps'), query ? 0 : 70),
        action: () => {
          setControlCenterOpen(false);
          setSpotlightOpen(false);
          setLaunchpadOpen(true);
        }
      },
      {
        id: 'quick:lock',
        kind: 'Action',
        title: 'Lock Screen',
        subtitle: 'Return to the lock screen immediately.',
        icon: 'L',
        score: Math.max(getSearchScore(query, 'lock screen security'), query ? 0 : 66),
        action: lockDesktop
      },
      {
        id: 'quick:dark',
        kind: 'Action',
        title: themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        subtitle: 'Change appearance instantly.',
        icon: 'A',
        score: Math.max(getSearchScore(query, 'dark mode light appearance theme'), query ? 0 : 62),
        action: () => {
          updateThemeMode(themeMode === 'dark' ? 'light' : 'dark');
          closeOverlays();
        }
      }
    ];

    const cognitoResults = buildCognitoSearchResults(query).map(item => ({
      id: item.id,
      kind: item.type === 'note' ? 'Note' : 'Document',
      title: item.title,
      subtitle: item.subtitle,
      icon: item.type === 'note' ? 'N' : item.icon || '📄',
      score: item.score,
      action: () => openCognitoItem(item.type === 'note'
        ? { type: 'temp_os_open_note', noteId: item.noteId }
        : { type: 'temp_os_open_doc', docId: item.docId })
    }));

    return [...quickActions, ...appResults, ...folderResults, ...settingsResults, ...cognitoResults]
      .filter(item => query ? item.score > 0 : item.score >= 60)
      .sort((a, b) => b.score - a.score)
      .slice(0, 14);
  }, [spotlightQuery, themeMode, windows, combinedLaunchpadFolders, appLookup]);

  const focusedApp = windows.find(w => w.id === focusedWindowId);
  const focusedAppTitle = focusedApp?.title || 'Finder';
  const focusedAppId = focusedApp?.appId || 'finder';
  const currentBackground = BACKGROUNDS[backgroundSelection.id];
  const backgroundUrl = currentBackground?.variants[backgroundSelection.variant] ?? Object.values(currentBackground?.variants ?? {})[0];
  const menuActions = {
    openNewWindow: () => openWindow(focusedAppId),
    closeFocusedWindow: () => focusedWindowId && closeWindow(focusedWindowId),
    minimizeFocusedWindow: () => focusedWindowId && minimizeWindow(focusedWindowId),
    maximizeFocusedWindow: () => focusedWindowId && maximizeWindow(focusedWindowId),
    centerFocusedWindow: () => focusedWindowId && centerWindow(focusedWindowId),
    snapFocusedWindow: (target) => focusedWindowId && applySnapTarget(focusedWindowId, target),
    tileVisibleWindows,
    quitFocusedApp: () => quitApp(focusedAppId)
  };

  if (bootPhase === 'splash') {
    return (
      <div className={styles.startupSplash}>
        <img
          src={startupLogoSrc}
          alt="Apple"
          className={styles.startupLogo}
          onError={() => {
            if (startupLogoSrc !== withBase('app_icons/logo.ico')) {
              setStartupLogoSrc(withBase('app_icons/logo.ico'));
            }
          }}
        />
      </div>
    );
  }

  if (bootPhase === 'shutdown') {
    return <div className={styles.shutdownScreen} />;
  }

  if (bootPhase === 'lock') {
    return <LockScreen backgroundUrl={backgroundUrl} backgroundReady={isBackgroundLoaded} onUnlock={handleUnlock} />;
  }

  if (bootPhase === 'desktopLoading') {
    return (
      <div
        className={styles.desktopPreloadScreen}
        style={{
          backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined
        }}
      >
        <div className={styles.desktopPreloadTint} />
        <div className={styles.desktopPreloadPanel}>
          <div className={styles.desktopPreloadBar}>
            <div className={styles.desktopPreloadFill} style={{ width: `${desktopPreloadProgress * 100}%` }} />
          </div>
        </div>
      </div>
    );
  }

  if (bootPhase !== 'desktop') {
    return null;
  }

  return (
    <div
      className={`${styles.desktop} ${styles[themeMode]}`}
      onMouseMove={handleDesktopMouseMove}
      onMouseLeave={handleDesktopMouseLeave}
      style={{
        backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
        backgroundPosition: `calc(50% + ${parallaxOffset.x}px) calc(50% + ${parallaxOffset.y}px)`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundColor: themeMode === 'dark' ? 'rgba(0, 0, 0, 0.18)' : 'rgba(255, 255, 255, 0.08)',
        backgroundBlendMode: 'overlay'
      }}
    >
      <TopMenuBar 
        focusedAppTitle={focusedAppTitle} 
        focusedAppId={focusedAppId} 
        menuActions={menuActions}
        themeMode={themeMode}
        logoSrc={withBase('app_icons/logo.ico')}
        overlayState={{ spotlight: spotlightOpen, controlCenter: controlCenterOpen }}
        systemActions={{
          aboutThisMac: openAboutThisMac,
          restart: rebootSystem,
          shutDown: shutDownSystem,
          lockScreen: lockDesktop,
          resetThisMac: confirmResetThisMac
        }}
        onToggleSpotlight={() => {
          setLaunchpadOpen(false);
          setControlCenterOpen(false);
          setSpotlightOpen(prev => !prev);
          if (spotlightOpen) {
            setSpotlightQuery('');
          }
        }}
        onToggleControlCenter={() => {
          setLaunchpadOpen(false);
          setSpotlightOpen(false);
          setControlCenterOpen(prev => !prev);
        }}
      />
      <Launchpad
        open={launchpadOpen}
        themeMode={themeMode}
        appLookup={appLookup}
        folders={combinedLaunchpadFolders}
        customFolders={customLaunchpadFolders}
        groups={LAUNCHPAD_GROUPS}
        requestedFolder={launchpadFolderRequest}
        onSaveFolder={saveLaunchpadFolder}
        onDeleteFolder={deleteLaunchpadFolder}
        onClose={() => {
          setLaunchpadOpen(false);
          setLaunchpadFolderRequest(null);
        }}
        onOpenApp={(appId) => {
          activateApp(appId);
          setLaunchpadOpen(false);
          setLaunchpadFolderRequest(null);
        }}
      />
      <Spotlight
        open={spotlightOpen}
        query={spotlightQuery}
        onQueryChange={setSpotlightQuery}
        onClose={() => {
          setSpotlightOpen(false);
          setSpotlightQuery('');
        }}
        themeMode={themeMode}
        results={spotlightResults}
      />
      <ControlCenter
        open={controlCenterOpen}
        themeMode={themeMode}
        dockSettings={dockSettings}
        onClose={() => setControlCenterOpen(false)}
        onLock={lockDesktop}
        onToggleTheme={() => updateThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
        updateDockSettings={updateDockSettings}
      />
      {!isBackgroundLoaded && (
        <div className={styles.desktopLoaderOverlay}>
          <Loader label="Loading desktop wallpaper" />
        </div>
      )}
      {snapPreview && (
        <div
          className={styles.snapPreview}
          style={{
            left: snapPreview.x,
            top: snapPreview.y,
            width: snapPreview.width,
            height: snapPreview.height
          }}
        />
      )}
      <WindowContainer
        windows={windows}
        focusedWindowId={focusedWindowId}
        bringToFront={bringToFront}
        closeWindow={closeWindow}
        updateWindowPosition={updateWindowPosition}
        updateWindowBounds={updateWindowBounds}
        applySnapTarget={applySnapTarget}
        showSnapPreview={showSnapPreview}
        clearSnapPreview={clearSnapPreview}
        minimizeWindow={minimizeWindow}
        maximizeWindow={maximizeWindow}
        openWindow={openWindow}
        backgroundSelection={backgroundSelection}
        updateBackgroundSelection={updateBackgroundSelection}
        themeMode={themeMode}
        updateThemeMode={updateThemeMode}
        dockSettings={dockSettings}
        updateDockSettings={updateDockSettings}
        requestedSettingsPane={requestedSettingsPane}
        notesCommand={notesCommand}
      />
      {themeTransition && (
        <div
          className={`${styles.themeTransitionOverlay} ${styles[themeTransition.from]} ${themeTransition.reveal ? styles.themeTransitionReveal : ''}`}
        >
          <div className={styles.themeTransitionGlow} />
        </div>
      )}
      {systemDialog && (
        <div className={styles.systemDialogBackdrop} onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeSystemDialog();
          }
        }}>
          <div className={styles.systemDialog}>
            {systemDialog.type === 'about' ? (
              <>
                <div className={styles.aboutMacIcon}>💻</div>
                <h2 className={styles.systemDialogTitle}>About this Mac</h2>
                <div className={styles.aboutMacMeta}>
                  <strong>PCbook 13.6&quot;</strong>
                  <span>InfinityReact OS</span>
                </div>
                <div className={styles.systemDialogActions}>
                  <button type="button" className={styles.systemDialogButtonPrimary} onClick={closeSystemDialog}>Close</button>
                </div>
              </>
            ) : (
              <>
                <h2 className={styles.systemDialogTitle}>{systemDialog.title}</h2>
                <p className={styles.systemDialogMessage}>{systemDialog.message}</p>
                <div className={styles.systemDialogActions}>
                  <button type="button" className={styles.systemDialogButtonSecondary} onClick={closeSystemDialog}>Cancel</button>
                  <button type="button" className={styles.systemDialogButtonDanger} onClick={resetThisMac}>{systemDialog.confirmLabel}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      <Dock 
        windows={windows} 
        openWindow={openWindow} 
        restoreWindow={restoreWindow}
        bringToFront={bringToFront} 
        quitApp={quitApp}
        themeMode={themeMode}
        dockSettings={dockSettings}
        toggleLaunchpad={() => {
          setSpotlightOpen(false);
          setControlCenterOpen(false);
          setLaunchpadFolderRequest(null);
          setLaunchpadOpen(prev => !prev);
        }}
        launchpadOpen={launchpadOpen}
      />
    </div>
  );
}