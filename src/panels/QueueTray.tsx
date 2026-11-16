import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGraphStore } from '../graph/store';
import { spring } from '../styles/tokens';

export const QueueTray: React.FC = () => {
  const { algorithm } = useGraphStore();
  const { steps, currentStepIndex } = algorithm;

  if (steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  if (!currentStep) return null;

  const queue = currentStep.queue;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={spring.panel}
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        display: 'flex',
        gap: 8,
        padding: '8 12',
        background: 'var(--color-surface)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)',
        maxWidth: '90vw',
        overflowX: 'auto',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-ink-soft)', fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font-family)' }}>
        Queue:
      </span>
      <AnimatePresence mode="popLayout">
        {queue.map((item: { node: string; distance: number }) => (
          <motion.div
            key={`${item.node}-${item.distance}`}
            layout
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -10 }}
            transition={spring.panel}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6 10',
              background: item.node === currentStep.node ? 'var(--color-coral)' : 'var(--color-coral-tint)',
              color: item.node === currentStep.node ? 'var(--color-surface)' : 'var(--color-ink)',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 500,
              fontFamily: 'var(--font-family)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
              boxShadow: item.node === currentStep.node ? '0 2px 8px rgba(255, 107, 53, 0.3)' : 'none',
            }}
          >
            {item.node}
            <span style={{ opacity: 0.7 }}>·</span>
            <span className="tabular-nums">{item.distance}</span>
          </motion.div>
        ))}
      </AnimatePresence>
      {queue.length === 0 && (
        <span style={{ display: 'flex', alignItems: 'center', color: 'var(--color-ink-muted)', fontSize: '12px', fontFamily: 'var(--font-family)' }}>
          (empty)
        </span>
      )}
    </motion.div>
  );
};