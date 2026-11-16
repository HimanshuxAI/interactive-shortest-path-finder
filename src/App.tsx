import React, { useEffect } from 'react';
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

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      const element = target as HTMLElement | null;
      if (!element) return false;
      const tag = element.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || element.isContentEditable;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const store = useGraphStore.getState();
      const { algorithm: algo, editor } = store;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        store.dispatch({ type: e.shiftKey ? 'REDO' : 'UNDO' });
        return;
      }

      // Everything below is a bare key, so leave form controls alone.
      if (isTypingTarget(e.target)) return;

      switch (e.key) {
        case ' ':
          if (algo.steps.length > 0) {
            e.preventDefault();
            store.dispatch({ type: algo.isPlaying ? 'PAUSE' : 'PLAY' });
          }
          break;
        case 'ArrowLeft':
          if (algo.steps.length > 0 && algo.currentStepIndex > 0) {
            e.preventDefault();
            store.dispatch({ type: 'PREV_STEP' });
          }
          break;
        case 'ArrowRight':
          if (algo.steps.length > 0 && algo.currentStepIndex < algo.steps.length - 1) {
            e.preventDefault();
            store.dispatch({ type: 'NEXT_STEP' });
          }
          break;
        case 'r':
        case 'R':
          if (algo.steps.length > 0) store.dispatch({ type: 'RESET' });
          break;
        case 'Delete':
        case 'Backspace':
          if (editor.hoveredNode) store.dispatch({ type: 'REMOVE_NODE', id: editor.hoveredNode });
          else if (editor.hoveredEdge) store.dispatch({ type: 'REMOVE_EDGE', id: editor.hoveredEdge });
          break;
        case 'Escape':
          if (editor.pendingEdgeSource || editor.editingWeightEdge) {
            store.dispatch({ type: 'SET_PENDING_EDGE_SOURCE', id: null });
            store.dispatch({ type: 'SET_EDITING_WEIGHT', id: null });
            store.dispatch({ type: 'SET_MODE', mode: 'select' });
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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