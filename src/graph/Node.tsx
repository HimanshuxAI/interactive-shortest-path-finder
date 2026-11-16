import React from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useGraphStore } from './store';
import { generateBlob } from './blob';
import { statePalette, spring } from '../styles/tokens';

interface NodeProps {
  node: ReturnType<typeof useGraphStore.getState>['graph']['nodes'][0];
  radius: number;
}

export const Node: React.FC<NodeProps> = React.memo(({ node, radius }) => {
  const { editor, algorithm } = useGraphStore();
  const isSource = algorithm.sourceNode === node.id;
  const isTarget = algorithm.targetNode === node.id;

  const scale = useMotionValue(1);
  const hoverScale = useSpring(scale, { ...spring.direct, mass: 0.8 });

  const state = node.state;
  const palette = statePalette[state as keyof typeof statePalette];
  const fill = palette.fill;
  const stroke = palette.stroke;
  const textColor = palette.text;
  const strokeWidth = state === 'path' ? 3 : 1.5;

  const blobPath = generateBlob(node.id, { x: 0, y: 0 }, radius);

  const handleMouseEnter = () => scale.set(1.05);
  const handleMouseLeave = () => scale.set(1);
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editor.mode === 'select') {
      useGraphStore.getState().dispatch({ type: 'SET_HOVERED_NODE', id: node.id });
    } else if (editor.mode === 'addEdge' && !editor.pendingEdgeSource) {
      useGraphStore.getState().dispatch({ type: 'SET_PENDING_EDGE_SOURCE', id: node.id });
    }
  };
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (editor.mode === 'addEdge' && editor.pendingEdgeSource && editor.pendingEdgeSource !== node.id) {
      const state = useGraphStore.getState();
      const exists = state.graph.edges.some(
        edge => edge.source === editor.pendingEdgeSource && edge.target === node.id
      );
      if (!exists) {
        state.dispatch({
          type: 'ADD_EDGE',
          edge: { id: `edge_${Date.now()}`, source: editor.pendingEdgeSource!, target: node.id, weight: 1, state: 'default', flowProgress: 0 },
        });
      }
      state.dispatch({ type: 'SET_MODE', mode: 'select' });
      state.dispatch({ type: 'SET_PENDING_EDGE_SOURCE', id: null });
    }
  };

  const distanceText = node.distance === null ? '∞' : String(node.distance);

  return (
    <motion.g
      transformOrigin="center center"
      style={{ x: node.position.x, y: node.position.y, scale: hoverScale, cursor: editor.mode === 'addEdge' ? 'crosshair' : 'grab' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
    >
      <motion.path
        d={blobPath}
        fill={fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        style={{
          filter: state === 'current' ? 'drop-shadow(0 0 8px var(--color-coral))' : 'none',
        }}
      />
      {(isSource || isTarget) && (
        <motion.path
          d={blobPath}
          fill="none"
          stroke="var(--color-coral)"
          strokeWidth={2}
          animate={{ strokeDashoffset: [0, -20] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          style={{ strokeDasharray: '8 6' }}
        />
      )}
      <text
        x={0}
        y={radius * 0.1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={textColor}
        fontSize={radius * 0.45}
        fontWeight={state === 'settled' || state === 'path' ? 650 : 450}
        fontFamily="var(--font-family)"
        className="tabular-nums"
        pointerEvents="none"
      >
        {node.label}
      </text>
      {node.distance !== null && (
        <motion.text
          x={0}
          y={radius * 0.55}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={textColor}
          fontSize={radius * 0.28}
          fontWeight={500}
          fontFamily="var(--font-family)"
          className="tabular-nums"
          pointerEvents="none"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.direct}
        >
          {distanceText}
        </motion.text>
      )}
    </motion.g>
  );
});

Node.displayName = 'Node';