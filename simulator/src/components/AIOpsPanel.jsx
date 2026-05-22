import { useRef, useEffect } from 'react';
import { C, lc } from '../config/theme.js';

export default function AIOpsPanel({
  aiTarget,
  aiRunning,
  aiLogs,
  aiPct,
  onDismiss,
}) {
  const logRef = useRef(null);
  useEffect(() => {
    logRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiLogs]);

  if (!aiTarget) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 48,
        left: 182,
        right: 0,
        zIndex: 150,
        background: 'rgba(255,255,255,0.98)',
        borderBottom: '2px solid rgba(59,130,246,0.2)',
        borderLeft: 'none',
        padding: '9px 18px',
        boxShadow: '0 4px 16px rgba(37,99,235,0.08)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 5,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: aiRunning ? C.BLUE : C.GREEN,
              boxShadow: aiRunning ? `0 0 6px ${C.BLUE}` : `0 0 6px ${C.GREEN}`,
              animation: aiRunning ? 'livePulse 1.2s infinite' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#1D4ED8',
              fontFamily: 'monospace',
            }}
          >
            AIOps Engine — {aiRunning ? 'RUNNING' : 'COMPLETED'}
          </span>
          <span
            style={{ fontSize: 10, color: C.MUTED, fontFamily: 'monospace' }}
          >
            · {aiTarget}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              fontSize: 9,
              fontFamily: 'monospace',
              color: aiRunning ? C.BLUE : C.GREEN,
              fontWeight: 700,
            }}
          >
            {aiPct}%
          </span>
          <div
            onClick={onDismiss}
            style={{
              cursor: 'pointer',
              fontSize: 10,
              color: C.MUTED,
              padding: '2px 8px',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 4,
              userSelect: 'none',
            }}
          >
            ✕
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div
        style={{
          background: 'rgba(0,0,0,0.04)',
          borderRadius: 3,
          height: 3,
          marginBottom: 5,
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 3,
            width: `${aiPct}%`,
            transition: 'width 0.3s',
            background: aiRunning
              ? `linear-gradient(90deg, #1d4ed8, #7c3aed)`
              : C.GREEN,
          }}
        />
      </div>

      {/* Log stream */}
      <div
        style={{
          maxHeight: 80,
          overflowY: 'auto',
          fontFamily: 'monospace',
          fontSize: 10,
        }}
      >
        {aiLogs.map((log, i) => (
          <div key={i} style={{ color: lc(log.t), lineHeight: 1.6 }}>
            <span style={{ color: C.MUTED }}>[{log.ts}] </span>
            {log.msg}
          </div>
        ))}
        <div ref={logRef} />
      </div>
    </div>
  );
}
