import React, { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { GraphCanvas } from './graph/GraphCanvas';
import { Toolbar } from './panels/Toolbar';
import { QueueTray } from './panels/QueueTray';
import { Narration } from './panels/Narration';
import { Timeline } from './panels/Timeline';
import { useGraphStore } from './graph/store';

function createDefaultGraph() {
  const nodes = [
    { id: 'A', label: 'A', position: { x: 200, y: 300 }, state: 'unvisited' as const, distance: null },
    { id: 'B', label: 'B', position: { x: 400, y: 200 }, state: 'unvisited' as const, distance: null },
    { id: 'C', label: 'C', position: { x: 400, y: 400 }, state: 'unvisited' as const, distance: null },
    { id: 'D', label: 'D', position: { x: 600, y: 300 }, state: 'unvisited' as const, distance: null },
    { id: 'E', label: 'E', position: { x: 300, y: 500 }, state: 'unvisited' as const, distance: null },
    { id: 'F', label: 'F', position: { x: 500, y: 100 }, state: 'unvisited' as const, distance: null },
  ];

  const edges = [
    { id: 'e1', source: 'A', target: 'B', weight: 4, state: 'default' as const, flowProgress: 0 },
    { id: 'e2', source: 'A', target: 'C', weight: 2, state: 'default' as const, flowProgress: 0 },
    { id: 'e3', source: 'C', target: 'B', weight: 1, state: 'default' as const, flowProgress: 0 },
    { id: 'e4', source: 'B', target: 'D', weight: 5, state: 'default' as const, flowProgress: 0 },
    { id: 'e5', source: 'C', target: 'D', weight: 8, state: 'default' as const, flowProgress: 0 },
    { id: 'e6', source: 'C', target: 'E', weight: 3, state: 'default' as const, flowProgress: 0 },
    { id: 'e7', source: 'E', target: 'D', weight: 2, state: 'default' as const, flowProgress: 0 },
    { id: 'e8', source: 'A', target: 'F', weight: 7, state: 'default' as const, flowProgress: 0 },
    { id: 'e9', source: 'F', target: 'B', weight: 2, state: 'default' as const, flowProgress: 0 },
  ];

  return { nodes, edges };
}

const STEP_INTERVAL_MS = 900;

export const App: React.FC = () => {
  const { loadGraph, algorithm, dispatch } = useGraphStore();
  const { isPlaying, playbackSpeed, steps, currentStepIndex } = algorithm;

  useEffect(() => {
    const saved = localStorage.getItem('shortest-path-finder-graph');
    if (!saved) {
      const defaultGraph = createDefaultGraph();
      dispatch({ type: 'LOAD_GRAPH', graph: defaultGraph });
    } else {
      loadGraph();
    }
  }, [loadGraph, dispatch]);

  // Drive playback. Each tick advances one step; the store stops playback once
  // it reaches a terminal step.
  useEffect(() => {
    if (!isPlaying || steps.length === 0) return;
    const delay = Math.max(80, STEP_INTERVAL_MS / playbackSpeed);
    const timer = window.setInterval(() => {
      useGraphStore.getState().dispatch({ type: 'NEXT_STEP' });
    }, delay);
    return () => window.clearInterval(timer);
  }, [isPlaying, playbackSpeed, steps.length, currentStepIndex]);

  useHotkeys(' ', () => {
    if (algorithm.steps.length > 0) {
      const { isPlaying } = algorithm;
      if (isPlaying) {
        dispatch({ type: 'PAUSE' });
      } else {
        dispatch({ type: 'PLAY' });
      }
    }
  }, [algorithm.steps.length, algorithm.isPlaying, dispatch]);

  useHotkeys('left', () => {
    if (algorithm.steps.length > 0 && algorithm.currentStepIndex > 0) {
      dispatch({ type: 'PREV_STEP' });
    }
  }, [algorithm.steps.length, algorithm.currentStepIndex, dispatch]);

  useHotkeys('right', () => {
    if (algorithm.steps.length > 0 && algorithm.currentStepIndex < algorithm.steps.length - 1) {
      dispatch({ type: 'NEXT_STEP' });
    }
  }, [algorithm.steps.length, algorithm.currentStepIndex, dispatch]);

  useHotkeys('r', () => {
    if (algorithm.steps.length > 0) {
      dispatch({ type: 'RESET' });
    }
  }, [algorithm.steps.length, dispatch]);

  useHotkeys('delete', () => {
    const { editor } = useGraphStore.getState();
    if (editor.hoveredNode) {
      dispatch({ type: 'REMOVE_NODE', id: editor.hoveredNode });
    } else if (editor.hoveredEdge) {
      dispatch({ type: 'REMOVE_EDGE', id: editor.hoveredEdge });
    }
  }, [dispatch]);

  useHotkeys('esc', () => {
    const store = useGraphStore.getState();
    if (store.editor.pendingEdgeSource || store.editor.editingWeightEdge) {
      store.dispatch({ type: 'SET_PENDING_EDGE_SOURCE', id: null });
      store.dispatch({ type: 'SET_EDITING_WEIGHT', id: null });
      store.dispatch({ type: 'SET_MODE', mode: 'select' });
    }
  }, [dispatch]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      <GraphCanvas data-graph-container="true" />
      <Toolbar />
      <QueueTray />
      <Narration />
      <Timeline />
      <div style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        fontSize: '11px',
        color: 'var(--color-ink-muted)',
        fontFamily: 'var(--font-family)',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}>
        <span>Space — Play/Pause</span>
        <span>← / → — Step</span>
        <span>R — Reset</span>
        <span>Del — Delete</span>
        <span>Click — Add Node</span>
        <span>Drag Node — Move</span>
        <span>Drag Node→Node — Add Edge</span>
        <span>Dbl-click Weight — Edit</span>
      </div>
    </div>
  );
};