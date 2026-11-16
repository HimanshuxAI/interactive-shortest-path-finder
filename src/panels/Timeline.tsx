import React, { useEffect } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useGraphStore } from '../graph/store';
import { spring } from '../styles/tokens';

export const Timeline: React.FC = () => {
  const { algorithm, dispatch, stepForward, stepBackward, togglePlayback, setPlaybackSpeed, resetAlgorithm } = useGraphStore();
  const { steps, currentStepIndex, isPlaying, playbackSpeed } = algorithm;

  // Hooks must run before the early return, otherwise starting a run changes
  // the hook count and React throws.
  const progress = useMotionValue(0);
  const springProgress = useSpring(progress, { stiffness: 300, damping: 25 });
  const progressWidth = useTransform(springProgress, v => `${Math.max(0, Math.min(1, v)) * 100}%`);

  useEffect(() => {
    progress.set(currentStepIndex / Math.max(1, steps.length - 1));
  }, [currentStepIndex, steps.length, progress]);

  if (steps.length === 0) return null;

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    const index = Math.round(value * (steps.length - 1));
    dispatch({ type: 'GOTO_STEP', index });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ') {
      e.preventDefault();
      togglePlayback();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepBackward();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepForward();
    } else if (e.key === 'r' || e.key === 'R') {
      resetAlgorithm();
    }
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={spring.panel}
      style={{
        position: 'fixed',
        bottom: 80,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: 'min(90vw, 600px)',
        padding: '16px 20px',
        background: 'var(--color-surface)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)',
        border: '1px solid var(--color-border)',
      }}
      onKeyDown={handleKeyDown}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={stepBackward}
          disabled={currentStepIndex <= 0}
          style={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            background: 'var(--color-surface)',
            color: currentStepIndex <= 0 ? 'var(--color-ink-muted)' : 'var(--color-ink)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: currentStepIndex <= 0 ? 0.5 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={togglePlayback}
          style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            background: isPlaying ? 'var(--color-coral)' : 'var(--color-surface)',
            color: isPlaying ? 'var(--color-surface)' : 'var(--color-ink)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={stepForward}
          disabled={currentStepIndex >= steps.length - 1}
          style={{
            width: 36,
            height: 36,
            borderRadius: '8px',
            background: 'var(--color-surface)',
            color: currentStepIndex >= steps.length - 1 ? 'var(--color-ink-muted)' : 'var(--color-ink)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: currentStepIndex >= steps.length - 1 ? 0.5 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </motion.button>
      </div>

      <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'var(--color-border)', overflow: 'hidden' }}>
        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: progressWidth,
            background: 'var(--color-coral)',
            borderRadius: 4,
          }}
        />
        <input
          type="range"
          min={0}
          max={1}
          step={1 / Math.max(1, steps.length - 1)}
          value={currentStepIndex / Math.max(1, steps.length - 1)}
          onChange={handleScrub}
          style={{
            position: 'absolute',
            top: -6,
            left: 0,
            width: '100%',
            height: 20,
            opacity: 0,
            cursor: 'pointer',
            zIndex: 10,
          }}
        />
        {steps.map((_step: typeof steps[0], index: number) => (
          <motion.div
            key={index}
            style={{
              position: 'absolute',
              top: -4,
              left: `calc(${index / Math.max(1, steps.length - 1) * 100}% - 4px)`,
              width: 8,
              height: 16,
              background: index === currentStepIndex ? 'var(--color-coral)' : 'var(--color-border-strong)',
              borderRadius: 2,
              transform: 'translateX(-50%)',
            }}
          />
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: '12px', color: 'var(--color-ink-soft)', fontFamily: 'var(--font-family)' }}>
        <span>Step {currentStepIndex + 1} / {steps.length}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: '11px' }}>Speed:</span>
          <select
            value={playbackSpeed}
            onChange={e => setPlaybackSpeed(parseFloat(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-ink)',
              fontSize: '11px',
              fontFamily: 'var(--font-family)',
            }}
          >
            <option value={0.5}>0.5×</option>
            <option value={1}>1×</option>
            <option value={1.5}>1.5×</option>
            <option value={2}>2×</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
};