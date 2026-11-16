import type { GraphNode } from '../types/graph';

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const CSS_VARIABLES = [
  '--color-bg',
  '--color-surface',
  '--color-ink',
  '--color-ink-soft',
  '--color-ink-muted',
  '--color-border',
  '--color-border-strong',
  '--color-edge-default',
  '--color-coral',
  '--color-coral-tint',
  '--color-coral-soft',
  '--color-node-fill',
  '--color-node-stroke',
  '--color-settled-fill',
  '--color-settled-text',
  '--font-family',
];

export function computeGraphBounds(nodes: GraphNode[], radius: number, padding = 60): Bounds {
  if (nodes.length === 0) {
    return { minX: 0, minY: 0, maxX: 800, maxY: 600 };
  }
  const xs = nodes.map(n => n.position.x);
  const ys = nodes.map(n => n.position.y);
  return {
    minX: Math.min(...xs) - radius - padding,
    minY: Math.min(...ys) - radius - padding,
    maxX: Math.max(...xs) + radius + padding,
    maxY: Math.max(...ys) + radius + padding,
  };
}

/**
 * A downloaded SVG is rendered outside the page, so `var(--…)` references and
 * the pan/zoom transform have to be baked in first.
 */
export function serializeSvgForExport(svg: SVGSVGElement, bounds: Bounds): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const width = Math.max(1, Math.round(bounds.maxX - bounds.minX));
  const height = Math.max(1, Math.round(bounds.maxY - bounds.minY));

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', `${bounds.minX} ${bounds.minY} ${width} ${height}`);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.style.transform = 'none';
  clone.style.transformOrigin = '0 0';

  const computed = getComputedStyle(document.documentElement);
  const values = new Map<string, string>();
  for (const name of CSS_VARIABLES) {
    const value = computed.getPropertyValue(name).trim();
    if (value) values.set(name, value);
  }

  let source = new XMLSerializer().serializeToString(clone);
  source = source.replace(/var\((--[a-z0-9-]+)\)/gi, (match, name: string) => values.get(name) ?? match);

  return source;
}
