import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGraphStore } from '../graph/store';
import { spring } from '../styles/tokens';

export const Narration: React.FC = () => {
  const { algorithm } = useGraphStore();
  const { steps, currentStepIndex } = algorithm;

  if (steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  if (!currentStep) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={spring.panel}
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 100,
        maxWidth: 360,
        padding: '16px 20px',
        background: 'var(--color-surface)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-ink-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8, fontFamily: 'var(--font-family)' }}>
        Step {currentStepIndex + 1} of {steps.length}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={currentStep.narration}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'var(--color-ink)',
            fontFamily: 'var(--font-family)',
            fontWeight: 450,
          }}
        >
          {currentStep.narration}
        </motion.p>
      </AnimatePresence>
      <motion.div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--color-border)',
          fontSize: '12px',
          color: 'var(--color-ink-soft)',
          fontFamily: 'var(--font-family)',
          display: 'flex',
          gap: 16,
        }}
      >
        <span>Visited: <strong>{currentStep.visited.length}</strong></span>
        <span>Settled: <strong>{currentStep.settled.length}</strong></span>
        <span>Queue: <strong>{currentStep.queue.length}</strong></span>
      </motion.div>
    </motion.div>
  );
};