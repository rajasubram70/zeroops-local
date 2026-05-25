import React, { useState, useEffect } from 'react';
import { C, sc, pc } from '../config/theme.js';
import { Lbl } from '../components/atoms.jsx';
import { useLiveData } from '../hooks/useLiveData.js';
import { LiveBadge } from '../components/LiveBadge.jsx';
import {
  INCIDENTS_DATA,
  REQUEST_STATS as REQ_STATS,
  SILENT_LOG,
  DAILY_STATS,
  AGENT_DEFS,
  CUSTOMER,
  METRICS,
} from '../data/customer/loader.js';
const AGENTS_DATA = AGENT_DEFS;

const REQUEST_STATS = REQ_STATS;

const PILLAR_COLORS = { 1: '#2563EB', 2: '#D97706', 3: '#16A34A' };
const PILLAR_LABELS = {
  1: 'Pillar 1 Sentinel',
  2: 'Pillar 2 Guardian',
  3: 'Pillar 3 Advisor',
};
const OUT_COLORS = {
  'AUTO-RESOLVED': '#16A34A',
  HEALED: '#16A34A',
  RESOLVED: '#16A34A',
  DETECTED: '#2563EB',
  'PENDING HITL': '#D97706',
  'HITL DONE': '#D97706',
  COMPLETED: '#7C3AED',
};

function SilentOpsLog() {
  const [filter, setFilter] = useState('all');
  const { data: liveEvents, isLive, lastSync } = useLiveData('/events', SILENT_LOG);
  const log = liveEvents || SILENT_LOG;

  const shown =
    filter === 'all'
      ? log
      : filter === 'p1'
      ? log.filter((e) => e.pillar === 1)
      : filter === 'p2'
      ? log.filter((e) => e.pillar === 2)
      : log.filter((e) =>
          ['HEALED', 'AUTO-RESOLVED'].includes(e.outcome)
        );

  const autoCount  = log.filter((e) => e.pillar === 1).length;
  const hitlCount  = log.filter((e) => e.pillar === 2).length;
  const healCount  = log.filter((e) => ['HEALED', 'AUTO-RESOLVED'].includes(e.outcome)).length;
  const approvedCount = log.filter((e) => e.outcome === 'RESOLVED').length;
  const awaitingCount = log.filter((e) => e.outcome === 'AWAITING APPROVAL').length;
  const totalCount = log.length;

  const liveStats = [
    {
      icon: '🤖',
      value: autoCount,
      label: 'Auto-resolved',
      color: C.GREEN,
      pillar: 1,
    },
    {
      icon: '✅',
      value: approvedCount,
      label: 'HiTL approved',
      color: C.BLUE,
      pillar: 2,
    },
    {
      icon: '⏳',
      value: awaitingCount,
      label: 'Awaiting approval',
      color: C.AMBER,
      pillar: 2,
    },
    {
      icon: '📋',
      value: totalCount,
      label: 'Total agent actions',
      color: '#7C3AED',
      pillar: 1,
    },
    {
      icon: '🛡',
      value: hitlCount,
      label: 'Guardian actions',
      color: C.BLUE,
      pillar: 2,
    },
    {
      icon: '🎯',
      value: totalCount > 0 ? Math.round((autoCount + approvedCount) / totalCount * 100) : 0,
      label: 'Resolution rate %',
      color: C.GREEN,
      pillar: 1,
    },
  ];

  const displayStats = isLive ? liveStats : DAILY_STATS;

  const groups = [
    {
      label: 'Last Hour',
      items: shown.filter((e) => parseInt(e.ts.split(':')[0]) >= 3),
    },
    {
      label: '2-4 Hours Ago',
      items: shown.filter((e) => {
        const h = parseInt(e.ts.split(':')[0]);
        return h >= 1 && h < 3;
      }),
    },
    {
      label: 'Earlier Today',
      items: shown.filter(
        (e) =>
          parseInt(e.ts.split(':')[0]) < 1 ||
          e.ts.startsWith('2') ||
          e.ts.startsWith('18') ||
          e.ts.startsWith('20') ||
          e.ts.startsWith('22') ||
          e.ts.startsWith('23')
      ),
    },
  ].filter((g) => g.items.length > 0);

  return (
    <div
      data-section="silent-ops"
      style={{
        marginTop: 4,
        background: C.PANEL,
        border: `1px solid ${C.BORDER}`,
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${C.BORDER}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(59,130,246,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: C.BLUE,
              animationName: 'livePulseBlue',
              animation: 'livePulseBlue 1.6s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <style>{`
            @keyframes livePulseBlue {
              0%, 100% { opacity:1; transform:scale(1); box-shadow:0 0 0 0 rgba(37,99,235,0.6); }
              50%       { opacity:0.6; transform:scale(1.3); box-shadow:0 0 0 5px rgba(37,99,235,0); }
            }
          `}</style>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
            Silent Operations Centre
          </span>
          {isLive
            ? <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#16A34A',
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)',
                borderRadius: 6, padding: '2px 8px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%',
                  background: '#16A34A', display: 'inline-block', flexShrink: 0 }}/>
                LIVE · {lastSync?.toLocaleTimeString()}
              </span>
            : <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#888780',
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(0,0,0,0.04)', border: '1px solid #D3D1C7',
                borderRadius: 6, padding: '2px 8px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%',
                  background: '#888780', display: 'inline-block', flexShrink: 0 }}/>
                STATIC
              </span>
          }
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 11, color: C.GREEN, fontFamily: 'monospace' }}>
            Today: {log.length} agent actions logged
          </span>
        </div>
      </div>

      {/* Daily counters */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6,1fr)',
          gap: 0,
          borderBottom: `1px solid ${C.BORDER}`,
        }}
      >
        {displayStats.map((stat, i) => (
          <div
            key={i}
            style={{
              padding: '12px 16px',
              borderRight: i < 5 ? `1px solid ${C.BORDER}` : 'none',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 18, marginBottom: 4 }}>{stat.icon}</div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: stat.color,
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {(stat.value ?? 0).toLocaleString()}
            </div>
            <div style={{ fontSize: 10, color: C.MUTED, marginTop: 4, lineHeight: 1.4 }}>
              {stat.label}
            </div>
            <div
              style={{
                marginTop: 5,
                fontSize: 9,
                color: PILLAR_COLORS[stat.pillar],
                background: 'rgba(0,0,0,0.04)',
                borderRadius: 3,
                padding: '1px 5px',
                fontFamily: 'monospace',
                display: 'inline-block',
                border: `1px solid ${PILLAR_COLORS[stat.pillar]}`,
              }}
            >
              {PILLAR_LABELS[stat.pillar]}
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          padding: '10px 16px',
          borderBottom: `1px solid ${C.BORDER}`,
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 11, color: C.MUTED, marginRight: 4 }}>Filter:</span>
        {[
          ['all', 'All Actions', log.length],
          ['p1', '👁 Sentinel', autoCount],
          ['p2', '🛡 Guardian', hitlCount],
          ['healed', '✅ Resolved', healCount],
        ].map(([key, label, count]) => (
          <div
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: filter === key ? 600 : 400,
              background: filter === key ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.03)',
              color: filter === key ? '#1D4ED8' : C.MUTED,
              border: `1px solid ${filter === key ? 'rgba(59,130,246,0.35)' : C.BORDER}`,
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {label}
            <span
              style={{
                fontSize: 10,
                background: 'rgba(0,0,0,0.08)',
                borderRadius: 3,
                padding: '1px 5px',
                fontFamily: 'monospace',
              }}
            >
              {count}
            </span>
          </div>
        ))}
      </div>

      {/* Log groups */}
      <div style={{ overflowY: 'auto', maxHeight: 560 }}>
        {groups.map((group) => (
          <div key={group.label}>
            <div
              style={{
                padding: '6px 16px',
                fontSize: 10,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
                background: 'rgba(0,0,0,0.025)',
                borderBottom: `1px solid rgba(255,255,255,0.03)`,
              }}
            >
              {group.label.toUpperCase()} — {group.items.length} action{group.items.length !== 1 ? 's' : ''}
            </div>
            {group.items.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 16px',
                  borderBottom: `1px solid rgba(255,255,255,0.03)`,
                  background: entry.highlight
                    ? 'rgba(59,130,246,0.04)'
                    : 'transparent',
                }}
              >
                <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748B', flexShrink: 0, width: 54 }}>{entry.ts}</span>
                <div style={{ width: 76, flexShrink: 0 }}>
                  <span
                    style={{
                      fontSize: 9, padding: '2px 6px', borderRadius: 3,
                      fontFamily: 'monospace', fontWeight: 600,
                      background: 'rgba(0,0,0,0.04)',
                      color: PILLAR_COLORS[entry.pillar],
                      border: `1px solid ${PILLAR_COLORS[entry.pillar]}`,
                    }}
                  >
                    {PILLAR_LABELS[entry.pillar]}
                  </span>
                </div>
                <span style={{ fontSize: 14, flexShrink: 0 }}>
                  {entry.icon === 'robot'  ? '🤖' :
                   entry.icon === 'check'  ? '✅' :
                   entry.icon === 'user'   ? '👤' :
                   entry.icon === 'alert'  ? '⚠️' : '🔍'}
                </span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#2563EB', flexShrink: 0, width: 130 }}>{entry.agent}</span>
                <span style={{ fontSize: 12, color: C.MUTED, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.action}</span>
                <span
                  style={{
                    fontSize: 10, padding: '2px 8px', borderRadius: 4,
                    fontFamily: 'monospace', fontWeight: 600, flexShrink: 0,
                    color: OUT_COLORS[entry.outcome] || C.MUTED,
                    background: `${OUT_COLORS[entry.outcome] || C.MUTED}20`,
                    border: `1px solid ${OUT_COLORS[entry.outcome] || C.MUTED}`,
                  }}
                >
                  {entry.outcome}
                </span>
                <span style={{ fontSize: 10, color: C.MUTED, fontFamily: 'monospace', flexShrink: 0, width: 36, textAlign: 'right' }}>{entry.dur}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '10px 16px',
          borderTop: `1px solid ${C.BORDER}`,
          display: 'flex',
          gap: 16,
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 11, color: C.GREEN }}>
          ✓ <strong>{autoCount}</strong> issues resolved with zero human intervention today
        </div>
        <div style={{ fontSize: 11, color: C.BLUE }}>
          🛡 <strong>{hitlCount}</strong> guardian actions · <strong>{approvedCount}</strong> HiTL approved
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 10, color: C.MUTED, fontFamily: 'monospace' }}>
          {isLive ? 'Live data · Bridge API · refreshes every 30s' : 'Static data · Bridge API offline'}
        </div>
      </div>
    </div>
  );
}


function AppHealthModal({ chains, status, onClose }) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('status');

  const statusOrder = { RED: 0, AMBER: 1, GREEN: 2 };
  const filterBg = {
    GREEN: 'rgba(22,163,74,0.08)',
    AMBER: 'rgba(217,119,6,0.08)',
    RED: 'rgba(220,38,38,0.08)',
  };

  const allApps = (chains || []).flatMap((ch) =>
    (ch.apps || []).map((a) => ({ ...a, chainName: ch.name, chainIcon: ch.icon || '⬡' }))
  );

  const visible = allApps
    .filter((a) => status === 'ALL' || a.status === status)
    .filter((a) => !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.chainName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'status') return statusOrder[a.status] - statusOrder[b.status];
      if (sortBy === 'perf') return (b.perf || 0) - (a.perf || 0);
      if (sortBy === 'chain') return a.chainName.localeCompare(b.chainName);
      return a.name.localeCompare(b.name);
    });

  const counts = { GREEN: 0, AMBER: 0, RED: 0 };
  allApps.forEach((a) => counts[a.status]++);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 48, paddingBottom: 24, overflow: 'auto' }}
      onClick={onClose}
    >
      <div
        style={{ background: 'rgba(255,255,255,0.99)', borderRadius: 12, width: '100%', maxWidth: 860, boxShadow: '0 24px 80px rgba(0,0,0,0.25)', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.BORDER}`, background: 'rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>Application Health</div>
            <div style={{ fontSize: 12, color: C.MUTED }}>{allApps.length} applications across {(chains || []).length} service chains — real-time status</div>
          </div>
          <div onClick={() => onClose(null)} style={{ cursor: 'pointer', color: C.MUTED, fontSize: 22, lineHeight: 1, padding: '0 4px' }}>✕</div>
        </div>

        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.BORDER}`, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {[['ALL', null, '#64748B', 'rgba(0,0,0,0.05)'], ['Critical', 'RED', C.RED, filterBg.RED], ['Degraded', 'AMBER', C.AMBER, filterBg.AMBER], ['Healthy', 'GREEN', C.GREEN, filterBg.GREEN]].map(([label, val, col, bg]) => {
            const cnt = val ? counts[val] : allApps.length;
            const active = status === val || (val === null && status === 'ALL');
            return (
              <div key={label} onClick={() => { if (val === null) onClose('ALL'); else onClose(val); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, cursor: 'pointer', background: active ? bg : 'rgba(0,0,0,0.03)', border: `1px solid ${active ? col + '50' : C.BORDER}`, transition: 'all 0.15s' }}>
                {val && <div style={{ width: 8, height: 8, borderRadius: '50%', background: col, boxShadow: active ? `0 0 6px ${col}` : 'none' }} />}
                <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? col : '#64748B' }}>{label}</span>
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: active ? col : C.MUTED }}>{cnt}</span>
              </div>
            );
          })}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: C.MUTED }}>Sort:</span>
            {['status', 'name', 'chain', 'perf'].map((s) => (
              <div key={s} onClick={() => setSortBy(s)}
                style={{ padding: '3px 8px', borderRadius: 5, cursor: 'pointer', fontSize: 11, fontFamily: 'monospace', background: sortBy === s ? 'rgba(37,99,235,0.1)' : 'transparent', color: sortBy === s ? '#1D4ED8' : C.MUTED, border: `1px solid ${sortBy === s ? 'rgba(37,99,235,0.3)' : C.BORDER}` }}>
                {s}
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '10px 20px', borderBottom: `1px solid ${C.BORDER}` }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search applications or service chains..."
            style={{ width: '100%', background: 'rgba(0,0,0,0.03)', border: `1px solid ${C.BORDER}`, borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#1E293B', outline: 'none', boxSizing: 'border-box' }} />
        </div>

        <div style={{ overflowY: 'auto', maxHeight: 380 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'rgba(255,255,255,0.98)', zIndex: 1 }}>
              <tr style={{ borderBottom: `2px solid ${C.BORDER}` }}>
                {['Application', 'Chain', 'Health', 'Perf Score', 'Version', 'Infra Signals'].map((h) => (
                  <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 10, color: C.MUTED, fontFamily: 'monospace', letterSpacing: 1.5, fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((app, i) => {
                const sCol = app.status === 'RED' ? C.RED : app.status === 'AMBER' ? C.AMBER : C.GREEN;
                const sBg = app.status === 'RED' ? 'rgba(220,38,38,0.06)' : app.status === 'AMBER' ? 'rgba(217,119,6,0.06)' : 'rgba(22,163,74,0.04)';
                const anom = (app.infra || []).filter((x) => x.anom).length;
                return (
                  <tr key={app.id || i}
                    style={{ borderBottom: `1px solid rgba(0,0,0,0.06)`, background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.012)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(37,99,235,0.04)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.012)')}>
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: '#1E293B' }}>{app.name}</td>
                    <td style={{ padding: '10px 16px', color: C.MUTED }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 14 }}>{app.chainIcon}</span>
                        <span style={{ fontSize: 11 }}>{app.chainName}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: sBg, border: `1px solid ${sCol}30`, borderRadius: 12, padding: '3px 10px' }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: sCol, display: 'inline-block', boxShadow: `0 0 5px ${sCol}80` }} />
                        <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'monospace', color: sCol }}>
                          {app.status === 'RED' ? 'Critical' : app.status === 'AMBER' ? 'Degraded' : 'Healthy'}
                        </span>
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 52, height: 5, background: 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${app.perf || 0}%`, background: app.perf >= 90 ? C.GREEN : app.perf >= 70 ? C.AMBER : C.RED, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: app.perf >= 90 ? C.GREEN : app.perf >= 70 ? C.AMBER : C.RED }}>{app.perf || 0}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 11, color: C.MUTED }}>{app.ver || '—'}</td>
                    <td style={{ padding: '10px 16px' }}>
                      {anom > 0 ? (
                        <span style={{ fontSize: 11, color: C.RED, fontFamily: 'monospace' }}>⚠ {anom} anomal{anom === 1 ? 'y' : 'ies'}</span>
                      ) : (
                        <span style={{ fontSize: 11, color: C.GREEN }}>✓ All clear</span>
                      )}
                      {(app.infra || []).filter((x) => x.anom).map((sig, si) => (
                        <div key={si} style={{ fontSize: 10, color: C.MUTED, marginTop: 2, lineHeight: 1.4 }}>· {sig.detail}</div>
                      ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && <div style={{ textAlign: 'center', color: C.MUTED, padding: '32px 0', fontSize: 13 }}>No applications match "{search}"</div>}
        </div>

        <div style={{ padding: '10px 20px', borderTop: `1px solid ${C.BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)' }}>
          <span style={{ fontSize: 11, color: C.MUTED, fontFamily: 'monospace' }}>Showing {visible.length} of {allApps.length} applications</span>
          <span style={{ fontSize: 11, color: C.MUTED }}>Click any filter pill to narrow · ESC or click outside to close</span>
        </div>
      </div>
    </div>
  );
}

// ── MTTR Timeline Arrow ───────────────────────────────────────
function MTTRBar({ current, baseline, color }) {
  const redPct = Math.round((1 - current / baseline) * 100);
  const baseVal = baseline >= 60 ? `${Math.round(baseline / 60)}h` : `${baseline}m`;
  const currVal = current >= 60 ? `${Math.round(current / 60)}h` : `${current}m`;
  return (
    <div style={{ width: '100%', padding: '4px 0 2px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 8, position: 'relative' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#DC2626', boxShadow: '0 0 0 3px rgba(220,38,38,0.2)', marginBottom: 4 }} />
          <span style={{ fontSize: 18, fontWeight: 800, color: '#DC2626', fontFamily: 'monospace', lineHeight: 1 }}>{baseVal}</span>
          <span style={{ fontSize: 9, color: '#94A3B8', fontFamily: 'monospace', letterSpacing: 1, marginTop: 2 }}>BEFORE</span>
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 8px', marginBottom: 20 }}>
          <div style={{ width: '100%', position: 'relative', height: 12, display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, height: 2, background: 'linear-gradient(to right,#DC2626,#16A34A)' }} />
            <div style={{ width: 0, height: 0, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: `10px solid ${color}`, flexShrink: 0 }} />
          </div>
          <div style={{ marginTop: 4, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 12, padding: '2px 10px' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color, fontFamily: 'monospace' }}>↓ {redPct}% faster</span>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, boxShadow: `0 0 0 3px ${color}30`, marginBottom: 4 }} />
          <span style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'monospace', lineHeight: 1 }}>{currVal}</span>
          <span style={{ fontSize: 9, color: '#94A3B8', fontFamily: 'monospace', letterSpacing: 1, marginTop: 2 }}>NOW</span>
        </div>
      </div>
      <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace', letterSpacing: 1, textAlign: 'center' }}>MEAN TIME TO RESOLVE</div>
    </div>
  );
}

// ── Donut ring ────────────────────────────────────────────────
function DonutKPI({ pct, color, label, value, sub, size = 90 }) {
  const cx = size / 2, cy = size / 2, r = size * 0.36;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={size * 0.1} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={size * 0.1}
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 1.2s ease' }} />
        <text x={cx} y={cy - 3} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.2} fontWeight="800" fill={color} fontFamily="monospace">{value}</text>
        <text x={cx} y={cy + size * 0.14} textAnchor="middle" fontSize={size * 0.1} fill="#94A3B8" fontFamily="monospace">{sub || ''}</text>
      </svg>
      <div style={{ fontSize: 9.5, color: '#64748B', fontFamily: 'monospace', letterSpacing: 0.5, textAlign: 'center', lineHeight: 1.3 }}>{label}</div>
    </div>
  );
}

// ── App Health donut ──────────────────────────────────────────
function AppHealthDonut({ red, amber, green, total, size = 80, onClick }) {
  const cx = size / 2, cy = size / 2, r = size * 0.36;
  const circ = 2 * Math.PI * r;
  const segments = [{ val: red, color: '#DC2626' }, { val: amber, color: '#D97706' }, { val: green, color: '#16A34A' }];
  let offset = 0;
  return (
    <svg width={size} height={size} style={{ cursor: 'pointer' }} onClick={onClick}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.07)" strokeWidth={size * 0.12} />
      {segments.map((seg, i) => {
        const pct = total > 0 ? seg.val / total : 0;
        const dash = pct * circ;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={size * 0.12}
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={(-offset * circ) / (total || 1)}
            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
        );
        offset += seg.val;
        return el;
      })}
      <text x={cx} y={cy - 2} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.24} fontWeight="800" fill="#0F172A" fontFamily="monospace">{total}</text>
      <text x={cx} y={cy + size * 0.16} textAnchor="middle" fontSize={size * 0.12} fill="#94A3B8" fontFamily="monospace">apps</text>
    </svg>
  );
}

export default function CommandCentre({ chains, incidents, industry, onNav }) {
  const allApps = (chains || []).flatMap((c) => c.apps || []);
  const redN = allApps.filter((a) => a.status === 'RED').length;
  const ambN = allApps.filter((a) => a.status === 'AMBER').length;
  const grnN = allApps.filter((a) => a.status === 'GREEN').length;
  const totalN = allApps.length;
  const activeInc = (incidents || INCIDENTS_DATA).filter(
    (i) => i.status !== 'Resolved' && i.status !== 'Auto-Resolved'
  );

  //const { data: liveMetrics } = useLiveData('/metrics', null);
  const { data: liveMetrics, isLive: metricsLive } = useLiveData('/metrics', null);
  const [appStatus, setAppStatus] = useState('ALL');
  const [appModalOpen, setAppModalOpen] = useState(false);

  const [wouldHaveMin, setWouldHaveMin] = useState(() => {
    const now = new Date();
    const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
    const elapsedHrs = (now - midnight) / 3600000;
    const dailyAutoResolved = DAILY_STATS.find((d) => d.label.includes('Auto'))?.value || 11;
    const baselineMTTR = METRICS?.kpis?.mttr_baseline_min || 3000;
    const ratePerHr = (dailyAutoResolved / 24) * baselineMTTR;
    return Math.round(ratePerHr * elapsedHrs);
  });

  useEffect(() => {
    const dailyAutoResolved = DAILY_STATS.find((d) => d.label.includes('Auto'))?.value || 11;
    const baselineMTTR = METRICS?.kpis?.mttr_baseline_min || 17100;
    const ratePerMin = (dailyAutoResolved / 1440) * baselineMTTR;
    const id = setInterval(() => { setWouldHaveMin((prev) => Math.round(prev + ratePerMin)); }, 60000);
    return () => clearInterval(id);
  }, []);

  const wouldHaveHrs = Math.floor(wouldHaveMin / 60);
  const wouldHaveRem = wouldHaveMin % 60;
  const wouldHaveCost = Math.round((wouldHaveMin / 60) * (METRICS?.kpis?.engineer_hourly_rate_usd || 85));

  const [nowTime, setNowTime] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNowTime(new Date()), 60000); return () => clearInterval(id); }, []);

  const kpis = [
    { l: 'MTTR — AI', 
      v: liveMetrics?.avg_mttr_display || `${METRICS?.kpis?.mttr_current_min || 31} min`, 
      d: liveMetrics ? `↓ from baseline · ${liveMetrics.closed_tickets} incidents closed` : `↓ ${Math.round((1 - (METRICS?.kpis?.mttr_current_min || 31) / (METRICS?.kpis?.mttr_baseline_min || 1860)) * 100)}% vs ${METRICS?.kpis?.mttr_baseline_min ? Math.round(METRICS.kpis.mttr_baseline_min / 60) + 'h' : '186 min'} manual`, 
      c: C.GREEN },
    { l: 'Auto-Fix Rate', 
      v: liveMetrics ? `${liveMetrics.auto_rate}%` : `${METRICS?.kpis?.auto_fix_rate_pct || 73}%`, 
      d: liveMetrics ? `${liveMetrics.closed_tickets} of ${liveMetrics.total_tickets} incidents auto-resolved` : `↑ from ${METRICS?.kpis?.auto_fix_baseline_pct || 0}% at go-live`, 
      c: C.BLUE },
    { l: 'Ticket Deflection', v: `${METRICS?.kpis?.ticket_deflection_pct || 81}%`, d: `↑ from ${METRICS?.kpis?.ticket_deflection_baseline_pct || 31}% at go-live`, c: C.PURPLE },
    { l: 'Alert Noise Red.', v: `${METRICS?.kpis?.alert_noise_red_pct || 99}%`, d: `${METRICS?.kpis?.alert_volume_per_day || 47000} raw → ${METRICS?.kpis?.actionable_alerts_per_day || 340}/day`, c: C.AMBER },
    {
      l: METRICS?.kpis?.satisfaction_measure === 'BOTH' ? 'CSAT / NPS' : METRICS?.kpis?.satisfaction_measure === 'NPS' ? 'NPS' : 'CSAT',
      v: METRICS?.kpis?.satisfaction_measure === 'BOTH' ? `${METRICS?.kpis?.csat_current || 4.1}/5` : METRICS?.kpis?.satisfaction_measure === 'NPS' ? `${(METRICS?.kpis?.nps_current || 28) >= 0 ? '+' : ''}${METRICS?.kpis?.nps_current || 28}` : `${METRICS?.kpis?.csat_current || 4.4}/5`,
      v2: METRICS?.kpis?.satisfaction_measure === 'BOTH' ? `${(METRICS?.kpis?.nps_current || 28) >= 0 ? '+' : ''}${METRICS?.kpis?.nps_current || 28} NPS` : null,
      d: METRICS?.kpis?.satisfaction_measure === 'BOTH' ? `NPS ${(METRICS?.kpis?.nps_current || 28) >= 0 ? '+' : ''}${METRICS?.kpis?.nps_current || 28} · from ${METRICS?.kpis?.nps_baseline || -50} baseline` : METRICS?.kpis?.satisfaction_measure === 'NPS' ? `↑ ${(METRICS?.kpis?.nps_current || 28) - (METRICS?.kpis?.nps_baseline || -50)} pts from ${METRICS?.kpis?.nps_baseline || -50}` : `↑ +${((METRICS?.kpis?.csat_current || 4.4) - (METRICS?.kpis?.csat_baseline || 3.1)).toFixed(1)} pts since AIOps`,
      c: '#EA580C', c2: '#7C3AED',
    },
    { l: 'Engineer Toil', v: `${METRICS?.kpis?.engineer_toil_current_pct || 28}%`, d: `↓ from ${METRICS?.kpis?.engineer_toil_baseline_pct || 70}% — ${(METRICS?.kpis?.engineer_toil_baseline_pct || 70) - (METRICS?.kpis?.engineer_toil_current_pct || 28)}pp reclaimed`, c: C.GREEN },
    { l: 'Active Incidents', 
      v: liveMetrics ? (liveMetrics.total_tickets - liveMetrics.closed_tickets) : activeInc.length, 
      d: liveMetrics ? `${liveMetrics.total_tickets} total · ${liveMetrics.closed_tickets} resolved` : `${activeInc.filter((i) => i.pri === 'P1').length} P1 open`, 
      c: C.RED, nav: 'inc' },
    { l: 'Open Requests', v: REQUEST_STATS.openNow, d: `${REQUEST_STATS.autoRate}% auto-fulfilling today`, c: '#7C3AED', nav: 'requests' },
  ];
  console.log('liveMetrics:', liveMetrics, 'isLive:', metricsLive);
  return (
    <div style={{ padding: '18px 22px 22px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
        <Lbl n="0">Dashboards</Lbl>
        {industry && (
          <div style={{ fontSize: 12, color: C.MUTED, fontFamily: 'monospace', background: `${industry.accentColor}14`, border: `1px solid ${industry.accentColor}28`, borderRadius: 6, padding: '4px 12px' }}>
            {industry.logo} {industry.name}
          </div>
        )}
      </div>

      {/* Value Delivered Today */}
      <div style={{ marginBottom: 8, background: 'linear-gradient(135deg,rgba(22,163,74,0.07),rgba(37,99,235,0.05))', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 10, padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 9, color: '#16A34A', fontFamily: 'monospace', letterSpacing: 3, marginBottom: 4 }}>ZEROOPS VALUE DELIVERED TODAY</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>Engineer hours saved · cost avoided · all autonomous · no human intervention required</div>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', lineHeight: 1 }}>{wouldHaveHrs}<span style={{ fontSize: 14, color: '#94A3B8' }}>h</span>{String(wouldHaveRem).padStart(2, '0')}<span style={{ fontSize: 14, color: '#94A3B8' }}>m</span></div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>engineer hours saved</div>
          </div>
          <div style={{ width: 1, height: 36, background: 'rgba(22,163,74,0.2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: '#16A34A', fontFamily: 'monospace', lineHeight: 1 }}>${wouldHaveCost.toLocaleString()}</div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>cost avoided today</div>
          </div>
          <div style={{ width: 1, height: 36, background: 'rgba(22,163,74,0.2)' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#2563EB', fontFamily: 'monospace', lineHeight: 1 }}>$0.12</div>
            <div style={{ fontSize: 10, color: '#94A3B8', fontFamily: 'monospace' }}>AI spend today</div>
          </div>
        </div>
      </div>

      {/* 2-column split */}
      <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 16, alignItems: 'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: C.MUTED, fontFamily: 'monospace', letterSpacing: 3, marginBottom: 8 }}>LIVE PERFORMANCE</div>

            {/* MTTR */}
            <div style={{ background: C.PANEL, border: `1px solid ${C.BORDER}`, borderRadius: 8, padding: '14px 16px', marginBottom: 8 }}>
              <MTTRBar current={liveMetrics?.avg_mttr_seconds ? Math.max(1, Math.round(liveMetrics.avg_mttr_seconds / 60)) : METRICS?.kpis?.mttr_current_min || 1200} baseline={METRICS?.kpis?.mttr_baseline_min || 3000} color={C.GREEN} />
              <div style={{ fontSize: 10, color: C.MUTED, fontFamily: 'monospace', letterSpacing: 2, marginBottom: 2, textAlign: 'center' }}>MTTR — AI ASSISTED</div>
            </div>

            {/* 3×2 Donut grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
              <div style={{ background: C.PANEL, border: `1px solid ${C.BORDER}`, borderRadius: 8, padding: '10px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <DonutKPI pct={liveMetrics?.auto_rate || METRICS?.kpis?.auto_fix_rate_pct || 42} color={C.BLUE} value={`${liveMetrics?.auto_rate || METRICS?.kpis?.auto_fix_rate_pct || 42}%`} sub="of target" label="Auto-Fix Rate" size={88} />
                <div style={{ fontSize: 9, color: C.MUTED, fontFamily: 'monospace', marginTop: 2, letterSpacing: 1 }}>TARGET {METRICS?.kpis?.auto_fix_target_pct || 60}%</div>
              </div>
              <div style={{ background: C.PANEL, border: `1px solid ${C.BORDER}`, borderRadius: 8, padding: '10px 8px', display: 'flex', justifyContent: 'center' }}>
                <DonutKPI pct={METRICS?.kpis?.ticket_deflection_pct || 48} color={C.PURPLE} value={`${METRICS?.kpis?.ticket_deflection_pct || 48}%`} sub="deflected" label="Ticket Deflection" size={88} />
              </div>
              <div style={{ background: C.PANEL, border: `1px solid ${C.BORDER}`, borderRadius: 8, padding: '10px 8px', display: 'flex', justifyContent: 'center' }}>
                <DonutKPI pct={METRICS?.kpis?.alert_noise_red_pct || 92} color={C.AMBER} value={`${METRICS?.kpis?.alert_noise_red_pct || 92}%`} sub="noise cut" label="Alert Noise Red." size={88} />
              </div>
              <div style={{ background: C.PANEL, border: `1px solid ${C.BORDER}`, borderRadius: 8, padding: '10px 8px', display: 'flex', justifyContent: 'center' }}>
                <DonutKPI pct={METRICS?.kpis?.csat_current ? (METRICS.kpis.csat_current / 5) * 100 : 80} color="#EA580C" value={`${METRICS?.kpis?.csat_current || 4.0}/5`} sub="CSAT" label="Customer Sat." size={88} />
              </div>
              <div style={{ background: C.PANEL, border: `1px solid ${C.BORDER}`, borderRadius: 8, padding: '10px 8px', display: 'flex', justifyContent: 'center' }}>
                <DonutKPI pct={100 - (METRICS?.kpis?.engineer_toil_current_pct || 28)} color={C.GREEN} value={`${METRICS?.kpis?.engineer_toil_current_pct || 28}%`} sub="toil" label="Engineer Toil" size={88} />
              </div>
              <div style={{ background: C.PANEL, border: `1px solid ${C.BORDER}`, borderRadius: 8, padding: '10px 8px', display: 'flex', justifyContent: 'center' }}>
                <DonutKPI pct={METRICS?.kpis?.mttd_current_min ? Math.max(100 - METRICS.kpis.mttd_current_min, 85) : 91} color="#0E7C7B" value={`${METRICS?.kpis?.mttd_current_min || 4}m`} sub="MTTD" label="Mean Time Detect" size={88} />
              </div>
            </div>

            {/* Application Health */}
            <div style={{ background: C.PANEL, border: `1px solid ${C.BORDER}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Application Health</div>
                  <div style={{ fontSize: 11, color: C.MUTED, marginTop: 2 }}>{totalN} apps · {(chains || []).length} chains — click to drill down</div>
                </div>
                <div style={{ fontSize: 10, color: C.MUTED, fontFamily: 'monospace', letterSpacing: 2 }}>LIVE</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <AppHealthDonut red={redN} amber={ambN} green={grnN} total={totalN} size={88} onClick={() => { setAppStatus('ALL'); setAppModalOpen(true); }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[{ label: 'Critical', count: redN, color: C.RED, sf: 'RED' }, { label: 'Degraded', count: ambN, color: C.AMBER, sf: 'AMBER' }, { label: 'Healthy', count: grnN, color: C.GREEN, sf: 'GREEN' }].map(({ label, count, color, sf }) => (
                    <div key={label} onClick={() => { setAppStatus(sf); setAppModalOpen(true); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
                      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                      <div style={{ fontSize: 11, color: '#475569', flex: 1 }}>{label}</div>
                      <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'monospace' }}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Silent Operations Centre */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>

          <SilentOpsLog />
        </div>
      </div>

      {/* App Health modal — rendered at root so it overlays everything */}
      {appModalOpen && (
        <AppHealthModal
          chains={chains}
          status={appStatus}
          onClose={(val) => {
            if (!val) { setAppModalOpen(false); }
            else { setAppStatus(val); }
          }}
        />
      )}
    </div>
  );
}