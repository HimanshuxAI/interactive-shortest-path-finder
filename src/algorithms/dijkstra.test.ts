import { describe, expect, it } from 'vitest';
import { computeDijkstraSteps } from './dijkstra';
import type { GraphEdge, GraphNode } from '../types/graph';

function nodes(...ids: string[]): GraphNode[] {
  return ids.map((id, i) => ({
    id,
    label: id,
    position: { x: i * 100, y: 0 },
    state: 'unvisited',
    distance: null,
  }));
}

function edges(spec: Array<[string, string, number]>): GraphEdge[] {
  return spec.map(([source, target, weight], i) => ({
    id: `e${i + 1}`,
    source,
    target,
    weight,
    state: 'default',
    flowProgress: 0,
  }));
}

function finalStep(ns: GraphNode[], es: GraphEdge[], source: string, target: string) {
  const steps = computeDijkstraSteps(ns, es, source, target);
  return steps[steps.length - 1];
}

describe('computeDijkstraSteps', () => {
  it('finds the path from the project synopsis (A -> C -> B -> D, cost 8)', () => {
    const ns = nodes('A', 'B', 'C', 'D');
    const es = edges([
      ['A', 'B', 4],
      ['A', 'C', 2],
      ['C', 'B', 1],
      ['B', 'D', 5],
      ['C', 'D', 8],
    ]);

    const step = finalStep(ns, es, 'A', 'D');

    expect(step.type).toBe('complete');
    expect(step.path).toEqual(['A', 'C', 'B', 'D']);
    expect(step.totalCost).toBe(8);
  });

  it('prefers the cheaper detour over the direct edge', () => {
    // Direct A->D is 8, but A->C->E->D costs 7.
    const ns = nodes('A', 'B', 'C', 'D', 'E', 'F');
    const es = edges([
      ['A', 'B', 4],
      ['A', 'C', 2],
      ['C', 'B', 1],
      ['B', 'D', 5],
      ['C', 'D', 8],
      ['C', 'E', 3],
      ['E', 'D', 2],
      ['A', 'F', 7],
      ['F', 'B', 2],
    ]);

    const step = finalStep(ns, es, 'A', 'D');

    expect(step.path).toEqual(['A', 'C', 'E', 'D']);
    expect(step.totalCost).toBe(7);
    expect(step.distances).toMatchObject({ A: 0, C: 2, E: 5, B: 3, D: 7 });
  });

  it('reports no path when the target is disconnected', () => {
    const ns = nodes('A', 'B', 'C');
    const es = edges([['A', 'B', 1]]);

    const step = finalStep(ns, es, 'A', 'C');

    expect(step.type).toBe('no-path');
    expect(step.path).toBeUndefined();
  });

  it('handles source equal to target', () => {
    const ns = nodes('A', 'B');
    const es = edges([['A', 'B', 3]]);

    const step = finalStep(ns, es, 'A', 'A');

    expect(step.type).toBe('complete');
    expect(step.path).toEqual(['A']);
    expect(step.totalCost).toBe(0);
  });

  it('always starts with an init step and ends on a terminal step', () => {
    const ns = nodes('A', 'B', 'C');
    const es = edges([
      ['A', 'B', 1],
      ['B', 'C', 1],
    ]);

    const steps = computeDijkstraSteps(ns, es, 'A', 'C');

    expect(steps[0].type).toBe('init');
    expect(steps[0].distances).toMatchObject({ A: 0, B: null, C: null });
    expect(steps[0].queue).toEqual([{ node: 'A', distance: 0 }]);

    const last = steps[steps.length - 1];
    expect(['complete', 'no-path']).toContain(last.type);
  });

  it('never settles more nodes than exist', () => {
    const ns = nodes('A', 'B', 'C', 'D');
    const es = edges([
      ['A', 'B', 1],
      ['A', 'C', 4],
      ['B', 'C', 1],
      ['C', 'D', 1],
    ]);

    const steps = computeDijkstraSteps(ns, es, 'A', 'D');

    for (const step of steps) {
      expect(step.settled.length).toBeLessThanOrEqual(ns.length);
      expect(new Set(step.settled).size).toBe(step.settled.length);
    }
  });
});
