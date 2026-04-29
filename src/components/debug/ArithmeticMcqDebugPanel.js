import React from 'react';
import { getArithmeticMcqDebugHistory } from '../../utils/arithmeticMcq';

export default function ArithmeticMcqDebugPanel() {
  let enabled = false;
  try {
    enabled = localStorage.getItem('gameDebug') === '1';
  } catch (_) {}
  if (!enabled) return null;

  const items = getArithmeticMcqDebugHistory();
  const latest = items[0] || null;

  try {
    if (latest) localStorage.setItem('gameDebugLatest', JSON.stringify(latest));
  } catch (_) {}

  const copyLatest = async () => {
    try {
      const text = JSON.stringify(latest, null, 2);
      await navigator.clipboard.writeText(text);
    } catch (_) {
      // Fallback: do nothing
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 12,
      right: 12,
      width: 420,
      maxHeight: 260,
      overflow: 'auto',
      zIndex: 99999,
      background: 'rgba(15, 23, 42, 0.92)',
      color: '#e2e8f0',
      border: '1px solid rgba(148, 163, 184, 0.35)',
      borderRadius: 12,
      padding: 12,
      fontSize: 12,
      lineHeight: 1.35,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ fontWeight: 700 }}>
          Arithmetic MCQ Debug (last {items.length})
        </div>
        <button
          onClick={copyLatest}
          disabled={!latest}
          style={{
            cursor: latest ? 'pointer' : 'not-allowed',
            borderRadius: 8,
            border: '1px solid rgba(148, 163, 184, 0.35)',
            background: 'rgba(30, 41, 59, 0.9)',
            color: '#e2e8f0',
            padding: '6px 10px',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Copy latest
        </button>
      </div>
      {items.length === 0 ? (
        <div>No generated questions yet.</div>
      ) : (
        items.map((it, idx) => (
          <div key={idx} style={{ padding: '8px 0', borderTop: idx === 0 ? 'none' : '1px solid rgba(148, 163, 184, 0.2)' }}>
            <div style={{ opacity: 0.85 }}>
              {new Date(it.ts).toLocaleTimeString()} • level {it.level}
            </div>
            <div style={{ marginTop: 4 }}><strong>Q</strong>: {it.text}</div>
            <div><strong>A</strong>: {String(it.answer)}</div>
            <div><strong>Options</strong>: [{it.options.map(String).join(', ')}]</div>
            <div><strong>Has answer in options</strong>: {String(it.options.includes(it.answer))}</div>
          </div>
        ))
      )}
      <div style={{ marginTop: 8, opacity: 0.8 }}>
        Disable: set localStorage gameDebug=0 • Latest also saved as localStorage gameDebugLatest
      </div>
    </div>
  );
}

