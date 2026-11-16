import type { AlgorithmState, DijkstraStep, GraphData, GraphEdge, GraphNode } from '../types/graph';

/**
 * Project a single Dijkstra step onto the graph's visual state. Every step
 * carries a full snapshot (distances, visited, settled, queue), so applying
 * any step directly gives the same result as replaying all of them.
 */
export function applyStepToGraph(
  graph: GraphData,
  step: DijkstraStep,
  sourceNode: string | null,
  targetNode: string | null,
): GraphData {
  const { nodes, edges } = graph;
  const path = step.path ?? [];
  const pathSet = new Set(path);
  const isPathNode = (id: string) => pathSet.has(id);
  // Only light up edges that actually join two consecutive path nodes.
  const isPathEdge = (edge: GraphEdge) => {
    for (let i = 0; i < path.length - 1; i++) {
      if (edge.source === path[i] && edge.target === path[i + 1]) return true;
    }
    return false;
  };

  return {
    nodes: nodes.map(n => {
      let nodeState: GraphNode['state'] = 'unvisited';
      if (isPathNode(n.id)) nodeState = 'path';
      else if (n.id === step.node && (step.type === 'visit' || step.type === 'relax')) nodeState = 'current';
      else if (step.settled.includes(n.id)) nodeState = 'settled';
      else if (step.visited.includes(n.id)) nodeState = 'frontier';
      if (n.id === sourceNode) nodeState = 'source';
      if (n.id === targetNode) nodeState = 'target';
      return { ...n, state: nodeState, distance: step.distances[n.id] ?? null };
    }),
    edges: edges.map(e => {
      let edgeState: GraphEdge['state'] = 'default';
      let flowProgress = 0;
      if (step.type === 'relax' && e.id === step.edge) {
        edgeState = 'relaxed';
        flowProgress = 1;
      } else if (step.type === 'visit' && e.source === step.node) {
        edgeState = 'current';
      } else if (isPathEdge(e)) {
        edgeState = 'path';
        flowProgress = 1;
      }
      return { ...e, state: edgeState, flowProgress };
    }),
  };
}

export function statusForStep(step: DijkstraStep | undefined): AlgorithmState['status'] {
  if (!step) return 'idle';
  if (step.type === 'complete') return 'complete';
  if (step.type === 'no-path') return 'no-path';
  return 'running';
}
