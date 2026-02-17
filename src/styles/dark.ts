/**
 * Dark theme UI chrome tokens.
 * These control the application shell appearance (toolbar, panels, sidebars, menus)
 * and are independent of the diagram canvas styles.
 */
export const darkTheme = {
  /* ── Surfaces ─────────────────────────────────────── */
  bgPrimary: '#111118',
  bgSecondary: '#1a1a24',
  bgTertiary: '#222230',
  bgHover: '#2a2a3a',
  bgActive: '#33334a',
  bgOverlay: 'rgba(0, 0, 0, 0.6)',

  /* ── Toolbar & Panels ─────────────────────────────── */
  toolbarBg: '#1a1a24',
  toolbarBorder: '#2a2a3a',
  panelBg: '#1a1a24',
  panelBorder: '#2a2a3a',
  sidebarBg: '#151520',
  sidebarBorder: '#2a2a3a',

  /* ── Text ──────────────────────────────────────────── */
  textPrimary: '#e8e8f0',
  textSecondary: '#a0a0b8',
  textTertiary: '#6e6e88',
  textDisabled: '#4a4a60',
  textInverse: '#111118',
  textLink: '#60a5fa',
  textLinkHover: '#93c5fd',

  /* ── Borders & Dividers ────────────────────────────── */
  borderDefault: '#2a2a3a',
  borderStrong: '#3f3f55',
  borderFocus: '#60a5fa',
  divider: '#222230',

  /* ── Interactive ───────────────────────────────────── */
  buttonPrimaryBg: '#3b82f6',
  buttonPrimaryText: '#ffffff',
  buttonPrimaryHover: '#60a5fa',
  buttonSecondaryBg: '#222230',
  buttonSecondaryText: '#c0c0d8',
  buttonSecondaryHover: '#2a2a3a',
  buttonDangerBg: '#ef4444',
  buttonDangerText: '#ffffff',
  buttonDangerHover: '#f87171',

  /* ── Form Controls ─────────────────────────────────── */
  inputBg: '#1a1a24',
  inputBorder: '#3f3f55',
  inputFocusBorder: '#60a5fa',
  inputFocusRing: 'rgba(96, 165, 250, 0.25)',
  inputPlaceholder: '#5a5a78',
  inputText: '#e8e8f0',

  /* ── Status ────────────────────────────────────────── */
  success: '#4ade80',
  successBg: '#052e16',
  warning: '#fbbf24',
  warningBg: '#451a03',
  error: '#f87171',
  errorBg: '#450a0a',
  info: '#60a5fa',
  infoBg: '#172554',

  /* ── Shadows ───────────────────────────────────────── */
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.35), 0 2px 4px rgba(0, 0, 0, 0.25)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.25)',
  shadowXl: '0 20px 25px rgba(0, 0, 0, 0.45), 0 8px 10px rgba(0, 0, 0, 0.25)',

  /* ── Scrollbar ─────────────────────────────────────── */
  scrollbarTrack: '#1a1a24',
  scrollbarThumb: '#3f3f55',
  scrollbarThumbHover: '#5a5a78',

  /* ── Miscellaneous ─────────────────────────────────── */
  tooltipBg: '#e8e8f0',
  tooltipText: '#111118',
  badgeBg: '#2a2a3a',
  badgeText: '#c0c0d8',
  skeletonBase: '#222230',
  skeletonHighlight: '#2a2a3a',
} as const;

export type DarkTheme = typeof darkTheme;
