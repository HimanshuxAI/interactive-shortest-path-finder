import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useGraphStore } from './store';
import { Node } from './Node';
import { Edge } from './Edge';
import { ExploredLayer } from './ExploredLayer';
import { nodeSize, spring } from '../styles/tokens';

export const GraphCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { graph, editor, viewport, dispatch, addNodeAt } = useGraphStore();
  const { nodes, edges } = graph;

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const motionX = useMotionValue(viewport.x);
  const motionY = useMotionValue(viewport.y);
  const motionScale = useMotionValue(viewport.scale);

  const springX = useSpring(motionX, spring.direct);
  const springY = useSpring(motionY, spring.direct);
  const springScale = useSpring(motionScale, { stiffness: 300, damping: 25 });

  useEffect(() => {
    motionX.set(viewport.x);
    motionY.set(viewport.y);
    motionScale.set(viewport.scale);
  }, [viewport.x, viewport.y, viewport.scale, motionX, motionY, motionScale]);

  const handleWheelNative = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const currentScale = motionScale.get();
    const newScale = Math.max(0.3, Math.min(3, currentScale * zoomFactor));
    const scaleRatio = newScale / currentScale;

    const newX = mouseX - (mouseX - motionX.get()) * scaleRatio;
    const newY = mouseY - (mouseY - motionY.get()) * scaleRatio;

    motionScale.set(newScale);
    motionX.set(newX);
    motionY.set(newY);

    dispatch({ type: 'SET_VIEWPORT', viewport: { x: newX, y: newY, scale: newScale } });
  }, [motionX, motionY, motionScale, dispatch]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', handleWheelNative);
  }, [handleWheelNative]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isGraphElement = target.closest('[data-graph-element]');
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      setPanStart({ x: e.clientX - motionX.get(), y: e.clientY - motionY.get() });
    } else if (e.button === 0 && editor.mode === 'select' && !isGraphElement) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const x = (e.clientX - rect.left - motionX.get()) / motionScale.get();
        const y = (e.clientY - rect.top - motionY.get()) / motionScale.get();
        addNodeAt({ x, y });
      }
    }
  }, [editor.mode, motionX, motionY, motionScale, addNodeAt]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    const newX = e.clientX - panStart.x;
    const newY = e.clientY - panStart.y;
    motionX.set(newX);
    motionY.set(newY);
    dispatch({ type: 'SET_VIEWPORT', viewport: { x: newX, y: newY, scale: motionScale.get() } });
  }, [isPanning, panStart, motionX, motionY, motionScale, dispatch]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
    }
  }, [isPanning]);

  const handleMouseLeave = useCallback(() => {
    if (isPanning) setIsPanning(false);
  }, [isPanning]);

  const transformX = useTransform(springX, v => `${v}px`);
  const transformY = useTransform(springY, v => `${v}px`);
  const transformScale = useTransform(springScale, v => `${v}`);

  const radius = nodeSize.default;

  return (
    <div
      ref={containerRef}
      data-graph-container="true"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--color-bg)',
        touchAction: 'none',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      <motion.svg
        style={{
          width: '100%',
          height: '100%',
          transformOrigin: '0 0',
          x: transformX,
          y: transformY,
          scale: transformScale,
        }}
      >
        <defs>
          <filter id="ink-pool" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
            <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="threshold" />
            <feBlend in="SourceGraphic" in2="threshold" mode="normal" />
          </filter>
        </defs>

        <rect
          width="4000"
          height="4000"
          x="-2000"
          y="-2000"
          fill="var(--color-bg)"
          pointerEvents="none"
        />

        <g filter="url(#ink-pool)" style={{ opacity: 0.4 }}>
          <ExploredLayer />
        </g>

        {edges.map((edge: typeof edges[0]) => {
          const sourceNode = nodes.find((n: typeof nodes[0]) => n.id === edge.source);
          const targetNode = nodes.find((n: typeof nodes[0]) => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;
          return (
            <Edge
              key={edge.id}
              edge={edge}
              sourceNode={sourceNode}
              targetNode={targetNode}
              radius={radius}
            />
          );
        })}

        {nodes.map((node: typeof nodes[0]) => (
          <Node
            key={node.id}
            node={node}
            radius={radius}
          />
        ))}

        {editor.mode === 'addEdge' && editor.pendingEdgeSource && (
          <PendingEdge sourceId={editor.pendingEdgeSource} radius={radius} />
        )}
      </motion.svg>
    </div>
  );
};

interface PendingEdgeProps {
  sourceId: string;
  radius: number;
}

const PendingEdge: React.FC<PendingEdgeProps> = ({ sourceId }) => {
  const { graph } = useGraphStore();
  const sourceNode = graph.nodes.find(n => n.id === sourceId);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const container = document.querySelector('[data-graph-container]');
      if (container) {
        const rect = container.getBoundingClientRect();
        setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      }
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  if (!sourceNode) return null;

  const dx = mousePos.x - sourceNode.position.x;
  const dy = mousePos.y - sourceNode.position.y;
  const distance = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx);

  const controlDistance = distance * 0.3;
  const controlPoint = {
    x: sourceNode.position.x + Math.cos(angle) * controlDistance,
    y: sourceNode.position.y + Math.sin(angle) * controlDistance,
  };

  const path = `M ${sourceNode.position.x} ${sourceNode.position.y} Q ${controlPoint.x} ${controlPoint.y} ${mousePos.x} ${mousePos.y}`;

  return (
    <path
      d={path}
      stroke="var(--color-coral)"
      strokeWidth={2}
      strokeDasharray="8 6"
      fill="none"
      strokeLinecap="round"
      style={{ opacity: 0.6, pointerEvents: 'none' }}
    />
  );
};

GraphCanvas.displayName = 'GraphCanvas';
