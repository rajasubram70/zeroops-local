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
                liveMetrics={TICKER.liveMetrics}
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
