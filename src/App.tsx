import React, { useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { GraphCanvas } from './graph/GraphCanvas';
import { Toolbar } from './panels/Toolbar';
import { QueueTray } from './panels/QueueTray';
import { Narration } from './panels/Narration';
import { Timeline } from './panels/Timeline';
import { useGraphStore } from './graph/store';
import { createDefaultGraph } from './graph/defaultGraph';

const STEP_INTERVAL_MS = 900;

export const App: React.FC = () => {
  const { algorithm, dispatch } = useGraphStore();
  const { isPlaying, playbackSpeed, steps, currentStepIndex } = algorithm;

  // The store rehydrates from localStorage before we mount, so an empty graph
  // here means there is nothing saved yet.
  useEffect(() => {
    if (useGraphStore.getState().graph.nodes.length === 0) {
      dispatch({ type: 'LOAD_GRAPH', graph: createDefaultGraph() });
    }
  }, [dispatch]);

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

  useHotkeys('mod+z', () => {
    dispatch({ type: 'UNDO' });
  }, [dispatch]);

  useHotkeys('mod+shift+z', () => {
    dispatch({ type: 'REDO' });
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
        <span>Del — Delete hovered</span>
        <span>Esc — Cancel</span>
        <span>⌘Z / ⇧⌘Z — Undo / Redo</span>
        <span>Add Node mode + click — New node</span>
        <span>Drag node — Move</span>
        <span>Add Edge mode + click two nodes — Connect</span>
        <span>Dbl-click weight — Edit</span>
        <span>Alt/middle drag — Pan · Scroll — Zoom</span>
      </div>
    </div>
  );
};