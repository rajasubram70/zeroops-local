import {
  CUSTOMER,
  METRICS,
  INCIDENTS_DATA,
  REQUEST_STATS,
  DAILY_STATS,
} from '../data/customer/loader.js';
import { useState, useRef, useEffect } from 'react';
import { C, sc, pc } from '../config/theme.js';
import { Lbl, Bar } from '../components/atoms.jsx';
// ── Business Value tab — metric history & chart ──────────────
// METRIC_HISTORY_BV — from customer metrics.json, fallback to  defaults
const METRIC_HISTORY_BV =
  METRICS?.history && METRICS.history.length > 0
    ? METRICS.history.map((h) => ({
        month: h.month,
        mttr: h.mttr,
        autoFix: h.autoFix,
        deflection: h.deflection,
        fcr: h.deflection, // use deflection as proxy for FCR
        noiseRed: h.noise || h.noiseRed || 78,
        csat: h.csat,
      }))
    : [
        {
          month: "Oct'25",
          mttr: 186,
          autoFix: 28,
          deflection: 31,
          fcr: 38,
          noiseRed: 42,
          csat: 3.1,
        },
        {
          month: "Nov'25",
          mttr: 162,
          autoFix: 34,
          deflection: 37,
          fcr: 44,
          noiseRed: 51,
          csat: 3.2,
        },
        {
          month: "Dec'25",
          mttr: 141,
          autoFix: 41,
          deflection: 44,
          fcr: 51,
          noiseRed: 62,
          csat: 3.4,
        },
        {
          month: "Jan'26",
          mttr: 118,
          autoFix: 48,
          deflection: 52,
          fcr: 58,
          noiseRed: 71,
          csat: 3.6,
        },
        {
          month: "Feb'26",
          mttr: 94,
          autoFix: 55,
          deflection: 61,
          fcr: 65,
          noiseRed: 81,
          csat: 3.8,
        },
        {
          month: "Mar'26",
          mttr: 74,
          autoFix: 62,
          deflection: 69,
          fcr: 72,
          noiseRed: 88,
          csat: 4.0,
        },
        {
          month: "Apr'26",
          mttr: 58,
          autoFix: 67,
          deflection: 74,
          fcr: 77,
          noiseRed: 92,
          csat: 4.1,
        },
        {
          month: "May'26",
          mttr: 47,
          autoFix: 70,
          deflection: 77,
          fcr: 80,
          noiseRed: 95,
          csat: 4.2,
        },
        {
          month: "Jun'26",
          mttr: 38,
          autoFix: 72,
          deflection: 79,
          fcr: 82,
          noiseRed: 97,
          csat: 4.3,
        },
        {
          month: "Jul'26",
          mttr: 34,
          autoFix: 73,
          deflection: 80,
          fcr: 83,
          noiseRed: 98,
          csat: 4.4,
        },
        {
          month: "Aug'26",
          mttr: 31,
          autoFix: 73,
          deflection: 81,
          fcr: 84,
          noiseRed: 99,
          csat: 4.4,
        },
      ];
const RANGES_BV = [
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '12 Months', months: 11 },
];
// SNAPSHOT_ROWS — from metrics.json snapshot, fallback to  defaults
const SNAPSHOT_ROWS =
  METRICS?.snapshot && METRICS.snapshot.length > 0
    ? METRICS.snapshot
    : [
        {
          metric: 'Mean Time to Resolve (MTTR)',
          before: '186 min',
          after: '31 min',
          delta: '↓ 83%',
          good: true,
        },
        {
          metric: 'Incidents Resolved Autonomously',
          before: '0%',
          after: '73%',
          delta: '↑ +73pp',
          good: true,
        },
        {
          metric: 'Alert Noise Seen by Engineers',
          before: '47,000/day',
          after: '340/day',
          delta: '↓ 99.3%',
          good: true,
        },
        {
          metric: 'Engineer Time on Toil',
          before: '~60%',
          after: '~18%',
          delta: '↓ 42pp',
          good: true,
        },
        {
          metric: 'Mean Time to Detect (MTTD)',
          before: '18 min',
          after: '1.2 min',
          delta: '↓ 93%',
          good: true,
        },
        {
          metric: 'Customer Satisfaction (CSAT)',
          before: '3.1 / 5',
          after: '4.4 / 5',
          delta: '↑ +1.3',
          good: true,
        },
        {
          metric: 'Ticket Deflection Rate',
          before: '31%',
          after: '81%',
          delta: '↑ +50pp',
          good: true,
        },
      ];

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

// ── Donut chart ───────────────────────────────────────────────
function Donut({ segments, size = 80 }) {
  const r = 28,
    cx = size / 2,
    cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const total = segments.reduce((s, g) => s + g.value, 0);
  return (
    <svg width={size} height={size}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dash = pct * circ;
        const el = (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="10"
            strokeDasharray={`${dash} ${circ - dash}`}
            strokeDashoffset={
              (((-offset * circ) / total) * r * 2 * Math.PI) / circ
            }
            style={{
              transform: `rotate(-90deg)`,
              transformOrigin: `${cx}px ${cy}px`,
            }}
            strokeDashoffset={-(offset / total) * circ}
          />
        );
        offset += seg.value;
        return el;
      })}
      <circle cx={cx} cy={cy} r={20} fill="white" />
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
function MonthlyReport({ incidents, chains, industry }) {
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
          value={`${_kpis.mttr_current_min || 28} min`}
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
          value={`${autoRate}%`}
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
                {[
                  [
                    'Alert Correlator',
                    '4,291',
                    '99.1%',
                    '858K',
                    '$0.001',
                    '0%',
                    C.GREEN,
                  ],
                  [
                    'Log Analyzer',
                    '1,847',
                    '98.3%',
                    '924K',
                    '$0.008',
                    '0%',
                    C.GREEN,
                  ],
                  [
                    'RCA Engine',
                    '923',
                    '94.7%',
                    '1.85M',
                    '$0.019',
                    '8%',
                    C.AMBER,
                  ],
                  [
                    'Remediation Agent',
                    '612',
                    '91.2%',
                    '490K',
                    '$0.013',
                    '22%',
                    C.AMBER,
                  ],
                  [
                    'Change Validator',
                    '341',
                    '100%',
                    '102K',
                    '$0.000',
                    '18%',
                    C.AMBER,
                  ],
                  [
                    'Capacity Planner',
                    '89',
                    '96.6%',
                    '267K',
                    '$0.031',
                    '5%',
                    C.GREEN,
                  ],
                ].map(([name, runs, ok, tok, cost, hum, col], i) => (
                  <tr
                    key={name}
                    style={{
                      borderBottom: `1px solid ${C.BORDER}`,
                      background:
                        i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                    }}
                  >
                    <td
                      style={{
                        padding: '7px 8px',
                        fontWeight: 600,
                        color: '#1E293B',
                      }}
                    >
                      {name}
                    </td>
                    <td
                      style={{
                        padding: '7px 8px',
                        fontFamily: 'monospace',
                        color: C.MUTED,
                      }}
                    >
                      {runs}
                    </td>
                    <td
                      style={{
                        padding: '7px 8px',
                        fontFamily: 'monospace',
                        color: col,
                        fontWeight: 700,
                      }}
                    >
                      {ok}
                    </td>
                    <td
                      style={{
                        padding: '7px 8px',
                        fontFamily: 'monospace',
                        color: C.MUTED,
                      }}
                    >
                      {tok}
                    </td>
                    <td
                      style={{
                        padding: '7px 8px',
                        fontFamily: 'monospace',
                        color: C.GREEN,
                      }}
                    >
                      {cost}
                    </td>
                    <td
                      style={{
                        padding: '7px 8px',
                        fontFamily: 'monospace',
                        color:
                          hum === '0%'
                            ? C.GREEN
                            : hum >= '20%'
                            ? C.AMBER
                            : C.BLUE,
                        fontWeight: 700,
                      }}
                    >
                      {hum}
                    </td>
                  </tr>
                ))}
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

// ── RCA Report visual ─────────────────────────────────────────
function RCAReport({ incident, chains, industry }) {
  if (!incident) return null;
  const chain = (chains || []).find((c) => c.id === incident.chainId);
  const app = chain?.apps.find((a) => a.id === incident.appId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg,#DC2626,#9F1239)',
          borderRadius: 12,
          padding: '18px 22px',
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
                letterSpacing: 2,
                marginBottom: 5,
              }}
            >
              POST-INCIDENT RCA REPORT
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>
              {incident.id}
            </div>
            <div style={{ fontSize: 13, opacity: 0.85 }}>{incident.svc}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{ fontSize: 28, fontWeight: 800, fontFamily: 'monospace' }}
            >
              {incident.pri}
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>{incident.status}</div>
          </div>
        </div>
      </div>

      {/* Incident metadata */}
      <div
        style={{
          background: '#fff',
          border: `1px solid ${C.BORDER}`,
          borderRadius: 10,
          padding: '16px 20px',
        }}
      >
        <SectionHeader icon="📋" title="Incident Details" color="#DC2626" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
          }}
        >
          {[
            ['Service', incident.svc],
            ['Value Chain', chain?.name || '—'],
            ['Application', app?.name || '—'],
            ['CI Reference', incident.ci],
            ['SLA Status', incident.sla],
            ['Hosting', incident.hosting || '—'],
            ['Assigned To', incident.by],
            ['Detected At', incident.at],
            ['Category', incident.cat],
          ].map(([label, val]) => (
            <div
              key={label}
              style={{
                padding: '8px 12px',
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
                  letterSpacing: 1.5,
                  marginBottom: 3,
                }}
              >
                {label.toUpperCase()}
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#1E293B' }}>
                {label === 'Hosting' ? <HostBadge hosting={val} /> : val}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 12,
            padding: '10px 14px',
            background: 'rgba(220,38,38,0.04)',
            border: '1px solid rgba(220,38,38,0.15)',
            borderRadius: 7,
            fontSize: 12,
            color: '#475569',
            lineHeight: 1.7,
          }}
        >
          {incident.desc}
        </div>
      </div>

      {/* Root Cause */}
      <div
        style={{
          background: '#fff',
          border: `1px solid ${C.BORDER}`,
          borderRadius: 10,
          padding: '16px 20px',
        }}
      >
        <SectionHeader icon="🔍" title="Root Cause Analysis" color="#DC2626" />
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              CAUSAL CHAIN
            </div>
            {(incident.notes || '')
              .split('. ')
              .filter((s) => s.length > 5)
              .map((step, i, arr) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    marginBottom: i < arr.length - 1 ? 10 : 0,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background:
                          i === 0
                            ? 'rgba(220,38,38,0.15)'
                            : 'rgba(217,119,6,0.1)',
                        border: `2px solid ${i === 0 ? '#DC2626' : '#D97706'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: 700,
                        color: i === 0 ? '#DC2626' : '#D97706',
                        fontFamily: 'monospace',
                      }}
                    >
                      {i + 1}
                    </div>
                    {i < arr.length - 1 && (
                      <div
                        style={{
                          width: 1,
                          height: 14,
                          background: `${C.BORDER}`,
                          marginTop: 3,
                        }}
                      />
                    )}
                  </div>
                  <div
                    style={{
                      padding: '4px 0',
                      fontSize: 12,
                      color: '#475569',
                      lineHeight: 1.5,
                    }}
                  >
                    {step.trim()}
                  </div>
                </div>
              ))}
          </div>
          <div>
            <div
              style={{
                fontSize: 10,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              AUTOMATED REMEDIATION STEPS
            </div>
            {[
              {
                n: 1,
                act: 'Detect and correlate alerts',
                auto: true,
                tool: 'Alert Correlator',
              },
              {
                n: 2,
                act: 'Run RCA — identify root cause',
                auto: true,
                tool: 'RCA Engine',
              },
              {
                n: 3,
                act: 'Prepare remediation plan',
                auto: true,
                tool: 'Remediation Agent',
              },
              {
                n: 4,
                act: 'Execute fix via OneEngine',
                auto: true,
                tool: 'OneEngine',
              },
              { n: 5, act: 'Validate recovery', auto: true, tool: 'ZeroOps' },
              {
                n: 6,
                act: 'Close ticket in ServiceNow',
                auto: true,
                tool: 'ServiceNow',
              },
            ].map((step) => (
              <div
                key={step.n}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  marginBottom: 7,
                  padding: '6px 10px',
                  background: 'rgba(22,163,74,0.05)',
                  border: '1px solid rgba(22,163,74,0.15)',
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: C.GREEN,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    color: '#fff',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </div>
                <div style={{ flex: 1, fontSize: 11, color: '#1E293B' }}>
                  {step.act}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    color: C.MUTED,
                    fontFamily: 'monospace',
                    background: 'rgba(0,0,0,0.04)',
                    borderRadius: 3,
                    padding: '1px 6px',
                  }}
                >
                  {step.tool}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Outcome */}
      <div
        style={{
          background:
            'linear-gradient(135deg,rgba(22,163,74,0.06),rgba(37,99,235,0.04))',
          border: '1px solid rgba(22,163,74,0.2)',
          borderRadius: 10,
          padding: '16px 20px',
        }}
      >
        <SectionHeader icon="✅" title="Resolution Outcome" color={C.GREEN} />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5,1fr)',
            gap: 10,
          }}
        >
          {[
            ['MTTR (AI)', '28 min', C.GREEN],
            ['Manual Estimate', '~90 min', C.MUTED],
            ['Time Saved', '~62 min', C.GREEN],
            ['Automation Rate', '6/7 steps', C.BLUE],
          ].map(([label, val, col]) => (
            <div
              key={label}
              style={{
                background: 'rgba(255,255,255,0.8)',
                borderRadius: 8,
                padding: '12px 14px',
                border: `1px solid ${col}20`,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                {label.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 20,
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
      </div>
    </div>
  );
}

// ── Service Desk Intelligence ─────────────────────────────────
function ServiceDeskIntelligence() {
  // ── Sentiment data ──────────────────────────────────────────
  const SENTIMENT_TREND = [
    { month: "Oct'25", score: 58, frustrated: 14, neutral: 31, positive: 55 },
    { month: "Nov'25", score: 63, frustrated: 11, neutral: 28, positive: 61 },
    { month: "Dec'25", score: 61, frustrated: 12, neutral: 30, positive: 58 },
    { month: "Jan'26", score: 67, frustrated: 9, neutral: 26, positive: 65 },
    { month: "Feb'26", score: 71, frustrated: 7, neutral: 25, positive: 68 },
    { month: "Mar'26", score: 76, frustrated: 5, neutral: 22, positive: 73 },
  ];

  const LIVE_TICKETS = [
    {
      id: 'INC0008838',
      svc: 'Entra ID MFA',
      user: `user.a@${
        CUSTOMER?.name?.toLowerCase().replace(/\s+/g, '') || 'company'
      }.com`,
      sentiment: 28,
      label: 'Frustrated',
      flag: '⚠ Escalate',
      age: '2h 14m',
      words: ['slow', 'still', 'again', 'nobody'],
    },
    {
      id: 'REQ0098418',
      svc: 'CyberArk PAM',
      user: `user.j@${
        CUSTOMER?.name?.toLowerCase().replace(/\s+/g, '') || 'company'
      }.com`,
      sentiment: 42,
      label: 'Frustrated',
      flag: '⚠ Escalate',
      age: '1h 22m',
      words: ['urgent', 'waiting', 'critical'],
    },
    {
      id: 'INC0008835',
      svc: 'SailPoint IGA',
      user: `user.r@${
        CUSTOMER?.name?.toLowerCase().replace(/\s+/g, '') || 'company'
      }.com`,
      sentiment: 61,
      label: 'Neutral',
      flag: '',
      age: '45 min',
      words: ['please', 'when', 'update'],
    },
    {
      id: 'REQ0098421',
      svc: 'SAP S/4HANA Role',
      user: `user.p@${
        CUSTOMER?.name?.toLowerCase().replace(/\s+/g, '') || 'company'
      }.com`,
      sentiment: 72,
      label: 'Neutral',
      flag: '',
      age: '32 min',
      words: ['request', 'access', 'approve'],
    },
    {
      id: 'INC0008847',
      svc: 'GitLab CI Runner',
      user: `user.l@${
        CUSTOMER?.name?.toLowerCase().replace(/\s+/g, '') || 'company'
      }.com`,
      sentiment: 55,
      label: 'Neutral',
      flag: '',
      age: '28 min',
      words: ['broken', 'pipeline', 'blocked'],
    },
    {
      id: 'REQ0098416',
      svc: 'M365 Licence',
      user: `user.k@${
        CUSTOMER?.name?.toLowerCase().replace(/\s+/g, '') || 'company'
      }.com`,
      sentiment: 84,
      label: 'Positive',
      flag: '',
      age: '18 min',
      words: ['thanks', 'quick', 'great'],
    },
    {
      id: 'INC0008823',
      svc: 'Nexus Disk',
      user: `noc@${
        CUSTOMER?.name?.toLowerCase().replace(/\s+/g, '') || 'company'
      }.com`,
      sentiment: 89,
      label: 'Positive',
      flag: '',
      age: '8 min',
      words: ['resolved', 'working', 'thank'],
    },
  ];

  const AGENTS = [
    {
      name: 'Support Agent 1',
      fcr: 91,
      handling: 8.2,
      csat: 4.7,
      kb: 89,
      escalRate: 4,
      tickets: 312,
      trend: '↑',
    },
    {
      name: 'Support Agent 2',
      fcr: 87,
      handling: 9.1,
      csat: 4.5,
      kb: 82,
      escalRate: 7,
      tickets: 287,
      trend: '↑',
    },
    {
      name: 'Support Agent 3',
      fcr: 82,
      handling: 11.4,
      csat: 4.3,
      kb: 71,
      escalRate: 11,
      tickets: 241,
      trend: '→',
    },
    {
      name: 'Support Agent 4',
      fcr: 79,
      handling: 13.2,
      csat: 4.1,
      kb: 58,
      escalRate: 14,
      tickets: 198,
      trend: '↓',
      flag: 'coaching',
    },
    {
      name: 'ZeroOps AI',
      fcr: 96,
      handling: 4.2,
      csat: 4.8,
      kb: 100,
      escalRate: 0,
      tickets: 847,
      trend: '↑',
      ai: true,
    },
  ];

  const DEFLECTION = {
    portalAttempts: 67,
    portalSuccess: 44,
    chatbotContainment: 61,
    proactiveOutreach: 12,
    ticketsAvoided: 89,
    timeSaved: 412,
    gaps: [
      'SAP password reset via mobile — no KB article',
      'MQ consumer disconnect — article outdated (Nov 2025)',
      'Keycloak token refresh on VPN — no article',
      'SAP transport import pre-checks — article missing',
    ],
  };

  const PROACTIVE = [
    {
      time: '09:14',
      event: 'Keycloak degradation detected',
      users: 47,
      notified: 47,
      ticketsAvoided: 42,
      channel: 'Teams',
      resolution: 'IAM-RESTART in progress',
    },
    {
      time: '08:50',
      event: 'SAP AP7 CPU — payroll batch delay',
      users: 23,
      notified: 23,
      ticketsAvoided: 21,
      channel: 'Teams + Email',
      resolution: 'FI_PAYROLL deferred via SM37',
    },
    {
      time: '07:30',
      event: 'Nexus disk 91% — build failures',
      users: 31,
      notified: 31,
      ticketsAvoided: 28,
      channel: 'Teams',
      resolution: 'Auto-cleanup executed',
    },
    {
      time: 'Yesterday 18:22',
      event: 'CMDB drift — ServiceNow corrections',
      users: 8,
      notified: 8,
      ticketsAvoided: 8,
      channel: 'Email',
      resolution: 'All 47 CIs corrected',
    },
    {
      time: 'Yesterday 14:30',
      event: 'JIRA DB latency — issue load slow',
      users: 156,
      notified: 156,
      ticketsAvoided: 143,
      channel: 'Teams',
      resolution: 'WAL cleared automatically',
    },
  ];

  const sentimentColor = (s) =>
    s >= 70 ? C.GREEN : s >= 50 ? C.AMBER : '#DC2626';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg,#7C3AED,#1d4ed8)',
          borderRadius: 12,
          padding: '18px 22px',
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
                letterSpacing: 2,
                marginBottom: 5,
              }}
            >
              SERVICE DESK INTELLIGENCE
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{`${
              CUSTOMER?.name || industry?.name || 'Enterprise IT'
            } — ${new Date().toLocaleString('default', {
              month: 'long',
              year: 'numeric',
            })}`}</div>
            <div style={{ fontSize: 12, opacity: 0.8 }}>
              Sentiment · Agent Effectiveness · Self-Help · Proactive Outreach ·
              Knowledge Gaps
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{ fontSize: 32, fontWeight: 800, fontFamily: 'monospace' }}
            >
              76
            </div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              Sentiment score / 100
            </div>
          </div>
        </div>
      </div>

      {/* Top KPI strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: 10,
        }}
      >
        {[
          {
            l: 'Sentiment Score',
            v: '76/100',
            sub: '↑ +18 pts since AIOps go-live',
            c: '#7C3AED',
          },
          {
            l: 'Avg Handling Time',
            v: '8.4 min',
            sub: '↓ from 18.2 min pre-AIOps',
            c: C.GREEN,
          },
          {
            l: 'First Contact Res.',
            v: '87%',
            sub: '↑ from 61% — AI triage context',
            c: C.BLUE,
          },
          {
            l: 'Self-Help Success',
            v: '44%',
            sub: 'of users who tried portal',
            c: C.AMBER,
          },
          {
            l: 'Tickets Deflected',
            v: '89 / day',
            sub: 'via proactive ZeroOps outreach',
            c: C.GREEN,
          },
        ].map((k) => (
          <div
            key={k.l}
            style={{
              background: '#fff',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 9,
              padding: '12px 14px',
              borderTop: `3px solid ${k.c}`,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 1.5,
                marginBottom: 6,
              }}
            >
              {k.l.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: k.c,
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {k.v}
            </div>
            <div style={{ fontSize: 10, color: C.MUTED, marginTop: 4 }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Sentiment + Live tickets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Sentiment trend */}
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
              fontSize: 14,
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: 4,
            }}
          >
            Sentiment Trend
          </div>
          <div style={{ fontSize: 11, color: C.MUTED, marginBottom: 14 }}>
            6-month rolling — ticket text + chat transcripts analysed by ZeroOps
          </div>
          {SENTIMENT_TREND.map((m, i) => (
            <div
              key={m.month}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  color: C.MUTED,
                  width: 46,
                  fontFamily: 'monospace',
                  flexShrink: 0,
                }}
              >
                {m.month}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 16,
                  background: 'rgba(0,0,0,0.04)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: `${m.frustrated}%`,
                    background: '#DC2626',
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    width: `${m.neutral}%`,
                    background: C.AMBER,
                    opacity: 0.6,
                  }}
                />
                <div
                  style={{
                    width: `${m.positive}%`,
                    background: C.GREEN,
                    opacity: 0.7,
                  }}
                />
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: `${sentimentColor(m.score)}15`,
                    border: `2px solid ${sentimentColor(m.score)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 800,
                    color: sentimentColor(m.score),
                    fontFamily: 'monospace',
                  }}
                >
                  {m.score}
                </div>
              </div>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              gap: 14,
              marginTop: 12,
              fontSize: 10,
              color: C.MUTED,
            }}
          >
            {[
              ['#DC2626', 'Frustrated'],
              ['#D97706', 'Neutral'],
              ['#16A34A', 'Positive'],
            ].map(([c, l]) => (
              <div
                key={l}
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: c,
                    opacity: 0.7,
                  }}
                />
                <span>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live ticket sentiment */}
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
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                Live Ticket Sentiment
              </div>
              <div style={{ fontSize: 11, color: C.MUTED }}>
                Real-time analysis · auto-escalation on frustration pattern
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: C.GREEN,
                  boxShadow: `0 0 6px ${C.GREEN}`,
                }}
              />
              <span
                style={{
                  fontSize: 10,
                  color: C.GREEN,
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                LIVE
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {LIVE_TICKETS.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: '8px 10px',
                  borderRadius: 7,
                  background:
                    t.sentiment < 45
                      ? 'rgba(220,38,38,0.04)'
                      : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${
                    t.sentiment < 45 ? 'rgba(220,38,38,0.2)' : C.BORDER
                  }`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 3,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: 10,
                        color: C.BLUE,
                      }}
                    >
                      {t.id}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 500,
                        color: '#1E293B',
                      }}
                    >
                      {t.svc}
                    </span>
                    {t.flag && (
                      <span
                        style={{
                          fontSize: 9,
                          color: '#DC2626',
                          background: 'rgba(220,38,38,0.08)',
                          border: '1px solid rgba(220,38,38,0.2)',
                          borderRadius: 4,
                          padding: '1px 6px',
                          fontWeight: 600,
                        }}
                      >
                        {t.flag}
                      </span>
                    )}
                    {t.ai && (
                      <span
                        style={{
                          fontSize: 9,
                          color: C.BLUE,
                          background: 'rgba(37,99,235,0.08)',
                          border: '1px solid rgba(37,99,235,0.2)',
                          borderRadius: 4,
                          padding: '1px 6px',
                        }}
                      >
                        🤖 AI
                      </span>
                    )}
                  </div>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 4,
                        background: 'rgba(0,0,0,0.07)',
                        borderRadius: 2,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${t.sentiment}%`,
                          background: sentimentColor(t.sentiment),
                          borderRadius: 2,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        color: sentimentColor(t.sentiment),
                        width: 22,
                      }}
                    >
                      {t.sentiment}
                    </span>
                  </div>
                </div>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span style={{ fontSize: 10, color: C.MUTED }}>{t.user}</span>
                  <span
                    style={{
                      fontSize: 9,
                      color: C.MUTED,
                      fontFamily: 'monospace',
                    }}
                  >
                    {t.age}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Effectiveness */}
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
            fontSize: 14,
            fontWeight: 700,
            color: '#0F172A',
            marginBottom: 4,
          }}
        >
          Agent Effectiveness
        </div>
        <div style={{ fontSize: 11, color: C.MUTED, marginBottom: 14 }}>
          FCR, handling time, CSAT and KB usage — ZeroOps AI included for
          comparison
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid ${C.BORDER}` }}>
                {[
                  'Agent',
                  'Tickets',
                  'FCR %',
                  'Avg Time',
                  'CSAT',
                  'KB Usage',
                  'Escalation %',
                  'Trend',
                  '',
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '7px 10px',
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
              {AGENTS.map((a, i) => (
                <tr
                  key={a.name}
                  style={{
                    borderBottom: `1px solid ${C.BORDER}`,
                    background: a.ai
                      ? 'rgba(37,99,235,0.03)'
                      : i % 2 === 0
                      ? 'transparent'
                      : 'rgba(0,0,0,0.01)',
                  }}
                >
                  <td style={{ padding: '9px 10px' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      {a.ai ? (
                        <span style={{ fontSize: 14 }}>🤖</span>
                      ) : (
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'rgba(37,99,235,0.1)',
                            border: '1px solid rgba(37,99,235,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 9,
                            fontWeight: 700,
                            color: C.BLUE,
                          }}
                        >
                          {a.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 600, color: '#1E293B' }}>
                          {a.name}
                        </div>
                        {a.ai && (
                          <div style={{ fontSize: 9, color: C.MUTED }}>
                            ZeroOps autonomous
                          </div>
                        )}
                        {a.flag === 'coaching' && (
                          <div
                            style={{
                              fontSize: 9,
                              color: C.AMBER,
                              fontWeight: 600,
                            }}
                          >
                            ⚑ Coaching recommended
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontFamily: 'monospace',
                      color: C.MUTED,
                    }}
                  >
                    {a.tickets}
                  </td>
                  <td style={{ padding: '9px 10px' }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 4,
                          background: 'rgba(0,0,0,0.07)',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${a.fcr}%`,
                            borderRadius: 2,
                            background:
                              a.fcr >= 90
                                ? C.GREEN
                                : a.fcr >= 80
                                ? C.BLUE
                                : C.AMBER,
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          fontSize: 12,
                          color:
                            a.fcr >= 90
                              ? C.GREEN
                              : a.fcr >= 80
                              ? C.BLUE
                              : C.AMBER,
                        }}
                      >
                        {a.fcr}%
                      </span>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontFamily: 'monospace',
                      color: C.MUTED,
                    }}
                  >
                    {a.handling}m
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      color:
                        a.csat >= 4.5
                          ? C.GREEN
                          : a.csat >= 4.2
                          ? C.BLUE
                          : C.AMBER,
                    }}
                  >
                    {a.csat}
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontFamily: 'monospace',
                      color:
                        a.kb >= 80 ? C.GREEN : a.kb >= 60 ? C.AMBER : '#DC2626',
                    }}
                  >
                    {a.kb}%
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontFamily: 'monospace',
                      color:
                        a.escalRate <= 5
                          ? C.GREEN
                          : a.escalRate <= 10
                          ? C.AMBER
                          : '#DC2626',
                    }}
                  >
                    {a.escalRate}%
                  </td>
                  <td
                    style={{
                      padding: '9px 10px',
                      fontSize: 14,
                      fontWeight: 700,
                      color:
                        a.trend === '↑'
                          ? C.GREEN
                          : a.trend === '↓'
                          ? '#DC2626'
                          : C.MUTED,
                    }}
                  >
                    {a.trend}
                  </td>
                  <td style={{ padding: '9px 10px' }}></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Self-Help + Proactive Outreach */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Self-help deflection */}
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
              fontSize: 14,
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: 4,
            }}
          >
            Self-Help & Deflection
          </div>
          <div style={{ fontSize: 11, color: C.MUTED, marginBottom: 14 }}>
            Portal, chatbot and proactive outreach — tickets that never reached
            the service desk
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 16,
            }}
          >
            {[
              {
                l: 'Portal Attempt Rate',
                v: `${DEFLECTION.portalAttempts}%`,
                c: C.BLUE,
                sub: 'of users tried self-service first',
              },
              {
                l: 'Portal Success Rate',
                v: `${DEFLECTION.portalSuccess}%`,
                c: C.GREEN,
                sub: 'resolved without agent contact',
              },
              {
                l: 'Chatbot Containment',
                v: `${DEFLECTION.chatbotContainment}%`,
                c: '#7C3AED',
                sub: 'no human handoff needed',
              },
              {
                l: 'Tickets Avoided',
                v: DEFLECTION.ticketsAvoided,
                c: C.GREEN,
                sub: `${DEFLECTION.timeSaved} min saved this month`,
              },
            ].map((k) => (
              <div
                key={k.l}
                style={{
                  background: `${k.c}08`,
                  border: `1px solid ${k.c}20`,
                  borderRadius: 8,
                  padding: '10px 12px',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: k.c,
                    fontFamily: 'monospace',
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  {k.l.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: k.c,
                    fontFamily: 'monospace',
                  }}
                >
                  {k.v}
                </div>
                <div style={{ fontSize: 10, color: C.MUTED, marginTop: 3 }}>
                  {k.sub}
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
            KB GAP ANALYSIS — TOP MISSING ARTICLES
          </div>
          {DEFLECTION.gaps.map((gap, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                marginBottom: 7,
                padding: '7px 10px',
                background: 'rgba(217,119,6,0.04)',
                border: '1px solid rgba(217,119,6,0.15)',
                borderRadius: 6,
              }}
            >
              <span style={{ color: C.AMBER, fontSize: 12, flexShrink: 0 }}>
                ⚑
              </span>
              <span style={{ fontSize: 11, color: '#1E293B' }}>{gap}</span>
            </div>
          ))}
          <div
            style={{
              marginTop: 10,
              padding: '8px 12px',
              background: 'rgba(37,99,235,0.05)',
              border: '1px solid rgba(37,99,235,0.15)',
              borderRadius: 6,
              fontSize: 11,
              color: C.BLUE,
            }}
          >
            💡 ZeroOps will auto-draft KB articles for these gaps — agent review
            required before publishing
          </div>
        </div>

        {/* Proactive Outreach */}
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
              fontSize: 14,
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: 4,
            }}
          >
            Proactive Outreach Log
          </div>
          <div style={{ fontSize: 11, color: C.MUTED, marginBottom: 14 }}>
            ZeroOps notified users before they raised tickets — incidents that
            never became calls
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PROACTIVE.map((p, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 12px',
                  borderRadius: 7,
                  background: 'rgba(22,163,74,0.04)',
                  border: '1px solid rgba(22,163,74,0.15)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 5,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#1E293B',
                        marginBottom: 2,
                      }}
                    >
                      {p.event}
                    </div>
                    <div style={{ fontSize: 10, color: C.MUTED }}>
                      {p.resolution}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: 'monospace',
                      color: C.MUTED,
                      flexShrink: 0,
                      marginLeft: 10,
                    }}
                  >
                    {p.time}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                  <span style={{ color: C.MUTED }}>
                    👥{' '}
                    <span style={{ color: '#1E293B', fontWeight: 600 }}>
                      {p.users}
                    </span>{' '}
                    users notified
                  </span>
                  <span style={{ color: C.MUTED }}>
                    🎫{' '}
                    <span style={{ color: C.GREEN, fontWeight: 600 }}>
                      {p.ticketsAvoided}
                    </span>{' '}
                    tickets avoided
                  </span>
                  <span style={{ color: C.MUTED }}>📣 {p.channel}</span>
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 12,
              padding: '10px 14px',
              background:
                'linear-gradient(135deg,rgba(22,163,74,0.06),rgba(37,99,235,0.04))',
              border: '1px solid rgba(22,163,74,0.2)',
              borderRadius: 7,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: C.GREEN }}>
                March total: 89 tickets avoided
              </div>
              <div style={{ fontSize: 10, color: C.MUTED }}>
                via proactive outreach · 412 min engineer time saved
              </div>
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: C.GREEN,
                fontFamily: 'monospace',
              }}
            >
              89
            </div>
          </div>
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

// ── Business Value Report ─────────────────────────────────────
function BusinessValue() {
  const [rangeIdx, setRangeIdx] = useState(1);
  const chartData = METRIC_HISTORY_BV.slice(-RANGES_BV[rangeIdx].months);

  // ── KPI headlines ─────────────────────────────────────────
  const first = chartData[0];
  const last = chartData[chartData.length - 1];
  const kpis = [
    {
      label: 'MTTR Reduction',
      value: '83%',
      sub: `${first.mttr} min → ${last.mttr} min`,
      color: '#DC2626',
      icon: '⏱',
    },
    {
      label: 'Auto-Fix Rate',
      value: '73%',
      sub: `+${last.autoFix - first.autoFix}pp since go-live`,
      color: '#2563EB',
      icon: '🤖',
    },
    {
      label: 'Alert Noise Removed',
      value: '99.3%',
      sub: '47,000 raw → 340 actionable/day',
      color: '#7C3AED',
      icon: '🔕',
    },
    {
      label: 'CSAT Improvement',
      value: '+1.3',
      sub: `${first.csat}/5 → ${last.csat}/5`,
      color: '#EA580C',
      icon: '⭐',
    },
  ];

  // ── Snapshot rows ─────────────────────────────────────────
  const snap = [
    {
      metric: 'Mean Time to Resolve',
      before: '186 min',
      after: '31 min',
      delta: '↓ 83%',
      good: true,
    },
    {
      metric: 'Incidents Auto-Resolved',
      before: '0%',
      after: '73%',
      delta: '↑ +73pp',
      good: true,
    },
    {
      metric: 'Alert Noise to Engineers',
      before: '47,000/day',
      after: '340/day',
      delta: '↓ 99.3%',
      good: true,
    },
    {
      metric: 'Engineer Time on Toil',
      before: '~60%',
      after: '~18%',
      delta: '↓ 42pp',
      good: true,
    },
    {
      metric: 'Mean Time to Detect',
      before: '18 min',
      after: '1.2 min',
      delta: '↓ 93%',
      good: true,
    },
    {
      metric: 'CSAT Score',
      before: '3.1 / 5',
      after: '4.4 / 5',
      delta: '↑ +1.3',
      good: true,
    },
    {
      metric: 'Ticket Deflection Rate',
      before: '31%',
      after: '81%',
      delta: '↑ +50pp',
      good: true,
    },
  ];

  // ── Chart ─────────────────────────────────────────────────
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const LINE_DEFS = [
    { key: 'autoFix', label: 'Auto-Fix Rate', color: '#2563EB' },
    { key: 'noiseRed', label: 'Noise Reduction', color: '#7C3AED' },
    { key: 'deflection', label: 'Ticket Deflection', color: '#0891B2' },
    { key: 'fcr', label: 'First Contact Res.', color: '#16A34A' },
  ];

  useEffect(() => {
    ensureChartJs(() => {
      if (!canvasRef.current) return;
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }

      const labels = chartData.map((d) => d.month);
      const N = chartData.length;
      const maxMttr =
        Math.ceil(Math.max(...chartData.map((d) => d.mttr)) / 20) * 20 || 200;
      const gridCol = 'rgba(0,0,0,0.05)';
      const textCol = '#94A3B8';
      const tickFont = { size: 11, family: 'monospace' };

      const barColors = chartData.map((_, i) => {
        const t = i / Math.max(N - 1, 1);
        const r = Math.round(220 - t * 190);
        const g = Math.round(60 + t * 103);
        const b = Math.round(60 + t * 14);
        return `rgba(${r},${g},${b},0.8)`;
      });

      const hexToRgba = (hex, alpha) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
      };
      const makeGradient = (ctx, color) => {
        const grad = ctx.createLinearGradient(0, 0, 0, 300);
        grad.addColorStop(0, hexToRgba(color, 0.1));
        grad.addColorStop(1, hexToRgba(color, 0.0));
        return grad;
      };

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      chartRef.current = new window.Chart(canvas, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            {
              type: 'bar',
              label: 'MTTR (min)',
              data: chartData.map((d) => d.mttr),
              backgroundColor: barColors,
              borderColor: 'transparent',
              borderRadius: 6,
              barPercentage: 0.5,
              yAxisID: 'yLeft',
              order: 1,
            },
            ...LINE_DEFS.map((s) => ({
              type: 'line',
              label: s.label,
              data: chartData.map((d) => d[s.key]),
              borderColor: s.color,
              backgroundColor: (() => {
                try {
                  return makeGradient(ctx, s.color);
                } catch (e) {
                  return 'transparent';
                }
              })(),
              pointBackgroundColor: s.color,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 7,
              borderWidth: 2.5,
              tension: 0.4,
              fill: true,
              yAxisID: 'yRight',
              order: 2,
            })),
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          animation: { duration: 800, easing: 'easeInOutQuart' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#fff',
              titleColor: '#0F172A',
              bodyColor: '#475569',
              borderColor: 'rgba(0,0,0,0.08)',
              borderWidth: 1,
              padding: 12,
              cornerRadius: 8,
              titleFont: { size: 13, weight: '600' },
              bodyFont: { size: 12 },
              callbacks: {
                title: (items) => items[0].label,
                label: (ctx) => {
                  const u = ctx.dataset.yAxisID === 'yLeft' ? ' min' : '%';
                  return `  ${ctx.dataset.label}: ${ctx.parsed.y}${u}`;
                },
              },
            },
          },
          scales: {
            x: {
              ticks: { color: textCol, font: tickFont, maxRotation: 0 },
              grid: { color: gridCol },
              border: { color: 'rgba(0,0,0,0.08)' },
            },
            yLeft: {
              position: 'left',
              title: {
                display: true,
                text: 'MTTR (minutes)',
                color: textCol,
                font: { size: 11 },
              },
              ticks: {
                color: textCol,
                font: tickFont,
                callback: (v) => v + 'm',
              },
              grid: { color: gridCol },
              border: { color: 'rgba(0,0,0,0.08)' },
              min: 0,
              max: maxMttr + 20,
            },
            yRight: {
              position: 'right',
              title: {
                display: true,
                text: 'Improvement (%)',
                color: textCol,
                font: { size: 11 },
              },
              ticks: {
                color: textCol,
                font: tickFont,
                callback: (v) => v + '%',
              },
              grid: { display: false },
              border: { color: 'rgba(0,0,0,0.08)' },
              min: 0,
              max: 110,
            },
          },
        },
      });
    });
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [chartData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* ── Header ── */}
      <div
        style={{
          background:
            'linear-gradient(135deg,#003F72 0%,#0369A1 60%,#0082F0 100%)',
          borderRadius: 12,
          padding: '22px 28px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                opacity: 0.6,
                fontFamily: 'monospace',
                letterSpacing: 3,
                marginBottom: 8,
                color: '#fff',
              }}
            >
              AIOPS BUSINESS VALUE — Enterprise IT Operations
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: '#fff',
                marginBottom: 4,
              }}
            >
              ZeroOps Impact Journey
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
              October 2025 → August 2026 &nbsp;·&nbsp; 11-month transformation
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 42,
                fontWeight: 900,
                fontFamily: 'monospace',
                color: '#fff',
                lineHeight: 1,
              }}
            >
              83%
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'rgba(255,255,255,0.6)',
                marginTop: 4,
              }}
            >
              MTTR reduction
            </div>
          </div>
        </div>

        {/* KPI strip inside header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5,1fr)',
            gap: 10,
          }}
        >
          {kpis.map((k) => (
            <div
              key={k.label}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 9,
                padding: '14px 16px',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>{k.icon}</span>
                <span
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.6)',
                    fontFamily: 'monospace',
                    letterSpacing: 1,
                  }}
                >
                  {k.label.toUpperCase()}
                </span>
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  color: '#fff',
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                {k.value}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
                {k.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Before / After comparison ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Before */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: '#F1F5F9',
              padding: '10px 18px',
              borderBottom: '1px solid #E2E8F0',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                letterSpacing: 2,
                color: '#64748B',
              }}
            >
              BEFORE &nbsp;·&nbsp; GO-LIVE BASELINE
            </div>
          </div>
          {snap.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '11px 18px',
                borderBottom:
                  i < snap.length - 1 ? '1px solid #F1F5F9' : 'none',
                background: i % 2 === 0 ? '#fff' : '#FAFBFC',
              }}
            >
              <span style={{ fontSize: 13, color: '#475569' }}>
                {row.metric}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontFamily: 'monospace',
                  color: '#94A3B8',
                  fontWeight: 500,
                }}
              >
                {row.before}
              </span>
            </div>
          ))}
        </div>

        {/* After + delta */}
        <div
          style={{
            background: '#fff',
            border: '1px solid #E2E8F0',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              background: 'rgba(22,163,74,0.07)',
              padding: '10px 18px',
              borderBottom: '1px solid rgba(22,163,74,0.15)',
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontFamily: 'monospace',
                letterSpacing: 2,
                color: '#15803D',
              }}
            >
              AFTER &nbsp;·&nbsp; CURRENT STATE
            </div>
          </div>
          {snap.map((row, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '11px 18px',
                borderBottom:
                  i < snap.length - 1 ? '1px solid #F0FDF4' : 'none',
                background: i % 2 === 0 ? '#fff' : '#F9FFF9',
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: '#15803D',
                }}
              >
                {row.after}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: row.good ? '#15803D' : '#DC2626',
                  background: row.good
                    ? 'rgba(22,163,74,0.09)'
                    : 'rgba(220,38,38,0.09)',
                  padding: '3px 10px',
                  borderRadius: 20,
                  border: row.good
                    ? '1px solid rgba(22,163,74,0.2)'
                    : '1px solid rgba(220,38,38,0.2)',
                }}
              >
                {row.delta}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trend chart ── */}
      <div
        style={{
          background: '#fff',
          border: '1px solid #E2E8F0',
          borderRadius: 10,
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 6,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: 3,
              }}
            >
              Transformation Trend
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>
              Bars = MTTR minutes (left, falling ✓) &nbsp;·&nbsp; Lines =
              improvement metrics % (right, rising ✓)
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 4,
              background: 'rgba(0,0,0,0.04)',
              borderRadius: 8,
              padding: 4,
            }}
          >
            {RANGES_BV.map((r, i) => (
              <div
                key={r.label}
                onClick={() => setRangeIdx(i)}
                style={{
                  padding: '5px 14px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                  background: rangeIdx === i ? '#fff' : 'transparent',
                  color: rangeIdx === i ? '#0F172A' : '#94A3B8',
                  boxShadow:
                    rangeIdx === i ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s',
                }}
              >
                {r.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', height: 300, marginTop: 16 }}>
          <canvas ref={canvasRef} />
        </div>

        {/* Legend */}
        <div
          style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '7px 14px',
              background: 'rgba(220,38,38,0.05)',
              borderRadius: 7,
              border: '1px solid rgba(220,38,38,0.12)',
            }}
          >
            <div
              style={{
                width: 16,
                height: 12,
                background:
                  'linear-gradient(180deg,rgba(220,60,60,0.85) 0%,rgba(22,163,74,0.85) 100%)',
                borderRadius: 3,
              }}
            />
            <div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#0F172A' }}>
                MTTR
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#DC2626',
                  fontFamily: 'monospace',
                }}
              >
                {first.mttr}m → {last.mttr}m &nbsp;↓{' '}
                {Math.round((1 - last.mttr / first.mttr) * 100)}%
              </div>
            </div>
          </div>
          {LINE_DEFS.map((s) => (
            <div
              key={s.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 14px',
                background: `${s.color}0d`,
                borderRadius: 7,
                border: `1px solid ${s.color}22`,
              }}
            >
              <svg width={28} height={14} style={{ flexShrink: 0 }}>
                <defs>
                  <linearGradient
                    id={`lg-${s.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={s.color} stopOpacity="0.18" />
                    <stop offset="100%" stopColor={s.color} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0 12 C7 12 7 4 14 4 C21 4 21 2 28 2"
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M0 12 C7 12 7 4 14 4 C21 4 21 2 28 2 L28 14 L0 14 Z"
                  fill={`url(#lg-${s.key})`}
                />
                <circle cx="28" cy="2" r="3" fill={s.color} />
              </svg>
              <div>
                <div
                  style={{ fontSize: 12, fontWeight: 500, color: '#0F172A' }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: s.color,
                    fontFamily: 'monospace',
                  }}
                >
                  {first[s.key]}% → {last[s.key]}% &nbsp;↑ +
                  {last[s.key] - first[s.key]}pp
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MIM Report Tab ────────────────────────────────────────────
// Per-incident report data keyed by incident ID
const MIM_REPORT_DATA = {
  INC0008847: {
    declaredAt: '03:12:04',
    resolvedAt: '03:23:16',
    mttr: '11m 04s',
    manualEstimate: '~90 min',
    saved: '~79 min (87%)',
    incidentManager: 'Support Agent 1',
    bridge: 'teams.microsoft.com/mim-0008847',
    smeCount: 4,
    autoSteps: 6,
    hitlSteps: 0,
    broadcastsSent: 2,
    causalChain: [
      'Nexus SNAPSHOT retention policy disabled 18 days ago during maintenance window',
      '1,847 stale artifacts accumulated — 521GB unreclaimed over 18 days',
      'Nexus /data partition reached 91% — I/O throughput degraded',
      'GitLab CI dependency fetch latency increased from 3s to 29s+ baseline',
      'Gradle build JVM retry storm exhausted -Xmx 2g heap across all 8 runners',
      'OOM kill cascade — 23 kills in 12 minutes · 847 pipeline jobs queued',
      '2,400 R&D engineers blocked at workday start',
    ],
    agentActions: [
      {
        agent: 'Alert Correlator',
        model: 'GPT-4o',
        duration: '3s',
        desc: 'Correlated 847 raw alerts to 1 incident. INC0008847 created in ServiceNow.',
      },
      {
        agent: 'RCA Engine',
        model: 'Claude Sonnet',
        duration: '79s',
        desc: 'Traversed CMDB topology. Vector DB match: INC0008811 (96% similarity). Causal chain confirmed.',
      },
      {
        agent: 'Remediation Agent',
        model: 'GPT-4o',
        duration: '8m 21s',
        desc: 'K8s HPA: 8→24 runners. ConfigMap: -Xmx 4g. NEXUS-CLEANUP: 521GB reclaimed.',
      },
      {
        agent: 'Capacity Planner',
        model: 'GPT-4o',
        duration: '40s',
        desc: 'Nexus retention policy re-enabled. 23-day headroom confirmed. Threshold adjusted to 70%.',
      },
    ],
    decisions: [
      {
        by: 'Senior Engineer',
        role: 'DevOps Lead',
        at: '03:13:58',
        action:
          'Approved remediation plan — runner scale + JVM resize + Nexus cleanup. Risk 14/100 accepted.',
      },
    ],
    lessonsLearned: [
      'Nexus SNAPSHOT retention policy must be treated as a safety-critical configuration — disabling requires a mandatory re-enable checklist step post-maintenance.',
      'GitLab runner JVM heap (-Xmx) should be sized to 4g as standard. 2g is insufficient for large monorepo builds.',
      'INC0008847 pattern now stored in ZeroOps vector DB — future occurrences will be pre-empted before user impact.',
    ],
    actionItems: [
      {
        item: 'Enforce Nexus SNAPSHOT retention policy — mandatory re-enable post every maintenance window',
        owner: 'Support Agent 2',
        due: 'Within 48 hours',
        pri: 'HIGH',
      },
      {
        item: 'Update GitLab runner ConfigMap default: -Xmx 4g across all environments',
        owner: 'Senior Engineer',
        due: 'Within 7 days',
        pri: 'HIGH',
      },
      {
        item: 'Add Nexus disk 70% alert threshold to Azure Monitor',
        owner: 'AIOps Engineer',
        due: 'Within 7 days',
        pri: 'MEDIUM',
      },
      {
        item: 'Schedule quarterly review of maintenance window checklists',
        owner: 'NOC Lead',
        due: 'Within 30 days',
        pri: 'LOW',
      },
    ],
  },
  INC0008841: {
    declaredAt: '02:00:02',
    resolvedAt: '02:31:03',
    mttr: '31 min',
    manualEstimate: '~3 hours',
    saved: '~2h 29min (83%)',
    incidentManager: 'Support Agent 1',
    bridge: 'teams.microsoft.com/mim-0008841',
    smeCount: 5,
    autoSteps: 5,
    hitlSteps: 2,
    broadcastsSent: 3,
    causalChain: [
      'SAP FI month-end batch jobs (FI_POST_CLOSE, GL_RECON, accruals) all scheduled concurrently',
      'All three batch jobs running in dialog WP class — competing with 340 active user sessions',
      '100 dialog WPs exhausted within 8 minutes of batch start',
      'Azure VM Standard_E32s_v5 CPU reached 87% — no remaining headroom',
      'SAP user sessions timing out — 340 finance users across 47 countries affected',
      'Period-end close (FI_POST_CLOSE) blocked — CFO office escalated directly',
    ],
    agentActions: [
      {
        agent: 'Alert Correlator',
        model: 'GPT-4o',
        duration: '2s',
        desc: 'SAP CCMS + Azure Monitor alerts correlated. P1 auto-declared. INC0008841 created.',
      },
      {
        agent: 'RCA Engine',
        model: 'Claude Sonnet',
        duration: '102s',
        desc: 'SM50 WP saturation confirmed. Batch job conflict in dialog class identified. Pattern match: INC0008712.',
      },
      {
        agent: 'Change Validator',
        model: 'GPT-4o',
        duration: '47s',
        desc: 'Batch deferral window validated — GL_RECON deferral within SOX compliance window. Risk 42/100. Guardian gate triggered.',
      },
      {
        agent: 'Remediation Agent',
        model: 'GPT-4o',
        duration: '6m 11s',
        desc: 'SM37: GL_RECON + accruals deferred. RZ10: 100→130 dialog WPs. FI_POST_CLOSE in dedicated class.',
      },
    ],
    decisions: [
      {
        by: 'Support Agent 4',
        role: 'SAP BASIS Admin',
        at: '02:07:33',
        action:
          'Approved batch deferral (GL_RECON, accruals) + WP allocation 100→130 via RZ10. CHG0048291 raised.',
      },
      {
        by: 'Support Agent 1',
        role: 'NOC Lead',
        at: '02:04:58',
        action:
          'Approved executive broadcast to CFO office. Status: root cause confirmed, fix imminent.',
      },
    ],
    lessonsLearned: [
      'Month-end batch scheduling must reserve dedicated WP class for FI_POST_CLOSE during period-end close window. This should be a permanent SAP SM37 configuration, not a reactive fix.',
      'Azure E32s_v5 is at capacity during peak month-end load. E48s_v5 upgrade CHG has been raised for next maintenance window.',
      'ZeroOps Capacity Planner threshold for SAP WP utilisation adjusted to 70% — next month-end will trigger predictive pre-emption before user impact.',
    ],
    actionItems: [
      {
        item: 'Configure dedicated batch WP class for FI_POST_CLOSE in SAP SM37 — permanent reservation',
        owner: 'Support Agent 4',
        due: 'Before next period-end',
        pri: 'HIGH',
      },
      {
        item: 'Execute Azure VM resize E32s_v5 → E48s_v5 during next maintenance window (CHG0048291)',
        owner: 'Klaus Weber',
        due: 'Next maintenance window',
        pri: 'HIGH',
      },
      {
        item: 'Set ZeroOps WP utilisation alert at 70% to enable predictive pre-emption',
        owner: 'AIOps Engineer',
        due: 'Within 48 hours',
        pri: 'HIGH',
      },
      {
        item: 'Review batch job schedule across all month-end processes — identify further conflicts',
        owner: 'Support Agent 4',
        due: 'Within 14 days',
        pri: 'MEDIUM',
      },
    ],
  },
  INC0008844: {
    declaredAt: '02:47:58',
    resolvedAt: '03:00:12',
    mttr: '12 min',
    manualEstimate: '~45 min',
    saved: '~33 min (73%)',
    incidentManager: 'Support Agent 2',
    bridge: 'teams.microsoft.com/mim-0008844',
    smeCount: 3,
    autoSteps: 6,
    hitlSteps: 1,
    broadcastsSent: 1,
    causalChain: [
      'SNAPSHOT retention policy disabled during maintenance window — not re-enabled',
      '1,847 SNAPSHOT artifacts accumulated over 18 days — 521GB unreclaimed',
      'Nexus /data partition reached 91.4% — I/O throughput degraded',
      'GitLab CI dependency fetch latency: 3s → 29s — Gradle/Maven builds timing out',
      'GitLab runner OOM cascade risk identified by ZeroOps — GitLab runner heap retry storm imminent',
      'INC0008844 declared proactively — GitLab not yet impacted at point of declaration',
    ],
    agentActions: [
      {
        agent: 'Alert Correlator',
        model: 'GPT-4o',
        duration: '5s',
        desc: 'Nexus + GitLab alert correlation. Pattern: NEXUS-DISK-RETENTION-FAILURE. Pre-emptive P1 declared.',
      },
      {
        agent: 'RCA Engine',
        model: 'Claude Sonnet',
        duration: '53s',
        desc: 'Retention policy status confirmed: disabled 18d ago. 1,847 uncleaned artifacts. NEXUS-CLEANUP recommended.',
      },
      {
        agent: 'Remediation Agent',
        model: 'GPT-4o',
        duration: '6m 8s',
        desc: 'NEXUS-CLEANUP: 521GB reclaimed across 3 artifact groups. Retention re-enabled. Capacity: 38%.',
      },
      {
        agent: 'Capacity Planner',
        model: 'GPT-4o',
        duration: '28s',
        desc: '23-day headroom confirmed. Retention policy verified active. Threshold alert set at 70%.',
      },
    ],
    decisions: [
      {
        by: 'Support Agent 2',
        role: 'Platform Engineer',
        at: '02:51:04',
        action:
          'Approved NEXUS-CLEANUP runbook. 521GB SNAPSHOT purge authorised. Retention policy to be enforced permanently.',
      },
    ],
    lessonsLearned: [
      'Nexus retention policy re-enable is now a mandatory post-maintenance checklist item — enforced via ServiceNow change management workflow.',
      'ZeroOps detected the identical pattern 12 minutes earlier than the previous incident (INC0008847), preventing the GitLab runner cascade entirely.',
      'Proactive incident declaration working as designed — engineers were unaware until after resolution.',
    ],
    actionItems: [
      {
        item: 'Add Nexus retention policy re-enable as mandatory step in ALL maintenance window CHG templates',
        owner: 'Support Agent 2',
        due: 'Within 48 hours',
        pri: 'HIGH',
      },
      {
        item: 'Configure ZeroOps alert at 70% Nexus disk to enable earlier pre-emption in future',
        owner: 'AIOps Engineer',
        due: 'Within 48 hours',
        pri: 'HIGH',
      },
      {
        item: 'Review all other artifact repositories for similar retention policy gaps',
        owner: 'Support Agent 2',
        due: 'Within 7 days',
        pri: 'MEDIUM',
      },
      {
        item: 'Update KB001 with confirmed root cause and mandatory checklist reference',
        owner: 'NOC Lead',
        due: 'Within 3 days',
        pri: 'MEDIUM',
      },
    ],
  },
};

function MIMReportTab({ incidents }) {
  const p1s = (incidents || []).filter((i) => i.pri === 'P1');
  const [selId, setSelId] = useState(p1s[0]?.id || null);
  const inc = p1s.find((i) => i.id === selId);
  const data = MIM_REPORT_DATA[selId];

  if (!inc)
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '60px 0',
          color: C.MUTED,
          fontSize: 14,
        }}
      >
        No P1 incidents available for MIM report
      </div>
    );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Incident selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {p1s.map((i) => (
          <div
            key={i.id}
            onClick={() => setSelId(i.id)}
            style={{
              padding: '7px 14px',
              borderRadius: 7,
              cursor: 'pointer',
              fontSize: 12,
              background:
                selId === i.id ? 'rgba(220,38,38,0.1)' : 'rgba(0,0,0,0.03)',
              border: `1.5px solid ${
                selId === i.id ? 'rgba(220,38,38,0.35)' : C.BORDER
              }`,
              color: selId === i.id ? '#DC2626' : C.MUTED,
            }}
          >
            <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
              {i.id}
            </span>
            <span style={{ marginLeft: 8, opacity: 0.7 }}>
              {i.svc.split('—')[0].trim()}
            </span>
          </div>
        ))}
      </div>

      {/* Report header */}
      <div
        style={{
          background: 'linear-gradient(135deg,#7F1D1D,#991B1B,#DC2626)',
          borderRadius: 12,
          padding: '22px 28px',
          color: '#fff',
        }}
      >
        <div
          style={{
            fontSize: 10,
            opacity: 0.6,
            fontFamily: 'monospace',
            letterSpacing: 3,
            marginBottom: 8,
          }}
        >
          MAJOR INCIDENT REPORT — AUTO-GENERATED BY ZEROOPS · ZERO MANUAL EFFORT
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>
          {inc.svc}
        </div>
        <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 18 }}>
          {selId} &nbsp;·&nbsp; {inc.cat} &nbsp;·&nbsp; CI: {inc.ci}{' '}
          &nbsp;·&nbsp; {inc.hosting} &nbsp;·&nbsp; Declared: {data?.declaredAt}{' '}
          &nbsp;·&nbsp; Resolved: {data?.resolvedAt}
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6,1fr)',
            gap: 10,
          }}
        >
          {[
            ['MTTR', data?.mttr || inc.sla, '#4ADE80'],
            ['vs Manual', data?.manualEstimate || '—', '#FCD34D'],
            ['Time Saved', data?.saved || '—', '#4ADE80'],
            ['SMEs Swarmed', `${data?.smeCount || '—'} engineers`, '#93C5FD'],
            [
              'Auto Steps',
              `${data?.autoSteps || 0} of ${
                (data?.autoSteps || 0) + (data?.hitlSteps || 0)
              }`,
              '#93C5FD',
            ],
            [
              'Status',
              inc.status,
              inc.status === 'Auto-Resolved' ? '#4ADE80' : '#FCD34D',
            ],
          ].map(([l, v, col]) => (
            <div
              key={l}
              style={{
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 8,
                padding: '12px 14px',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  opacity: 0.6,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  marginBottom: 5,
                }}
              >
                {l.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
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

      {/* Executive Summary + Impact side by side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: '2px solid rgba(220,38,38,0.12)',
            }}
          >
            <span style={{ fontSize: 18 }}>📋</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              Executive Summary
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
            {inc.status === 'Auto-Resolved'
              ? 'ZeroOps autonomously resolved'
              : 'The operations team resolved'}{' '}
            P1 incident {selId} affecting {inc.svc} within the SLA window. The
            incident was declared at {data?.declaredAt} and resolved at{' '}
            {data?.resolvedAt} — an MTTR of {data?.mttr} compared to an
            estimated {data?.manualEstimate} for manual resolution.
            <br />
            <br />
            {inc.desc?.slice(0, 280)}...
          </div>
        </div>

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
              alignItems: 'center',
              gap: 8,
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: '2px solid rgba(220,38,38,0.12)',
            }}
          >
            <span style={{ fontSize: 18 }}>📊</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              Impact Analysis
            </span>
          </div>
          {[
            ['Affected CI', inc.ci],
            ['Hosting', inc.hosting],
            ['Category', inc.cat],
            ['SLA Status', inc.sla],
            ['Incident Manager', data?.incidentManager || inc.by],
            ['Bridge', data?.bridge || '—'],
            ['SMEs engaged', `${data?.smeCount} engineers auto-swarmed`],
            ['Broadcasts sent', `${data?.broadcastsSent} stakeholder updates`],
          ].map(([l, v]) => (
            <div
              key={l}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid rgba(0,0,0,0.05)',
                alignItems: 'flex-start',
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: '#64748B',
                  flexShrink: 0,
                  width: 130,
                }}
              >
                {l}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: '#1E293B',
                  fontWeight: 500,
                  textAlign: 'right',
                  fontFamily: 'monospace',
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Causal chain */}
      {data?.causalChain && (
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
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: '2px solid rgba(220,38,38,0.12)',
            }}
          >
            <span style={{ fontSize: 18 }}>🔍</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              Root Cause — Causal Chain
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: '#7C3AED',
                fontFamily: 'monospace',
                background: 'rgba(124,58,237,0.07)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 5,
                padding: '2px 10px',
              }}
            >
              Confirmed by ZeroOps RCA Engine
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {data.causalChain.map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: 36,
                    flexShrink: 0,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background:
                        i === 0
                          ? 'rgba(220,38,38,0.12)'
                          : 'rgba(217,119,6,0.1)',
                      border: `2px solid ${i === 0 ? '#DC2626' : '#D97706'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 11,
                      fontWeight: 700,
                      color: i === 0 ? '#DC2626' : '#D97706',
                      fontFamily: 'monospace',
                    }}
                  >
                    {i + 1}
                  </div>
                  {i < data.causalChain.length - 1 && (
                    <div
                      style={{
                        width: 2,
                        height: 24,
                        background: 'rgba(0,0,0,0.08)',
                        margin: '3px 0',
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    paddingTop: 5,
                    paddingBottom: i < data.causalChain.length - 1 ? 16 : 0,
                    flex: 1,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      color: i === 0 ? '#DC2626' : '#475569',
                      lineHeight: 1.6,
                      fontWeight: i === 0 ? 500 : 400,
                    }}
                  >
                    {step}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agent execution + Human decisions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {data?.agentActions && (
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
                alignItems: 'center',
                gap: 8,
                marginBottom: 14,
                paddingBottom: 10,
                borderBottom: '2px solid rgba(124,58,237,0.15)',
              }}
            >
              <span style={{ fontSize: 18 }}>🤖</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                Agent Execution Log
              </span>
            </div>
            {data.agentActions.map((a, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 14px',
                  borderRadius: 8,
                  marginBottom: 10,
                  background: 'rgba(124,58,237,0.04)',
                  border: '1px solid rgba(124,58,237,0.15)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 5,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 7 }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#7C3AED',
                      }}
                    >
                      ◈ {a.agent}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: '#64748B',
                        background: 'rgba(0,0,0,0.05)',
                        borderRadius: 4,
                        padding: '1px 7px',
                        fontFamily: 'monospace',
                      }}
                    >
                      {a.model}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: '#94A3B8',
                      fontFamily: 'monospace',
                    }}
                  >
                    {a.duration}
                  </span>
                </div>
                <div
                  style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}
                >
                  {a.desc}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data?.decisions && (
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
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                  paddingBottom: 10,
                  borderBottom: '2px solid rgba(217,119,6,0.15)',
                }}
              >
                <span style={{ fontSize: 18 }}>✋</span>
                <span
                  style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}
                >
                  Human Decisions
                </span>
              </div>
              {data.decisions.length === 0 ? (
                <div
                  style={{ fontSize: 13, color: C.MUTED, fontStyle: 'italic' }}
                >
                  No human decisions required — fully autonomous resolution.
                </div>
              ) : (
                data.decisions.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '11px 14px',
                      borderRadius: 8,
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
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#D97706',
                        }}
                      >
                        ✋ {d.by}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontFamily: 'monospace',
                          color: '#94A3B8',
                        }}
                      >
                        {d.at}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#64748B',
                        marginBottom: 4,
                      }}
                    >
                      {d.role}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#475569',
                        lineHeight: 1.6,
                      }}
                    >
                      {d.action}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {data?.lessonsLearned && (
            <div
              style={{
                background: 'rgba(37,99,235,0.04)',
                border: '1px solid rgba(37,99,235,0.15)',
                borderRadius: 10,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 16 }}>💡</span>
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}
                >
                  Lessons Learned
                </span>
              </div>
              {data.lessonsLearned.map((l, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', gap: 8, marginBottom: 8 }}
                >
                  <span
                    style={{
                      color: '#2563EB',
                      fontSize: 13,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    →
                  </span>
                  <span
                    style={{ fontSize: 12, color: '#475569', lineHeight: 1.6 }}
                  >
                    {l}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action items */}
      {data?.actionItems && (
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
              alignItems: 'center',
              gap: 8,
              marginBottom: 14,
              paddingBottom: 10,
              borderBottom: '2px solid rgba(22,163,74,0.15)',
            }}
          >
            <span style={{ fontSize: 18 }}>✅</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              Action Items — Prevention
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: '#16A34A',
                fontFamily: 'monospace',
                background: 'rgba(22,163,74,0.08)',
                border: '1px solid rgba(22,163,74,0.2)',
                borderRadius: 5,
                padding: '2px 10px',
              }}
            >
              Auto-assigned by ZeroOps
            </span>
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
          >
            {data.actionItems.map((a, i) => (
              <div
                key={i}
                style={{
                  borderRadius: 9,
                  overflow: 'hidden',
                  border: `1px solid ${
                    a.pri === 'HIGH'
                      ? 'rgba(220,38,38,0.25)'
                      : a.pri === 'MEDIUM'
                      ? 'rgba(217,119,6,0.2)'
                      : 'rgba(100,116,139,0.2)'
                  }`,
                }}
              >
                <div
                  style={{
                    padding: '8px 14px',
                    background:
                      a.pri === 'HIGH'
                        ? 'rgba(220,38,38,0.06)'
                        : a.pri === 'MEDIUM'
                        ? 'rgba(217,119,6,0.05)'
                        : 'rgba(100,116,139,0.04)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: `1px solid ${
                      a.pri === 'HIGH'
                        ? 'rgba(220,38,38,0.15)'
                        : a.pri === 'MEDIUM'
                        ? 'rgba(217,119,6,0.12)'
                        : C.BORDER
                    }`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      color: '#fff',
                      background:
                        a.pri === 'HIGH'
                          ? '#DC2626'
                          : a.pri === 'MEDIUM'
                          ? '#D97706'
                          : '#64748B',
                      borderRadius: 4,
                      padding: '2px 8px',
                      fontFamily: 'monospace',
                    }}
                  >
                    {a.pri}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: '#94A3B8',
                      fontFamily: 'monospace',
                    }}
                  >
                    Due: {a.due}
                  </span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: '#1E293B',
                      lineHeight: 1.5,
                      marginBottom: 6,
                    }}
                  >
                    {a.item}
                  </div>
                  <div style={{ fontSize: 11, color: '#94A3B8' }}>
                    Owner:{' '}
                    <span style={{ color: '#475569', fontWeight: 500 }}>
                      {a.owner}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          padding: '12px 18px',
          background: 'rgba(37,99,235,0.05)',
          border: '1px solid rgba(37,99,235,0.15)',
          borderRadius: 8,
          fontSize: 12,
          color: '#475569',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontStyle: 'italic' }}>
          This report was auto-generated by ZeroOps at incident close — zero
          manual effort required. Generated in &lt; 1 second from incident
          timeline and agent execution logs.
        </span>
        <span
          style={{
            fontSize: 11,
            color: '#2563EB',
            fontFamily: 'monospace',
            fontWeight: 600,
            flexShrink: 0,
            marginLeft: 16,
          }}
        >
          {new Date().toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}{' '}
          · ZeroOps v1.0
        </span>
      </div>
    </div>
  );
}

// ── Main ReportsPage ──────────────────────────────────────────
export default function ReportsPage({ chains, incidents, industry }) {
  const [reportType, setReportType] = useState('monthly');
  const [selInc, setSelInc] = useState(null);
  const [generated, setGenerated] = useState(false);

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
            ['rca', '📄 Post-Incident RCA'],
            ['sd', '🎯 Service Desk Intelligence'],
            ['bv', '📈 Business Value'],
            ['mim', '🚨 MIM Report'],
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

      {reportType === 'rca' && (
        <div
          style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 14 }}
        >
          {/* Incident selector */}
          <div
            style={{
              background: '#fff',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 10,
              padding: 16,
              height: 'fit-content',
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
              SELECT INCIDENT
            </div>
            {activeInc.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 9,
                    color: C.AMBER,
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                    marginBottom: 6,
                  }}
                >
                  ACTIVE
                </div>
                {activeInc.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => generate(inc)}
                    style={{
                      padding: '9px 10px',
                      borderRadius: 7,
                      marginBottom: 5,
                      cursor: 'pointer',
                      background:
                        selInc?.id === inc.id
                          ? 'rgba(37,99,235,0.08)'
                          : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${
                        selInc?.id === inc.id ? 'rgba(37,99,235,0.3)' : C.BORDER
                      }`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 11,
                          color: '#2563EB',
                          fontWeight: 600,
                        }}
                      >
                        {inc.id}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: '#fff',
                          background: pc(inc.pri),
                          borderRadius: 3,
                          padding: '1px 5px',
                        }}
                      >
                        {inc.pri}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#1E293B',
                        fontWeight: 500,
                      }}
                    >
                      {inc.svc}
                    </div>
                    {inc.hosting && (
                      <div style={{ marginTop: 4 }}>
                        <HostBadge hosting={inc.hosting} />
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
            {resolvedInc.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: 9,
                    color: C.GREEN,
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                    margin: '10px 0 6px',
                  }}
                >
                  RESOLVED
                </div>
                {resolvedInc.map((inc) => (
                  <div
                    key={inc.id}
                    onClick={() => generate(inc)}
                    style={{
                      padding: '9px 10px',
                      borderRadius: 7,
                      marginBottom: 5,
                      cursor: 'pointer',
                      background:
                        selInc?.id === inc.id
                          ? 'rgba(37,99,235,0.08)'
                          : 'rgba(0,0,0,0.02)',
                      border: `1px solid ${
                        selInc?.id === inc.id ? 'rgba(37,99,235,0.3)' : C.BORDER
                      }`,
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 2,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 11,
                          color: '#2563EB',
                          fontWeight: 600,
                        }}
                      >
                        {inc.id}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: C.GREEN,
                          fontFamily: 'monospace',
                        }}
                      >
                        ✓
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      {inc.svc}
                    </div>
                    {inc.hosting && (
                      <div style={{ marginTop: 4 }}>
                        <HostBadge hosting={inc.hosting} />
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>

          {/* RCA report */}
          {generated && selInc ? (
            <RCAReport
              incident={selInc}
              chains={chains || []}
              industry={industry}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fff',
                borderRadius: 10,
                border: `1px solid ${C.BORDER}`,
                height: 400,
              }}
            >
              <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
              <div style={{ fontSize: 14, color: C.MUTED }}>
                Select an incident to generate its RCA report
              </div>
            </div>
          )}
        </div>
      )}

      {/* Service Desk Intelligence */}
      {reportType === 'sd' && <ServiceDeskIntelligence />}

      {/* Business Value */}
      {reportType === 'bv' && <BusinessValue />}
      {/* MIM Report */}
      {reportType === 'mim' && <MIMReportTab incidents={incidents || []} />}
    </div>
  );
}
