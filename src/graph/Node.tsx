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
  const isDragging = editor.draggingNode === node.id;

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
  const handleMouseLeave = () => {
    if (!isDragging) scale.set(1);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    const store = useGraphStore.getState();
    const currentEditor = store.editor;
    if (currentEditor.mode === 'select') {
      store.dispatch({ type: 'SET_HOVERED_NODE', id: node.id });
      startDrag(e, node.position, store.viewport.scale, node.id);
    } else if (currentEditor.mode === 'addEdge' && !currentEditor.pendingEdgeSource) {
      store.dispatch({ type: 'SET_PENDING_EDGE_SOURCE', id: node.id });
    }
  };

  const startDrag = (
    e: React.MouseEvent,
    origin: { x: number; y: number },
    viewportScale: number,
    id: string,
  ) => {
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    const onMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / viewportScale;
      const dy = (ev.clientY - startY) / viewportScale;
      if (!moved && Math.hypot(dx, dy) < 3) return;
      moved = true;
      const current = useGraphStore.getState();
      current.dispatch({ type: 'SET_DRAGGING_NODE', id });
      current.dispatch({ type: 'MOVE_NODE', id, position: { x: origin.x + dx, y: origin.y + dy } });
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      const current = useGraphStore.getState();
      if (moved) {
        current.dispatch({ type: 'SET_DRAGGING_NODE', id: null });
        current.dispatch({ type: 'COMMIT_GRAPH' });
      }
      scale.set(1);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const store = useGraphStore.getState();
    const currentEditor = store.editor;
    if (currentEditor.mode !== 'addEdge' || !currentEditor.pendingEdgeSource) return;
    if (currentEditor.pendingEdgeSource === node.id) return;

    const source = currentEditor.pendingEdgeSource;
    const exists = store.graph.edges.some(edge => edge.source === source && edge.target === node.id);
    if (!exists) {
      store.dispatch({
        type: 'ADD_EDGE',
        edge: { id: `edge_${Date.now()}`, source, target: node.id, weight: 1, state: 'default', flowProgress: 0 },
      });
    }
    store.dispatch({ type: 'SET_MODE', mode: 'select' });
    store.dispatch({ type: 'SET_PENDING_EDGE_SOURCE', id: null });
  };

  const distanceText = node.distance === null ? '∞' : String(node.distance);

  return (
    <g
      data-graph-element="node"
      transform={`translate(${node.position.x} ${node.position.y})`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      style={{ cursor: editor.mode === 'addEdge' ? 'crosshair' : isDragging ? 'grabbing' : 'grab' }}
    >
      <motion.g style={{ scale: hoverScale }}>
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
    </g>
  );
});

Node.displayName = 'Node';
