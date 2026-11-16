import type { Point } from '../types/graph';

export interface EdgePathData {
  fillPath: string;
  centerlinePath: string;
  sourcePoint: Point;
  targetPoint: Point;
  midPoint: Point;
  angle: number;
}

function cubicBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  const u = 1 - t;
  const uu = u * u;
  const uuu = uu * u;
  const tt = t * t;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

function pointOnCurve(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): Point {
  return cubicBezier(p0, p1, p2, p3, t);
}

function angleAt(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number
): number {
  const u = 1 - t;
  const uu = u * u;
  const tt = t * t;
  const dx = 3 * uu * (p1.x - p0.x) + 6 * u * t * (p2.x - p1.x) + 3 * tt * (p3.x - p2.x);
  const dy = 3 * uu * (p1.y - p0.y) + 6 * u * t * (p2.y - p1.y) + 3 * tt * (p3.y - p2.y);
  return Math.atan2(dy, dx);
}

export function computeEdgePath(
  sourceId: string,
  targetId: string,
  sourceCenter: Point,
  targetCenter: Point,
  sourceRadius: number,
  targetRadius: number,
  sourceVariation: number,
  targetVariation: number,
  getPointOnBlob: (id: string, center: Point, radius: number, angle: number, variation: number) => Point,
  tension = 0.3,
  taperFactor = 0.6
): EdgePathData {
  const dx = targetCenter.x - sourceCenter.x;
  const dy = targetCenter.y - sourceCenter.y;
  const distance = Math.hypot(dx, dy);
  const baseAngle = Math.atan2(dy, dx);

  const sourceAngle = baseAngle;
  const targetAngle = baseAngle + Math.PI;

  const sourcePoint = getPointOnBlob(sourceId, sourceCenter, sourceRadius, sourceAngle, sourceVariation);
  const targetPoint = getPointOnBlob(targetId, targetCenter, targetRadius, targetAngle, targetVariation);

  const controlDistance = distance * tension;
  const controlPoint: Point = {
    x: sourcePoint.x + Math.cos(sourceAngle) * controlDistance,
    y: sourcePoint.y + Math.sin(sourceAngle) * controlDistance,
  };

  const centerlinePath = `M ${sourcePoint.x.toFixed(2)} ${sourcePoint.y.toFixed(2)} Q ${controlPoint.x.toFixed(2)} ${controlPoint.y.toFixed(2)} ${targetPoint.x.toFixed(2)} ${targetPoint.y.toFixed(2)}`;

  const midPoint = pointOnCurve(sourcePoint, controlPoint, controlPoint, targetPoint, 0.5);
  const midAngle = angleAt(sourcePoint, controlPoint, controlPoint, targetPoint, 0.5);
  const perpAngle = midAngle + Math.PI / 2;

  const sourceWidth = sourceRadius * 0.5;
  const targetWidth = sourceWidth * taperFactor;

  const sourcePerp = {
    x: Math.cos(perpAngle) * sourceWidth,
    y: Math.sin(perpAngle) * sourceWidth,
  };
  const targetPerp = {
    x: Math.cos(perpAngle) * targetWidth,
    y: Math.sin(perpAngle) * targetWidth,
  };

  const sourceLeft = { x: sourcePoint.x + sourcePerp.x, y: sourcePoint.y + sourcePerp.y };
  const sourceRight = { x: sourcePoint.x - sourcePerp.x, y: sourcePoint.y - sourcePerp.y };
  const targetLeft = { x: targetPoint.x + targetPerp.x, y: targetPoint.y + targetPerp.y };
  const targetRight = { x: targetPoint.x - targetPerp.x, y: targetPoint.y - targetPerp.y };

  const cpLeft = {
    x: controlPoint.x + Math.cos(perpAngle) * sourceWidth * 0.7,
    y: controlPoint.y + Math.sin(perpAngle) * sourceWidth * 0.7,
  };
  const cpRight = {
    x: controlPoint.x - Math.cos(perpAngle) * sourceWidth * 0.7,
    y: controlPoint.y - Math.sin(perpAngle) * sourceWidth * 0.7,
  };

  const arrowSize = 10;
  const arrowBaseOffset = targetRadius * 0.15;
  const arrowBase = pointOnCurve(sourcePoint, controlPoint, controlPoint, targetPoint, 1 - arrowBaseOffset / distance);
  const arrowTip = targetPoint;
  const arrowAngle = angleAt(sourcePoint, controlPoint, controlPoint, targetPoint, 1 - arrowBaseOffset / distance);
  const arrowPerp = arrowAngle + Math.PI / 2;
  const arrowLeft = { x: arrowBase.x + Math.cos(arrowPerp) * arrowSize * 0.6, y: arrowBase.y + Math.sin(arrowPerp) * arrowSize * 0.6 };
  const arrowRight = { x: arrowBase.x - Math.cos(arrowPerp) * arrowSize * 0.6, y: arrowBase.y - Math.sin(arrowPerp) * arrowSize * 0.6 };

  let fillPath = `M ${sourceLeft.x.toFixed(2)} ${sourceLeft.y.toFixed(2)}`;
  fillPath += ` Q ${cpLeft.x.toFixed(2)} ${cpLeft.y.toFixed(2)} ${targetLeft.x.toFixed(2)} ${targetLeft.y.toFixed(2)}`;
  fillPath += ` L ${arrowLeft.x.toFixed(2)} ${arrowLeft.y.toFixed(2)}`;
  fillPath += ` L ${arrowTip.x.toFixed(2)} ${arrowTip.y.toFixed(2)}`;
  fillPath += ` L ${arrowRight.x.toFixed(2)} ${arrowRight.y.toFixed(2)}`;
  fillPath += ` L ${targetRight.x.toFixed(2)} ${targetRight.y.toFixed(2)}`;
  fillPath += ` Q ${cpRight.x.toFixed(2)} ${cpRight.y.toFixed(2)} ${sourceRight.x.toFixed(2)} ${sourceRight.y.toFixed(2)}`;
  fillPath += ' Z';

  return {
    fillPath,
    centerlinePath,
    sourcePoint,
    targetPoint,
    midPoint,
    angle: midAngle,
  };
}