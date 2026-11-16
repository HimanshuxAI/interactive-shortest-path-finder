export const theme = {
  colors: {
    bg: 'var(--color-bg)',
    surface: 'var(--color-surface)',
    surfaceElevated: 'var(--color-surface-elevated)',
    accent: 'var(--color-accent)',
    accentMuted: 'var(--color-accent-muted)',
    accentSoft: 'var(--color-accent-soft)',
    textPrimary: 'var(--color-text-primary)',
    textSecondary: 'var(--color-text-secondary)',
    textMuted: 'var(--color-text-muted)',
    border: 'var(--color-border)',
    borderStrong: 'var(--color-border-strong)',
    edgeDefault: 'var(--color-edge-default)',
    edgeActive: 'var(--color-edge-active)',
    nodeRing: 'var(--color-node-ring)',
    nodeFill: 'var(--color-node-fill)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    error: 'var(--color-error)',
  },
  spacing: {
    1: 'var(--spacing-1)',
    2: 'var(--spacing-2)',
    3: 'var(--spacing-3)',
    4: 'var(--spacing-4)',
    5: 'var(--spacing-5)',
    6: 'var(--spacing-6)',
    8: 'var(--spacing-8)',
    10: 'var(--spacing-10)',
    12: 'var(--spacing-12)',
  },
  radius: {
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: 'var(--radius-xl)',
    full: 'var(--radius-full)',
  },
  shadows: {
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    xl: 'var(--shadow-xl)',
  },
  transitions: {
    fast: 'var(--transition-fast)',
    base: 'var(--transition-base)',
    spring: 'var(--transition-spring)',
  },
  zIndex: {
    dropdown: 'var(--z-dropdown)',
    modal: 'var(--z-modal)',
    toast: 'var(--z-toast)',
    tooltip: 'var(--z-tooltip)',
  },
} as const;

export const springConfig = {
  gentle: { type: 'spring', stiffness: 120, damping: 18, mass: 1 },
  bouncy: { type: 'spring', stiffness: 180, damping: 14, mass: 1 },
  snappy: { type: 'spring', stiffness: 280, damping: 22, mass: 1 },
  slow: { type: 'spring', stiffness: 80, damping: 20, mass: 1 },
} as const;

export const nodeSize = {
  min: 44,
  default: 56,
  max: 72,
  labelOffset: 8,
} as const;

export const edgeStyle = {
  width: 2,
  activeWidth: 3.5,
  taperFactor: 0.6,
  arrowSize: 8,
  flowSpeed: 1.2,
} as const;