import { describe, expect, it } from 'vitest';
import { computeGraphBounds } from './svgExport';
import type { GraphNode } from '../types/graph';

const node = (id: string, x: number, y: number): GraphNode => ({
  id,
  label: id,
  position: { x, y },
  state: 'unvisited',
  distance: null,
});

describe('computeGraphBounds', () => {
  it('pads the bounding box around every node', () => {
    const bounds = computeGraphBounds([node('A', 200, 300), node('D', 600, 300)], 56, 60);
    expect(bounds.minX).toBe(200 - 56 - 60);
    expect(bounds.maxX).toBe(600 + 56 + 60);
    expect(bounds.minY).toBe(300 - 56 - 60);
    expect(bounds.maxY).toBe(300 + 56 + 60);
  });

  it('falls back to a sane box for an empty graph', () => {
    const bounds = computeGraphBounds([], 56);
    expect(bounds.maxX).toBeGreaterThan(bounds.minX);
    expect(bounds.maxY).toBeGreaterThan(bounds.minY);
  });
});
