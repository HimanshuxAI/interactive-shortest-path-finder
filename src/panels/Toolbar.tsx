import React from 'react';
import { motion } from 'framer-motion';
import { useGraphStore } from '../graph/store';
import { ExportMenu } from './ExportMenu';

export const Toolbar: React.FC = () => {
  const { graph, algorithm, editor, dispatch, stepForward, stepBackward, togglePlayback, resetAlgorithm } = useGraphStore();
  const { nodes, edges } = graph;
  const { steps, currentStepIndex, isPlaying, sourceNode, targetNode } = algorithm;
  const { mode } = editor;

  const canRun = nodes.length > 0 && edges.length > 0;
  const hasSteps = steps.length > 0;

  const handleSourceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_ENDPOINTS', source: e.target.value || null });
  };

  const handleTargetSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch({ type: 'SET_ENDPOINTS', target: e.target.value || null });
  };

  const currentStep = steps[currentStepIndex];
  const totalCost = algorithm.status === 'complete' ? currentStep?.totalCost : undefined;

  return (
    <div style={{ position: 'fixed', top: 16, left: 16, zIndex: 100, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--color-surface)', padding: '8 12', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => dispatch({ type: 'SET_MODE', mode: 'select' })}
          style={{
            padding: '8 12',
            borderRadius: '8px',
            background: mode === 'select' ? 'var(--color-coral)' : 'transparent',
            color: mode === 'select' ? 'var(--color-surface)' : 'var(--color-ink)',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'var(--font-family)',
            border: '1px solid var(--color-border)',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          Select
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => dispatch({ type: 'SET_MODE', mode: 'addNode' })}
          style={{
            padding: '8 12',
            borderRadius: '8px',
            background: mode === 'addNode' ? 'var(--color-coral)' : 'transparent',
            color: mode === 'addNode' ? 'var(--color-surface)' : 'var(--color-ink)',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'var(--font-family)',
            border: '1px solid var(--color-border)',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          Add Node
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => dispatch({ type: 'SET_MODE', mode: 'addEdge' })}
          style={{
            padding: '8 12',
            borderRadius: '8px',
            background: mode === 'addEdge' ? 'var(--color-coral)' : 'transparent',
            color: mode === 'addEdge' ? 'var(--color-surface)' : 'var(--color-ink)',
            fontSize: '13px',
            fontWeight: 500,
            fontFamily: 'var(--font-family)',
            border: '1px solid var(--color-border)',
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          Add Edge
        </motion.button>
      </div>

      {canRun && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--color-surface)', padding: '8 12', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' }}>
          <select
            value={sourceNode || ''}
            onChange={handleSourceSelect}
            disabled={!canRun}
            style={{
              padding: '8 12',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              fontSize: '13px',
              fontFamily: 'var(--font-family)',
              minWidth: '120px',
            }}
          >
            <option value="">Source</option>
            {nodes.map((n: typeof nodes[0]) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
          <span style={{ color: 'var(--color-ink-muted)', fontSize: '13px' }}>→</span>
          <select
            value={targetNode || ''}
            onChange={handleTargetSelect}
            disabled={!canRun}
            style={{
              padding: '8 12',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              fontSize: '13px',
              fontFamily: 'var(--font-family)',
              minWidth: '120px',
            }}
          >
            <option value="">Target</option>
            {nodes.map((n: typeof nodes[0]) => <option key={n.id} value={n.id}>{n.label}</option>)}
          </select>
        </div>
      )}

      {totalCost !== undefined && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--color-coral-tint)',
          color: 'var(--color-coral)',
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid var(--color-coral)',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: 'var(--font-family)',
        }}>
          Shortest path cost: <strong>{totalCost}</strong>
        </div>
      )}

      {algorithm.status === 'no-path' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--color-surface)',
          color: 'var(--color-ink-soft)',
          padding: '8px 12px',
          borderRadius: '12px',
          border: '1px solid var(--color-border)',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: 'var(--font-family)',
        }}>
          No path between the two nodes
        </div>
      )}

      {hasSteps && (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'var(--color-surface)', padding: '8 12', borderRadius: '12px', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)' }}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={stepBackward}
            disabled={currentStepIndex <= 0}
            style={{
              padding: '8 12',
              borderRadius: '8px',
              background: 'var(--color-surface)',
              color: currentStepIndex <= 0 ? 'var(--color-ink-muted)' : 'var(--color-ink)',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'var(--font-family)',
              border: '1px solid var(--color-border)',
              opacity: currentStepIndex <= 0 ? 0.5 : 1,
            }}
          >
            ← Step
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={togglePlayback}
            style={{
              padding: '8 16',
              borderRadius: '8px',
              background: isPlaying ? 'var(--color-coral)' : 'var(--color-surface)',
              color: isPlaying ? 'var(--color-surface)' : 'var(--color-ink)',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'var(--font-family)',
              border: '1px solid var(--color-border)',
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={stepForward}
            disabled={currentStepIndex >= steps.length - 1}
            style={{
              padding: '8 12',
              borderRadius: '8px',
              background: 'var(--color-surface)',
              color: currentStepIndex >= steps.length - 1 ? 'var(--color-ink-muted)' : 'var(--color-ink)',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'var(--font-family)',
              border: '1px solid var(--color-border)',
              opacity: currentStepIndex >= steps.length - 1 ? 0.5 : 1,
            }}
          >
            Step →
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetAlgorithm}
            style={{
              padding: '8 12',
              borderRadius: '8px',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'var(--font-family)',
              border: '1px solid var(--color-border)',
            }}
          >
            Reset
          </motion.button>
        </div>
      )}

      <ExportMenu />
    </div>
  );
};