import { describe, expect, it } from 'vitest';
import { applyStepToGraph, statusForStep } from './graphState';
import { computeDijkstraSteps } from '../algorithms/dijkstra';
import type { GraphData, GraphEdge, GraphNode } from '../types/graph';

function makeGraph(): GraphData {
  const ids = ['A', 'B', 'C', 'D'];
  const nodes: GraphNode[] = ids.map((id, i) => ({
    id,
    label: id,
    position: { x: i * 100, y: 0 },
    state: 'unvisited',
    distance: null,
  }));
  const spec: Array<[string, string, number]> = [
    ['A', 'B', 4],
    ['A', 'C', 2],
    ['C', 'B', 1],
    ['B', 'D', 5],
    ['C', 'D', 8],
  ];
  const edges: GraphEdge[] = spec.map(([source, target, weight], i) => ({
    id: `e${i + 1}`,
    source,
    target,
    weight,
    state: 'default',
    flowProgress: 0,
  }));
  return { nodes, edges };
}

describe('applyStepToGraph', () => {
  it('lights up only the consecutive edges of the shortest path', () => {
    const graph = makeGraph();
    const steps = computeDijkstraSteps(graph.nodes, graph.edges, 'A', 'D');
    const complete = steps[steps.length - 1];

    const painted = applyStepToGraph(graph, complete, 'A', 'D');
    const stateOf = (id: string) => painted.edges.find(e => e.id === id)?.state;

    // A->C, C->B, B->D are on the path.
    expect(stateOf('e2')).toBe('path');
    expect(stateOf('e3')).toBe('path');
    expect(stateOf('e4')).toBe('path');
    // A->B joins two path nodes but is not part of the route.
    expect(stateOf('e1')).toBe('default');
    // C->D is not on the route either.
    expect(stateOf('e5')).toBe('default');
  });

  it('marks the source and target nodes and copies distances', () => {
    const graph = makeGraph();
    const steps = computeDijkstraSteps(graph.nodes, graph.edges, 'A', 'D');
    const complete = steps[steps.length - 1];

    const painted = applyStepToGraph(graph, complete, 'A', 'D');
    const nodeOf = (id: string) => painted.nodes.find(n => n.id === id)!;

    expect(nodeOf('A').state).toBe('source');
    expect(nodeOf('D').state).toBe('target');
    expect(nodeOf('C').state).toBe('path');
    expect(nodeOf('B').distance).toBe(3);
    expect(nodeOf('D').distance).toBe(8);
  });

  it('marks outgoing edges as current while visiting a node', () => {
    const graph = makeGraph();
    const steps = computeDijkstraSteps(graph.nodes, graph.edges, 'A', 'D');
    const visitA = steps.find(s => s.type === 'visit' && s.node === 'A')!;

    const painted = applyStepToGraph(graph, visitA, 'A', 'D');
    const stateOf = (id: string) => painted.edges.find(e => e.id === id)?.state;

    expect(stateOf('e1')).toBe('current');
    expect(stateOf('e2')).toBe('current');
    expect(painted.nodes.find(n => n.id === 'A')!.state).toBe('source');
  });
});

describe('statusForStep', () => {
  it('maps terminal steps and the empty case', () => {
    expect(statusForStep(undefined)).toBe('idle');
    expect(statusForStep({ type: 'visit' } as never)).toBe('running');
    expect(statusForStep({ type: 'complete' } as never)).toBe('complete');
    expect(statusForStep({ type: 'no-path' } as never)).toBe('no-path');
  });
});
