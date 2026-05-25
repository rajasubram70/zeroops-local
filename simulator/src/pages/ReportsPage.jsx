import {
  CUSTOMER,
  METRICS,
  INCIDENTS_DATA,
  REQUEST_STATS,
  DAILY_STATS,
  AGENT_DEFS,
} from '../data/customer/loader.js';
import { useState, useRef, useEffect } from 'react';
import { useLiveData } from '../hooks/useLiveData.js';
import { C, sc, pc } from '../config/theme.js';
import { Lbl, Bar } from '../components/atoms.jsx';

// ── Sparkline mini chart ──────────────────────────────────────
function Spark({ data, color, h = 28, w = 80 }) {
  if (!data?.length) return null;
  const max = Math.max(...data),
    min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pts.split(' ').pop().split(',')[0]}
        cy={pts.split(' ').pop().split(',')[1]}
        r="3"
        fill={color}
      />
    </svg>
  );
}

// ── Metric card ───────────────────────────────────────────────
function MetricCard({ label, value, delta, deltaUp, color, sub, trend }) {
  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid ${C.BORDER}`,
        borderRadius: 10,
        padding: '16px 18px',
        borderTop: `3px solid ${color}`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 60,
          height: 60,
          background: `${color}08`,
          borderRadius: '0 10px 0 60px',
        }}
      />
      <div
        style={{
          fontSize: 10,
          color: C.MUTED,
          fontFamily: 'monospace',
          letterSpacing: 2,
          marginBottom: 8,
        }}
      >
        {label.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color,
          fontFamily: 'monospace',
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 11, color: C.MUTED, marginBottom: 6 }}>
          {sub}
        </div>
      )}
      {delta && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            style={{
              fontSize: 12,
              color: deltaUp ? C.GREEN : C.RED,
              fontWeight: 600,
            }}
          >
            {deltaUp ? '↑' : '↓'} {delta}
          </span>
        </div>
      )}
      {trend && (
        <div style={{ position: 'absolute', bottom: 12, right: 12 }}>
          <Spark data={trend} color={color} h={24} w={60} />
        </div>
      )}
    </div>
  );
}

// ── Section header ────────────────────────────────────────────
function SectionHeader({ icon, title, subtitle, color = C.BLUE }) {
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

// ── Hosting badge ─────────────────────────────────────────────
function HostBadge({ hosting }) {
  const isAWS = hosting?.includes('AWS');
  const isAzure = hosting?.includes('Azure');
  const isOnPrem =
    hosting &&
    !['Azure', 'AWS', 'SaaS', 'Cloud'].some((k) => hosting.includes(k));
  const color = isAWS
    ? '#FF9900'
    : isAzure
    ? '#0078D4'
    : isOnPrem
    ? '#1B4332'
    : '#64748B';
  const bg = isAWS
    ? 'rgba(255,153,0,0.08)'
    : isAzure
    ? 'rgba(0,120,212,0.08)'
    : isOnPrem
    ? 'rgba(27,67,50,0.08)'
    : 'rgba(100,116,139,0.08)';
  const bdr = isAWS
    ? 'rgba(255,153,0,0.25)'
    : isAzure
    ? 'rgba(0,120,212,0.25)'
    : isOnPrem
    ? 'rgba(27,67,50,0.25)'
    : 'rgba(100,116,139,0.25)';
  const icon = isAWS
    ? '☁ AWS'
    : isAzure
    ? '☁ Azure'
    : isOnPrem
    ? `🏢 ${CUSTOMER?.onPremDC?.split('·')[0]?.trim() || 'On-Prem DC'}`
    : '☁ Cloud';
  return (
    <span
      style={{
        fontSize: 9,
        fontFamily: 'monospace',
        fontWeight: 600,
        padding: '2px 7px',
        borderRadius: 4,
        color,
        background: bg,
        border: `1px solid ${bdr}`,
      }}
    >
      {icon}
    </span>
  );
}

// ── Monthly report visual ─────────────────────────────────────
function MonthlyReport({ incidents, chains, industry, liveMetrics }) {
  const safeInc = incidents || [];
  const total = safeInc.length;
  const p1 = safeInc.filter((i) => i.pri === 'P1').length;
  const p2 = safeInc.filter((i) => i.pri === 'P2').length;
  const p3 = safeInc.filter((i) => i.pri === 'P3').length;
  const auto = safeInc.filter((i) => i.status === 'Auto-Resolved').length;
  const hitl = safeInc.filter((i) => i.status === 'Resolved').length;
  const open = safeInc.filter(
    (i) => i.status === 'Open' || i.status === 'In Progress'
  ).length;
  // Use METRICS.roi when available, otherwise derive from incidents
  const _roi = METRICS?.roi || {};
  const _kpis = METRICS?.kpis || {};
  const autoRate =
    _roi.autoResolved && _roi.incidentsHandled
      ? Math.round((_roi.autoResolved / _roi.incidentsHandled) * 100)
      : Math.round((auto / total) * 100);
  const hrsSaved = _roi.hrsSaved || Math.round((total * 44) / 60);
  const costAvoid =
    _roi.costAvoidance ||
    Math.round(hrsSaved * (_kpis.engineer_hourly_rate_usd || 150));
  const noiseVal =
    _roi.noiseSuppressValue || Math.round(((1257 * 22 * 5) / 60) * 150);
  const totalVal = costAvoid + noiseVal;
  const llmCost = _roi.llmCost || _kpis.llm_cost_per_month_usd || 44;
  const netROI = _roi.netROI || totalVal - llmCost;
  const roiMult = _roi.roiMultiplier || Math.round(totalVal / llmCost);

  const azureInc = safeInc.filter((i) => i.hosting?.includes('Azure')).length;
  const partnerInc = safeInc.filter((i) =>
    i.hosting?.includes('Partner')
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Report header */}
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
                fontSize: 11,
                opacity: 0.7,
                fontFamily: 'monospace',
                letterSpacing: 2,
                marginBottom: 6,
              }}
            >
              MONTHLY VALUE REPORT
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
              {CUSTOMER?.name || industry?.name || 'Enterprise IT'}
            </div>
            <div
              style={{ fontSize: 13, opacity: 0.8 }}
            >{`Period: ${new Date().toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}  ·  Generated by ZeroOps Autonomous Reporting Engine`}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace' }}
            >
              {autoRate}%
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              Auto-resolution rate
            </div>
          </div>
        </div>
      </div>

      {/* Top KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: 12,
        }}
      >
        <MetricCard
          label="MTTR — AI Assisted"
          value={liveMetrics?.avg_mttr_display || `${_kpis.mttr_current_min || 28} min`}
          delta={`${Math.round(
            (1 -
              (_kpis.mttr_current_min || 28) /
                (_kpis.mttr_baseline_min || 1440)) *
              100
          )}% faster than baseline`}
          deltaUp={true}
          color={C.GREEN}
          sub={`vs ${
            _kpis.mttr_baseline_min
              ? Math.round(_kpis.mttr_baseline_min / 60) + 'h'
              : '186 min'
          } manual`}
          trend={[142, 115, 95, 72, 58, 41, 35, 28]}
        />
        <MetricCard
          label="Auto-Fix Rate"
          value={`${liveMetrics?.auto_rate ?? autoRate}%`}
          delta={`↑ from ${_kpis.auto_fix_baseline_pct || 0}% at go-live`}
          deltaUp={true}
          color={C.BLUE}
          sub={`${auto} of ${total} incidents`}
          trend={[31, 38, 44, 51, 61, 68, 72, autoRate]}
        />
        <MetricCard
          label="Alert Noise Reduction"
          value={`${_kpis.alert_noise_red_pct || 78}%`}
          delta={`${_kpis.alert_volume_per_day || 320} alerts → ${
            _kpis.actionable_alerts_per_day || 71
          }/day`}
          deltaUp={true}
          color="#7C3AED"
          sub={`${
            (_kpis.alert_volume_per_day || 320) -
            (_kpis.actionable_alerts_per_day || 71)
          } alerts suppressed daily`}
          trend={[61, 69, 75, 81, 88, 93, 95, 96.8]}
        />
        <MetricCard
          label="CSAT — Per Ticket"
          value={`${_kpis.csat_current || 4.1}/5`}
          delta={`+${(
            (_kpis.csat_current || 4.1) - (_kpis.csat_baseline || 2.4)
          ).toFixed(1)} pts since go-live`}
          deltaUp={true}
          color="#EA580C"
          sub={`↑ from ${_kpis.csat_baseline || 2.4} · post-resolution survey`}
          trend={[2.4, 2.8, 3.2, 3.6, 3.9, 4.1, 4.1, 4.1]}
        />
        <MetricCard
          label="NPS — Overall"
          value={`${(_kpis.nps_current || 28) >= 0 ? '+' : ''}${
            _kpis.nps_current || 28
          }`}
          delta={`↑ ${
            (_kpis.nps_current || 28) - (_kpis.nps_baseline || -50)
          } pts from ${_kpis.nps_baseline || -50}`}
          deltaUp={true}
          color="#7C3AED"
          sub={`target +${_kpis.nps_target || 50} · lags CSAT ~1 quarter`}
          trend={[-50, -50, -35, -20, -5, 28, 28, 28]}
        />
      </div>

      {/* Incident breakdown + Hosting split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Incident breakdown */}
        <div
          style={{
            background: '#fff',
            border: `1px solid ${C.BORDER}`,
            borderRadius: 10,
            padding: '18px 20px',
          }}
        >
          <SectionHeader
            icon="📋"
            title="Incident Breakdown"
            subtitle={`${new Date().toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })} · all priorities`}
            color={C.BLUE}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 16,
            }}
          >
            {[
              ['P1 Critical', p1, '#DC2626'],
              ['P2 High', p2, '#D97706'],
              ['P3 Medium', p3, '#2563EB'],
              ['Total', total, '#0F172A'],
            ].map(([l, v, col]) => (
              <div
                key={l}
                style={{
                  background: `${col}08`,
                  border: `1px solid ${col}20`,
                  borderRadius: 8,
                  padding: '10px 14px',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: col,
                    fontFamily: 'monospace',
                    letterSpacing: 1,
                  }}
                >
                  {l}
                </div>
                <div
                  style={{
                    fontSize: 24,
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
          <div
            style={{
              fontSize: 11,
              color: C.MUTED,
              fontFamily: 'monospace',
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            RESOLUTION MODE
          </div>
          {[
            ['Sentinel — Silent Auto', auto, autoRate, C.GREEN],
            [
              'Guardian — Human-in-Loop',
              hitl,
              Math.round((hitl / total) * 100),
              C.BLUE,
            ],
            [
              'Advisor — AI-Assisted Human',
              open,
              Math.round((open / total) * 100),
              C.AMBER,
            ],
          ].map(([label, count, pct, color]) => (
            <div key={label} style={{ marginBottom: 10 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 4,
                }}
              >
                <span style={{ fontSize: 12, color: '#1E293B' }}>{label}</span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color,
                  }}
                >
                  {count} ({pct}%)
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'rgba(0,0,0,0.06)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${pct}%`,
                    background: color,
                    borderRadius: 3,
                    transition: 'width 1s',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Hosting split */}
        <div
          style={{
            background: '#fff',
            border: `1px solid ${C.BORDER}`,
            borderRadius: 10,
            padding: '18px 20px',
          }}
        >
          <SectionHeader
            icon="🌐"
            title="Hybrid Environment Split"
            subtitle="Cloud · On-Prem · Hybrid"
            color="#0078D4"
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#0078D4',
                  fontFamily: 'monospace',
                }}
              >
                {azureInc}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#0078D4',
                  fontFamily: 'monospace',
                }}
              >
                ☁ Azure
              </div>
              <div style={{ fontSize: 10, color: C.MUTED }}>SAP landscape</div>
            </div>
            <div style={{ width: 1, height: 60, background: C.BORDER }} />
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: '#64748B',
                  fontFamily: 'monospace',
                }}
              >
                {partnerInc}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#64748B',
                  fontFamily: 'monospace',
                }}
              >{`🏢 ${
                CUSTOMER?.onPremDC?.split('·')[0]?.trim() || 'On-Prem DC'
              }`}</div>
              <div style={{ fontSize: 10, color: C.MUTED }}>
                Enterprise apps
              </div>
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              color: C.MUTED,
              fontFamily: 'monospace',
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            TOP INCIDENT CATEGORIES
          </div>
          {[
            ['SAP Work Process Saturation', 4, 75, '#0078D4'],
            ['MQ / Integration Failures', 3, 100, '#64748B'],
            ['Security / Identity Events', 2, 50, '#DC2626'],
            ['Config Drift', 2, 100, '#7C3AED'],
            ['Capacity / Storage', 2, 100, C.GREEN],
          ].map(([cat, count, autoR, color]) => (
            <div
              key={cat}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 8,
                padding: '6px 10px',
                background: 'rgba(0,0,0,0.02)',
                borderRadius: 6,
                border: `1px solid ${C.BORDER}`,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 32,
                  borderRadius: 2,
                  background: color,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1 }}>
                <div
                  style={{ fontSize: 11, fontWeight: 500, color: '#1E293B' }}
                >
                  {cat}
                </div>
                <div style={{ fontSize: 10, color: C.MUTED }}>
                  {count} incidents · {autoR}% auto-resolved
                </div>
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color,
                  fontFamily: 'monospace',
                }}
              >
                {autoR}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSAT + Agent Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* CSAT */}
        <div
          style={{
            background: '#fff',
            border: `1px solid ${C.BORDER}`,
            borderRadius: 10,
            padding: '18px 20px',
          }}
        >
          <SectionHeader
            icon="⭐"
            title="Customer Satisfaction"
            subtitle="6-month trend"
            color="#EA580C"
          />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 800,
                  color: '#EA580C',
                  fontFamily: 'monospace',
                  lineHeight: 1,
                }}
              >
                {CUSTOMER?.kpis?.find?.((k) => k.label?.includes('NPS'))
                  ? '+28'
                  : '4.6'}
              </div>
              <div style={{ fontSize: 11, color: C.MUTED }}>
                {METRICS?.kpis?.satisfaction_measure === 'NPS'
                  ? 'NPS score (target: +50)'
                  : 'out of 5.0'}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <Spark
                data={[3.2, 3.5, 3.7, 4.0, 4.3, 4.6]}
                color="#EA580C"
                h={40}
                w={160}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 9,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  marginTop: 2,
                }}
              >
                <span>Oct'25</span>
                <span>Mar'26</span>
              </div>
            </div>
          </div>
          {[
            ['P1 Critical', 4.2, 23],
            ['P2 High', 4.5, 41],
            ['P3 Medium', 4.7, 87],
          ].map(([label, score, responses]) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 11, color: C.MUTED, width: 80 }}>
                {label}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: 'rgba(0,0,0,0.06)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(score / 5) * 100}%`,
                    background: '#EA580C',
                    borderRadius: 3,
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#EA580C',
                  fontFamily: 'monospace',
                  width: 28,
                }}
              >
                {score}
              </span>
              <span style={{ fontSize: 10, color: C.MUTED, width: 60 }}>
                {responses} resp.
              </span>
            </div>
          ))}
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              background: 'rgba(234,88,12,0.06)',
              border: '1px solid rgba(234,88,12,0.15)',
              borderRadius: 7,
              fontSize: 11,
              color: '#92400E',
              fontStyle: 'italic',
            }}
          >
            Top feedback theme: "Issues fixed before we noticed them" — 31% of
            responses
          </div>
        </div>

        {/* Agent Performance */}
        <div
          style={{
            background: '#fff',
            border: `1px solid ${C.BORDER}`,
            borderRadius: 10,
            padding: '18px 20px',
          }}
        >
          <SectionHeader
            icon="🤖"
            title="Agent Performance"
            subtitle={`${new Date().toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })} · all agents`}
            color={C.BLUE}
          />
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 11,
              }}
            >
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.BORDER}` }}>
                  {[
                    'Agent',
                    'Runs',
                    'Success',
                    'Tokens',
                    'Cost/OK',
                    'Human%',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '6px 8px',
                        textAlign: 'left',
                        fontSize: 9,
                        color: C.MUTED,
                        fontFamily: 'monospace',
                        letterSpacing: 1.5,
                        fontWeight: 500,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(AGENT_DEFS || []).map((agent, i) => {
                  const okNum = parseInt(agent.success) || agent.ok || 0;
                  const col = okNum >= 97 ? C.GREEN : okNum >= 90 ? C.AMBER : C.RED;
                  const humNum = parseInt(agent.human) || 0;
                  const humCol = humNum === 0 ? C.GREEN : humNum >= 20 ? C.AMBER : C.BLUE;
                  return (
                    <tr
                      key={agent.id}
                      style={{
                        borderBottom: `1px solid ${C.BORDER}`,
                        background: i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                      }}
                    >
                      <td style={{ padding: '7px 8px', fontWeight: 600, color: '#1E293B' }}>
                        {agent.icon} {agent.name}
                      </td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: C.MUTED }}>
                        {(agent.runs || 0).toLocaleString()}
                      </td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: col, fontWeight: 700 }}>
                        {agent.success}
                      </td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: C.MUTED }}>
                        {agent.tokensMonth || agent.tokens}
                      </td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: C.GREEN }}>
                        {agent.costOK}
                      </td>
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', color: humCol, fontWeight: 700 }}>
                        {agent.human}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ROI */}
      <div
        style={{
          background:
            'linear-gradient(135deg,rgba(22,163,74,0.06),rgba(37,99,235,0.06))',
          border: '1px solid rgba(22,163,74,0.2)',
          borderRadius: 10,
          padding: '20px 24px',
        }}
      >
        <SectionHeader
          icon="💰"
          title="ROI Calculation — Current Period"
          subtitle="Net value delivered vs LLM operating cost"
          color={C.GREEN}
        />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: 14,
          }}
        >
          {[
            [
              `Engineer Hours Saved`,
              `${hrsSaved}h`,
              C.GREEN,
              `at $${_kpis.engineer_hourly_rate_usd || 150}/hr fully-loaded`,
            ],
            [
              'Labour Cost Avoidance',
              `$${costAvoid.toLocaleString()}`,
              C.GREEN,
              'incident resolution time',
            ],
            [
              `Noise Suppression Value`,
              `$${noiseVal.toLocaleString()}`,
              C.BLUE,
              `${_kpis.alert_volume_per_day || 320} alerts/day suppressed`,
            ],
            [
              `LLM Operating Cost`,
              `$${llmCost}`,
              '#DC2626',
              'total AI token spend this period',
            ],
          ].map(([label, val, color, sub]) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.7)',
                borderRadius: 8,
                padding: '14px 16px',
                border: `1px solid ${color}25`,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  marginBottom: 6,
                }}
              >
                {label.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color,
                  fontFamily: 'monospace',
                }}
              >
                {val}
              </div>
              <div style={{ fontSize: 10, color: C.MUTED, marginTop: 4 }}>
                {sub}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 16,
            padding: '14px 18px',
            background: 'rgba(255,255,255,0.8)',
            borderRadius: 8,
            border: `2px solid ${C.GREEN}30`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
              }}
            >
              NET ROI — MARCH 2026
            </div>
            <div style={{ fontSize: 11, color: C.MUTED, marginTop: 2 }}>
              Excludes platform licence, infrastructure and implementation costs
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: C.GREEN,
                fontFamily: 'monospace',
              }}
            >
              ${netROI.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, color: C.GREEN }}>
              {roiMult}× return on LLM spend
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
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
          title="Recommendations for April 2026"
          subtitle="Prioritised by impact"
          color={C.AMBER}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            [
              'URGENT',
              'Resize SAP AP1/AP7 work process allocation for month-end peak',
              'Recurring resource saturation · cloud VM scale-up recommended · ZeroOps case raised',
              '#DC2626',
              'Azure',
            ],
            [
              'HIGH',
              'Apply MQ auto-reconnect config across all SAP MQ channels',
              'Prevents integration queue backup on network blip · pattern from recent incidents',
              '#D97706',
              'On-Prem DC',
            ],
            [
              'MEDIUM',
              'Enable SAP MDM sync queue alert at 200 records threshold',
              'Current alert at 1,000 · earlier warning gives 2h lead time before data quality impact',
              '#2563EB',
              'Azure',
            ],
            [
              'ONGOING',
              'IGA Tool access review campaign — 14 days overdue',
              'Schedule quarterly review cycle · maintain compliance posture · access certification',
              '#64748B',
              'Azure',
            ],
          ].map(([pri, title, detail, col, host]) => (
            <div
              key={title}
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
                  {pri}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}
                  >
                    {title}
                  </span>
                  <HostBadge hosting={host} />
                </div>
                <div style={{ fontSize: 11, color: C.MUTED, lineHeight: 1.5 }}>
                  {detail}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Chart.js loader (lazy, singleton) ────────────────────────
function ensureChartJs(cb) {
  if (window.Chart) {
    cb();
    return;
  }
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js';
  s.onload = cb;
  document.head.appendChild(s);
}


// ── Main ReportsPage ──────────────────────────────────────────
export default function ReportsPage({ chains, incidents, industry }) {
  const [reportType, setReportType] = useState('monthly');
  const [selInc, setSelInc] = useState(null);
  const [generated, setGenerated] = useState(false);
  const { data: liveMetrics } = useLiveData('/metrics', null);

  const resolvedInc = (incidents || []).filter(
    (i) => i.status === 'Resolved' || i.status === 'Auto-Resolved'
  );
  const activeInc = (incidents || []).filter(
    (i) => i.status !== 'Resolved' && i.status !== 'Auto-Resolved'
  );

  const generate = (inc) => {
    setSelInc(inc);
    setGenerated(true);
  };

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
        <Lbl n="6">Reports</Lbl>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            ['monthly', '📊 Monthly Value Report'],
          ].map(([t, l]) => (
            <div
              key={t}
              data-demo={`report-tab-${t}`}
              onClick={() => {
                setReportType(t);
                setGenerated(false);
                setSelInc(null);
              }}
              style={{
                padding: '7px 16px',
                borderRadius: 7,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: reportType === t ? 600 : 400,
                background:
                  reportType === t ? 'rgba(37,99,235,0.1)' : 'rgba(0,0,0,0.03)',
                color: reportType === t ? '#1D4ED8' : C.MUTED,
                border: `1px solid ${
                  reportType === t ? 'rgba(37,99,235,0.3)' : C.BORDER
                }`,
              }}
            >
              {l}
            </div>
          ))}
        </div>
      </div>

      {reportType === 'monthly' &&
        (generated ? (
          <MonthlyReport
            incidents={incidents || []}
            chains={chains || []}
            industry={industry}
            liveMetrics={liveMetrics}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 400,
              background: '#fff',
              borderRadius: 12,
              border: `1px solid ${C.BORDER}`,
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: 8,
              }}
            >
              Monthly Value Report — March 2026
            </div>
            <div
              style={{
                fontSize: 13,
                color: C.MUTED,
                marginBottom: 24,
                textAlign: 'center',
                maxWidth: 400,
              }}
            >
              Covers all incidents · MTTR trends · Pillar breakdown · CSAT ·
              Agent performance · ROI calculation · Recommendations
            </div>
            <button
              data-demo="generate-report"
              onClick={() => generate(null)}
              style={{
                background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '12px 28px',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
              }}
            >
              Generate Report
            </button>
          </div>
        ))}

      

    </div>
  );
}
