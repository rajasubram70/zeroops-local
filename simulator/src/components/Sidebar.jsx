import { useState } from 'react';
import { C, sc } from '../config/theme.js';
import { NAV_ITEMS } from '../config/roles.config.js';

// ── Nav item helper ───────────────────────────────────────────
function NavItem({ item, active, alerts, onNav, accentColor = '#2563EB' }) {
  return (
    <div
      onClick={() => onNav(item.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 9px',
        borderRadius: 6,
        cursor: 'pointer',
        marginBottom: 2,
        background: active ? `${accentColor}12` : 'transparent',
        borderLeft: active
          ? `2px solid ${accentColor}`
          : '2px solid transparent',
        transition: 'all 0.15s',
      }}
    >
      <span style={{ fontSize: 13, opacity: active ? 1 : 0.45 }}>
        {item.icon}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: active ? 600 : 400,
          color: active ? accentColor : '#64748B',
        }}
      >
        {item.label}
      </span>
      {item.id === 'inc' && alerts.length > 0 && (
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 9,
            background: 'rgba(220,38,38,0.12)',
            color: '#DC2626',
            border: '1px solid rgba(220,38,38,0.25)',
            borderRadius: 10,
            padding: '1px 5px',
            fontFamily: 'monospace',
          }}
        >
          {alerts.length}
        </span>
      )}
    </div>
  );
}

export default function Sidebar({
  user,
  nav,
  onNav,
  selChain,
  selApp,
  onSelectApp,
  onClearChain,
  teamActivity,
  predictAlerts,
}) {
  const allowed = NAV_ITEMS.filter((n) => user.access.includes(n.acc));
  const [showTeam, setShowTeam] = useState(false);

  const alerts = (predictAlerts || []).slice(0, 3);

  return (
    <div
      className="sidebar-hide"
      style={{
        width: 190,
        background: 'rgba(255,255,255,0.99)',
        borderRight: `1px solid ${C.BORDER}`,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* ── Nav items — scrollable, always shows everything ── */}
      <div
        style={{
          padding: '11px 9px 6px',
          flexShrink: 0,
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 180px)',
        }}
      >
        {/* Common nav item — Command Centre */}
        {allowed
          .filter((i) => i.pillar === 'common')
          .map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={nav === item.id}
              alerts={alerts}
              onNav={onNav}
            />
          ))}

        {/* DEV pillar */}
        {allowed.some((i) => i.pillar === 'dev') && (
          <>
            <div
              style={{
                fontSize: 7,
                color: '#16A34A',
                letterSpacing: 3,
                fontFamily: 'monospace',
                margin: '10px 3px 5px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'rgba(22,163,74,0.2)',
                }}
              />
              DEV
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'rgba(22,163,74,0.2)',
                }}
              />
            </div>
            {allowed
              .filter((i) => i.pillar === 'dev')
              .map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={nav === item.id}
                  alerts={alerts}
                  onNav={onNav}
                  accentColor="#16A34A"
                />
              ))}
          </>
        )}

        {/* OPS pillar */}
        {allowed.some((i) => i.pillar === 'ops') && (
          <>
            <div
              style={{
                fontSize: 7,
                color: '#2563EB',
                letterSpacing: 3,
                fontFamily: 'monospace',
                margin: '10px 3px 5px',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'rgba(37,99,235,0.2)',
                }}
              />
              OPS
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'rgba(37,99,235,0.2)',
                }}
              />
            </div>
            {allowed
              .filter((i) => i.pillar === 'ops')
              .map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={nav === item.id}
                  alerts={alerts}
                  onNav={onNav}
                />
              ))}
          </>
        )}
      </div>

      {/* ── Predictive Alerts ── */}
      {alerts.length > 0 && (
        <div
          style={{
            margin: '0 9px 10px',
            background: 'rgba(217,119,6,0.06)',
            border: '1px solid rgba(217,119,6,0.2)',
            borderRadius: 8,
            padding: '9px 10px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 8,
              color: '#D97706',
              fontFamily: 'monospace',
              letterSpacing: 2,
              marginBottom: 7,
            }}
          >
            ⚠ PREDICTIVE ALERTS
          </div>
          {alerts.map((a, i) => (
            <div
              key={i}
              style={{ marginBottom: i < alerts.length - 1 ? 7 : 0 }}
            >
              <div style={{ fontSize: 11, fontWeight: 600, color: '#92400E' }}>
                {a.appName}
              </div>
              <div style={{ fontSize: 10, color: '#78350F' }}>
                {a.component} trending critical
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#D97706',
                  fontFamily: 'monospace',
                }}
              >
                {a.current}% · breach in {a.eta}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Topology drill-down ── */}
      {nav === 'topo' && selChain && (
        <div
          style={{
            padding: '9px',
            borderTop: `1px solid ${C.BORDER}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: 7,
              color: '#64748B',
              letterSpacing: 2,
              fontFamily: 'monospace',
              marginBottom: 5,
            }}
          >
            DRILL-DOWN
          </div>
          <div
            onClick={() => onClearChain()}
            style={{
              cursor: 'pointer',
              fontSize: 11,
              color: C.MUTED,
              padding: '4px 7px',
              borderRadius: 4,
            }}
          >
            ← All Chains
          </div>
          {selApp && (
            <div
              onClick={() => onSelectApp(null)}
              style={{
                cursor: 'pointer',
                fontSize: 11,
                color: C.MUTED,
                padding: '4px 7px',
                borderRadius: 4,
              }}
            >
              ← {selChain.name}
            </div>
          )}
          {!selApp &&
            selChain.apps.map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectApp(app)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 7px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  marginBottom: 1,
                  background: 'rgba(0,0,0,0.025)',
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: sc(app.status),
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  {app.name}
                </span>
              </div>
            ))}
        </div>
      )}

      {/* ── Spacer ── */}
      <div style={{ flex: 1 }} />

      {/* ── Team Activity — collapsed by default ── */}
      <div style={{ borderTop: `1px solid ${C.BORDER}`, flexShrink: 0 }}>
        <div
          onClick={() => setShowTeam((s) => !s)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 11px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              fontSize: 7,
              color: '#64748B',
              letterSpacing: 2,
              fontFamily: 'monospace',
            }}
          >
            TEAM ONLINE
          </div>
          <span style={{ fontSize: 10, color: C.MUTED }}>
            {showTeam ? '▲' : '▼'}
          </span>
        </div>
        {showTeam && (
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {(teamActivity || []).map((member, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 7,
                  padding: '6px 11px',
                  borderBottom: `1px solid rgba(0,0,0,0.04)`,
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: `${member.color}18`,
                    border: `1px solid ${member.color}30`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 700,
                    color: member.color,
                    flexShrink: 0,
                  }}
                >
                  {member.user
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: '#1E293B',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {member.user}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.MUTED,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {member.action}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: '#94A3B8',
                      fontFamily: 'monospace',
                    }}
                  >
                    {member.ago}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: '8px 11px',
          borderTop: `1px solid ${C.BORDER}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 7,
            color: '#94A3B8',
            textAlign: 'center',
            lineHeight: 1.8,
            fontFamily: 'monospace',
          }}
        >
          ZeroOps v1.0 · Synthetic Data
        </div>
      </div>
    </div>
  );
}
