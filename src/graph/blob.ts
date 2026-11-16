import type { Point } from '../types/graph';

interface BlobPoint {
  x: number;
  y: number;
}

function seededRandom(seed: string): () => number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i);
    h |= 0;
  }
  let state = h >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return (state >>> 0) / 0xffffffff;
  };
}

function catmullRomToBezier(points: BlobPoint[], closed = true): BlobPoint[] {
  const n = points.length;
  if (n < 4) return points;

  const result: BlobPoint[] = [];

  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const cp1 = {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6,
    };
    const cp2 = {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6,
    };

    if (i === 0) {
      result.push(p1, cp1, cp2);
    } else {
      result.push(cp1, cp2);
    }
  }

  if (closed) {
    const p0 = points[n - 2];
    const p1 = points[n - 1];
    const p2 = points[0];
    const p3 = points[1];

    const cp1 = {
      x: p1.x + (p2.x - p0.x) / 6,
      y: p1.y + (p2.y - p0.y) / 6,
    };
    const cp2 = {
      x: p2.x - (p3.x - p1.x) / 6,
      y: p2.y - (p3.y - p1.y) / 6,
    };

    result.push(cp1, cp2, p2);
  }

  return result;
}

export function generateBlob(
  id: string,
  center: Point,
  radius: number,
  variation = 0.06
): string {
  const rand = seededRandom(id);
  const points = 8;
  const basePoints: BlobPoint[] = [];

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2;
    const r = radius * (1 + (rand() - 0.5) * 2 * variation);
    basePoints.push({
      x: center.x + r * Math.cos(angle),
      y: center.y + r * Math.sin(angle),
    });
  }

  const bezierPoints = catmullRomToBezier(basePoints);

  let path = `M ${bezierPoints[0].x.toFixed(2)} ${bezierPoints[0].y.toFixed(2)}`;
  for (let i = 1; i < bezierPoints.length; i += 3) {
    const cp1 = bezierPoints[i];
    const cp2 = bezierPoints[i + 1];
    const end = bezierPoints[i + 2];
    if (end) {
      path += ` C ${cp1.x.toFixed(2)} ${cp1.y.toFixed(2)}, ${cp2.x.toFixed(2)} ${cp2.y.toFixed(2)}, ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
    }
  }
  path += ' Z';

  return path;
}

export function getBlobPoints(
  id: string,
  center: Point,
  radius: number,
  variation = 0.06,
  count = 64
): Point[] {
  const result: Point[] = [];

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const baseIdx = Math.floor((angle / (Math.PI * 2)) * 8);
    const nextIdx = (baseIdx + 1) % 8;
    const t = (angle - (baseIdx / 8) * Math.PI * 2) / (Math.PI * 2 / 8);

    const r1 = radius * (1 + (seededRandom(id + baseIdx)() - 0.5) * 2 * variation);
    const r2 = radius * (1 + (seededRandom(id + nextIdx)() - 0.5) * 2 * variation);
    const r = r1 * (1 - t) + r2 * t;

    result.push({
      x: center.x + r * Math.cos(angle),
      y: center.y + r * Math.sin(angle),
    });
  }

  return result;
}

export function getPointOnBlob(
  id: string,
  center: Point,
  radius: number,
  angle: number,
  variation = 0.06
): Point {
  const baseIdx = Math.floor((angle / (Math.PI * 2)) * 8) % 8;
  const nextIdx = (baseIdx + 1) % 8;
  const t = (angle - (baseIdx / 8) * Math.PI * 2) / (Math.PI * 2 / 8);

  const r1 = radius * (1 + (seededRandom(id + baseIdx)() - 0.5) * 2 * variation);
  const r2 = radius * (1 + (seededRandom(id + nextIdx)() - 0.5) * 2 * variation);
  const r = r1 * (1 - t) + r2 * t;

  return {
    x: center.x + r * Math.cos(angle),
    y: center.y + r * Math.sin(angle),
  };
}

export function getBlobBounds(
  id: string,
  center: Point,
  radius: number,
  variation = 0.06
): { minX: number; maxX: number; minY: number; maxY: number } {
  const points = getBlobPoints(id, center, radius, variation, 32);
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  return { minX, maxX, minY, maxY };
}