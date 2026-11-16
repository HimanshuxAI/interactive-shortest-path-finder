import type { GraphNode, GraphEdge, DijkstraStep } from '../types/graph';

function buildAdjacencyList(nodes: GraphNode[], edges: GraphEdge[]) {
  const adj = new Map<string, Array<{ target: string; weight: number; edgeId: string }>>();
  nodes.forEach(node => adj.set(node.id, []));
  edges.forEach(edge => {
    const list = adj.get(edge.source);
    if (list) list.push({ target: edge.target, weight: edge.weight, edgeId: edge.id });
  });
  return adj;
}

function createInitialStep(source: string, nodeIds: string[]): DijkstraStep {
  const distances: Record<string, number | null> = {};
  const previous: Record<string, string | null> = {};
  nodeIds.forEach(id => {
    distances[id] = id === source ? 0 : null;
    previous[id] = null;
  });
  return {
    type: 'init',
    distances,
    previous,
    queue: [{ node: source, distance: 0 }],
    visited: [],
    settled: [],
    narration: `Starting at ${source}. Distance is 0. All others are ∞.`,
  };
}

function cloneState(
  distances: Record<string, number | null>,
  previous: Record<string, string | null>,
  queue: Array<{ node: string; distance: number }>,
  visited: string[],
  settled: string[]
) {
  return {
    distances: { ...distances },
    previous: { ...previous },
    queue: queue.map(q => ({ ...q })),
    visited: [...visited],
    settled: [...settled],
  };
}

export function computeDijkstraSteps(
  nodes: GraphNode[],
  edges: GraphEdge[],
  sourceId: string,
  targetId: string
): DijkstraStep[] {
  const nodeIds = nodes.map(n => n.id);
  const adj = buildAdjacencyList(nodes, edges);

  const distances: Record<string, number | null> = {};
  const previous: Record<string, string | null> = {};
  const visited = new Set<string>();
  const settled = new Set<string>();
  const queue: Array<{ node: string; distance: number }> = [];

  nodeIds.forEach(id => {
    distances[id] = id === sourceId ? 0 : null;
    previous[id] = null;
  });
  queue.push({ node: sourceId, distance: 0 });

  const steps: DijkstraStep[] = [createInitialStep(sourceId, nodeIds)];

  while (queue.length > 0) {
    queue.sort((a, b) => a.distance - b.distance);
    const { node: current, distance: currentDist } = queue.shift()!;

    if (visited.has(current)) continue;
    if (currentDist > (distances[current] ?? Infinity)) continue;

    visited.add(current);

    const visitState = cloneState(distances, previous, queue, Array.from(visited), Array.from(settled));
    steps.push({
      type: 'visit',
      node: current,
      ...visitState,
      narration: `Visiting ${current}. Its distance is ${currentDist}.`,
    });

    if (current === targetId) {
      const path: string[] = [];
      let curr: string | null = targetId;
      while (curr !== null) {
        path.unshift(curr);
        curr = previous[curr];
      }
      const finalState = cloneState(distances, previous, [], Array.from(visited), Array.from(settled));
      steps.push({
        type: 'complete',
        node: current,
        ...finalState,
        path,
        totalCost: distances[targetId] ?? 0,
        narration: `Found it. Path is ${path.join(' → ')}. Total cost ${distances[targetId]}.`,
      });
      return steps;
    }

    const neighbors = adj.get(current) ?? [];
    for (const { target, weight, edgeId } of neighbors) {
      if (visited.has(target)) continue;

      const newDist = currentDist + weight;
      const oldDist = distances[target];

      if (oldDist === null || newDist < oldDist) {
        distances[target] = newDist;
        previous[target] = current;

        const existingIndex = queue.findIndex(q => q.node === target);
        if (existingIndex >= 0) {
          queue[existingIndex] = { node: target, distance: newDist };
        } else {
          queue.push({ node: target, distance: newDist });
        }

        const relaxState = cloneState(distances, previous, queue, Array.from(visited), Array.from(settled));
        steps.push({
          type: 'relax',
          node: current,
          edge: edgeId,
          ...relaxState,
          narration: `${target} via ${current} costs ${currentDist} + ${weight} = ${newDist}. ` +
            `${oldDist === null ? 'Beats ∞' : `Beats ${oldDist}`}, so I'll keep it.`,
        });
      }
    }

    settled.add(current);
  }

  const noPathState = cloneState(distances, previous, [], Array.from(visited), Array.from(settled));
  steps.push({
    type: 'no-path',
    ...noPathState,
    narration: `No path from ${sourceId} to ${targetId}.`,
  });

  return steps;
}