import { C, sc, sb } from '../config/theme.js';
import { Tag, Rag, Bar, Lbl, Sparkline } from '../components/atoms.jsx';

const CHANNEL_DATA = {
  'sap-landscape': {
    web: { up: 86, rt: 1200, err: 1.4 },
    mobile: { up: 84, rt: 1600, err: 1.8 },
    api: { up: 88, rt: 340, err: 1.1 },
    sessions: 247,
  },
  assembly: {
    web: { up: 82, rt: 1800, err: 3.1 },
    mobile: { up: 85, rt: 2200, err: 2.8 },
    api: { up: 88, rt: 420, err: 1.9 },
    sessions: 87,
  },
  'supply-chain': {
    web: { up: 96, rt: 820, err: 0.4 },
    mobile: { up: 97, rt: 1100, err: 0.3 },
    api: { up: 98, rt: 210, err: 0.2 },
    sessions: 234,
  },
  quality: {
    web: { up: 78, rt: 2600, err: 5.4 },
    mobile: { up: 80, rt: 3100, err: 4.8 },
    api: { up: 82, rt: 640, err: 3.9 },
    sessions: 56,
  },
  delivery: {
    web: { up: 99, rt: 380, err: 0.1 },
    mobile: { up: 99, rt: 510, err: 0.1 },
    api: { up: 100, rt: 120, err: 0.0 },
    sessions: 1847,
  },
};
const getCD = (id) =>
  CHANNEL_DATA[id] || {
    web: { up: 90, rt: 800, err: 1.2 },
    mobile: { up: 88, rt: 1100, err: 1.5 },
    api: { up: 92, rt: 350, err: 0.9 },
  };
const rtColor = (ms) => (ms < 500 ? C.GREEN : ms < 2000 ? C.AMBER : C.RED);
const errColor = (e) => (e < 1 ? C.GREEN : e < 5 ? C.AMBER : C.RED);
const upColor = (u) => (u >= 90 ? C.GREEN : u >= 75 ? C.AMBER : C.RED);

function ChannelBar({ label, data }) {
  return (
    <div
      style={{
        background: 'rgba(0,0,0,0.025)',
        borderRadius: 6,
        padding: '8px 10px',
        border: `1px solid rgba(0,0,0,0.06)`,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: C.MUTED,
          fontFamily: 'monospace',
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}
      >
        {[
          ['Avail', `${data.up}%`, upColor(data.up)],
          ['Resp', `${data.rt}ms`, rtColor(data.rt)],
          ['Errors', `${data.err}%`, errColor(data.err)],
        ].map(([l, v, col]) => (
          <div key={l} style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: col,
                fontFamily: 'monospace',
              }}
            >
              {v}
            </div>
            <div style={{ fontSize: 9, color: C.MUTED, marginTop: 1 }}>{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Predictive alert banner for a specific chain
function PredictBanner({ alerts, chainId, onRunHC }) {
  const relevant = (alerts || []).filter((a) => a.chainId === chainId);
  if (!relevant.length) return null;
  return (
    <div
      style={{
        margin: '8px 0 0',
        background: 'rgba(217,119,6,0.07)',
        border: '1px solid rgba(217,119,6,0.25)',
        borderRadius: 7,
        padding: '8px 12px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#92400E',
          marginBottom: 5,
        }}
      >
        ⚠ Predictive Alert — AIOps detected early warning
      </div>
      {relevant.map((a, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: i < relevant.length - 1 ? 5 : 0,
          }}
        >
          <div style={{ fontSize: 11, color: '#78350F' }}>
            <strong>{a.appName}</strong> · {a.component} at{' '}
            <strong style={{ color: '#D97706' }}>{a.current}%</strong> — breach
            in <strong style={{ color: '#DC2626' }}>{a.eta}</strong>
          </div>
          <button
            onClick={() => onRunHC(a.appId)}
            style={{
              fontSize: 10,
              background: 'rgba(217,119,6,0.15)',
              color: '#92400E',
              border: '1px solid rgba(217,119,6,0.3)',
              borderRadius: 5,
              padding: '3px 10px',
              cursor: 'pointer',
              flexShrink: 0,
              marginLeft: 8,
            }}
          >
            Pre-empt \u2192
          </button>
        </div>
      ))}
    </div>
  );
}

export default function SinglePane({
  chains,
  industry,
  selChainId,
  selAppId,
  onSelectChain,
  onSelectApp,
  onClearChain,
  runHC,
  healed,
  liveMetrics,
  predictAlerts,
  demoDegrade,
  onStartDegrade,
  onStopDegrade,
}) {
  const selChain = selChainId
    ? chains.find((c) => c.id === selChainId) || null
    : null;
  const selApp =
    selChain && selAppId
      ? selChain.apps.find((a) => a.id === selAppId) || null
      : null;
  const term = industry?.terminology || {};

  const getLive = (appId, comp, fallback) => {
    const key = `${appId}:${comp}`;
    return liveMetrics && liveMetrics[key] != null
      ? Math.round(liveMetrics[key])
      : fallback;
  };

  // ── LAYER 1: Value Chain cards ─────────────────────────────
  if (!selChain)
    return (
      <div style={{ padding: 22 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 14,
          }}
        >
          <Lbl n="1">Single Pane of Glass</Lbl>
          {/* Demo degradation control */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {demoDegrade ? (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: C.RED,
                    boxShadow: `0 0 8px ${C.RED}`,
                    animation: 'livePulse 1.2s infinite',
                  }}
                />
                <span
                  style={{
                    fontSize: 11,
                    color: C.RED,
                    fontFamily: 'monospace',
                  }}
                >
                  DEMO DEGRADATION ACTIVE
                </span>
                <button
                  onClick={onStopDegrade}
                  style={{
                    marginLeft: 4,
                    background: 'rgba(220,38,38,0.1)',
                    color: C.RED,
                    border: `1px solid ${C.RED}40`,
                    borderRadius: 5,
                    padding: '3px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  ■ Stop
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <div style={{ fontSize: 10, color: C.MUTED, marginRight: 2 }}>
                  Simulate:
                </div>
                <button
                  onClick={() => onStartDegrade('enterprise-apps')}
                  style={{
                    background: 'rgba(100,116,139,0.1)',
                    color: '#64748B',
                    border: '1px solid rgba(100,116,139,0.3)',
                    borderRadius: 5,
                    padding: '4px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  🏢 Partner DC Crisis
                </button>
                <button
                  onClick={() => onStartDegrade('sap-landscape')}
                  style={{
                    background: 'rgba(0,120,212,0.08)',
                    color: '#0078D4',
                    border: '1px solid rgba(0,120,212,0.25)',
                    borderRadius: 5,
                    padding: '4px 10px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  ☁ Azure SAP Crisis
                </button>
              </div>
            )}
          </div>
        </div>
        <div style={{ marginBottom: 10, fontSize: 12, color: C.MUTED }}>
          {term.valueChains || 'Value Chains'} — {chains.length} active · click
          any card to drill down
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
            gap: 14,
          }}
        >
          {chains.map((ch) => {
            const cd = getCD(ch.id);
            const alerts = (predictAlerts || []).filter(
              (a) => a.chainId === ch.id
            );
            return (
              <div
                key={ch.id}
                onClick={() => onSelectChain(ch.id)}
                style={{
                  background: C.PANEL,
                  border: `2px solid ${
                    alerts.length ? 'rgba(217,119,6,0.4)' : sc(ch.status) + '22'
                  }`,
                  borderRadius: 10,
                  padding: 16,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 16px rgba(0,0,0,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg,${sc(
                      ch.status
                    )},transparent)`,
                  }}
                />

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <span style={{ fontSize: 20, opacity: 0.7 }}>
                      {ch.icon}
                    </span>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#1E293B',
                      }}
                    >
                      {ch.name}
                    </div>
                  </div>
                  <Rag status={ch.status} />
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-end',
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 800,
                        color: sc(ch.status),
                        fontFamily: 'monospace',
                        lineHeight: 1,
                      }}
                    >
                      {ch.uptime}%
                    </div>
                    <div style={{ fontSize: 10, color: C.MUTED, marginTop: 2 }}>
                      Overall uptime
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 4,
                    }}
                  >
                    <Sparkline data={ch.trend} color={sc(ch.status)} />
                    <div
                      style={{
                        fontSize: 10,
                        color: C.MUTED,
                        fontFamily: 'monospace',
                      }}
                    >
                      👥 {(cd.sessions || 0).toLocaleString()} sessions
                    </div>
                  </div>
                </div>
                <Bar value={ch.uptime} status={ch.status} h={3} />

                {/* Channel breakdown */}
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      fontSize: 9,
                      color: C.MUTED,
                      fontFamily: 'monospace',
                      letterSpacing: 2,
                      marginBottom: 6,
                    }}
                  >
                    CHANNEL AVAILABILITY
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 5,
                    }}
                  >
                    {[
                      ['🌐 Web', cd.web],
                      ['📱 Mobile', cd.mobile],
                      ['⚡ API', cd.api],
                    ].map(([l, d]) => (
                      <ChannelBar key={l} label={l} data={d} />
                    ))}
                  </div>
                </div>

                {/* Predictive alert */}
                {alerts.length > 0 && (
                  <div
                    style={{
                      marginTop: 8,
                      background: 'rgba(217,119,6,0.06)',
                      border: '1px solid rgba(217,119,6,0.2)',
                      borderRadius: 6,
                      padding: '6px 10px',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: '#D97706',
                        fontWeight: 600,
                      }}
                    >
                      ⚠ {alerts.length} predictive alert
                      {alerts.length > 1 ? 's' : ''}
                    </div>
                    {alerts.map((a, i) => (
                      <div key={i} style={{ fontSize: 10, color: '#92400E' }}>
                        {a.appName} · {a.component} breach in {a.eta}
                      </div>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: C.BLUE,
                    fontWeight: 500,
                  }}
                >
                  View Details \u2192
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

  // ── LAYER 2: Applications ──────────────────────────────────
  const cd = getCD(selChain.id);
  if (!selApp)
    return (
      <div style={{ padding: 22 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            marginBottom: 14,
            fontSize: 12,
          }}
        >
          <span
            onClick={() => onClearChain()}
            style={{ cursor: 'pointer', color: C.MUTED }}
          >
            ← All {term.valueChains || 'Chains'}
          </span>
          <span style={{ color: C.MUTED }}>/</span>
          <span style={{ color: '#1E293B', fontWeight: 600 }}>
            {selChain.name}
          </span>
          <Rag status={selChain.status} lg />
        </div>

        {/* Chain-level channel metrics */}
        <div
          style={{
            background: C.PANEL,
            border: `1px solid ${C.BORDER}`,
            borderRadius: 8,
            padding: 14,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
              }}
            >
              CHANNEL METRICS — {selChain.name.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: C.MUTED }}>
              👥 {(cd.sessions || 0).toLocaleString()} active sessions
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 10,
            }}
          >
            {[
              ['🌐 Web', cd.web],
              ['📱 Mobile', cd.mobile],
              ['⚡ API', cd.api],
            ].map(([label, data]) => (
              <div
                key={label}
                style={{
                  background: 'rgba(0,0,0,0.02)',
                  borderRadius: 7,
                  padding: 12,
                  border: `1px solid rgba(0,0,0,0.06)`,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#1E293B',
                    marginBottom: 8,
                  }}
                >
                  {label}
                </div>
                {[
                  ['Availability', `${data.up}%`, upColor(data.up)],
                  ['Response Time', `${data.rt}ms`, rtColor(data.rt)],
                  ['Error Rate', `${data.err}%`, errColor(data.err)],
                ].map(([l, v, col]) => (
                  <div
                    key={l}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '3px 0',
                      borderBottom: '1px solid rgba(0,0,0,0.05)',
                    }}
                  >
                    <span style={{ fontSize: 12, color: C.MUTED }}>{l}</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: col,
                        fontFamily: 'monospace',
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Predictive alerts for this chain */}
        <PredictBanner
          alerts={predictAlerts}
          chainId={selChain.id}
          onRunHC={runHC}
        />

        <div
          style={{
            fontSize: 9,
            color: C.MUTED,
            letterSpacing: 3,
            fontFamily: 'monospace',
            margin: '14px 0 10px',
          }}
        >
          {(term.applications || 'APPLICATIONS').toUpperCase()}
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {selChain.apps.map((app) => {
            const isHealed = healed.has(app.id);
            const effStatus = isHealed ? 'GREEN' : app.status;
            const appAlerts = (predictAlerts || []).filter(
              (a) => a.appId === app.id
            );
            // Live metric for first infra component
            const livePerf =
              app.infra.length > 0
                ? getLive(app.id, app.infra[0].c, app.perf)
                : app.perf;
            return (
              <div
                key={app.id}
                onClick={() => onSelectApp(app.id)}
                style={{
                  background: C.PANEL,
                  border: `1px solid ${
                    appAlerts.length
                      ? 'rgba(217,119,6,0.3)'
                      : sc(effStatus) + '22'
                  }`,
                  borderRadius: 8,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'border-color 0.15s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.borderColor = sc(effStatus) + '44')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.borderColor = appAlerts.length
                    ? 'rgba(217,119,6,0.3)'
                    : sc(effStatus) + '22')
                }
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 7,
                        background: sb(effStatus),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 15,
                      }}
                    >
                      ⬡
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: '#1E293B',
                        }}
                      >
                        {app.name}
                      </div>
                      <div style={{ fontSize: 10, color: C.MUTED }}>
                        {app.ver}
                      </div>
                      {appAlerts.length > 0 && (
                        <div
                          style={{
                            fontSize: 10,
                            color: '#D97706',
                            marginTop: 1,
                          }}
                        >
                          ⚠ Trending critical in {appAlerts[0].eta}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 19,
                          fontWeight: 800,
                          color: sc(effStatus),
                          fontFamily: 'monospace',
                        }}
                      >
                        {livePerf}%
                      </div>
                      <div style={{ fontSize: 9, color: C.MUTED }}>
                        Live metric
                      </div>
                    </div>
                    <Rag status={effStatus} />
                    {effStatus === 'RED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          runHC(app.id);
                        }}
                        style={{
                          background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 5,
                          padding: '5px 11px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ⚡ Healthcheck
                      </button>
                    )}
                    {appAlerts.length > 0 && effStatus !== 'RED' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          runHC(app.id);
                        }}
                        style={{
                          background: 'rgba(217,119,6,0.1)',
                          color: '#92400E',
                          border: '1px solid rgba(217,119,6,0.3)',
                          borderRadius: 5,
                          padding: '5px 11px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ⚡ Pre-empt
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <Bar value={livePerf} status={effStatus} h={4} />
                </div>
                <div
                  style={{
                    marginTop: 7,
                    display: 'flex',
                    gap: 4,
                    flexWrap: 'wrap',
                  }}
                >
                  {app.infra.map((inf) => {
                    const liveM = getLive(app.id, inf.c, inf.m);
                    const liveStatus = isHealed
                      ? 'GREEN'
                      : liveM > 90
                      ? 'RED'
                      : liveM > 75
                      ? 'AMBER'
                      : inf.h;
                    return (
                      <div
                        key={inf.c}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          fontSize: 10,
                          padding: '2px 7px',
                          background: sb(liveStatus),
                          borderRadius: 4,
                          border: `1px solid ${sc(liveStatus)}20`,
                        }}
                      >
                        <div
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: '50%',
                            background: sc(liveStatus),
                          }}
                        />
                        <span style={{ color: '#475569' }}>{inf.c}</span>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            color: sc(liveStatus),
                          }}
                        >
                          {liveM}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

  // ── LAYER 3: Infrastructure ────────────────────────────────
  return (
    <div style={{ padding: 22 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 14,
          fontSize: 12,
        }}
      >
        <span
          onClick={() => onClearChain()}
          style={{ cursor: 'pointer', color: C.MUTED }}
        >
          ← All {term.valueChains || 'Chains'}
        </span>
        <span style={{ color: C.MUTED }}>/</span>
        <span
          onClick={() => onSelectApp(null)}
          style={{ cursor: 'pointer', color: C.MUTED }}
        >
          {selChain.name}
        </span>
        <span style={{ color: C.MUTED }}>/</span>
        <span style={{ color: '#1E293B', fontWeight: 600 }}>{selApp.name}</span>
      </div>
      <div
        style={{
          fontSize: 9,
          color: C.MUTED,
          letterSpacing: 3,
          fontFamily: 'monospace',
          marginBottom: 12,
        }}
      >
        {(term.infrastructure || 'INFRASTRUCTURE').toUpperCase()} — LIVE METRICS
      </div>
      <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
        {selApp.infra.map((inf) => {
          const isHealed = healed.has(selApp.id);
          const liveM = getLive(selApp.id, inf.c, inf.m);
          const liveStatus = isHealed
            ? 'GREEN'
            : liveM > 90
            ? 'RED'
            : liveM > 75
            ? 'AMBER'
            : inf.h;
          return (
            <div
              key={inf.c}
              style={{
                background: C.PANEL,
                border: `1px solid ${sc(liveStatus) + '22'}`,
                borderRadius: 8,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 7,
                      background: sb(liveStatus),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 16,
                    }}
                  >
                    {{
                      Server: '🖥',
                      Database: '🗄',
                      Filesystem: '💾',
                      Network: '🌐',
                    }[inf.c] || '⬡'}
                  </div>
                  <div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#1E293B',
                      }}
                    >
                      {inf.c}
                    </div>
                    <div style={{ fontSize: 10, color: C.MUTED }}>
                      {inf.type} · {inf.detail}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Live metric with pulse if degrading */}
                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: sc(liveStatus),
                        fontFamily: 'monospace',
                      }}
                    >
                      {liveM}%
                    </div>
                    <div style={{ fontSize: 9, color: C.MUTED }}>live</div>
                  </div>
                  <Rag status={liveStatus} />
                </div>
              </div>
              <div style={{ marginTop: 7 }}>
                <Bar value={liveM} status={liveStatus} h={5} />
              </div>
            </div>
          );
        })}
      </div>
      {(selApp.status === 'RED' || healed.has(selApp.id)) && (
        <div
          style={{
            background: healed.has(selApp.id)
              ? 'rgba(22,163,74,0.06)'
              : 'rgba(220,38,38,0.06)',
            border: `1px solid ${
              healed.has(selApp.id)
                ? 'rgba(22,163,74,0.2)'
                : 'rgba(220,38,38,0.2)'
            }`,
            borderRadius: 8,
            padding: 14,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: healed.has(selApp.id) ? C.GREEN : '#DC2626',
              }}
            >
              {healed.has(selApp.id)
                ? '✅ AIOps remediation complete — ' + selApp.name + ' healthy'
                : '⚠ Critical issues in ' + selApp.name}
            </div>
            <div style={{ fontSize: 11, color: C.MUTED, marginTop: 2 }}>
              {healed.has(selApp.id)
                ? 'All metrics within normal range'
                : 'AIOps can automatically diagnose and remediate'}
            </div>
          </div>
          {!healed.has(selApp.id) && (
            <button
              onClick={() => runHC(selApp.id)}
              style={{
                background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ⚡ Run Healthcheck
            </button>
          )}
        </div>
      )}
    </div>
  );
}
