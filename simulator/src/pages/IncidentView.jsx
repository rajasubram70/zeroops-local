import { useState, useEffect } from 'react';
import { ITSM, CUSTOMER } from '../data/customer/loader.js';
import { C, sc, pc } from '../config/theme.js';
import { Tag, Lbl } from '../components/atoms.jsx';
import { useLiveData } from '../hooks/useLiveData.js';

function formatTs(ts) {
  if (!ts) return '—';
  if (ts.includes('T') || ts.includes('Z') || ts.match(/^\d{4}-/)) {
    const d = new Date(ts);
    if (!isNaN(d)) {
      const day  = d.toLocaleString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Europe/Paris' });
      const time = d.toLocaleString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'Europe/Paris' });
      return `${day} ${time}`;
    }
  }
  const today = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Europe/Paris' });
  if (ts.startsWith('Yesterday')) return ts.replace('Yesterday', 'Yest');
  return `${today} ${ts}`;
}

const TIMELINE_COLORS = {
  detect: '#2563EB', correlate: '#7C3AED', rca: '#D97706',
  hitl: '#16A34A', fix: '#DC2626', validate: '#16A34A',
  close: '#64748B', pending: '#94A3B8',
};

const PILLAR_BADGE = {
  1: ['🤖 Auto', '#2563EB'],
  2: ['🤝 HiTL', '#D97706'],
  3: ['👤 Human', '#16A34A'],
};

// ── MAIN COMPONENT ────────────────────────────────────────────
export default function IncidentView({ incidents, runHC, chains, incidentIntel }) {
  const { data: liveTickets } = useLiveData('/incidents', null);

  const mappedLive = (liveTickets || []).map(t => ({
    id:        `INC${String(t.id).padStart(7, '0')}`,
    pri:       t.priority || 'P2',
    svc:       t.title.replace('ZeroOps Alert — ', '').replace('ZeroOps Alert - ', ''),
    status:    t.status === 'Closed'
                 ? (t.title.includes('URLDown') || t.title.includes('QueueDepth')
                   ? 'Auto-Resolved' : 'Resolved')
                 : 'Open',
    at:        t.created || '—',
    created:   t.created || '',
    by:        t.assigned || 'ZeroOps Engine',
    assigned:  t.assigned || 'ZeroOps Engine',
    cat:       'Automated Detection',
    desc:      t.title,
    sla:       'Met',
    mttr:      t.mttr || '—',
    hosting:   'Docker',
    notes:     `Resolved automatically by ZeroOps. MTTR: ${t.mttr || '—'}`,
    isLive:    true,
    zammad_id: t.zammad_id,
  }));

  const mergedIncidents = mappedLive.length > 0 ? mappedLive : (incidents || []);

  const [sel,     setSel]     = useState(null);
  const [tab,     setTab]     = useState('overview');
  const [rbStates,setRbStates]= useState({});
  const [liveRCA, setLiveRCA] = useState(null);
  const [liveSimilar, setLiveSimilar] = useState(null);
  const intel = sel ? (incidentIntel || {})[sel.id] : null;

  useEffect(() => {
    if (sel?.isLive && sel?.zammad_id) {
      setLiveRCA(null);
      setLiveSimilar(null);
      fetch(`http://localhost:5002/incidents/${sel.zammad_id}/rca`)
        .then(r => r.json())
        .then(data => setLiveRCA(data))
        .catch(() => setLiveRCA(null));
      fetch(`http://localhost:5002/incidents/${sel.zammad_id}/similar`)
        .then(r => r.json())
        .then(data => setLiveSimilar(data))
        .catch(() => setLiveSimilar(null));
    } else {
      setLiveRCA(null);
      setLiveSimilar(null);
    }
  }, [sel]);

  const execStep = (n) => {
    setRbStates(p => ({ ...p, [n]: 'running' }));
    setTimeout(() => setRbStates(p => ({ ...p, [n]: 'done' })), 1400);
  };

  const execAll = (rb) => {
    rb.filter(s => s.auto).forEach((s, i) => {
      setTimeout(() => setRbStates(p => ({ ...p, [s.n]: 'running' })), i * 600);
      setTimeout(() => setRbStates(p => ({ ...p, [s.n]: 'done'    })), i * 600 + 1200);
    });
  };

  const TABS = [
    ['overview', '📋 Overview'],
    ['cause',    '🔍 Root Cause'],
    ['similar',  '🔗 Similar'],
    ['runbook',  '⚡ Runbook'],
  ];

  return (
    <div style={{ padding: 22, display: 'flex', gap: 14 }}>

      {/* ── INCIDENT TABLE ── */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <Lbl n="2">
          Incidents{' '}
          <span style={{ fontSize: 13, fontWeight: 400, color: C.MUTED }}>
            — from {ITSM}
          </span>
        </Lbl>

        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
          {[
            ['P1 Open',      (mergedIncidents).filter(i => i.pri === 'P1' && !i.status.includes('Resolved')).length, C.RED],
            ['P2 Open',      (mergedIncidents).filter(i => i.pri === 'P2' && !i.status.includes('Resolved')).length, C.AMBER],
            ['Auto-Resolved',(mergedIncidents).filter(i => i.status === 'Auto-Resolved').length, C.GREEN],
          ].map(([l, n, col]) => (
            <div key={l} style={{ background: C.PANEL, border: `1px solid ${C.BORDER}`,
              borderRadius: 5, padding: '5px 10px', fontSize: 12 }}>
              <span style={{ color: C.MUTED }}>{l}: </span>
              <span style={{ fontWeight: 700, color: col, fontFamily: 'monospace' }}>{n}</span>
            </div>
          ))}
        </div>

        <div style={{ background: C.PANEL, border: `1px solid ${C.BORDER}`,
          borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid',
            gridTemplateColumns: '110px 108px 44px 1fr 100px 110px',
            padding: '8px 12px', borderBottom: `1px solid ${C.BORDER}`,
            fontSize: 8, color: C.MUTED, fontFamily: 'monospace', letterSpacing: 2 }}>
            {['TIME','INCIDENT','PRI','SERVICE','STATUS','ASSIGNED'].map(h => (
              <div key={h}>{h}</div>
            ))}
          </div>

          {[...mergedIncidents]
            .sort((a, b) => {
              if (a.isLive && b.isLive) {
                return new Date(b.created || 0) - new Date(a.created || 0);
              }
              if (a.isLive) return -1;
              if (b.isLive) return 1;
              return a.pri.localeCompare(b.pri);
            })
            .map(inc => (
              <div key={inc.id}
                onClick={() => { setSel(s => s?.id === inc.id ? null : inc); setTab('overview'); setRbStates({}); }}
                style={{ display: 'grid',
                  gridTemplateColumns: '110px 108px 44px 1fr 100px 110px',
                  padding: '10px 12px', borderBottom: `1px solid rgba(0,0,0,0.04)`,
                  cursor: 'pointer',
                  background: sel?.id === inc.id ? 'rgba(37,99,235,0.07)' : 'transparent',
                  alignItems: 'center', transition: 'background 0.1s' }}
                onMouseEnter={e => { if (sel?.id !== inc.id) e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                onMouseLeave={e => { if (sel?.id !== inc.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ fontSize: 10, color: C.MUTED, fontFamily: 'monospace' }}>
                  <div>{formatTs(inc.at).split(' ').slice(0,2).join(' ')}</div>
                  <div style={{ fontWeight: 600, color: '#475569' }}>{formatTs(inc.at).split(' ').slice(2).join(' ')}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#2563EB' }}>{inc.id}</div>
                  {(ITSM || inc.isLive) && (
                    <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4,
                      fontFamily: 'monospace', fontWeight: 600,
                      background: inc.isLive ? 'rgba(22,163,74,0.08)' : 'rgba(124,58,237,0.08)',
                      color: inc.isLive ? '#16A34A' : '#7C3AED',
                      border: inc.isLive ? '1px solid rgba(22,163,74,0.2)' : '1px solid rgba(124,58,237,0.2)' }}>
                      {inc.isLive ? `Zammad #${inc.zammad_id}` : ITSM}
                    </span>
                  )}
                </div>
                <div>
                  <span style={{ background: `${pc(inc.pri)}20`, color: pc(inc.pri),
                    border: `1px solid ${pc(inc.pri)}38`, borderRadius: 4,
                    padding: '1px 5px', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}>
                    {inc.pri}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#1E293B' }}>{inc.svc}</div>
                <div>
                  <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4,
                    fontFamily: 'monospace',
                    background: inc.status.includes('Resolved') ? 'rgba(22,163,74,0.1)'
                      : inc.status === 'In Progress' ? 'rgba(37,99,235,0.1)' : 'rgba(217,119,6,0.1)',
                    color: inc.status.includes('Resolved') ? C.GREEN
                      : inc.status === 'In Progress' ? C.BLUE : C.AMBER }}>
                    {inc.status}
                  </span>
                </div>
               <div style={{ fontSize: 11, color: '#64748B' }}>{inc.assigned || inc.by || '—'}</div>
                </div>
            ))}
        </div>
      </div>

      {/* ── INTELLIGENCE PANEL ── */}
      {sel && (
        <div style={{ width: 420, flexShrink: 0, background: 'rgba(255,255,255,0.98)',
          border: `1px solid ${C.BORDER}`, borderRadius: 10,
          display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 110px)', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.BORDER}`, flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: 7 }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 13,
                  color: '#2563EB', fontWeight: 700 }}>{sel.id}</div>
                <div style={{ fontSize: 13, fontWeight: 600,
                  color: '#1E293B', marginTop: 2 }}>{sel.svc}</div>
              </div>
              <div onClick={() => setSel(null)}
                style={{ cursor: 'pointer', color: C.MUTED, fontSize: 17 }}>✕</div>
            </div>
            <div style={{ display: 'flex', gap: 5 }}>
              <span style={{ background: `${pc(sel.pri)}20`, color: pc(sel.pri),
                border: `1px solid ${pc(sel.pri)}38`, borderRadius: 4,
                padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{sel.pri}</span>
              <span style={{ background: 'rgba(37,99,235,0.1)', color: C.BLUE,
                border: '1px solid rgba(37,99,235,0.2)', borderRadius: 4,
                padding: '2px 8px', fontSize: 11 }}>{sel.cat}</span>
              {sel.status === 'Auto-Resolved' && (
                <span style={{ background: 'rgba(22,163,74,0.1)', color: C.GREEN,
                  border: '1px solid rgba(22,163,74,0.2)', borderRadius: 4,
                  padding: '2px 8px', fontSize: 11 }}>🤖 Auto-Resolved</span>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.BORDER}`,
            flexShrink: 0, overflowX: 'auto' }}>
            {TABS.map(([t, l]) => (
              <div key={t} onClick={() => setTab(t)}
                style={{ padding: '8px 6px', textAlign: 'center', fontSize: 9,
                  cursor: 'pointer', fontFamily: 'monospace', whiteSpace: 'nowrap',
                  flexShrink: 0,
                  color: tab === t ? '#1D4ED8' : C.MUTED,
                  borderBottom: tab === t ? '2px solid #2563EB' : '2px solid transparent',
                  background: tab === t ? 'rgba(37,99,235,0.06)' : 'transparent',
                  transition: 'all 0.15s' }}>
                {l}
              </div>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>

            {/* ── OVERVIEW ── */}
            {tab === 'overview' && (
              <>
                {[
                  ['Affected CI', sel.ci,      'monospace'],
                  ['SLA',         sel.sla,     'monospace'],
                  ['Assigned',    sel.assigned || sel.by || '—', ''],
                  ['Created',     formatTs(sel.at), ''],
                ].map(([k, v, ff]) => (
                  <div key={k} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 8, color: C.MUTED, letterSpacing: 3,
                      fontFamily: 'monospace', marginBottom: 2 }}>{k.toUpperCase()}</div>
                    <div style={{ fontSize: 12, color: '#1E293B', fontFamily: ff }}>{v}</div>
                  </div>
                ))}
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 8, color: C.MUTED, letterSpacing: 3,
                    fontFamily: 'monospace', marginBottom: 2 }}>DESCRIPTION</div>
                  <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7 }}>{sel.desc}</div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 8, color: C.MUTED, letterSpacing: 3,
                    fontFamily: 'monospace', marginBottom: 2 }}>WORK NOTES</div>
                  <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.7,
                    background: 'rgba(0,0,0,0.025)', borderRadius: 5, padding: 9,
                    border: `1px solid ${C.BORDER}` }}>{sel.notes}</div>
                </div>
                {sel.mttr && sel.mttr !== '—' && (
                  <div style={{ background: 'rgba(22,163,74,0.07)',
                    border: '1px solid rgba(22,163,74,0.2)',
                    borderRadius: 7, padding: 10 }}>
                    <div style={{ fontSize: 8, color: C.MUTED, fontFamily: 'monospace',
                      letterSpacing: 2, marginBottom: 4 }}>MTTR</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: C.GREEN,
                      fontFamily: 'monospace' }}>{sel.mttr}</div>
                  </div>
                )}
              </>
            )}

            {/* ── ROOT CAUSE — LIVE ── */}
            {tab === 'cause' && sel?.isLive && liveRCA && (
              <>
                <div style={{ background: 'rgba(220,38,38,0.07)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 7, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 8, color: C.MUTED, fontFamily: 'monospace',
                    letterSpacing: 2, marginBottom: 3 }}>PRIMARY ROOT CAUSE</div>
                  <div style={{ fontSize: 13, fontWeight: 600,
                    color: '#DC2626', marginBottom: 6 }}>{liveRCA.root_cause}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.07)',
                      borderRadius: 4, height: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${liveRCA.confidence}%`,
                        height: '100%', background: C.GREEN }}/>
                    </div>
                    <span style={{ fontSize: 11, color: C.GREEN,
                      fontFamily: 'monospace', fontWeight: 700 }}>
                      {liveRCA.confidence}% confidence
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, fontFamily: 'monospace',
                      color: '#7C3AED', background: 'rgba(124,58,237,0.08)',
                      border: '1px solid rgba(124,58,237,0.2)',
                      borderRadius: 4, padding: '2px 8px' }}>
                      Risk: {liveRCA.risk_score}/100
                    </span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace',
                      color: C.BLUE, background: 'rgba(37,99,235,0.08)',
                      border: '1px solid rgba(37,99,235,0.2)',
                      borderRadius: 4, padding: '2px 8px' }}>
                      {liveRCA.pillar}
                    </span>
                  </div>
                </div>

                <div style={{ fontSize: 8, color: C.MUTED, letterSpacing: 3,
                  fontFamily: 'monospace', marginBottom: 8 }}>CAUSAL CHAIN</div>
                <div style={{ position: 'relative', paddingLeft: 14, marginBottom: 14 }}>
                  <div style={{ position: 'absolute', left: 6, top: 8, bottom: 8,
                    width: 1, background: 'rgba(220,38,38,0.2)' }}/>
                  {(liveRCA.causal_chain || []).map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, position: 'relative',
                      marginBottom: i < liveRCA.causal_chain.length - 1 ? 8 : 0 }}>
                      <div style={{ width: 13, height: 13, borderRadius: '50%',
                        background: '#DC2626', flexShrink: 0, marginTop: 2, zIndex: 1 }}/>
                      <div style={{ background: 'rgba(220,38,38,0.05)',
                        border: '1px solid rgba(220,38,38,0.15)',
                        borderRadius: 5, padding: '6px 9px', flex: 1 }}>
                        <div style={{ fontSize: 11, color: '#1E293B', lineHeight: 1.5 }}>{step}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 8, color: C.MUTED, letterSpacing: 3,
                  fontFamily: 'monospace', marginBottom: 8 }}>RECOMMENDATION</div>
                <div style={{ background: 'rgba(22,163,74,0.07)',
                  border: '1px solid rgba(22,163,74,0.2)',
                  borderRadius: 7, padding: 12, fontSize: 12,
                  color: '#166534', lineHeight: 1.7, marginBottom: 12 }}>
                  ✅ {liveRCA.recommendation}
                </div>

                <div style={{ padding: '8px 10px', background: 'rgba(37,99,235,0.05)',
                  border: '1px solid rgba(37,99,235,0.15)', borderRadius: 6,
                  fontSize: 10, color: C.BLUE, fontFamily: 'monospace' }}>
                  🤖 Generated by ZeroOps RCA Engine · Ollama · air-gapped
                </div>
              </>
            )}
            {tab === 'cause' && sel?.isLive && !liveRCA && (
              <div style={{ color: C.MUTED, textAlign: 'center', padding: 24, fontSize: 13 }}>
                Loading RCA from Zammad...
              </div>
            )}

            {/* ── ROOT CAUSE — STATIC ── */}
            {tab === 'cause' && !sel?.isLive && intel && (
              <>
                <div style={{ background: 'rgba(220,38,38,0.07)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 7, padding: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 8, color: C.MUTED, fontFamily: 'monospace',
                    letterSpacing: 2, marginBottom: 3 }}>PRIMARY ROOT CAUSE</div>
                  <div style={{ fontSize: 13, fontWeight: 600,
                    color: '#DC2626', marginBottom: 6 }}>{intel.cause.primary}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.07)',
                      borderRadius: 4, height: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${intel.cause.conf}%`,
                        height: '100%', background: C.GREEN }}/>
                    </div>
                    <span style={{ fontSize: 11, color: C.GREEN,
                      fontFamily: 'monospace', fontWeight: 700 }}>
                      {intel.cause.conf}% confidence
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#64748B',
                  lineHeight: 1.7, marginBottom: 14 }}>{intel.cause.mech}</div>

                <div style={{ fontSize: 8, color: C.MUTED, letterSpacing: 3,
                  fontFamily: 'monospace', marginBottom: 8 }}>CAUSAL CHAIN</div>
                <div style={{ position: 'relative', paddingLeft: 14 }}>
                  <div style={{ position: 'absolute', left: 6, top: 8, bottom: 8,
                    width: 1, background: 'rgba(220,38,38,0.2)' }}/>
                  {intel.cause.chain.map((node, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, position: 'relative',
                      marginBottom: i < intel.cause.chain.length - 1 ? 8 : 0 }}>
                      <div style={{ width: 13, height: 13, borderRadius: '50%',
                        background: sc(node.s), flexShrink: 0, marginTop: 2,
                        zIndex: 1, boxShadow: `0 0 5px ${sc(node.s)}60` }}/>
                      <div style={{ background: `${sc(node.s)}0d`,
                        border: `1px solid ${sc(node.s)}25`,
                        borderRadius: 5, padding: '6px 9px', flex: 1 }}>
                        <div style={{ fontSize: 11, fontWeight: 600,
                          color: '#1E293B', fontFamily: 'monospace' }}>{node.node}</div>
                        <div style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>{node.d}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: 8, color: C.MUTED, letterSpacing: 3,
                  fontFamily: 'monospace', margin: '12px 0 7px' }}>DETECTION SIGNALS</div>
                {intel.cause.signals.map((sig, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, padding: '6px 9px',
                    background: 'rgba(0,0,0,0.025)', borderRadius: 5,
                    border: `1px solid ${C.BORDER}`, marginBottom: 5 }}>
                    <span style={{ fontSize: 14 }}>{sig.icon}</span>
                    <div>
                      <div style={{ fontSize: 8, color: C.MUTED,
                        fontFamily: 'monospace', letterSpacing: 1 }}>{sig.t}</div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>{sig.v}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
            {tab === 'cause' && !sel?.isLive && !intel && (
              <div style={{ color: C.MUTED, textAlign: 'center', padding: 24, fontSize: 13 }}>
                No intelligence data for this incident.
              </div>
            )}

            {/* ── SIMILAR ── */}
            {tab === 'similar' && (intel || liveSimilar) && (
              <>
                <div style={{ fontSize: 12, color: C.MUTED, marginBottom: 12, lineHeight: 1.7 }}>
                  Past incidents with similar signatures from Zammad — matched by alert type.
                </div>
                {(liveSimilar || intel?.similar || []).length === 0 && (
                  <div style={{ color: C.MUTED, textAlign: 'center', padding: 24, fontSize: 13 }}>
                    No similar incidents found.
                  </div>
                )}
                {liveSimilar ? liveSimilar.map((sim, idx) => (
                  <div key={`${sim.id}-${idx}`} style={{ background: C.PANEL,
                    border: `1px solid ${C.BORDER}`, borderRadius: 7,
                    padding: 11, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontSize: 12,
                          color: '#2563EB', fontWeight: 600 }}>#{sim.id}</span>
                        <span style={{ fontSize: 11, color: C.MUTED, marginLeft: 7 }}>
                          {sim.created ? new Date(sim.created).toLocaleDateString('en-GB', {day:'2-digit',month:'short',year:'numeric'}) : ''}
                        </span>
                      </div>
                      <span style={{ fontSize: 10, fontFamily: 'monospace',
                        color: C.GREEN, background: 'rgba(22,163,74,0.08)',
                        border: '1px solid rgba(22,163,74,0.2)',
                        borderRadius: 4, padding: '1px 6px' }}>CLOSED</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#1E293B', marginBottom: 6, fontWeight: 500 }}>
                      {sim.title}
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                      <span style={{ color: C.MUTED }}>
                        MTTR: <span style={{ color: '#1E293B', fontFamily: 'monospace' }}>{sim.mttr}</span>
                      </span>
                      <span style={{ color: C.MUTED }}>
                        By: <span style={{ color: C.BLUE }}>ZeroOps Engine</span>
                      </span>
                    </div>
                  </div>
                )) : (intel?.similar || []).map((sim, idx) => (
                  <div key={`${sim.id}-${idx}`} style={{ background: C.PANEL,
                    border: `1px solid ${C.BORDER}`, borderRadius: 7,
                    padding: 11, marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <div>
                        <span style={{ fontFamily: 'monospace', fontSize: 12,
                          color: '#2563EB', fontWeight: 600 }}>{sim.id}</span>
                        <span style={{ fontSize: 11, color: C.MUTED, marginLeft: 7 }}>{sim.date}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 32, background: 'rgba(0,0,0,0.07)',
                          borderRadius: 3, height: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${sim.sim}%`, height: '100%',
                            background: sim.sim > 89 ? C.GREEN : C.AMBER }}/>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700,
                          color: sim.sim > 89 ? C.GREEN : C.AMBER }}>{sim.sim}%</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B',
                      background: 'rgba(22,163,74,0.05)',
                      border: '1px solid rgba(22,163,74,0.15)',
                      borderRadius: 4, padding: '5px 8px', marginBottom: 5 }}>
                      <span style={{ color: C.GREEN, fontSize: 9, fontFamily: 'monospace',
                        letterSpacing: 1, display: 'block', marginBottom: 2 }}>RESOLUTION</span>
                      {sim.res || sim.resolution}
                    </div>
                    <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
                      <span style={{ color: C.MUTED }}>
                        MTTR: <span style={{ color: '#1E293B', fontFamily: 'monospace' }}>{sim.mttr}</span>
                      </span>
                      <span style={{ color: C.MUTED }}>
                        → <span style={{ color: sim.out?.includes('Permanent') ? C.GREEN
                          : sim.out?.includes('Temporary') ? C.AMBER : '#64748B' }}>
                          {sim.out}
                        </span>
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.MUTED, marginTop: 2 }}>By: {sim.by}</div>
                  </div>
                ))}
              </>
            )}
            {tab === 'similar' && !intel && (
              <div style={{ color: C.MUTED, textAlign: 'center', padding: 24, fontSize: 13 }}>
                No data.
              </div>
            )}

            {/* ── RUNBOOK ── */}
            {tab === 'runbook' && intel && (
              <>
                <div style={{ fontSize: 12, color: C.MUTED, marginBottom: 12, lineHeight: 1.7 }}>
                  AI-generated runbook. Auto steps execute via agents.
                </div>
                {intel.runbook.map(step => {
                  const st = rbStates[step.n];
                  return (
                    <div key={step.n} style={{ display: 'flex', gap: 9,
                      marginBottom: 7, opacity: st === 'done' ? 0.65 : 1 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%',
                        background: st === 'done' ? 'rgba(22,163,74,0.2)'
                          : st === 'running' ? 'rgba(37,99,235,0.2)' : 'rgba(0,0,0,0.05)',
                        border: `1px solid ${st === 'done' ? 'rgba(22,163,74,0.4)'
                          : st === 'running' ? 'rgba(37,99,235,0.4)' : C.BORDER}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, flexShrink: 0, fontFamily: 'monospace',
                        color: st === 'done' ? C.GREEN : st === 'running' ? C.BLUE : C.MUTED }}>
                        {st === 'done' ? '✓' : st === 'running' ? '…' : step.n}
                      </div>
                      <div style={{ flex: 1, background: 'rgba(0,0,0,0.025)',
                        border: `1px solid ${C.BORDER}`, borderRadius: 5, padding: '7px 9px' }}>
                        <div style={{ fontSize: 12, color: '#1E293B',
                          marginBottom: 5, lineHeight: 1.5 }}>{step.act}</div>
                        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                          <Tag color={step.risk === 'LOW' ? C.GREEN : step.risk === 'MEDIUM' ? C.AMBER : C.RED}>
                            Risk: {step.risk}
                          </Tag>
                          <Tag color={C.BLUE}>{step.t}</Tag>
                          <Tag color={step.auto ? '#7C3AED' : '#64748B'}>
                            {step.auto ? '🤖 Auto' : '👤 Manual'}
                          </Tag>
                          <span style={{ fontSize: 10, color: C.MUTED, fontFamily: 'monospace' }}>
                            {step.tool}
                          </span>
                        </div>
                        {step.auto && !st && (
                          <button onClick={() => execStep(step.n)}
                            style={{ marginTop: 6, background: 'rgba(124,58,237,0.1)',
                              color: '#6D28D9', border: '1px solid rgba(124,58,237,0.2)',
                              borderRadius: 4, padding: '2px 9px', fontSize: 11, cursor: 'pointer' }}>
                            ▶ Execute
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => execAll(intel.runbook)}
                  style={{ width: '100%', background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
                    color: '#fff', border: 'none', borderRadius: 6, padding: '9px',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
                  ⚡ Execute All Auto Steps
                </button>
              </>
            )}
            {tab === 'runbook' && !intel && (
              <div style={{ color: C.MUTED, textAlign: 'center', padding: 24, fontSize: 13 }}>
                No runbook available.
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}