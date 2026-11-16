import React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useGraphStore } from './store';
import { computeEdgePath } from './edgePath';
import { getPointOnBlob } from './blob';
import { edgeStyle, spring } from '../styles/tokens';

interface EdgeProps {
  edge: ReturnType<typeof useGraphStore.getState>['graph']['edges'][0];
  sourceNode: ReturnType<typeof useGraphStore.getState>['graph']['nodes'][0] | undefined;
  targetNode: ReturnType<typeof useGraphStore.getState>['graph']['nodes'][0] | undefined;
  radius: number;
}

const stateColors: Record<string, string> = {
  default: 'var(--color-edge-default)',
  current: 'var(--color-coral)',
  relaxed: 'var(--color-coral)',
  path: 'var(--color-coral)',
};

const stateStrokeWidth: Record<string, number> = {
  default: edgeStyle.width,
  current: edgeStyle.activeWidth,
  relaxed: edgeStyle.activeWidth,
  path: edgeStyle.activeWidth,
};

export const Edge: React.FC<EdgeProps> = React.memo(({ edge, sourceNode, targetNode, radius }) => {
  if (!sourceNode || !targetNode) return null;

  const flowProgress = useMotionValue(0);
  const springFlow = useSpring(flowProgress, { stiffness: 180, damping: 20 });

  const pathData = computeEdgePath(
    edge.source,
    edge.target,
    sourceNode.position,
    targetNode.position,
    radius,
    radius,
    0.06,
    0.06,
    getPointOnBlob,
    0.3,
    edgeStyle.taperFactor
  );

  const color = stateColors[edge.state] || stateColors.default;
  const strokeWidth = stateStrokeWidth[edge.state] || edgeStyle.width;

  const weightX = pathData.midPoint.x - sourceNode.position.x;
  const weightY = pathData.midPoint.y - sourceNode.position.y;

  const showWeightEdit = useGraphStore.getState().editor.editingWeightEdge === edge.id;
  const [editWeight, setEditWeight] = React.useState(String(edge.weight));

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    useGraphStore.getState().dispatch({ type: 'SET_EDITING_WEIGHT', id: edge.id });
    setEditWeight(String(edge.weight));
  };

  const handleWeightSubmit = () => {
    const weight = parseFloat(editWeight);
    if (!isNaN(weight) && weight > 0) {
      useGraphStore.getState().dispatch({ type: 'UPDATE_WEIGHT', edgeId: edge.id, weight });
    }
    useGraphStore.getState().dispatch({ type: 'SET_EDITING_WEIGHT', id: null });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleWeightSubmit();
    if (e.key === 'Escape') {
      setEditWeight(String(edge.weight));
      useGraphStore.getState().dispatch({ type: 'SET_EDITING_WEIGHT', id: null });
    }
  };

  React.useEffect(() => {
    if (edge.state === 'relaxed' || edge.state === 'path') {
      const duration = Math.min(edge.weight * 100, 900);
      flowProgress.set(0);
      const start = performance.now();
      const animate = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        flowProgress.set(progress);
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [edge.state, edge.weight, flowProgress]);

  const flowOffset = springFlow;

  return (
    <g onMouseEnter={() => useGraphStore.getState().dispatch({ type: 'SET_HOVERED_EDGE', id: edge.id })} onMouseLeave={() => useGraphStore.getState().dispatch({ type: 'SET_HOVERED_EDGE', id: null })}>
      <path
        d={pathData.fillPath}
        fill={color}
        stroke="none"
        opacity={edge.state === 'path' ? 1 : 0.9}
        style={{
          filter: edge.state === 'current' || edge.state === 'relaxed' ? 'drop-shadow(0 0 6px var(--color-coral))' : 'none',
        }}
      />
      <motion.path
        d={pathData.centerlinePath}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray="8 6"
        strokeDashoffset={flowOffset}
        fill="none"
        strokeLinecap="round"
        opacity={edge.state === 'relaxed' || edge.state === 'path' ? 1 : 0}
        style={{
          pointerEvents: 'none',
          filter: edge.state === 'path' ? 'drop-shadow(0 0 4px var(--color-coral))' : 'none',
        }}
      />
      {!showWeightEdit && (
        <g onDoubleClick={handleDoubleClick} style={{ cursor: 'pointer' }}>
          <motion.circle
            cx={pathData.midPoint.x - sourceNode.position.x}
            cy={pathData.midPoint.y - sourceNode.position.y}
            r={14}
            fill="var(--color-surface)"
            stroke="var(--color-border)"
            strokeWidth={1.5}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={spring.direct}
          />
          <text
            x={weightX}
            y={weightY + 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="var(--color-ink)"
            fontSize={12}
            fontWeight={500}
            fontFamily="var(--font-family)"
            className="tabular-nums"
            pointerEvents="none"
          >
            {edge.weight}
          </text>
        </g>
      )}
      {showWeightEdit && (
        <foreignObject
          x={weightX - 30}
          y={weightY - 16}
          width={60}
          height={32}
          style={{ pointerEvents: 'all' }}
        >
          <input
            type="number"
            value={editWeight}
            onChange={e => setEditWeight(e.target.value)}
            onBlur={handleWeightSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              width: '100%',
              height: '100%',
              border: '2px solid var(--color-coral)',
              borderRadius: '6px',
              padding: '0 8px',
              fontSize: '13px',
              fontFamily: 'var(--font-family)',
              fontWeight: 500,
              textAlign: 'center',
              outline: 'none',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              MozAppearance: 'textfield',
            }}
          />
        </foreignObject>
      )}
    </g>
  );
});

Edge.displayName = 'Edge';