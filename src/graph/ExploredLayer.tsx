import React from 'react';
import { useGraphStore } from './store';

export const ExploredLayer: React.FC = () => {
  const { graph, algorithm } = useGraphStore();
  const { nodes, edges } = graph;
  const currentStep = algorithm.steps[algorithm.currentStepIndex];
  const settled = currentStep?.settled ?? [];

  const settledNodes = nodes.filter((n: typeof nodes[0]) => settled.includes(n.id));
  const settledEdges = edges.filter((e: typeof edges[0]) => settled.includes(e.source) && settled.includes(e.target));

  if (settledNodes.length === 0 && settledEdges.length === 0) return null;

  const allPoints: string[] = [];
  const radius = 56;

  settledNodes.forEach((node: typeof nodes[0]) => {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      allPoints.push(`${(node.position.x + radius * Math.cos(angle)).toFixed(1)},${(node.position.y + radius * Math.sin(angle)).toFixed(1)}`);
    }
  });

  settledEdges.forEach((edge: typeof edges[0]) => {
    const source = nodes.find(n => n.id === edge.source);
    const target = nodes.find(n => n.id === edge.target);
    if (source && target) {
      const dx = target.position.x - source.position.x;
      const dy = target.position.y - source.position.y;
      for (let i = 0; i <= 10; i++) {
        const t = i / 10;
        const x = source.position.x + dx * t;
        const y = source.position.y + dy * t;
        allPoints.push(`${x.toFixed(1)},${y.toFixed(1)}`);
      }
    }
  });

  if (allPoints.length < 3) return null;

  const hull = computeHull(allPoints.map(p => {
    const [x, y] = p.split(',').map(Number);
    return { x, y };
  }));

  if (!hull) return null;

  const path = `M ${hull[0].x} ${hull[0].y} ${hull.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')} Z`;

  return (
    <path
      d={path}
      fill="var(--color-ink)"
      style={{ opacity: 0.06 }}
    />
  );
};

function computeHull(points: { x: number; y: number }[]): { x: number; y: number }[] | null {
  if (points.length < 3) return null;
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const lower: { x: number; y: number }[] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }
  const upper: { x: number; y: number }[] = [];
  for (const p of [...sorted].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }
  lower.pop();
  upper.pop();
  return [...lower, ...upper];
}

function cross(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}