/**
 * Light theme UI chrome tokens.
 * These control the application shell appearance (toolbar, panels, sidebars, menus)
 * and are independent of the diagram canvas styles.
 */
export const lightTheme = {
  /* ── Surfaces ─────────────────────────────────────── */
  bgPrimary: '#ffffff',
  bgSecondary: '#f8f9fa',
  bgTertiary: '#f1f3f5',
  bgHover: '#e9ecef',
  bgActive: '#dee2e6',
  bgOverlay: 'rgba(0, 0, 0, 0.4)',

  /* ── Toolbar & Panels ─────────────────────────────── */
  toolbarBg: '#ffffff',
  toolbarBorder: '#e5e7eb',
  panelBg: '#ffffff',
  panelBorder: '#e5e7eb',
  sidebarBg: '#f8f9fa',
  sidebarBorder: '#e5e7eb',

  /* ── Text ──────────────────────────────────────────── */
  textPrimary: '#1a1a2e',
  textSecondary: '#495057',
  textTertiary: '#868e96',
  textDisabled: '#adb5bd',
  textInverse: '#ffffff',
  textLink: '#2563eb',
  textLinkHover: '#1d4ed8',

  /* ── Borders & Dividers ────────────────────────────── */
  borderDefault: '#dee2e6',
  borderStrong: '#adb5bd',
  borderFocus: '#2563eb',
  divider: '#e9ecef',

  /* ── Interactive ───────────────────────────────────── */
  buttonPrimaryBg: '#2563eb',
  buttonPrimaryText: '#ffffff',
  buttonPrimaryHover: '#1d4ed8',
  buttonSecondaryBg: '#f1f3f5',
  buttonSecondaryText: '#374151',
  buttonSecondaryHover: '#e5e7eb',
  buttonDangerBg: '#dc2626',
  buttonDangerText: '#ffffff',
  buttonDangerHover: '#b91c1c',

  /* ── Form Controls ─────────────────────────────────── */
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
  inputFocusBorder: '#2563eb',
  inputFocusRing: 'rgba(37, 99, 235, 0.2)',
  inputPlaceholder: '#9ca3af',
  inputText: '#1a1a2e',

  /* ── Status ────────────────────────────────────────── */
  success: '#16a34a',
  successBg: '#f0fdf4',
  warning: '#d97706',
  warningBg: '#fffbeb',
  error: '#dc2626',
  errorBg: '#fef2f2',
  info: '#2563eb',
  infoBg: '#eff6ff',

  /* ── Shadows ───────────────────────────────────────── */
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  shadowMd: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05)',
  shadowLg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  shadowXl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 8px 10px rgba(0, 0, 0, 0.04)',

  /* ── Scrollbar ─────────────────────────────────────── */
  scrollbarTrack: '#f1f3f5',
  scrollbarThumb: '#c1c8cf',
  scrollbarThumbHover: '#a1a8b0',

  /* ── Miscellaneous ─────────────────────────────────── */
  tooltipBg: '#1f2937',
  tooltipText: '#ffffff',
  badgeBg: '#e5e7eb',
  badgeText: '#374151',
  skeletonBase: '#e5e7eb',
  skeletonHighlight: '#f3f4f6',
} as const;

export type LightTheme = typeof lightTheme;
