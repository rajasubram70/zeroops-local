import React, { useState, useEffect } from 'react';
import { C } from './config/theme.js';
import { ACTIVE_INDUSTRY } from './config/industry.config.js';
import {
  INCIDENTS_DATA,
  INCIDENT_INTEL,
  APP_DOMAINS,
} from './data/customer/loader.js';
import { useHealthcheck } from './hooks/useHealthcheck.js';
import { useMetricsTicker } from './hooks/useMetricsTicker.js';
import { useNotifications } from './hooks/useNotifications.js';
import { useLiveData } from './hooks/useLiveData.js';

import Login from './components/Login.jsx';
import TopBar from './components/TopBar.jsx';
import Sidebar from './components/Sidebar.jsx';
import GuidedDemo from './components/GuidedDemo.jsx';

import CommandCentre from './pages/CommandCentre.jsx';
import IncidentView from './pages/IncidentView.jsx';
import TopologyPage from './pages/TopologyPage.jsx';
import AgentsKBPage from './pages/AgentsKBPage.jsx';
import WorkflowPage from './pages/WorkflowPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import ServiceRequestPage from './pages/ServiceRequestPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import MIMPage from './pages/MIMPage.jsx';
import TransferPage from './pages/TransferPage.jsx';
import SDLCPage from './pages/SDLCPage.jsx';
import AskChat from './components/AskChat.jsx';
import ZOVAVoicePopup from './components/ZOVAVoicePopup.jsx';
import DemoNarrator from './components/DemoNarrator.jsx';

// Synthetic team activity feed
const TEAM_ACTIVITY = [
  {
    user: 'Arjun Mehta',
    role: 'NOC',
    action: 'Viewing INC0001847',
    ago: 'just now',
    color: '#2563EB',
  },
  {
    user: 'Priya Nair',
    role: 'AIOps',
    action: 'Running healthcheck on SAP AP1',
    ago: '2 min ago',
    color: '#7C3AED',
  },
  {
    user: 'Wei Zhang',
    role: 'NOC',
    action: 'Reviewing topology — Wafer Fab',
    ago: '4 min ago',
    color: '#2563EB',
  },
  {
    user: 'Kavya Reddy',
    role: 'AIOps',
    action: 'Analysing KB article KB003',
    ago: '7 min ago',
    color: '#7C3AED',
  },
  {
    user: 'Ravi Kumar',
    role: 'L3 SRE',
    action: 'Closed INC0001838',
    ago: '12 min ago',
    color: '#16A34A',
  },
];

export default function App() {
  const [user, setUser] = useState(null);
  const [nav, setNav] = useState('cmd');
  const [industry, setIndustry] = useState(ACTIVE_INDUSTRY);
  const [chains, setChains] = useState(APP_DOMAINS);
  const { data: liveMetrics } = useLiveData('/metrics', null);

  useEffect(() => {
    if (!liveMetrics) return;
    setChains(prev => prev.map(ch => {
      if (ch.id === 'live-api') {
        const healthy = liveMetrics.api_health === 1;
        const queueAnom = liveMetrics.queue_depth > 5;
        const memMb = liveMetrics?.api_memory_mb || 0;
        const memHigh = memMb > 150;
        const memWarn = memMb > 100;
        return {
          ...ch,
          status: healthy ? (queueAnom ? 'AMBER' : memHigh ? 'AMBER' : memWarn ? 'AMBER' : 'GREEN') : 'RED',
          uptime: healthy ? 99.9 : 0,
          apps: ch.apps.map(app => ({
            ...app,
            status: healthy ? (queueAnom ? 'AMBER' : memHigh ? 'AMBER' : memWarn ? 'AMBER' : 'GREEN') : 'RED',
            perf: healthy ? 98 : 0,
            infra: app.infra.map(i => {
              const dbMs   = liveMetrics?.db_response_ms || 120;
              const dbPool = liveMetrics?.db_pool_used   || 0;
              const dbSlow = dbMs > 1000;
              const dbAnom = dbMs > 500;
              if (i.c === 'health')  return { ...i, val: healthy ? 'Passing' : 'DOWN', m: healthy ? 100 : 0, anom: !healthy, h: healthy ? 'GREEN' : 'RED', detail: healthy ? 'Web health endpoint OK' : 'Health check FAILING — container down' };
              if (i.c === 'resp')    return { ...i, val: healthy ? '240ms' : 'Timeout', m: healthy ? 88 : 0, anom: !healthy, h: healthy ? 'GREEN' : 'RED', detail: healthy ? 'Within SLA' : 'No response — container unreachable' };
              if (i.c === 'sess')    return { ...i, val: healthy ? '38' : '0', m: healthy ? 60 : 0, anom: !healthy, h: healthy ? 'GREEN' : 'AMBER' };
              if (i.c === 'db-resp') return { ...i, val: healthy ? `${dbMs}ms` : 'N/A', m: healthy ? Math.max(0, 100 - Math.round(dbMs/20)) : 0, anom: healthy && dbAnom, h: !healthy ? 'RED' : dbSlow ? 'RED' : dbAnom ? 'AMBER' : 'GREEN', detail: !healthy ? 'Container down' : dbSlow ? `DB response ${dbMs}ms — SLA breach — connection pool pressure` : dbAnom ? `DB response ${dbMs}ms — elevated — monitor` : `PostgreSQL query time normal — ${dbMs}ms` };
              if (i.c === 'conn')    return { ...i, val: healthy ? `${dbPool}/100` : 'N/A', m: healthy ? dbPool : 0, anom: healthy && dbPool > 50, h: !healthy ? 'RED' : dbPool > 80 ? 'RED' : dbPool > 50 ? 'AMBER' : 'GREEN', detail: !healthy ? 'Container down' : dbPool > 80 ? `${dbPool} connections active — pool near exhaustion` : dbPool > 50 ? `${dbPool} connections — elevated — monitor` : `${dbPool} of 100 connections active — healthy` };
              if (i.c === 'mem') {
                const memMb = liveMetrics?.api_memory_mb || 62;
                const memHigh = memMb > 150;
                const memWarn = memMb > 100;
                return { ...i,
                  val: `${memMb}MB`,
                  m: Math.min(Math.round(memMb / 3), 100),
                  anom: memHigh || memWarn,
                  h: !healthy ? 'RED' : memHigh ? 'RED' : memWarn ? 'AMBER' : 'GREEN',
                  detail: !healthy ? 'Container down' : memHigh ? `Memory ${memMb}MB — OOM risk — preemptive restart triggered` : memWarn ? `Memory ${memMb}MB — elevated — monitoring trend` : `Memory ${memMb}MB — within normal range`
                };
              }
              if (i.c === 'queue') {
                const qd = liveMetrics?.queue_depth || 0;
                const qHigh = qd > 50;
                const qWarn = qd > 5;
                return { ...i,
                  val: `${qd}`,
                  m: Math.min(qd * 2, 100),
                  anom: qHigh || qWarn,
                  h: !healthy ? 'RED' : qHigh ? 'RED' : qWarn ? 'AMBER' : 'GREEN',
                  detail: !healthy ? 'Container down' : qHigh ? `Queue ${qd} — worker down — backlog critical` : qWarn ? `Queue ${qd} — worker consuming slowly` : `Queue depth normal — ${qd} pending`
                };
              }
              return i;
            })
          }))
        };
      }
      if (ch.id === 'live-crm') {
        const healthy = liveMetrics.crm_health === 1;
        const dbMs   = liveMetrics?.db_response_ms || 120;
        const dbPool = liveMetrics?.db_pool_used   || 0;
        const dbSlow = dbMs > 1000;
        const dbAnom = dbMs > 500;
        return {
          ...ch,
          status: healthy ? (dbSlow ? 'AMBER' : 'GREEN') : 'RED',
          uptime: healthy ? 99.8 : 0,
          apps: ch.apps.map(app => ({
            ...app,
            status: healthy ? (dbSlow ? 'AMBER' : 'GREEN') : 'RED',
            perf: healthy ? 97 : 0,
            infra: app.infra.map(i => {
              if (i.c === 'health')  return { ...i, val: healthy ? 'Passing' : 'DOWN', m: healthy ? 100 : 0, anom: !healthy, h: healthy ? 'GREEN' : 'RED', detail: healthy ? 'Web health endpoint OK' : 'Health check FAILING — container down' };
              if (i.c === 'db-resp') return { ...i, val: healthy ? `${dbMs}ms` : 'N/A', m: healthy ? Math.max(0, 100 - Math.round(dbMs / 20)) : 0, anom: healthy && dbAnom, h: !healthy ? 'RED' : dbSlow ? 'RED' : dbAnom ? 'AMBER' : 'GREEN', detail: !healthy ? 'Container down' : dbSlow ? `DB response ${dbMs}ms — SLA breach` : dbAnom ? `DB response ${dbMs}ms — elevated` : `PostgreSQL query time normal — ${dbMs}ms` };
              if (i.c === 'conn')    return { ...i, val: healthy ? `${dbPool}/100` : 'N/A', m: healthy ? dbPool : 0, anom: healthy && dbPool > 50, h: !healthy ? 'RED' : dbPool > 80 ? 'RED' : dbPool > 50 ? 'AMBER' : 'GREEN', detail: !healthy ? 'Container down' : `${dbPool} of 100 connections active` };
              if (i.c === 'resp')    return { ...i, val: healthy ? `${dbMs < 500 ? 240 : Math.round(dbMs * 1.4)}ms` : 'Timeout', m: healthy ? (dbSlow ? 30 : 88) : 0, anom: !healthy || dbSlow, h: !healthy ? 'RED' : dbSlow ? 'AMBER' : 'GREEN', detail: healthy ? 'Within SLA' : 'No response' };
              if (i.c === 'sess')    return { ...i, val: healthy ? '38' : '0', m: healthy ? 60 : 0, anom: !healthy, h: healthy ? 'GREEN' : 'AMBER' };
              return i;
            })
          }))
        };
      }
      if (ch.id === 'live-sap') {
        const wpPct    = liveMetrics?.sap_wp_dialog_used_pct   || 18;
        const respMs   = liveMetrics?.sap_dialog_response_ms   || 420;
        const idocQ    = liveMetrics?.sap_idoc_queue_depth     || 13;
        const batchQ   = liveMetrics?.sap_batch_queue_depth    || 0;
        const hanaCpu  = liveMetrics?.sap_hana_cpu_pct         || 22;
        const hanaMem  = liveMetrics?.sap_hana_memory_pct      || 48;

        const wpHigh   = wpPct  > 85;
        const wpWarn   = wpPct  > 70;
        const respSlow = respMs > 5000;
        const respWarn = respMs > 2000;
        const idocHigh = idocQ  > 100;
        const batchErr = batchQ > 5;
        const hanaWarn = hanaCpu > 60;

        const sapStatus = wpHigh || respSlow || idocHigh || batchErr ? 'RED'
                        : wpWarn || respWarn || hanaWarn ? 'AMBER' : 'GREEN';

        return {
          ...ch,
          status: sapStatus,
          apps: ch.apps.map(app => {
            if (app.id === 's4hana-app') {
              return {
                ...app,
                status: wpHigh ? 'RED' : wpWarn ? 'AMBER' : 'GREEN',
                infra: app.infra.map(i => {
                  if (i.c === 'health') return { ...i,
                    val: sapStatus === 'RED' ? 'Degraded' : 'Healthy',
                    m: sapStatus === 'RED' ? 40 : 95,
                    anom: sapStatus !== 'GREEN',
                    h: sapStatus
                  };
                  if (i.c === 'wp') return { ...i,
                    val: `${Math.round(wpPct)}%`,
                    m: Math.round(wpPct),
                    anom: wpWarn || wpHigh,
                    h: wpHigh ? 'RED' : wpWarn ? 'AMBER' : 'GREEN',
                    detail: wpHigh ? `Dialog WP pool ${Math.round(wpPct)}% — saturation — SM37 reschedule triggered` : wpWarn ? `Dialog WP pool ${Math.round(wpPct)}% — elevated — monitor` : `Dialog WP pool ${Math.round(wpPct)}% — normal`
                  };
                  if (i.c === 'resp') return { ...i,
                    val: respMs > 1000 ? `${(respMs/1000).toFixed(1)}s` : `${Math.round(respMs)}ms`,
                    m: Math.min(Math.round(respMs / 200), 100),
                    anom: respWarn || respSlow,
                    h: respSlow ? 'RED' : respWarn ? 'AMBER' : 'GREEN',
                    detail: respSlow ? `Dialog response ${(respMs/1000).toFixed(1)}s — HANA slowdown detected` : respWarn ? `Dialog response ${(respMs/1000).toFixed(1)}s — elevated` : `Dialog response ${Math.round(respMs)}ms — within SLA`
                  };
                  if (i.c === 'idoc') return { ...i,
                    val: `${Math.round(idocQ)}`,
                    m: Math.min(Math.round(idocQ / 10), 100),
                    anom: idocHigh,
                    h: idocHigh ? 'RED' : 'GREEN',
                    detail: idocHigh ? `iDoc queue ${Math.round(idocQ)} — backup detected — consumer restarting` : `iDoc queue ${Math.round(idocQ)} — normal processing`
                  };
                  if (i.c === 'batch') return { ...i,
                    val: batchErr ? `${Math.round(batchQ)} queued` : '2 active',
                    m: Math.min(Math.round(batchQ * 10), 100),
                    anom: batchErr,
                    h: batchErr ? 'RED' : 'GREEN',
                    detail: batchErr ? `SM37 — ${Math.round(batchQ)} jobs queued — payroll batch aborted` : 'SM37 — batch jobs running normally'
                  };
                  return i;
                })
              };
            }
            if (app.id === 'hana-db') {
              return {
                ...app,
                status: hanaWarn ? 'AMBER' : 'GREEN',
                infra: app.infra.map(i => {
                  if (i.c === 'cpu') return { ...i,
                    val: `${Math.round(hanaCpu)}%`,
                    m: Math.round(hanaCpu),
                    anom: hanaWarn,
                    h: hanaCpu > 80 ? 'RED' : hanaWarn ? 'AMBER' : 'GREEN',
                    detail: hanaWarn ? `HANA CPU ${Math.round(hanaCpu)}% — elevated — query optimisation recommended` : `HANA CPU ${Math.round(hanaCpu)}% — normal`
                  };
                  if (i.c === 'mem') return { ...i,
                    val: `${Math.round(hanaMem)}%`,
                    m: Math.round(hanaMem),
                    anom: hanaMem > 85,
                    h: hanaMem > 90 ? 'RED' : hanaMem > 85 ? 'AMBER' : 'GREEN',
                    detail: `HANA memory ${Math.round(hanaMem)}% — ${hanaMem > 85 ? 'elevated' : 'normal'}`
                  };
                  return i;
                })
              };
            }
            return app;
          })
        };
      }
      return ch;
    }));
  }, [liveMetrics]);
  const [incidents, setIncidents] = useState(INCIDENTS_DATA);
  const [chatOpen, setChatOpen] = useState(false);
  const [ariaOpen, setAriaOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoStep, setDemoStep] = useState(0);

  const [selChainId, setSelChainId] = useState(null);
  const [selAppId, setSelAppId] = useState(null);
  const selChain = selChainId
    ? chains.find((c) => c.id === selChainId) || null
    : null;
  const selApp =
    selChain && selAppId
      ? selChain.apps.find((a) => a.id === selAppId) || null
      : null;

  const HC = useHealthcheck();
  // Merge intel from active incidents file
  // ── Adapt INCIDENT_INTEL shape to what IncidentView expects ─────────
  const INTEL = Object.fromEntries(
    Object.entries(INCIDENT_INTEL || {}).map(([id, raw]) => [
      id,
      {
        cause: {
          primary: raw.rootCause?.split('.')[0] || 'See description',
          conf: raw.confidence || 85,
          mech: raw.rootCause || '',
          chain: (raw.causalChain || []).map((d, i) => ({
            node: `Step ${i + 1}`,
            d,
            s:
              i === 0
                ? 'RED'
                : i === raw.causalChain.length - 1
                ? 'AMBER'
                : 'AMBER',
          })),
          signals: (raw.cause?.signals || raw.agents || []).map((a) =>
            typeof a === 'object'
              ? a
              : {
                  icon: a.includes('RCA')
                    ? '🔍'
                    : a.includes('Alert')
                    ? '🔗'
                    : a.includes('Capacity')
                    ? '📊'
                    : a.includes('Change')
                    ? '✅'
                    : '⚡',
                  t: a.toUpperCase(),
                  v: `${a} analysing incident signals`,
                }
          ),
        },
        similar: (raw.similar || []).map((sid, i) => ({
          id: sid,
          date: `${['Jan', 'Feb', 'Mar', 'Nov', 'Dec'][i % 5]} 2026`,
          sim: [96, 91, 88, 84, 79][i] || 80,
          res: raw.recommendation?.split('.')[0] || 'See recommendation',
          mttr: ['8m', '12m', '22m', '28m', '45m'][i] || '20m',
          out: i === 0 ? 'Permanent fix applied' : 'Temporary fix — monitoring',
          by: [
            'ZeroOps AI',
            'Senior Engineer',
            'Platform Lead',
            'Support Agent',
            'Ops Analyst',
          ][i % 5],
        })),
        runbook: (raw.recommendation || '')
          .split('.')
          .filter((s) => s.trim().length > 5)
          .map((act, i) => ({
            n: i + 1,
            act: act.trim(),
            risk: i === 0 ? 'LOW' : i === 1 ? 'MEDIUM' : 'HIGH',
            auto: raw.autoFixable && i < 2,
            tool: raw.agents?.[i % raw.agents.length] || 'ZeroOps',
          })),
      },
    ])
  );
  const NOTIF = useNotifications();
  const TICKER = useMetricsTicker(chains, HC.healed);

  useEffect(() => {
    setChains(APP_DOMAINS);
    setIncidents(INCIDENTS_DATA);
    setSelChainId(null);
    setSelAppId(null);
  }, [industry]);

  if (!user)
    return (
      <Login
        onLogin={(r) => {
          setUser(r);
          setIndustry(r.industry || ACTIVE_INDUSTRY);
          setNav(r.access[0]);
        }}
      />
    );

  const runHC = (id) => HC.runHealthcheck(id, setChains, setIncidents);

  const handleNavigateIncident = () => {
    setNav('inc');
    setSelChainId(null);
    setSelAppId(null);
  };

  const handleDemoNav = (action) => {
    if (action.nav) setNav(action.nav);
    if (action.chainId) {
      setSelChainId(action.chainId);
      setSelAppId(null);
    }
    if (action.appId) setSelAppId(action.appId);
    if (action.clearChain) {
      setSelChainId(null);
      setSelAppId(null);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background: C.BG,
        color: C.TEXT,
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        fontSize: 13,
        overflow: 'hidden',
      }}
    >
      <TopBar
        user={{ ...user, industry }}
        chains={chains}
        notifications={NOTIF.notifications}
        onMarkRead={NOTIF.markRead}
        onMarkAllRead={NOTIF.markAllRead}
        onNavigateIncident={handleNavigateIncident}
        onLogout={() => setUser(null)}
        onSwitchIndustry={(ind) => setIndustry(ind)}
        demoMode={demoMode}
        onToggleDemo={() => {
          setDemoMode((m) => !m);
          setDemoStep(0);
        }}
      />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar
          user={user}
          nav={nav}
          onNav={setNav}
          selChain={selChain}
          selApp={selApp}
          onSelectApp={(a) => setSelAppId(a ? a.id : null)}
          onClearChain={() => {
            setSelChainId(null);
            setSelAppId(null);
          }}
          teamActivity={TEAM_ACTIVITY}
          predictAlerts={TICKER.predictAlerts}
        />

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1 }}>
            {nav === 'cmd' && (
              <CommandCentre
                chains={chains}
                incidents={incidents}
                industry={industry}
                predictAlerts={TICKER.predictAlerts}
                demoDegrade={TICKER.demoDegrade}
                onStartDegrade={TICKER.startDegradation}
                onStopDegrade={TICKER.stopDegradation}
                onNav={setNav}
              />
            )}

            {nav === 'inc' && (
              <IncidentView
                incidents={incidents}
                runHC={runHC}
                chains={chains}
                incidentIntel={INTEL}
              />
            )}
            {nav === 'topo' && (
              <TopologyPage
                chains={chains}
                healed={HC.healed}
                runHC={runHC}
                liveMetrics={liveMetrics}
                predictAlerts={TICKER.predictAlerts}
                demoDegrade={TICKER.demoDegrade}
                onStartDegrade={TICKER.startDegradation}
                onStopDegrade={TICKER.stopDegradation}
              />
            )}
            {nav === 'sdlc' && <SDLCPage />}
            {nav === 'agents' && <AgentsKBPage runHC={runHC} />}
            {nav === 'wf' && <WorkflowPage runHC={runHC} />}
            {nav === 'reports' && (
              <ReportsPage
                chains={chains}
                incidents={incidents}
                industry={industry}
              />
            )}
            {nav === 'requests' && <ServiceRequestPage />}
            {nav === 'chat' && <ChatPage />}
            {nav === 'mim' && <MIMPage />}
            {nav === 'transfer' && <TransferPage />}
          </div>
        </div>
      </div>

      <button
        onClick={() => setChatOpen((o) => !o)}
        style={{
          position: 'fixed',
          bottom: 18,
          right: 18,
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
          border: 'none',
          color: '#fff',
          fontSize: 18,
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
          zIndex: 199,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {chatOpen ? '✕' : '💬'}
      </button>

      {/* Demo Narrator button — disabled */}

      {/* ZOVA Voice button — floating mic */}
      <button
        onClick={() => {
          setAriaOpen((o) => !o);
          setChatOpen(false);
        }}
        title="Talk to ZOVA"
        style={{
          position: 'fixed',
          bottom: 72,
          right: 18,
          width: 46,
          height: 46,
          borderRadius: '50%',
          background: ariaOpen
            ? 'linear-gradient(135deg,#7c3aed,#4c1d95)'
            : 'linear-gradient(135deg,#7c3aed,#5b21b6)',
          border: 'none',
          color: '#fff',
          fontSize: 20,
          cursor: 'pointer',
          boxShadow: ariaOpen
            ? '0 0 0 3px rgba(139,92,246,0.4), 0 4px 20px rgba(139,92,246,0.5)'
            : '0 4px 20px rgba(139,92,246,0.4)',
          zIndex: 199,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
        }}
      >
        {ariaOpen ? '✕' : '🎤'}
      </button>

      <AskChat
        chains={chains}
        incidents={incidents}
        open={chatOpen}
        onClose={() => setChatOpen(false)}
      />
      <ZOVAVoicePopup open={ariaOpen} onClose={() => setAriaOpen(false)} />
      {/* DemoNarrator disabled */}

      {demoMode && (
        <GuidedDemo
          step={demoStep}
          onStep={setDemoStep}
          onNav={handleDemoNav}
          onExit={() => {
            setDemoMode(false);
            setDemoStep(0);
          }}
          currentNav={nav}
        />
      )}

      <div
        style={{
          position: 'fixed',
          bottom: 8,
          right: 14,
          fontSize: 8,
          color: '#CBD5E1',
          fontFamily: 'monospace',
          pointerEvents: 'none',
          zIndex: 50,
        }}
      >
        ZeroOps v1.0 – Powered by Synthetic Data
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 4px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.04); }
        input::placeholder { color: #94A3B8; }
        input, textarea, select { color: #1E293B; }
        /* Responsive: tablet */
        @media (max-width: 900px) {
          .sidebar-hide { display: none !important; }
          .main-content { padding: 12px !important; }
          .grid-2 { grid-template-columns: 1fr !important; }
          .grid-3 { grid-template-columns: 1fr 1fr !important; }
          .kpi-grid { grid-template-columns: repeat(3,1fr) !important; }
        }
        @media (max-width: 600px) {
          .grid-3 { grid-template-columns: 1fr !important; }
          .kpi-grid { grid-template-columns: 1fr 1fr !important; }
          .hide-mobile { display: none !important; }
        }
      `}</style>
    </div>
  );
}
