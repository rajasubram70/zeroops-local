import { useState, useEffect, useRef, useCallback } from 'react';
import { C } from '../config/theme.js';
import {
  INCIDENTS_DATA,
  MIM_SME_ROSTER,
  MIM_LIVE_METRICS,
  MIM_WAR_ROOM_CHAT,
  MIM_VENDOR_ESCALATIONS,
  MIM_TIMELINE,
  MIM_BROADCAST_TEMPLATES,
} from '../data/customer/loader.js';

const P1_INCIDENTS = INCIDENTS_DATA.filter((i) => i.pri === 'P1');

// ── Rich SME rosters ──────────────────────────────────────────
// SME_ROSTER loaded from mim_teams.json via loader

// ── Live metrics per incident ──────────────────────────────────
// LIVE_METRICS loaded from mim_teams.json via loader

// ── War room chat transcripts ─────────────────────────────────
// WAR_ROOM_CHAT loaded from mim_teams.json via loader

// ── Vendor escalations ────────────────────────────────────────
// VENDOR_ESCALATIONS loaded from mim_teams.json via loader

// ── Full timeline data ────────────────────────────────────────
// TIMELINE loaded from mim_teams.json via loader

// ── Broadcast templates ───────────────────────────────────────
// BROADCAST_TEMPLATES loaded from mim_teams.json via loader

// ── Type config ───────────────────────────────────────────────
const TYPE_CFG = {
  alert: {
    icon: '🔴',
    label: 'Alert',
    bg: 'rgba(220,38,38,0.07)',
    border: 'rgba(220,38,38,0.2)',
    color: '#DC2626',
  },
  ai: {
    icon: '🤖',
    label: 'AI',
    bg: 'rgba(124,58,237,0.07)',
    border: 'rgba(124,58,237,0.2)',
    color: '#7C3AED',
  },
  swarm: {
    icon: '👥',
    label: 'Swarm',
    bg: 'rgba(37,99,235,0.07)',
    border: 'rgba(37,99,235,0.2)',
    color: '#2563EB',
  },
  comms: {
    icon: '📣',
    label: 'Comms',
    bg: 'rgba(8,145,178,0.07)',
    border: 'rgba(8,145,178,0.2)',
    color: '#0891B2',
  },
  decision: {
    icon: '✋',
    label: 'Decision',
    bg: 'rgba(217,119,6,0.07)',
    border: 'rgba(217,119,6,0.2)',
    color: '#D97706',
  },
  action: {
    icon: '⚡',
    label: 'Action',
    bg: 'rgba(22,163,74,0.07)',
    border: 'rgba(22,163,74,0.2)',
    color: '#16A34A',
  },
  success: {
    icon: '✅',
    label: 'Resolved',
    bg: 'rgba(22,163,74,0.07)',
    border: 'rgba(22,163,74,0.2)',
    color: '#16A34A',
  },
  close: {
    icon: '🏁',
    label: 'Closed',
    bg: 'rgba(22,163,74,0.1)',
    border: 'rgba(22,163,74,0.3)',
    color: '#16A34A',
  },
};

function Avatar({ member, size = 28 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: `${member.color}20`,
        border: `1.5px solid ${member.color}40`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.36,
        fontWeight: 700,
        color: member.color,
        fontFamily: 'monospace',
      }}
    >
      {member.avatar}
    </div>
  );
}

export default function MIMPage() {
  const [selId, setSelId] = useState(P1_INCIDENTS[0]?.id || null);
  const [tab, setTab] = useState('timeline');
  const [broadcastT, setBroadcastT] = useState(0);
  const [broadcastV, setBroadcastV] = useState('');
  const [sent, setSent] = useState([]);
  const [minutes, setMinutes] = useState('');
  const [minutesSaved, setMinutesSaved] = useState(false);
  const [replayActive, setReplayActive] = useState(false);
  const [replayIdx, setReplayIdx] = useState(0);
  const [replayEvents, setReplayEvents] = useState([]);
  const replayRef = useRef(null);
  const timelineRef = useRef(null);

  const incident = P1_INCIDENTS.find((i) => i.id === selId);
  const timeline = MIM_TIMELINE[selId] || [];
  const chat = MIM_WAR_ROOM_CHAT[selId] || [];
  const _rawMetrics = MIM_LIVE_METRICS[selId] || {};
  const metrics = Array.isArray(_rawMetrics)
    ? _rawMetrics
    : [
        {
          label: 'MTTR',
          before: 'Manual avg',
          after: _rawMetrics.mttr || '—',
          color: '#16A34A',
        },
        {
          label: 'Alerts Correlated',
          before: 'Multiple',
          after: `${_rawMetrics.alerts || 0} alerts`,
          color: '#2563EB',
        },
        {
          label: 'Auto Steps',
          before: '0/6 manual',
          after: `${_rawMetrics.autoSteps || 0} automated`,
          color: '#7C3AED',
        },
        {
          label: 'Confidence',
          before: 'Unknown',
          after: `${_rawMetrics.confidence || 0}%`,
          color: '#D97706',
        },
        {
          label: 'Status',
          before: 'Escalated',
          after: _rawMetrics.status || '—',
          color: '#16A34A',
        },
      ];
  const vendors = MIM_VENDOR_ESCALATIONS[selId] || [];
  const svcKey = incident?.svc.split('—')[0].trim().split(' ')[0];
  const smes =
    MIM_SME_ROSTER[svcKey] ||
    MIM_SME_ROSTER['DEFAULT'] ||
    MIM_SME_ROSTER['SAP'] ||
    [];
  const resolved =
    incident?.status === 'Resolved' || incident?.status === 'Auto-Resolved';

  // Replay-aware derived values
  const isReplaying = replayActive || replayEvents.length > 0;
  const replayHasSwarm = replayEvents.some((e) => e.type === 'swarm');
  const replayDecisions = replayEvents.filter((e) => e.type === 'decision');
  const replayBridgeOpen = replayEvents.some(
    (e) => e.type === 'swarm' || e.type === 'comms'
  );
  // How many SMEs to show based on replay progress — one per 3 replay events after swarm
  const swarmEventIdx = replayEvents.findIndex((e) => e.type === 'swarm');
  const eventsAfterSwarm =
    swarmEventIdx >= 0 ? replayEvents.length - swarmEventIdx : 0;
  const visibleSMECount = !isReplaying
    ? smes.length
    : !replayHasSwarm
    ? 0
    : Math.min(smes.length, 1 + Math.floor(eventsAfterSwarm / 1.5));

  useEffect(() => {
    const t = MIM_BROADCAST_TEMPLATES[broadcastT];
    setBroadcastV(
      t.text
        .replace(/\{id\}/g, selId || '')
        .replace(/\{svc\}/g, incident?.svc || '')
        .replace(
          /\{impact\}/g,
          `${smes.filter((s) => !s.ai).length} SMEs engaged — details on bridge`
        )
        .replace(/\{ts\}/g, incident?.at || '')
        .replace(/\{num\}/g, selId?.replace('INC', '') || '')
        .replace(/\{elapsed\}/g, incident?.sla?.split('·').pop().trim() || '—')
        .replace(
          /\{rca\}/g,
          incident?.notes?.slice(0, 80) + '...' || 'Under investigation'
        )
        .replace(/\{eta\}/g, '20 minutes')
        .replace(/\{mttr\}/g, resolved ? 'Resolved' : 'In progress')
        .replace(/\{resolution\}/g, incident?.notes?.slice(0, 60) + '...' || '')
    );
  }, [broadcastT, selId]);

  useEffect(() => {
    setMinutesSaved(false);
    setSent([]);
    setMinutes('');
  }, [selId]);

  const startReplay = useCallback(() => {
    setReplayEvents([]);
    setReplayIdx(0);
    setReplayActive(true);
  }, []);

  const stopReplay = useCallback(() => {
    setReplayActive(false);
    if (replayRef.current) clearTimeout(replayRef.current);
  }, []);

  // Reset replay when incident changes
  useEffect(() => {
    setReplayActive(false);
    setReplayIdx(0);
    setReplayEvents([]);
    if (replayRef.current) clearTimeout(replayRef.current);
  }, [selId]);

  // Replay engine — one event every 1.8 seconds
  useEffect(() => {
    if (!replayActive) return;
    if (replayIdx >= timeline.length) {
      setReplayActive(false);
      return;
    }
    replayRef.current = setTimeout(
      () => {
        setReplayEvents((prev) => [...prev, timeline[replayIdx]]);
        setReplayIdx((i) => i + 1);
        if (timelineRef.current) {
          timelineRef.current.scrollTo({
            top: timelineRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
      },
      replayIdx === 0 ? 400 : 1800
    );
    return () => clearTimeout(replayRef.current);
  }, [replayActive, replayIdx, timeline]);

  const TABS = [
    { id: 'timeline', label: '📋 Timeline' },
    { id: 'swarm', label: '👥 Swarm & Bridge' },
    { id: 'chat', label: '💬 War Room Chat' },
    { id: 'comms', label: '📣 Comms' },
    { id: 'minutes', label: '📝 Minutes' },
    { id: 'metrics', label: '📊 Impact Metrics' },
  ];

  return (
    <div
      style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <style>{`@keyframes mimPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(1.3)}} @keyframes smeAppear{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* ── Header ── */}
      <div
        style={{
          background: 'linear-gradient(135deg,#7F1D1D,#991B1B,#DC2626)',
          borderRadius: 12,
          padding: '18px 24px',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                opacity: 0.6,
                fontFamily: 'monospace',
                letterSpacing: 3,
                marginBottom: 6,
              }}
            >
              MAJOR INCIDENT MANAGEMENT — COMMAND ROOM
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 3 }}>
              {incident?.svc || '—'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>
              {selId} &nbsp;·&nbsp; {incident?.cat} &nbsp;·&nbsp; CI:{' '}
              {incident?.ci} &nbsp;·&nbsp; {incident?.hosting}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                justifyContent: 'flex-end',
                marginBottom: 6,
              }}
            >
              {resolved ? (
                <>
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: '#4ADE80',
                    }}
                  />
                  <span
                    style={{ fontSize: 14, fontWeight: 800, color: '#4ADE80' }}
                  >
                    RESOLVED
                  </span>
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: '#FCD34D',
                      animation: 'mimPulse 1.2s infinite',
                    }}
                  />
                  <span
                    style={{ fontSize: 14, fontWeight: 800, color: '#FCD34D' }}
                  >
                    ACTIVE BRIDGE
                  </span>
                </>
              )}
            </div>
            <div style={{ fontSize: 11, opacity: 0.65 }}>
              {smes.filter((s) => s.status === 'active').length} SMEs active
              &nbsp;·&nbsp; {smes.filter((s) => s.status === 'standby').length}{' '}
              standby
            </div>
          </div>
        </div>

        {/* KPI strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6,1fr)',
            gap: 8,
          }}
        >
          {[
            ['Detected', '< 1 min', '#FCD34D'],
            ['Swarmed', '< 2 min', '#93C5FD'],
            ['RCA', '< 3 min', '#C4B5FD'],
            [
              'SMEs active',
              `${smes.filter((s) => s.status === 'active').length}`,
              '#4ADE80',
            ],
            ['Timeline events', `${timeline.length}`, '#93C5FD'],
            ['MTTR', resolved ? 'See metrics' : 'Active', '#4ADE80'],
          ].map(([l, v, col]) => (
            <div
              key={l}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 7,
                padding: '10px 12px',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  opacity: 0.65,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  marginBottom: 5,
                }}
              >
                {l.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: col,
                  fontFamily: 'monospace',
                }}
              >
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Incident selector ── */}
      <div style={{ display: 'flex', gap: 8 }}>
        {P1_INCIDENTS.map((inc) => (
          <div
            key={inc.id}
            onClick={() => {
              setSelId(inc.id);
              setTab('timeline');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: 7,
              cursor: 'pointer',
              fontSize: 12,
              background:
                selId === inc.id ? 'rgba(220,38,38,0.1)' : 'rgba(0,0,0,0.03)',
              border: `1.5px solid ${
                selId === inc.id ? 'rgba(220,38,38,0.4)' : C.BORDER
              }`,
              color: selId === inc.id ? '#DC2626' : C.MUTED,
            }}
          >
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
              {inc.id}
            </span>
            <span style={{ marginLeft: 8, opacity: 0.7 }}>
              {inc.svc.split('—')[0].trim()}
            </span>
          </div>
        ))}
      </div>

      {/* ── Tab bar ── */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          borderBottom: `2px solid ${C.BORDER}`,
        }}
      >
        {TABS.map((t) => (
          <div
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: tab === t.id ? 600 : 400,
              color: tab === t.id ? '#DC2626' : C.MUTED,
              borderBottom:
                tab === t.id ? '2px solid #DC2626' : '2px solid transparent',
              marginBottom: -2,
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {/* ══ TIMELINE ══════════════════════════════════════════════ */}
      {tab === 'timeline' && (
        <div
          style={{
            background: '#fff',
            border: `1px solid ${C.BORDER}`,
            borderRadius: 10,
            padding: '18px 20px',
            maxHeight: 560,
            overflowY: 'auto',
          }}
          ref={timelineRef}
        >
          {/* Header + Replay controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              paddingBottom: 12,
              borderBottom: `1px solid ${C.BORDER}`,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 10,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                }}
              >
                INCIDENT TIMELINE — {selId} —{' '}
                {replayActive
                  ? `${replayEvents.length} of ${timeline.length}`
                  : timeline.length}{' '}
                EVENTS
              </div>
              <div style={{ fontSize: 10, color: C.MUTED, marginTop: 3 }}>
                {replayActive
                  ? 'Broadcasting live — events appearing in real time'
                  : 'Click LIVE REPLAY to watch the incident unfold'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {replayActive && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#DC2626',
                      animation: 'mimPulse 1s ease-in-out infinite',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      color: '#DC2626',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  >
                    LIVE
                  </span>
                </div>
              )}
              {!replayActive &&
                replayIdx >= timeline.length &&
                replayEvents.length > 0 && (
                  <span
                    style={{
                      fontSize: 10,
                      color: '#16A34A',
                      fontFamily: 'monospace',
                      fontWeight: 700,
                    }}
                  >
                    ✓ RESOLVED
                  </span>
                )}
              <button
                onClick={replayActive ? stopReplay : startReplay}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  background: replayActive
                    ? 'rgba(220,38,38,0.1)'
                    : 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
                  color: replayActive ? '#DC2626' : '#fff',
                  boxShadow: replayActive
                    ? 'none'
                    : '0 2px 8px rgba(29,78,216,0.3)',
                }}
              >
                {replayActive ? '⏹ STOP' : '▶ LIVE REPLAY'}
              </button>
              {!replayActive && replayEvents.length > 0 && (
                <button
                  onClick={() => {
                    setReplayEvents([]);
                    setReplayIdx(0);
                  }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: `1px solid ${C.BORDER}`,
                    cursor: 'pointer',
                    fontSize: 11,
                    background: 'transparent',
                    color: C.MUTED,
                  }}
                >
                  ↺
                </button>
              )}
            </div>
          </div>

          {/* Empty state — before replay starts */}
          {replayEvents.length === 0 && !replayActive && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#1E293B',
                  marginBottom: 6,
                }}
              >
                {timeline.length} events captured for {selId}
              </div>
              <div style={{ fontSize: 12, color: C.MUTED, marginBottom: 20 }}>
                Press LIVE REPLAY to watch the incident unfold in real time —
                one event every 1.8 seconds
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 16,
                  fontSize: 11,
                  color: C.MUTED,
                }}
              >
                {[
                  ['🔴', 'Alert'],
                  ['🤖', 'AI RCA'],
                  ['👥', 'Swarm'],
                  ['📣', 'Comms'],
                  ['✋', 'Decision'],
                  ['⚡', 'Action'],
                  ['🏁', 'Close'],
                ].map(([icon, label]) => (
                  <div
                    key={label}
                    style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Waiting for first event */}
          {replayEvents.length === 0 && replayActive && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                fontSize: 13,
                color: '#DC2626',
                fontFamily: 'monospace',
              }}
            >
              <div style={{ animation: 'mimPulse 1s ease-in-out infinite' }}>
                ◉ Monitoring environment...
              </div>
            </div>
          )}

          {/* Replay events */}
          {replayEvents.map((ev, i) => {
            const cfg = TYPE_CFG[ev.type] || TYPE_CFG.action;
            return (
              <div
                key={i}
                style={{ display: 'flex', gap: 12, marginBottom: 16 }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: 44,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: cfg.bg,
                      border: `2px solid ${cfg.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                    }}
                  >
                    {cfg.icon}
                  </div>
                  {i < timeline.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        flex: 1,
                        minHeight: 20,
                        background: 'rgba(0,0,0,0.06)',
                        marginTop: 4,
                      }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, paddingTop: 4 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 7 }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          color: cfg.color,
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          borderRadius: 4,
                          padding: '2px 8px',
                        }}
                      >
                        {cfg.label.toUpperCase()}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: '#475569',
                          fontWeight: 500,
                        }}
                      >
                        {ev.actor}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: '#94A3B8',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {ev.ts}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#1E293B',
                      lineHeight: 1.7,
                      background: cfg.bg,
                      border: `1px solid ${cfg.border}`,
                      borderRadius: 8,
                      padding: '10px 14px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {ev.msg}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ SWARM & BRIDGE ════════════════════════════════════════ */}
      {tab === 'swarm' && (
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
        >
          <div
            style={{
              background: '#fff',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 10,
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                }}
              >
                SME SWARM — AUTO-ASSEMBLED IN &lt; 60 SECONDS
              </div>
              {isReplaying && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  {replayHasSwarm ? (
                    <>
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: '#22C55E',
                          boxShadow: '0 0 6px rgba(34,197,94,0.5)',
                        }}
                      />
                      <span
                        style={{
                          fontSize: 9,
                          color: '#16A34A',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                        }}
                      >
                        {visibleSMECount} / {smes.length} JOINED
                      </span>
                    </>
                  ) : (
                    <>
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: '#DC2626',
                          animation: 'mimPulse 1s ease-in-out infinite',
                        }}
                      />
                      <span
                        style={{
                          fontSize: 9,
                          color: '#DC2626',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                        }}
                      >
                        ASSEMBLING...
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
            <div
              style={{
                fontSize: 12,
                color: '#475569',
                marginBottom: 14,
                padding: '9px 12px',
                background: 'rgba(37,99,235,0.05)',
                border: '1px solid rgba(37,99,235,0.15)',
                borderRadius: 7,
                lineHeight: 1.7,
              }}
            >
              ZeroOps traversed the CMDB topology for {incident?.ci}, identified
              required expertise domains, and paged the right SMEs via their
              configured channels — before a human incident manager could have
              manually compiled the list.
            </div>
            {smes.map((s, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 9,
                  marginBottom: 8,
                  background:
                    s.status === 'active'
                      ? 'rgba(22,163,74,0.04)'
                      : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${
                    s.status === 'active' ? 'rgba(22,163,74,0.2)' : C.BORDER
                  }`,
                }}
              >
                <Avatar member={s} size={38} />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      marginBottom: 3,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#1E293B',
                      }}
                    >
                      {s.name}
                    </span>
                    {s.ai && (
                      <span
                        style={{
                          fontSize: 9,
                          color: '#7C3AED',
                          background: 'rgba(124,58,237,0.08)',
                          border: '1px solid rgba(124,58,237,0.2)',
                          borderRadius: 4,
                          padding: '1px 6px',
                          fontFamily: 'monospace',
                        }}
                      >
                        AI AGENT
                      </span>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        marginLeft: 'auto',
                      }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background:
                            s.status === 'active' ? '#22C55E' : '#94A3B8',
                          boxShadow:
                            s.status === 'active'
                              ? '0 0 5px rgba(34,197,94,0.5)'
                              : 'none',
                        }}
                      />
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: s.status === 'active' ? '#16A34A' : '#94A3B8',
                        }}
                      >
                        {s.status === 'active' ? 'Active' : 'Standby'}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}
                  >
                    {s.role} &nbsp;·&nbsp; {s.org}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#475569',
                      fontStyle: 'italic',
                      lineHeight: 1.5,
                      marginBottom: 4,
                    }}
                  >
                    {s.action}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#94A3B8',
                      fontFamily: 'monospace',
                    }}
                  >
                    Joined {s.joined} &nbsp;·&nbsp; Paged via {s.paged}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Bridge */}
            <div
              style={{
                background: '#fff',
                border: `1px solid ${C.BORDER}`,
                borderRadius: 10,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                  marginBottom: 12,
                }}
              >
                TEAMS BRIDGE — AUTO-OPENED
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  background: 'rgba(37,99,235,0.06)',
                  border: '1px solid rgba(37,99,235,0.2)',
                  borderRadius: 8,
                  marginBottom: 12,
                }}
              >
                <span style={{ fontSize: 22 }}>💻</span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}
                  >
                    MIM Bridge — {selId}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#94A3B8',
                      fontFamily: 'monospace',
                    }}
                  >
                    teams.microsoft.com/mim-{selId?.replace('INC', '')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: '#22C55E',
                      boxShadow: '0 0 6px rgba(34,197,94,0.5)',
                    }}
                  />
                  <span
                    style={{ fontSize: 11, color: '#16A34A', fontWeight: 700 }}
                  >
                    LIVE
                  </span>
                </div>
              </div>
              {[
                {
                  icon: '📹',
                  label: 'Video bridge auto-dialled',
                  detail: `All ${
                    smes.filter((s) => !s.ai).length
                  } SMEs connected · ${
                    smes.filter((s) => s.status === 'standby').length
                  } on standby`,
                },
                {
                  icon: '💬',
                  label: 'Incident thread auto-created',
                  detail: 'Every ZeroOps action posted in real time',
                },
                {
                  icon: '📁',
                  label: 'Evidence folder attached',
                  detail: 'RCA output, logs, causal chain diagram',
                },
                {
                  icon: '📧',
                  label: 'Executive email thread opened',
                  detail: "CFO, IT Head BCC'd on all broadcast updates",
                },
                {
                  icon: '📊',
                  label: 'ServiceNow CHG auto-linked',
                  detail: 'CHG raised for any production changes',
                },
              ]
                .filter((_, i) =>
                  !isReplaying || replayBridgeOpen ? true : false
                )
                .filter(
                  (_, i) => !isReplaying || i < Math.max(0, eventsAfterSwarm)
                )
                .map((ch, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '9px 12px',
                      borderRadius: 7,
                      marginBottom: 6,
                      background: 'rgba(0,0,0,0.02)',
                      border: `1px solid ${C.BORDER}`,
                      animation: isReplaying
                        ? 'smeAppear 0.4s ease-out'
                        : 'none',
                    }}
                  >
                    <span style={{ fontSize: 17 }}>{ch.icon}</span>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 500,
                          color: '#1E293B',
                        }}
                      >
                        {ch.label}
                      </div>
                      <div style={{ fontSize: 11, color: C.MUTED }}>
                        {ch.detail}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Vendor escalations */}
            <div
              style={{
                background: '#fff',
                border: `1px solid ${C.BORDER}`,
                borderRadius: 10,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                  marginBottom: 10,
                }}
              >
                VENDOR ESCALATION TRACKER
              </div>
              {vendors.map((v, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '9px 12px',
                    borderRadius: 7,
                    marginBottom: 6,
                    background: `${v.color}09`,
                    border: `1px solid ${v.color}28`,
                  }}
                >
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: v.color,
                      marginTop: 4,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#1E293B',
                        }}
                      >
                        {v.vendor}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: v.color,
                          fontFamily: 'monospace',
                          fontWeight: 700,
                        }}
                      >
                        {v.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.MUTED }}>
                      {v.product} &nbsp;·&nbsp; {v.note}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Decision log */}
            <div
              style={{
                background: '#fff',
                border: `1px solid ${C.BORDER}`,
                borderRadius: 10,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                  marginBottom: 10,
                }}
              >
                DECISION LOG — EVERY HUMAN DECISION CAPTURED
              </div>
              {(isReplaying
                ? replayDecisions
                : timeline.filter((e) => e.type === 'decision')
              ).map((ev, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 13px',
                    borderRadius: 7,
                    marginBottom: 8,
                    background: 'rgba(217,119,6,0.05)',
                    border: '1px solid rgba(217,119,6,0.2)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#D97706',
                      }}
                    >
                      ✋ {ev.actor}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: '#94A3B8',
                      }}
                    >
                      {ev.ts}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#475569',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {ev.msg}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ══ WAR ROOM CHAT ═════════════════════════════════════════ */}
      {tab === 'chat' && (
        <div
          style={{
            background: '#fff',
            border: `1px solid ${C.BORDER}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: '#1e293b',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 16 }}>💻</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                MIM Bridge — {selId} — Teams Channel
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#94A3B8',
                  fontFamily: 'monospace',
                }}
              >
                teams.microsoft.com/mim-{selId?.replace('INC', '')}
              </div>
            </div>
            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: '#22C55E',
                  boxShadow: '0 0 6px rgba(34,197,94,0.5)',
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: '#22C55E',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                LIVE BRIDGE
              </span>
            </div>
          </div>
          <div
            style={{ padding: '18px 20px', maxHeight: 520, overflowY: 'auto' }}
          >
            {chat.map((msg, i) => {
              const isAI = msg.ai;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: 16,
                    flexDirection: isAI ? 'row' : 'row',
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: `${msg.color}20`,
                      border: `1.5px solid ${msg.color}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: msg.color,
                      fontFamily: 'monospace',
                      marginTop: 2,
                    }}
                  >
                    {msg.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: msg.color,
                        }}
                      >
                        {msg.from}
                      </span>
                      {isAI && (
                        <span
                          style={{
                            fontSize: 9,
                            color: '#7C3AED',
                            background: 'rgba(124,58,237,0.08)',
                            border: '1px solid rgba(124,58,237,0.2)',
                            borderRadius: 4,
                            padding: '1px 6px',
                            fontFamily: 'monospace',
                          }}
                        >
                          AI AGENT
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          color: '#94A3B8',
                          fontFamily: 'monospace',
                        }}
                      >
                        {msg.ts}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#1E293B',
                        lineHeight: 1.7,
                        background: isAI
                          ? 'rgba(124,58,237,0.05)'
                          : 'rgba(0,0,0,0.02)',
                        border: isAI
                          ? '1px solid rgba(124,58,237,0.15)'
                          : `1px solid ${C.BORDER}`,
                        borderRadius: '4px 12px 12px 12px',
                        padding: '10px 14px',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {msg.msg}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ COMMS ═════════════════════════════════════════════════ */}
      {tab === 'comms' && (
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
        >
          <div
            style={{
              background: '#fff',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 10,
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
                marginBottom: 14,
              }}
            >
              STAKEHOLDER BROADCAST COMPOSER
            </div>
            <div
              style={{
                display: 'flex',
                gap: 6,
                marginBottom: 12,
                flexWrap: 'wrap',
              }}
            >
              {MIM_BROADCAST_TEMPLATES.map((t, i) => (
                <div
                  key={i}
                  onClick={() => setBroadcastT(i)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 12,
                    background:
                      broadcastT === i
                        ? 'rgba(8,145,178,0.1)'
                        : 'rgba(0,0,0,0.03)',
                    border: `1px solid ${
                      broadcastT === i ? 'rgba(8,145,178,0.35)' : C.BORDER
                    }`,
                    color: broadcastT === i ? '#0891B2' : C.MUTED,
                  }}
                >
                  {t.label}
                </div>
              ))}
            </div>
            <textarea
              value={broadcastV}
              onChange={(e) => setBroadcastV(e.target.value)}
              style={{
                width: '100%',
                height: 200,
                fontSize: 12,
                fontFamily: 'monospace',
                color: '#1E293B',
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: 8,
                padding: '12px 14px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.7,
              }}
            />
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 10,
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {[
                ['📺 Teams', '#2563EB'],
                ['📧 Email', '#D97706'],
                ['📱 SMS', '#16A34A'],
                ['🔔 PagerDuty', '#16A34A'],
              ].map(([ch, col]) => (
                <span
                  key={ch}
                  style={{
                    fontSize: 11,
                    padding: '4px 10px',
                    borderRadius: 5,
                    background: `${col}12`,
                    color: col,
                    border: `1px solid ${col}28`,
                    fontFamily: 'monospace',
                  }}
                >
                  ✓ {ch}
                </span>
              ))}
              <button
                onClick={() =>
                  setSent((s) => [
                    ...s,
                    {
                      text: broadcastV,
                      ts: new Date().toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      }),
                      channels: 'Teams · Email · SMS · PagerDuty',
                    },
                  ])
                }
                style={{
                  marginLeft: 'auto',
                  padding: '8px 20px',
                  background: 'linear-gradient(135deg,#0891B2,#0369A1)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Send broadcast →
              </button>
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 10,
              padding: '18px 20px',
              maxHeight: 560,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
                marginBottom: 12,
              }}
            >
              BROADCAST LOG — AUTO + MANUAL
            </div>
            <div
              style={{
                fontSize: 10,
                color: C.MUTED,
                fontFamily: 'monospace',
                marginBottom: 8,
              }}
            >
              AUTO-SENT BY ZEROOPS
            </div>
            {timeline
              .filter((e) => e.type === 'comms')
              .map((ev, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px 13px',
                    borderRadius: 7,
                    marginBottom: 8,
                    background: 'rgba(8,145,178,0.05)',
                    border: '1px solid rgba(8,145,178,0.18)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 5,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        color: '#0891B2',
                        fontWeight: 700,
                      }}
                    >
                      📣 {ev.actor}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        color: '#94A3B8',
                      }}
                    >
                      {ev.ts}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#1E293B',
                      lineHeight: 1.6,
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {ev.msg}
                  </div>
                </div>
              ))}
            {sent.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 10,
                    color: C.MUTED,
                    fontFamily: 'monospace',
                    margin: '12px 0 8px',
                  }}
                >
                  SENT FROM COMPOSER
                </div>
                {sent.map((s, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '10px 13px',
                      borderRadius: 7,
                      marginBottom: 8,
                      background: 'rgba(22,163,74,0.05)',
                      border: '1px solid rgba(22,163,74,0.2)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 5,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          color: '#16A34A',
                          fontWeight: 700,
                        }}
                      >
                        ✅ Sent · {s.channels}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: 'monospace',
                          color: '#94A3B8',
                        }}
                      >
                        {s.ts}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#475569',
                        lineHeight: 1.6,
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {s.text}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* ══ MINUTES ═══════════════════════════════════════════════ */}
      {tab === 'minutes' && (
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
        >
          <div
            style={{
              background: '#fff',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 10,
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                }}
              >
                BRIDGE MINUTES — MANUAL NOTES
              </div>
              <button
                onClick={() => {
                  if (minutes.trim()) setMinutesSaved(true);
                }}
                style={{
                  padding: '5px 14px',
                  background: 'rgba(22,163,74,0.1)',
                  color: '#16A34A',
                  border: '1px solid rgba(22,163,74,0.25)',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {minutesSaved ? '✓ Saved' : 'Save'}
              </button>
            </div>
            <textarea
              value={minutes}
              onChange={(e) => {
                setMinutes(e.target.value);
                setMinutesSaved(false);
              }}
              placeholder={`MIM Bridge Minutes — ${selId}\nDate: ${new Date().toLocaleDateString(
                'en-GB'
              )}\n\nParticipants:\n- \n\nKey decisions made:\n- \n\nAction items:\n- [ ] Action · Owner · Due date\n\nNext bridge call (if needed):\nDate/Time:\n\nEscalations:\n- `}
              style={{
                width: '100%',
                height: 400,
                fontSize: 13,
                fontFamily: 'monospace',
                color: '#1E293B',
                background: '#F8FAFC',
                border: '1.5px solid #E2E8F0',
                borderRadius: 8,
                padding: '14px 16px',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.8,
              }}
            />
          </div>
          <div
            style={{
              background: '#fff',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 10,
              padding: '18px 20px',
              maxHeight: 520,
              overflowY: 'auto',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              AUTO-GENERATED MINUTES — FROM TIMELINE
            </div>
            <div
              style={{
                marginBottom: 12,
                padding: '9px 12px',
                background: 'rgba(124,58,237,0.05)',
                border: '1px solid rgba(124,58,237,0.15)',
                borderRadius: 7,
                fontSize: 12,
                color: '#475569',
              }}
            >
              ZeroOps generates these automatically from the incident timeline
              the moment the bridge closes. No human effort required.
            </div>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 12,
                lineHeight: 1.9,
                color: '#1E293B',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13,
                  borderBottom: `2px solid ${C.BORDER}`,
                  paddingBottom: 8,
                  marginBottom: 12,
                }}
              >
                MIM BRIDGE MINUTES — {selId}
              </div>
              <div style={{ color: C.MUTED, marginBottom: 10 }}>
                Date:{' '}
                {new Date().toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}{' '}
                &nbsp;·&nbsp; Auto-generated by ZeroOps
              </div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>INCIDENT</div>
              <div style={{ color: '#475569', marginBottom: 10 }}>
                {selId} · {incident?.svc} · {incident?.cat}
                <br />
                CI: {incident?.ci} · Hosting: {incident?.hosting}
                <br />
                SLA: {incident?.sla}
              </div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>
                PARTICIPANTS
              </div>
              {smes.map((s, i) => (
                <div key={i} style={{ color: '#475569' }}>
                  · {s.name} ({s.role}, {s.org})
                  {s.ai ? ' · ZeroOps AI Agent' : ''}
                </div>
              ))}
              <div style={{ fontWeight: 700, margin: '12px 0 6px' }}>
                TIMELINE SUMMARY
              </div>
              {timeline.map((ev, i) => (
                <div key={i} style={{ color: '#475569', marginBottom: 3 }}>
                  {ev.ts} · [{TYPE_CFG[ev.type]?.label}] {ev.msg.slice(0, 100)}
                  {ev.msg.length > 100 ? '...' : ''}
                </div>
              ))}
              <div style={{ fontWeight: 700, margin: '12px 0 6px' }}>
                HUMAN DECISIONS
              </div>
              {timeline.filter((e) => e.type === 'decision').length === 0 ? (
                <div style={{ color: C.MUTED }}>
                  · No human decisions — fully autonomous resolution
                </div>
              ) : (
                timeline
                  .filter((e) => e.type === 'decision')
                  .map((ev, i) => (
                    <div key={i} style={{ color: '#475569', marginBottom: 4 }}>
                      · {ev.ts} — {ev.actor}: {ev.msg.slice(0, 120)}
                    </div>
                  ))
              )}
              <div style={{ fontWeight: 700, margin: '12px 0 6px' }}>
                STATUS
              </div>
              <div
                style={{
                  color: resolved ? '#16A34A' : '#DC2626',
                  fontWeight: 700,
                }}
              >
                {resolved
                  ? '✅ RESOLVED — MIM report generated automatically'
                  : '⏸ ACTIVE BRIDGE'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ IMPACT METRICS ════════════════════════════════════════ */}
      {tab === 'metrics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              background: '#fff',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 10,
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
                marginBottom: 16,
              }}
            >
              LIVE IMPACT METRICS — BEFORE vs AFTER REMEDIATION
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 12,
              }}
            >
              {metrics.map((m, i) => (
                <div
                  key={i}
                  style={{
                    borderRadius: 9,
                    overflow: 'hidden',
                    border: `1px solid ${C.BORDER}`,
                  }}
                >
                  <div
                    style={{
                      background: '#F8FAFC',
                      padding: '10px 14px',
                      borderBottom: `1px solid ${C.BORDER}`,
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#0F172A',
                    }}
                  >
                    {m.label}
                  </div>
                  <div
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}
                  >
                    <div
                      style={{
                        padding: '14px 14px',
                        borderRight: `1px solid ${C.BORDER}`,
                        background: 'rgba(220,38,38,0.03)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: '#DC2626',
                          fontFamily: 'monospace',
                          letterSpacing: 1,
                          marginBottom: 6,
                        }}
                      >
                        BEFORE
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: m.color,
                          fontFamily: 'monospace',
                        }}
                      >
                        {m.before}
                      </div>
                    </div>
                    <div
                      style={{
                        padding: '14px 14px',
                        background: 'rgba(22,163,74,0.03)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 9,
                          color: '#16A34A',
                          fontFamily: 'monospace',
                          letterSpacing: 1,
                          marginBottom: 6,
                        }}
                      >
                        AFTER
                      </div>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: m.afterColor,
                          fontFamily: 'monospace',
                        }}
                      >
                        {m.after}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison with manual process */}
          <div
            style={{
              background:
                'linear-gradient(135deg,rgba(37,99,235,0.05),rgba(22,163,74,0.05))',
              border: '1px solid rgba(37,99,235,0.15)',
              borderRadius: 10,
              padding: '18px 20px',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: 12,
              }}
            >
              ZeroOps MIM vs Traditional MIM Process
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 0,
                borderRadius: 8,
                overflow: 'hidden',
                border: `1px solid ${C.BORDER}`,
              }}
            >
              {[
                ['Activity', 'Traditional (Manual)', 'ZeroOps AIOps'],
                [
                  'Declare P1',
                  'Engineer spots it · 5–15 min delay',
                  'Auto-declared · < 30 seconds',
                ],
                [
                  'Assemble swarm',
                  'Incident manager manually calls · 10–20 min',
                  'CMDB traversal · auto-paged · < 60 seconds',
                ],
                [
                  'RCA',
                  'Bridge discussion · 20–45 min',
                  'Agent analysis · < 3 minutes',
                ],
                [
                  'Stakeholder comms',
                  'Typed manually · inconsistent',
                  'Template-generated · auto-sent · 100% consistent',
                ],
                [
                  'Bridge minutes',
                  'Written post-bridge · 30–60 min',
                  'Auto-generated from timeline · instant',
                ],
                [
                  'MIM report',
                  '2–3 days to write',
                  'Ready at incident close · 0 manual effort',
                ],
                ['MTTR', '> 2 hours typical', '11–31 min in demo scenarios'],
              ].map(([act, old, neo], i) => (
                <div key={i} style={{ display: 'contents' }}>
                  <div
                    style={{
                      padding: '9px 14px',
                      background:
                        i === 0 ? '#F1F5F9' : i % 2 === 0 ? '#fff' : '#FAFBFC',
                      borderBottom: `1px solid ${C.BORDER}`,
                      fontSize: i === 0 ? 10 : 12,
                      fontWeight: i === 0 ? 700 : 400,
                      color: i === 0 ? '#64748B' : '#1E293B',
                      fontFamily: i === 0 ? 'monospace' : 'inherit',
                      letterSpacing: i === 0 ? 1 : 0,
                    }}
                  >
                    {act}
                  </div>
                  <div
                    style={{
                      padding: '9px 14px',
                      background:
                        i === 0
                          ? 'rgba(220,38,38,0.06)'
                          : i % 2 === 0
                          ? 'rgba(220,38,38,0.02)'
                          : 'rgba(220,38,38,0.03)',
                      borderBottom: `1px solid ${C.BORDER}`,
                      borderLeft: `1px solid ${C.BORDER}`,
                      fontSize: 12,
                      color: i === 0 ? '#DC2626' : '#64748B',
                      fontWeight: i === 0 ? 700 : 400,
                      fontFamily: i === 0 ? 'monospace' : 'inherit',
                      letterSpacing: i === 0 ? 1 : 0,
                    }}
                  >
                    {old}
                  </div>
                  <div
                    style={{
                      padding: '9px 14px',
                      background:
                        i === 0
                          ? 'rgba(22,163,74,0.07)'
                          : i % 2 === 0
                          ? 'rgba(22,163,74,0.02)'
                          : 'rgba(22,163,74,0.03)',
                      borderBottom: `1px solid ${C.BORDER}`,
                      borderLeft: `1px solid ${C.BORDER}`,
                      fontSize: 12,
                      color: i === 0 ? '#16A34A' : '#16A34A',
                      fontWeight: i === 0 ? 700 : 500,
                      fontFamily: i === 0 ? 'monospace' : 'inherit',
                      letterSpacing: i === 0 ? 1 : 0,
                    }}
                  >
                    {neo}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
