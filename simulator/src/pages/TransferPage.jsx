import { useState } from 'react';
import { C } from '../config/theme.js';
import { Lbl } from '../components/atoms.jsx';
import { CUSTOMER } from '../data/customer/loader.js';

// ── Radial progress ring ──────────────────────────────────────
function RadialProgress({ pct, size = 80, color = '#16A34A', label }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(0,0,0,0.07)"
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{
            transform: 'rotate(-90deg)',
            transformOrigin: `${size / 2}px ${size / 2}px`,
            transition: 'stroke-dasharray 1s ease',
          }}
        />
        <text
          x={size / 2}
          y={size / 2 + 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="14"
          fontWeight="800"
          fill={color}
          fontFamily="monospace"
        >
          {pct}%
        </text>
      </svg>
      {label && (
        <div
          style={{
            fontSize: 9,
            color: C.MUTED,
            textAlign: 'center',
            maxWidth: 70,
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle, color = '#2563EB' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 14,
        paddingBottom: 10,
        borderBottom: `2px solid ${color}20`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 16,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: C.MUTED }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
}

// ── Transfer Readiness tab ────────────────────────────────────
function ReadinessTab({ tc }) {
  const {
    readiness = { overall: 0, categories: [] },
    risks = [],
    from = '',
    to = '',
    handoverDate = '',
    gccLocation = '',
    tcsLocation = '',
  } = tc;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
          borderRadius: 12,
          padding: '20px 24px',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                opacity: 0.7,
                fontFamily: 'monospace',
                letterSpacing: 3,
                marginBottom: 6,
              }}
            >
              TRANSFER READINESS — {handoverDate}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              {tc.programme}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              {from} → {to}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{ fontSize: 42, fontWeight: 800, fontFamily: 'monospace' }}
            >
              {readiness.overall}%
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Overall readiness</div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 20,
            marginTop: 16,
            fontSize: 11,
            opacity: 0.8,
          }}
        >
          <span>🏢 From: {tcsLocation}</span>
          <span>🌏 To: {gccLocation}</span>
          <span>📅 Target: {handoverDate}</span>
        </div>
      </div>

      {/* Readiness categories */}
      <div
        style={{
          background: '#fff',
          border: `1px solid ${C.BORDER}`,
          borderRadius: 10,
          padding: '18px 20px',
        }}
      >
        <SectionHeader
          icon="🎯"
          title="Readiness by Category"
          subtitle="What Canon GCC inherits at handover"
          color="#2563EB"
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 14,
          }}
        >
          {(readiness?.categories || []).map((cat) => (
            <div
              key={cat.id}
              style={{
                background: `${cat.color}06`,
                border: `1px solid ${cat.color}20`,
                borderRadius: 10,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 12,
                }}
              >
                <div>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>
                    {cat.icon}
                  </div>
                  <div
                    style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}
                  >
                    {cat.label}
                  </div>
                  <div style={{ fontSize: 11, color: C.MUTED, marginTop: 2 }}>
                    {cat.count} of {cat.total}
                  </div>
                </div>
                <RadialProgress pct={cat.pct} size={64} color={cat.color} />
              </div>
              <div
                style={{
                  height: 5,
                  background: 'rgba(0,0,0,0.06)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${cat.pct}%`,
                    background: cat.color,
                    borderRadius: 3,
                    transition: 'width 1s',
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: C.MUTED,
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                {cat.detail}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Risk register */}
      <div
        style={{
          background: '#fff',
          border: `1px solid ${C.BORDER}`,
          borderRadius: 10,
          padding: '18px 20px',
        }}
      >
        <SectionHeader
          icon="⚠"
          title="Transfer Risk Register"
          subtitle="Active risks and mitigations"
          color="#DC2626"
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(risks || []).map((risk, i) => {
            const col =
              risk.severity === 'HIGH'
                ? '#DC2626'
                : risk.severity === 'MEDIUM'
                ? '#D97706'
                : '#16A34A';
            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 14px',
                  borderRadius: 8,
                  background: `${col}06`,
                  border: `1px solid ${col}20`,
                }}
              >
                <div style={{ flexShrink: 0, paddingTop: 2 }}>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#fff',
                      background: col,
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {risk.severity}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#1E293B',
                      marginBottom: 3,
                    }}
                  >
                    {risk.label}
                  </div>
                  <div style={{ fontSize: 11, color: C.MUTED }}>
                    <span style={{ color: col, fontWeight: 500 }}>
                      Mitigation:
                    </span>{' '}
                    {risk.mitigation}
                  </div>
                  <div style={{ fontSize: 10, color: C.MUTED, marginTop: 2 }}>
                    Owner: {risk.owner}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── KT Progress tab ───────────────────────────────────────────
function KTProgressTab({ tc }) {
  const { ktProgress = [] } = tc;
  const maxVal = 61;
  const SERIES = [
    { key: 'runbooks', label: 'Runbooks', color: '#2563EB' },
    { key: 'kb', label: 'KB Articles', color: '#7C3AED' },
    { key: 'automation', label: 'Automation', color: '#16A34A' },
    { key: 'shadowing', label: 'Shadowing', color: '#D97706' },
  ];
  const handoverMonth = ktProgress.find((m) => m.handover);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg,#059669,#2563EB)',
          borderRadius: 12,
          padding: '20px 24px',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                opacity: 0.7,
                fontFamily: 'monospace',
                letterSpacing: 3,
                marginBottom: 6,
              }}
            >
              KNOWLEDGE TRANSFER PROGRESS
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              ZeroOps Knowledge Capture Timeline
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              Every resolved incident adds to institutional memory — Canon GCC
              inherits it all
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace' }}
            >
              {tc.handoverDate}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>Target handover</div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div
        style={{
          background: '#fff',
          border: `1px solid ${C.BORDER}`,
          borderRadius: 10,
          padding: '20px 24px',
        }}
      >
        <SectionHeader
          icon="📈"
          title="Transfer Progress Over Time"
          subtitle="Projected KT milestones · Jun'26 to Dec'26 · all forecast"
          color="#16A34A"
        />

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          {SERIES.map((s) => (
            <div
              key={s.key}
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              <div
                style={{
                  width: 12,
                  height: 4,
                  borderRadius: 2,
                  background: s.color,
                }}
              />
              <span style={{ fontSize: 11, color: C.MUTED }}>{s.label}</span>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              marginLeft: 'auto',
            }}
          >
            <div
              style={{
                width: 20,
                height: 2,
                background: '#94A3B8',
                borderTop: '2px dashed #94A3B8',
              }}
            />
            <span style={{ fontSize: 11, color: C.MUTED }}>Forecast</span>
          </div>
        </div>

        {/* Bar chart */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'flex-end',
            height: 200,
            borderBottom: `1px solid ${C.BORDER}`,
            paddingBottom: 4,
          }}
        >
          {(ktProgress || []).map((month, mi) => (
            <div
              key={month.month}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <div
                style={{
                  width: '100%',
                  display: 'flex',
                  gap: 1,
                  alignItems: 'flex-end',
                  height: 180,
                  opacity: month.forecast ? 0.55 : 1,
                }}
              >
                {SERIES.map((s) => {
                  const h = Math.round((month[s.key] / maxVal) * 170);
                  return (
                    <div
                      key={s.key}
                      style={{
                        flex: 1,
                        height: h,
                        background: s.color,
                        borderRadius: '2px 2px 0 0',
                        borderTop: month.forecast
                          ? `2px dashed ${s.color}`
                          : 'none',
                        background: month.forecast ? 'transparent' : s.color,
                        border: month.forecast
                          ? `1px dashed ${s.color}`
                          : 'none',
                      }}
                    />
                  );
                })}
              </div>
              {month.handover && (
                <div
                  style={{
                    fontSize: 8,
                    color: '#DC2626',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    marginTop: 2,
                  }}
                >
                  HANDOVER
                </div>
              )}
              <div
                style={{
                  fontSize: 9,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  textAlign: 'center',
                }}
              >
                {month.month.replace("'", "'")}
              </div>
            </div>
          ))}
        </div>

        {/* Current state summary */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 10,
            marginTop: 16,
          }}
        >
          {SERIES.map((s) => {
            const current =
              ktProgress.filter((m) => !m.forecast).slice(-1)[0] ||
              ktProgress[0] ||
              {};
            const target = ktProgress.slice(-1)[0] || {};
            return (
              <div
                key={s.key}
                style={{
                  background: `${s.color}08`,
                  border: `1px solid ${s.color}20`,
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: s.color,
                    fontFamily: 'monospace',
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  {s.label.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: s.color,
                    fontFamily: 'monospace',
                  }}
                >
                  {current[s.key] ?? 0}
                </div>
                <div style={{ fontSize: 10, color: C.MUTED }}>
                  of {target[s.key] ?? 0} target
                </div>
                <div
                  style={{
                    height: 4,
                    background: 'rgba(0,0,0,0.06)',
                    borderRadius: 2,
                    overflow: 'hidden',
                    marginTop: 6,
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${
                        target[s.key]
                          ? Math.round(
                              ((current[s.key] || 0) / target[s.key]) * 100
                            )
                          : 0
                      }%`,
                      background: s.color,
                      borderRadius: 2,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What ZeroOps captures */}
      <div
        style={{
          background: '#fff',
          border: `1px solid ${C.BORDER}`,
          borderRadius: 10,
          padding: '18px 20px',
        }}
      >
        <SectionHeader
          icon="🧠"
          title="What ZeroOps Captures Automatically"
          subtitle="Every incident adds to Canon GCC's institutional memory"
          color="#7C3AED"
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 10,
          }}
        >
          {[
            [
              'Resolution Patterns',
              'Every auto-resolved incident creates a validated runbook — no manual authoring required',
              '📋',
              '#2563EB',
            ],
            [
              'Root Cause Library',
              'RCA Engine builds a vector database of failure modes — GCC engineers inherit years of diagnostic knowledge',
              '🔍',
              '#7C3AED',
            ],
            [
              'Confidence Scores',
              'Each pattern is rated by accuracy — GCC knows exactly which automations to trust from day one',
              '📊',
              '#16A34A',
            ],
            [
              'Escalation Paths',
              'Who to call, what to check, what to do — captured from every HiTL decision the team makes',
              '🔗',
              '#D97706',
            ],
            [
              'Change History',
              'Every approved change creates a validated runbook — Change Validator learns what safe looks like',
              '✅',
              '#059669',
            ],
            [
              'Tribal Knowledge',
              'Engineer notes, workarounds, and context captured at resolution time — not lost when someone leaves',
              '💡',
              '#DC2626',
            ],
          ].map(([title, detail, icon, color]) => (
            <div
              key={title}
              style={{
                padding: '12px 14px',
                background: `${color}06`,
                border: `1px solid ${color}18`,
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 18, marginBottom: 6 }}>{icon}</div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1E293B',
                  marginBottom: 4,
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: 11, color: C.MUTED, lineHeight: 1.5 }}>
                {detail}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Dual-Entity Service Map tab ───────────────────────────────
function DualEntityTab({ tc }) {
  const { domains = [], currentCoverage = 0, targetCoverage = 100 } = tc;
  const [selDomain, setSelDomain] = useState(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg,#0078D4,#7C3AED)',
          borderRadius: 12,
          padding: '20px 24px',
          color: '#fff',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                opacity: 0.7,
                fontFamily: 'monospace',
                letterSpacing: 3,
                marginBottom: 6,
              }}
            >
              DUAL-ENTITY VIEW — LIVE MONITORING
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              TCS Managed + GCC Incoming — one platform
            </div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              ZeroOps monitors both scopes simultaneously — unified visibility
              across the entire Canon estate
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, textAlign: 'center' }}>
            <div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                }}
              >
                {currentCoverage}%
              </div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>
                TCS managed today
              </div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                }}
              >
                {targetCoverage}%
              </div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>GCC target</div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-side domains */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {(domains || []).map((domain) => (
          <div
            key={domain.id}
            onClick={() =>
              setSelDomain(selDomain === domain.id ? null : domain.id)
            }
            style={{
              background: '#fff',
              border: `2px solid ${
                selDomain === domain.id ? domain.color : C.BORDER
              }`,
              borderRadius: 10,
              padding: '18px 20px',
              cursor: 'pointer',
              borderTop: `4px solid ${domain.color}`,
              transition: 'border-color 0.2s',
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: `${domain.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                  }}
                >
                  {domain.icon}
                </div>
                <div>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}
                  >
                    {domain.label}
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                      background:
                        domain.status === 'LIVE'
                          ? 'rgba(22,163,74,0.1)'
                          : 'rgba(124,58,237,0.1)',
                      color: domain.status === 'LIVE' ? '#16A34A' : '#7C3AED',
                    }}
                  >
                    {domain.status}
                  </span>
                </div>
              </div>
              <RadialProgress
                pct={domain.status === 'LIVE' ? domain.automationRate : 0}
                size={56}
                color={domain.color}
                label={
                  domain.status === 'LIVE' ? 'auto-resolved' : 'onboarding'
                }
              />
            </div>

            {/* Apps list */}
            <div style={{ marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 9,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                  marginBottom: 6,
                }}
              >
                APPLICATIONS
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {(domain.apps || []).map((app) => (
                  <span
                    key={app}
                    style={{
                      fontSize: 10,
                      padding: '2px 8px',
                      borderRadius: 4,
                      background: `${domain.color}10`,
                      color: domain.color,
                      fontWeight: 500,
                    }}
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {[
                [
                  'Runbook Coverage',
                  `${domain.runbookCoverage}%`,
                  domain.runbookCoverage >= 70
                    ? '#16A34A'
                    : domain.runbookCoverage >= 40
                    ? '#D97706'
                    : '#DC2626',
                ],
                [
                  'Automation Rate',
                  `${domain.automationRate}%`,
                  domain.automationRate >= 50
                    ? '#16A34A'
                    : domain.automationRate >= 20
                    ? '#D97706'
                    : '#94A3B8',
                ],
              ].map(([label, val, col]) => (
                <div
                  key={label}
                  style={{
                    padding: '8px 10px',
                    background: 'rgba(0,0,0,0.02)',
                    borderRadius: 6,
                    border: `1px solid ${C.BORDER}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: C.MUTED,
                      fontFamily: 'monospace',
                      letterSpacing: 1,
                      marginBottom: 3,
                    }}
                  >
                    {label.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: col,
                      fontFamily: 'monospace',
                    }}
                  >
                    {val}
                  </div>
                </div>
              ))}
            </div>

            {domain.note && (
              <div
                style={{
                  marginTop: 10,
                  padding: '7px 10px',
                  background: 'rgba(124,58,237,0.05)',
                  border: '1px solid rgba(124,58,237,0.15)',
                  borderRadius: 6,
                  fontSize: 11,
                  color: '#5B21B6',
                }}
              >
                💡 {domain.note}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Transfer progress bar */}
      <div
        style={{
          background: '#fff',
          border: `1px solid ${C.BORDER}`,
          borderRadius: 10,
          padding: '18px 20px',
        }}
      >
        <SectionHeader
          icon="🔄"
          title="Scope Transfer Progress"
          subtitle="Current state → Target handover"
          color="#0078D4"
        />
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <span style={{ fontSize: 12, color: C.MUTED }}>
              TCS managed today
            </span>
            <span style={{ fontSize: 12, color: C.MUTED }}>GCC target</span>
          </div>
          <div
            style={{
              height: 20,
              background: 'rgba(0,0,0,0.05)',
              borderRadius: 10,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                height: '100%',
                width: `${currentCoverage}%`,
                background: 'linear-gradient(90deg,#0078D4,#2563EB)',
                borderRadius: '10px 0 0 10px',
                transition: 'width 1s',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: `${currentCoverage}%`,
                top: 0,
                height: '100%',
                width: `${targetCoverage - currentCoverage}%`,
                background: 'rgba(124,58,237,0.3)',
                borderRight: '2px dashed #7C3AED',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
                color: '#fff',
                fontFamily: 'monospace',
              }}
            >
              {currentCoverage}% live · {targetCoverage - currentCoverage}%
              onboarding
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: 6,
              fontSize: 10,
              color: C.MUTED,
            }}
          >
            <span style={{ color: '#0078D4', fontWeight: 600 }}>
              ■ TCS Managed — {currentCoverage}%
            </span>
            <span style={{ color: '#7C3AED', fontWeight: 600 }}>
              ■ GCC Incoming — {targetCoverage - currentCoverage}%
            </span>
          </div>
        </div>

        <div
          style={{
            padding: '12px 16px',
            background:
              'linear-gradient(135deg,rgba(22,163,74,0.06),rgba(37,99,235,0.04))',
            border: '1px solid rgba(22,163,74,0.2)',
            borderRadius: 8,
            fontSize: 12,
            color: '#064E3B',
          }}
        >
          🛡 <strong>ZeroOps guarantee:</strong> Canon GCC inherits a fully
          documented, fully automated IT estate — not a black box. Every
          incident resolved before handover becomes institutional knowledge the
          GCC team owns from day one.
        </div>
      </div>
    </div>
  );
}

// ── Main TransferPage ─────────────────────────────────────────
export default function TransferPage() {
  const [tab, setTab] = useState('readiness');
  const tc = CUSTOMER?.transferConfig;

  if (!tc) {
    return (
      <div
        style={{
          padding: 22,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 400,
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔄</div>
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: '#0F172A',
            marginBottom: 6,
          }}
        >
          Transfer Readiness
        </div>
        <div style={{ fontSize: 13, color: C.MUTED }}>
          No transfer configuration found for this customer.
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.MUTED,
            marginTop: 4,
            fontFamily: 'monospace',
          }}
        >
          Add transferConfig to customer.json to enable this view.
        </div>
      </div>
    );
  }

  const TABS = [
    {
      id: 'readiness',
      label: '🎯 Transfer Readiness',
      desc: 'What GCC inherits at handover',
    },
    { id: 'kt', label: '📈 KT Progress', desc: 'Knowledge capture timeline' },
    {
      id: 'dual',
      label: '🗺 Dual-Entity View',
      desc: 'TCS + GCC live monitoring',
    },
  ];

  return (
    <div style={{ padding: 22, maxWidth: 1200 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
        }}
      >
        <Lbl n="6">Transfer Readiness</Lbl>
        <div style={{ display: 'flex', gap: 8 }}>
          {TABS.map((t) => (
            <div
              key={t.id}
              data-demo={`transfer-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              style={{
                padding: '7px 16px',
                borderRadius: 7,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: tab === t.id ? 600 : 400,
                background:
                  tab === t.id ? 'rgba(37,99,235,0.1)' : 'rgba(0,0,0,0.03)',
                color: tab === t.id ? '#1D4ED8' : C.MUTED,
                border: `1px solid ${
                  tab === t.id ? 'rgba(37,99,235,0.3)' : C.BORDER
                }`,
              }}
            >
              {t.label}
            </div>
          ))}
        </div>
      </div>

      {tab === 'readiness' && <ReadinessTab tc={tc} />}
      {tab === 'kt' && <KTProgressTab tc={tc} />}
      {tab === 'dual' && <DualEntityTab tc={tc} />}
    </div>
  );
}
