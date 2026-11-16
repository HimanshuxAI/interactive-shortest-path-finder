export const colors = {
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  ink: '#1C1C1C',
  inkSoft: '#6B6B6B',
  inkMuted: '#A3A3A3',
  border: '#E7E5E4',
  borderStrong: '#D6D3D1',
  edgeDefault: '#D4D4D4',
  coral: '#FF6B35',
  coralTint: '#FFE5DD',
  coralSoft: '#FFF0EB',
  inkPool: 'rgba(28, 28, 28, 0.06)',
  nodeStroke: '#BDBDB8',
  nodeFill: '#FFFFFF',
  settledFill: '#1C1C1C',
  settledText: '#FAFAF9',
  success: '#00C853',
  warning: '#FFB300',
  error: '#FF3D00',
};

export const statePalette = {
  unvisited: { fill: colors.nodeFill, stroke: colors.nodeStroke, text: colors.inkSoft },
  frontier: { fill: colors.coralTint, stroke: colors.coral, text: colors.ink },
  current: { fill: colors.coral, stroke: colors.coral, text: colors.ink },
  settled: { fill: colors.settledFill, stroke: 'none', text: colors.settledText },
  path: { fill: colors.settledFill, stroke: colors.coral, strokeWidth: 3, text: colors.settledText },
  source: { fill: colors.coralTint, stroke: colors.coral, text: colors.ink },
  target: { fill: colors.coralTint, stroke: colors.coral, text: colors.ink },
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

export const spring = {
  direct: { stiffness: 300, damping: 18 },
  rope: { stiffness: 220, damping: 14 },
  panel: { stiffness: 260, damping: 26 },
  blob: { stiffness: 280, damping: 22 },
} as const;

export const tween = {
  step: { duration: 0.22, ease: 'easeOut' },
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.04)',
  md: '0 4px 12px rgba(0,0,0,0.06)',
  lg: '0 12px 28px rgba(0,0,0,0.08)',
  xl: '0 20px 40px rgba(0,0,0,0.1)',
} as const;

export const fontSizes = {
  xs: '0.7rem',
  sm: '0.8125rem',
  base: '0.9375rem',
  lg: '1.125rem',
  xl: '1.375rem',
  '2xl': '1.75rem',
  '3xl': '2.25rem',
} as const;

export const fontWeights = {
  light: 200,
  regular: 400,
  medium: 450,
  semibold: 600,
  bold: 650,
} as const;

export const zIndex = {
  dropdown: 100,
  modal: 200,
  toast: 300,
  tooltip: 400,
} as const;

export const flow = {
  maxMs: 900,
  dashArray: '8 6',
} as const;