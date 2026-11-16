import type { GraphData, GraphEdge, GraphNode } from '../types/graph';

const node = (id: string, x: number, y: number): GraphNode => ({
  id,
  label: id,
  position: { x, y },
  state: 'unvisited',
  distance: null,
});

const edge = (id: string, source: string, target: string, weight: number): GraphEdge => ({
  id,
  source,
  target,
  weight,
  state: 'default',
  flowProgress: 0,
});

/**
 * A six node, nine edge sample. The shortest route from A to D is
 * A -> C -> E -> D for a total of 7.
 */
export function createDefaultGraph(): GraphData {
  return {
    nodes: [
      node('A', 200, 300),
      node('B', 400, 200),
      node('C', 400, 400),
      node('D', 600, 300),
      node('E', 300, 500),
      node('F', 500, 100),
    ],
    edges: [
      edge('e1', 'A', 'B', 4),
      edge('e2', 'A', 'C', 2),
      edge('e3', 'C', 'B', 1),
      edge('e4', 'B', 'D', 5),
      edge('e5', 'C', 'D', 8),
      edge('e6', 'C', 'E', 3),
      edge('e7', 'E', 'D', 2),
      edge('e8', 'A', 'F', 7),
      edge('e9', 'F', 'B', 2),
    ],
  };
}
