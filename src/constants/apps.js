import { withBase } from '../utils/paths';

export const APPS = [
  { id: 'finder', name: 'Finder', icon: '📁', keywords: ['files', 'desktop', 'browse', 'folders'] },
  { id: 'notes', name: 'Cognito Write', icon: withBase('app_icons/notes.ico'), keywords: ['write', 'notes', 'documents', 'drafts'] },
  { id: 'safari', name: 'Safari', icon: withBase('app_icons/web.ico'), keywords: ['web', 'browser', 'internet'] },
  { id: 'terminal', name: 'Terminal', icon: withBase('app_icons/terminal.ico'), iconLight: withBase('app_icons/terminal_light.ico'), keywords: ['shell', 'console', 'command line'] },
  { id: 'calculator', name: 'Calculator', icon: withBase('app_icons/calculator.ico'), iconLight: withBase('app_icons/calculator_light.ico'), keywords: ['math', 'numbers', 'utility'] },
  { id: 'settings', name: 'Settings', icon: withBase('app_icons/settings.ico'), iconLight: withBase('app_icons/settings_light.ico'), keywords: ['preferences', 'system', 'controls'] }
];

export const DOCK_ITEMS = [
  { id: 'finder', type: 'app' },
  { id: 'launchpad', type: 'launcher', name: 'Launchpad', icon: withBase('app_icons/launchpad.png') },
  { id: 'notes', type: 'app' },
  { id: 'safari', type: 'app' },
  { id: 'terminal', type: 'app' },
  { id: 'calculator', type: 'app' },
  { id: 'settings', type: 'app' }
];

export const LAUNCHPAD_FOLDERS = [
  {
    id: 'create',
    name: 'Create',
    subtitle: 'Writing and idea capture',
    appIds: ['notes', 'safari', 'calculator']
  },
  {
    id: 'system',
    name: 'System',
    subtitle: 'Core tools and setup',
    appIds: ['finder', 'terminal', 'settings']
  }
];

export const LAUNCHPAD_GROUPS = [
  {
    id: 'favorites',
    title: 'Favorites',
    description: 'Daily apps and writing tools',
    appIds: ['finder', 'notes', 'safari']
  },
  {
    id: 'utilities',
    title: 'Utilities',
    description: 'System utilities and controls',
    appIds: ['terminal', 'calculator', 'settings']
  }
];

export const SEARCHABLE_SETTINGS = [
  {
    id: 'account',
    label: 'User Accounts',
    description: 'Manage your local username and password.',
    keywords: ['account', 'login', 'password', 'username', 'user']
  },
  {
    id: 'desktopDock',
    label: 'Desktop and Dock',
    description: 'Adjust Dock magnification and auto-hide behavior.',
    keywords: ['dock', 'desktop', 'magnification', 'auto hide', 'wallpaper']
  },
  {
    id: 'general',
    label: 'General',
    description: 'Browse system-wide preferences.',
    keywords: ['general', 'preferences', 'system']
  },
  {
    id: 'sound',
    label: 'Sound',
    description: 'Review audio output settings and volume behavior.',
    keywords: ['sound', 'audio', 'speaker', 'volume']
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Change light or dark mode and desktop wallpaper.',
    keywords: ['appearance', 'theme', 'dark', 'light', 'wallpaper']
  },
  {
    id: 'privacy',
    label: 'Privacy and Security',
    description: 'Inspect privacy and security controls.',
    keywords: ['privacy', 'security', 'permissions', 'safety']
  }
];