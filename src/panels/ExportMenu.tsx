import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGraphStore } from '../graph/store';
import { spring } from '../styles/tokens';

export const ExportMenu: React.FC = () => {
  const { exportGraph, exportImage, saveGraph, loadGraph } = useGraphStore();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportGraph = () => {
    exportGraph();
    setIsOpen(false);
  };

  const handleExportImage = () => {
    const svg = document.querySelector('svg') as SVGSVGElement;
    exportImage(svg);
    setIsOpen(false);
  };

  const handleSave = () => {
    saveGraph();
    setIsOpen(false);
  };

  const handleLoad = () => {
    loadGraph();
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', zIndex: 200 }}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '8 12',
          borderRadius: '8px',
          background: 'var(--color-surface)',
          color: 'var(--color-ink)',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: 'var(--font-family)',
          border: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Export
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={spring.panel}
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              minWidth: 200,
              background: 'var(--color-surface)',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden',
            }}
          >
            <motion.button
              layout
              whileHover={{ background: 'var(--color-coral-tint)', color: 'var(--color-coral)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportGraph}
              style={{
                width: '100%',
                padding: '12 16',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--font-family)',
                color: 'var(--color-ink)',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              Export Graph (JSON)
            </motion.button>
            <div style={{ height: 1, background: 'var(--color-border)', margin: '0 12' }} />
            <motion.button
              layout
              whileHover={{ background: 'var(--color-coral-tint)', color: 'var(--color-coral)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportImage}
              style={{
                width: '100%',
                padding: '12 16',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--font-family)',
                color: 'var(--color-ink)',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              Export Image (SVG)
            </motion.button>
            <div style={{ height: 1, background: 'var(--color-border)', margin: '0 12' }} />
            <motion.button
              layout
              whileHover={{ background: 'var(--color-coral-tint)', color: 'var(--color-coral)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              style={{
                width: '100%',
                padding: '12 16',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--font-family)',
                color: 'var(--color-ink)',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save to LocalStorage
            </motion.button>
            <div style={{ height: 1, background: 'var(--color-border)', margin: '0 12' }} />
            <motion.button
              layout
              whileHover={{ background: 'var(--color-coral-tint)', color: 'var(--color-coral)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLoad}
              style={{
                width: '100%',
                padding: '12 16',
                textAlign: 'left',
                fontSize: '13px',
                fontWeight: 500,
                fontFamily: 'var(--font-family)',
                color: 'var(--color-ink)',
                background: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Load from LocalStorage
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};