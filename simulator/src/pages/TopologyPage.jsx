import { useState, useRef, useEffect } from 'react';
import { C, sc, sb } from '../config/theme.js';
import { Lbl, Tag, Rag, Bar, Sparkline } from '../components/atoms.jsx';
import { CUSTOMER } from '../data/customer/loader.js';

// ── Hosting label helper ──────────────────────────────────────
const getHostingLabel = (hosting) => {
  if (!hosting) return '';
  if (hosting.includes('OCI') && hosting.includes('Azure'))
    return '☁ OCI + Azure';
  if (hosting.includes('OCI')) return '☁ OCI';
  if (hosting.includes('Salesforce')) return '☁ Salesforce Cloud';
  if (hosting.includes('Azure')) return '☁ Azure';
  if (hosting.includes('AWS')) return '☁ AWS';
  if (hosting.includes('GCP')) return '☁ GCP';
  if (hosting.includes('KaaS')) return '☁ KaaS';
  if (hosting.includes('Kubernetes')) return '☁ Kubernetes';
  if (
    hosting.includes('Tapiola') ||
    hosting.includes('Sateri') ||
    hosting.includes('Pasila')
  )
    return '🏢 Elisa DC';
  return '🏢 On-Prem DC';
};

const INFRA_ICONS = {
  Server: '🖥',
  Database: '🗄',
  Filesystem: '💾',
  Network: '🌐',
  'Azure VM': '☁',
  'Azure VMs': '☁',
  'Premium SSD': '💾',
  ExpressRoute: '🔗',
  'Azure Monitor': '📊',
  'Azure Storage': '💾',
  'Azure Network': '🌐',
  'Azure VNet': '🌐',
  'Partner DC': '🏢',
  'On-Prem DC': '🏢',
  AWS: '☁',
  'AWS / On-Prem DC': '🏢',
  'DC Fabric': '🌐',
  'Oracle on Azure': '🗄',
  'Azure VM (HANA)': '☁',
  '14× E/M-series': '☁',
};

// ── CHANNEL data per chain ────────────────────────────────────
const CHANNEL_DATA = {
  'wafer-fab': {
    web: { up: 65, rt: 4200, err: 8.2 },
    mobile: { up: 71, rt: 5100, err: 6.1 },
    api: { up: 68, rt: 890, err: 7.4 },
  },
  assembly: {
    web: { up: 82, rt: 1800, err: 3.1 },
    mobile: { up: 85, rt: 2200, err: 2.8 },
    api: { up: 88, rt: 420, err: 1.9 },
  },
  'supply-chain': {
    web: { up: 96, rt: 820, err: 0.4 },
    mobile: { up: 97, rt: 1100, err: 0.3 },
    api: { up: 98, rt: 210, err: 0.2 },
  },
  quality: {
    web: { up: 78, rt: 2600, err: 5.4 },
    mobile: { up: 80, rt: 3100, err: 4.8 },
    api: { up: 82, rt: 640, err: 3.9 },
  },
  delivery: {
    web: { up: 99, rt: 380, err: 0.1 },
    mobile: { up: 99, rt: 510, err: 0.1 },
    api: { up: 100, rt: 120, err: 0.0 },
  },
  'prod-planning': {
    web: { up: 79, rt: 4200, err: 5.1 },
    mobile: { up: 76, rt: 5800, err: 6.3 },
    api: { up: 82, rt: 920, err: 4.2 },
  },
  'shop-floor': {
    web: { up: 68, rt: 5100, err: 9.2 },
    mobile: { up: 65, rt: 6200, err: 11.1 },
    api: { up: 70, rt: 1100, err: 8.4 },
  },
  'quality-mfg': {
    web: { up: 82, rt: 2200, err: 3.8 },
    mobile: { up: 84, rt: 2800, err: 3.2 },
    api: { up: 86, rt: 580, err: 2.9 },
  },
  maintenance: {
    web: { up: 95, rt: 940, err: 0.8 },
    mobile: { up: 94, rt: 1200, err: 0.9 },
    api: { up: 97, rt: 280, err: 0.5 },
  },
  warehouse: {
    web: { up: 98, rt: 620, err: 0.3 },
    mobile: { up: 97, rt: 880, err: 0.4 },
    api: { up: 99, rt: 190, err: 0.2 },
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

// ── Customer channel data for chain cards ─────────────────────
const CHAIN_CD = {
  'sap-landscape': {
    web: { up: 86, rt: 1200, err: 1.4 },
    mobile: { up: 84, rt: 1600, err: 1.8 },
    api: { up: 88, rt: 340, err: 1.1 },
    sessions: 247,
  },
  'engineering-platform': {
    web: { up: 58, rt: 4800, err: 9.2 },
    mobile: { up: 54, rt: 6100, err: 11.4 },
    api: { up: 61, rt: 1200, err: 8.7 },
    sessions: 2400,
  },
  'global-collaboration': {
    web: { up: 99, rt: 280, err: 0.1 },
    mobile: { up: 98, rt: 410, err: 0.2 },
    api: { up: 99, rt: 110, err: 0.1 },
    sessions: 18400,
  },
  'identity-access': {
    web: { up: 81, rt: 4200, err: 6.1 },
    mobile: { up: 78, rt: 5800, err: 7.4 },
    api: { up: 83, rt: 890, err: 5.2 },
    sessions: 8400,
  },
  'end-user-compute': {
    web: { up: 96, rt: 640, err: 0.4 },
    mobile: { up: 97, rt: 820, err: 0.3 },
    api: { up: 98, rt: 220, err: 0.2 },
    sessions: 14200,
  },
  'network-security': {
    web: { up: 99, rt: 180, err: 0.1 },
    mobile: { up: 99, rt: 240, err: 0.1 },
    api: { up: 100, rt: 80, err: 0.0 },
    sessions: 0,
  },
};
const getCDChain = (id, ch) => {
  // If domain has its own uptime, derive channel availability from it
  if (ch?.uptime && !CHAIN_CD[id]) {
    const base = ch.uptime;
    return {
      web: {
        up: Math.max(base - 0.3, 97).toFixed(1) * 1,
        rt: Math.round(800 * (100 / base)),
        err: parseFloat((100 - base) * 0.4).toFixed(1) * 1,
      },
      mobile: {
        up: Math.max(base - 0.5, 97).toFixed(1) * 1,
        rt: Math.round(1100 * (100 / base)),
        err: parseFloat((100 - base) * 0.6).toFixed(1) * 1,
      },
      api: {
        up: Math.max(base - 0.1, 98).toFixed(1) * 1,
        rt: Math.round(350 * (100 / base)),
        err: parseFloat((100 - base) * 0.2).toFixed(1) * 1,
      },
      sessions: ch.sessions || 0,
    };
  }
  return (
    CHAIN_CD[id] || {
      web: { up: 90, rt: 800, err: 1.2 },
      mobile: { up: 88, rt: 1100, err: 1.5 },
      api: { up: 92, rt: 350, err: 0.9 },
      sessions: 0,
    }
  );
};

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
        ⚠ Predictive Alert — ZeroOps detected early warning
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
          {onRunHC && (
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
              Pre-empt →
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

// ── DIAG DATA — keyed by appId:component for precise drill-down ──────
const DIAG_APP = {
  'msb:queue': {
    title: 'MSB — JMS Queue Silent Disconnect',
    metrics: [
      {
        l: 'JMS Consumers',
        v: '0 active',
        s: 'RED',
        n: 'All consumer threads disconnected',
      },
      {
        l: 'Queue Depth',
        v: '2,847 msg',
        s: 'RED',
        n: 'Orders/promos accumulating',
      },
      {
        l: 'Tellus Latency',
        v: '340ms',
        s: 'RED',
        n: 'Root cause — SLA: 50ms',
      },
    ],
    events: [
      {
        ts: '06:11',
        msg: 'JMS heartbeat failure — MSB silent disconnect detected',
        kind: 'error',
      },
      {
        ts: '06:09',
        msg: 'Tellus CRM latency spike 340ms detected',
        kind: 'warn',
      },
      {
        ts: '06:14',
        msg: 'Amdocs auto-escalated via ServiceNow P1',
        kind: 'info',
      },
    ],
    recommendation:
      'JMS reconnect executing. Amdocs escalated. MTTR: 9 min vs 1-2h manual. Pattern: weekly peak load.',
    tools: ['WSO2 MI Admin', 'JMS Broker', 'Amdocs API', 'ServiceNow'],
    agents: [
      { icon: '🔍', name: 'RCA Engine', role: 'Tellus upstream root cause' },
      {
        icon: '⚡',
        name: 'Remediation Agent',
        role: 'JMS reconnect + Amdocs escalation',
      },
    ],
    confidence: 94,
  },
  'taapi:cache': {
    title: 'TAAPI — Cache Staleness + Pod OOMKill',
    metrics: [
      {
        l: 'Cache Age',
        v: '4h stale',
        s: 'RED',
        n: 'NIMS sync lag — SLA 15 min',
      },
      { l: 'Pods Running', v: '1/3', s: 'RED', n: '2 pods OOMKilled' },
      {
        l: 'Availability',
        v: '0 results',
        s: 'RED',
        n: 'Mobile/broadband sales blocked',
      },
    ],
    events: [
      {
        ts: '05:50',
        msg: 'TAAPI availability check empty — NIMS sync lag 4h',
        kind: 'error',
      },
      {
        ts: '05:52',
        msg: 'Pod OOMKill — cache miss forcing full DB scan',
        kind: 'error',
      },
    ],
    recommendation:
      'NIMS forced sync + cache invalidation executing. Pod memory scaled 512Mi→1Gi. MTTR: 44 min vs 4-5 day manual.',
    tools: ['kubectl', 'PostgreSQL', 'NIMS Sync API', 'ServiceNow'],
    agents: [
      {
        icon: '⚡',
        name: 'Remediation Agent',
        role: 'NIMS sync + cache invalidation + pod restart',
      },
      {
        icon: '✅',
        name: 'Change Validator',
        role: 'Availability check validation',
      },
    ],
    confidence: 87,
  },
  'cil:threads': {
    title: 'CIL — Thread Pool Exhaustion (SAP Mass Event)',
    metrics: [
      {
        l: 'Thread Pool',
        v: '98% used',
        s: 'RED',
        n: 'SAP Port-In: 1,247 notifications',
      },
      { l: 'Dropped Events', v: '312', s: 'RED', n: 'Notifications lost' },
      { l: 'CPU', v: '87%', s: 'RED', n: 'Processing overload' },
    ],
    events: [
      {
        ts: 'now',
        msg: 'CIL thread pool 98% — SAP mass notification overload',
        kind: 'error',
      },
      {
        ts: '-15min',
        msg: 'SAP Port-In campaign triggered 1,247 async notifications',
        kind: 'warn',
      },
    ],
    recommendation:
      'Thread pool scaling to 200. Retry queue processing 312 dropped notifications. MTTR: 47 min vs 68h manual.',
    tools: ['Java JVM', 'SAP Notification API', 'ServiceNow'],
    agents: [
      {
        icon: '⚡',
        name: 'Remediation Agent',
        role: 'Thread scale + retry queue',
      },
      { icon: '✅', name: 'Change Validator', role: 'Reconciliation sign-off' },
    ],
    confidence: 85,
  },
  'nims:storage': {
    title: 'NIMS — Storage Capacity Warning (8 Days to Breach)',
    metrics: [
      { l: 'Storage Used', v: '87%', s: 'AMBER', n: 'Threshold 90%' },
      { l: 'Growth Rate', v: '3.2 GB/day', s: 'AMBER', n: 'Trending up' },
      { l: 'Runway', v: '8 days', s: 'RED', n: 'Pre-emptive action required' },
    ],
    events: [
      {
        ts: 'now',
        msg: 'NIMS storage 87% — breach predicted in 8 days',
        kind: 'warn',
      },
    ],
    recommendation:
      'Automated storage expansion scheduled. ZeroOps will expand before breach.',
    tools: ['Linux storage', 'ServiceNow'],
    agents: [
      {
        icon: '📊',
        name: 'Capacity Planner',
        role: 'Pre-emptive storage expansion',
      },
    ],
    confidence: 94,
  },

  'sfdc-crm:api': {
    title: 'Salesforce CRM — Integration Flow Healthy',
    metrics: [
      { l: 'SF API', v: '98.4%', s: 'GREEN', n: 'Within SLA' },
      {
        l: 'Sync Flow',
        v: 'Active',
        s: 'GREEN',
        n: 'Oracle→SF data flowing normally',
      },
    ],
    events: [
      {
        ts: 'now',
        msg: 'Salesforce CRM healthy — no active issues',
        kind: 'info',
      },
    ],
    recommendation:
      'ZeroOps monitoring Salesforce→Oracle integration pipeline for month-end data integrity.',
    tools: ['Salesforce API', 'Informatica IICS', 'XURRENT'],
    agents: [
      {
        icon: '📊',
        name: 'Capacity Planner',
        role: 'Month-end pre-scale monitoring',
      },
    ],
    confidence: 93,
  },
  'sfdc-crm:pod': {
    title: 'Salesforce CRM — Integration Flow Healthy',
    metrics: [
      { l: 'SF API', v: '98.4%', s: 'GREEN', n: 'Within SLA' },
      { l: 'Sync', v: 'Active', s: 'GREEN', n: 'Data flowing normally' },
    ],
    events: [
      {
        ts: 'now',
        msg: 'Salesforce healthy — ZeroOps monitoring integration pipeline',
        kind: 'info',
      },
    ],
    recommendation:
      'Pre-scale scheduled ahead of month-end billing cycle — usage spikes predictable.',
    tools: ['Salesforce API', 'XURRENT'],
    agents: [
      { icon: '📊', name: 'Capacity Planner', role: 'Pre-scale for month-end' },
    ],
    confidence: 93,
  },
  'oas:pipeline': {
    title: 'OAS Analytics — Data Pipelines Healthy',
    metrics: [
      {
        l: 'Data Pipelines',
        v: 'All OK',
        s: 'GREEN',
        n: 'EBS and Informatica feeds on schedule',
      },
      { l: 'OCI CPU', v: '38%', s: 'GREEN', n: 'Normal' },
    ],
    events: [
      {
        ts: 'now',
        msg: 'OAS data pipelines healthy — last refresh within SLA',
        kind: 'info',
      },
    ],
    recommendation:
      'ZeroOps monitors Informatica→OAS feed freshness every 15 min — auto-triggers refresh on 2h lag.',
    tools: ['OAS API', 'Informatica IICS', 'OCI Monitoring'],
    agents: [
      {
        icon: '⚡',
        name: 'Remediation Agent',
        role: 'Auto-trigger feed refresh on staleness',
      },
    ],
    confidence: 91,
  },
  'oas:cpu': {
    title: 'OAS Analytics — Healthy',
    metrics: [
      { l: 'OCI CPU', v: '38%', s: 'GREEN', n: 'Normal load' },
      { l: 'Reports', v: 'Current', s: 'GREEN', n: 'Data within SLA' },
    ],
    events: [
      { ts: 'now', msg: 'OAS healthy — all reports current', kind: 'info' },
    ],
    recommendation:
      'No action required. ZeroOps monitoring data freshness proactively.',
    tools: ['OCI Monitoring', 'OAS API'],
    agents: [
      { icon: '📊', name: 'Capacity Planner', role: 'Proactive monitoring' },
    ],
    confidence: 91,
  },

  // ── Canon Europa diagnostics ──────────────────────────────────
  'informatica:queue': {
    title: 'Informatica — Integration Jobs Failed',
    metrics: [
      {
        l: 'Failed Jobs',
        v: '7 failed',
        s: 'RED',
        n: 'Jobs aborted — no auto-recovery',
      },
      {
        l: 'Unscheduled',
        v: '3 jobs',
        s: 'RED',
        n: 'Scheduler disabled on failure',
      },
      {
        l: 'Transit Files',
        v: '24 stuck',
        s: 'RED',
        n: 'Not moved to landing directory',
      },
    ],
    events: [
      {
        ts: '05:11',
        msg: 'ELK: 7 Informatica jobs in FAILED state — INC-CN-00142 raised',
        kind: 'error',
      },
      {
        ts: '05:09',
        msg: 'OEM: 3 jobs unscheduled — scheduler disabled after failure',
        kind: 'warn',
      },
      {
        ts: '05:14',
        msg: 'ZeroOps auto-recovery: batch reset, transit files moving, jobs restarting',
        kind: 'info',
      },
    ],
    recommendation:
      'Auto-recovery executing: batch status reset, 24 transit files moved to landing, all 7 jobs restarting. MTTR: 18 min vs 4-6h manual. Downstream: EBS, Salesforce, Pearlchain unblocked.',
    tools: ['Informatica IICS REST API', 'ELK Stack', 'Oracle OEM', 'XCURRENT'],
    agents: [
      {
        icon: '🔍',
        name: 'RCA Engine',
        role: 'Upstream null field root cause — 91% confidence',
      },
      {
        icon: '⚡',
        name: 'Remediation Agent',
        role: 'Batch reset + file moves + job restart',
      },
    ],
    confidence: 91,
  },
  'informatica:app': {
    title: 'Informatica — Job Scheduler Disabled',
    metrics: [
      {
        l: 'Scheduler',
        v: '3 disabled',
        s: 'RED',
        n: 'Jobs will not auto-run',
      },
      {
        l: 'Failed Jobs',
        v: '7 total',
        s: 'RED',
        n: 'All integration flows stopped',
      },
    ],
    events: [
      {
        ts: '05:11',
        msg: 'Job scheduler auto-disabled after failure — manual reschedule required',
        kind: 'error',
      },
    ],
    recommendation:
      'ZeroOps re-enables scheduler and reschedules all affected jobs after root cause confirmed.',
    tools: ['Informatica IICS', 'XCURRENT'],
    agents: [
      {
        icon: '⚡',
        name: 'Remediation Agent',
        role: 'Scheduler re-enable + reschedule',
      },
    ],
    confidence: 91,
  },
  'informatica:db': {
    title: 'Informatica — Transit Files Stuck',
    metrics: [
      {
        l: 'Transit Files',
        v: '24 stuck',
        s: 'RED',
        n: 'Not moved to landing',
      },
      {
        l: 'Inbound Jobs',
        v: 'Blocked',
        s: 'RED',
        n: 'Cannot process without landing files',
      },
    ],
    events: [
      {
        ts: '05:11',
        msg: '24 files in transit directory — inbound jobs blocked',
        kind: 'error',
      },
      {
        ts: '05:16',
        msg: 'ZeroOps moving files from transit to landing directory',
        kind: 'info',
      },
    ],
    recommendation:
      'Files moved to landing directory — inbound jobs retriggered. 24 files processing.',
    tools: ['Informatica IICS', 'OCI Storage', 'XCURRENT'],
    agents: [
      {
        icon: '⚡',
        name: 'Remediation Agent',
        role: 'Transit → landing file move + inbound retrigger',
      },
    ],
    confidence: 91,
  },
  'oracle-ebs:queue': {
    title: 'Oracle EBS — WSH Concurrent Requests Stuck',
    metrics: [
      {
        l: 'WSH Concurrent',
        v: '38 stuck',
        s: 'RED',
        n: 'Ship confirm jobs not completing',
      },
      {
        l: 'Orders Blocked',
        v: '38 orders',
        s: 'RED',
        n: 'Revenue recognition cannot proceed',
      },
      { l: 'Period Risk', s: 'RED', n: 'Month-end revenue target at risk' },
    ],
    events: [
      {
        ts: '14:22',
        msg: 'OEM: 38 WSH concurrent requests stuck > 30 min — INC-CN-00141',
        kind: 'error',
      },
      {
        ts: '14:25',
        msg: 'Finance team notified — revenue recognition blocked',
        kind: 'warn',
      },
      {
        ts: '14:38',
        msg: 'ZeroOps: 32 orders auto-reprocessed via WSHFSTRX — 6 require DB fix',
        kind: 'info',
      },
    ],
    recommendation:
      '32 of 38 orders cleared via auto-reprocessing. 6 require DBA/Finance sign-off for DB-level fix. Revenue recognition unblocked for 32 orders immediately.',
    tools: [
      'Oracle EBS Concurrent Manager',
      'Oracle OEM',
      'MTL_TRANSACTIONS_INTERFACE',
      'XCURRENT',
    ],
    agents: [
      {
        icon: '🏛',
        name: 'Oracle Ops Agent',
        role: 'WSHFSTRX concurrent reprocessing',
      },
      {
        icon: '✋',
        name: 'HiTL Console',
        role: 'Finance/DBA approval for 6 DB fixes',
      },
    ],
    confidence: 89,
  },
  'oracle-ebs:db': {
    title: 'Oracle EBS — Inventory Interface Transactions Pending',
    metrics: [
      {
        l: 'MTL Interface',
        v: '156 pending',
        s: 'RED',
        n: 'Transactions not clearing',
      },
      {
        l: 'Impact',
        v: '38 orders',
        s: 'RED',
        n: 'Cannot ship confirm without clearance',
      },
    ],
    events: [
      {
        ts: '14:24',
        msg: 'MTL_TRANSACTIONS_INTERFACE: 156 pending transactions — root cause of ship confirm failure',
        kind: 'error',
      },
    ],
    recommendation:
      'ZeroOps clears eligible MTL interface records. DBA sign-off for complex cases. Inventory interface cleared in 28 min vs 3-4h manual.',
    tools: ['Oracle DB', 'MTL_TRANSACTIONS_INTERFACE', 'Oracle OEM'],
    agents: [
      {
        icon: '🏛',
        name: 'Oracle Ops Agent',
        role: 'MTL interface transaction clearing',
      },
    ],
    confidence: 89,
  },
  'oracle-finance:db': {
    title: 'Oracle Finance — DD Auth: 284 Invoices Not Picked',
    metrics: [
      {
        l: 'Invoices',
        v: '284 not picked',
        s: 'RED',
        n: 'Bank mandate expiry — 31 customers',
      },
      {
        l: 'DD Run',
        v: 'Failed',
        s: 'RED',
        n: 'Authorisation cannot complete',
      },
      {
        l: 'Collection Delay',
        v: '1 week',
        s: 'RED',
        n: 'Without ZeroOps intervention',
      },
    ],
    events: [
      {
        ts: '09:30',
        msg: 'DD authorisation run: 284 invoices not picked — mandate error',
        kind: 'error',
      },
      {
        ts: '09:31',
        msg: '31 customers with expired bank mandates identified',
        kind: 'warn',
      },
      {
        ts: '09:36',
        msg: 'ZeroOps: AR receipts reversing, mandate fix executing',
        kind: 'info',
      },
    ],
    recommendation:
      'AR reversal executing. Mandate correction in Oracle AR backend. Accenture notified for same-period rerun. MTTR: 4 hrs vs 1-week manual delay.',
    tools: ['Oracle AR', 'Oracle EBS', 'Accenture API', 'XCURRENT'],
    agents: [
      {
        icon: '⚡',
        name: 'Remediation Agent',
        role: 'AR reversal + mandate fix + Accenture rerun',
      },
      {
        icon: '🔍',
        name: 'RCA Engine',
        role: 'Mandate expiry root cause — 31 customers',
      },
    ],
    confidence: 82,
  },
  'oracle-finance:app': {
    title: 'Oracle Finance — Direct Debit Process Failed',
    metrics: [
      {
        l: 'DD Process',
        v: 'Failed',
        s: 'RED',
        n: 'Mandate validation failed',
      },
      { l: 'Invoices Affected', v: '284', s: 'RED', n: 'Not picked in DD run' },
    ],
    events: [
      {
        ts: '09:30',
        msg: 'Direct Debit authorisation process failed — bank mandate issue',
        kind: 'error',
      },
    ],
    recommendation:
      'Pre-DD mandate scan now active — detects expiring mandates 5 days before next run. Prevents failure rather than recovering.',
    tools: ['Oracle AR', 'Oracle EBS'],
    agents: [
      {
        icon: '🔍',
        name: 'Alert Correlator',
        role: 'DD failure detection pre-execution',
      },
    ],
    confidence: 82,
  },
  'primavera:app': {
    title: 'Primavera — Invoice Delivery Failure (Header/Line Mismatch)',
    metrics: [
      {
        l: 'Failed Invoices',
        v: '12 failed',
        s: 'AMBER',
        n: 'Header ≠ sum(lines)',
      },
      { l: 'Source', s: 'AMBER', n: 'Informatica rounding error' },
      {
        l: 'MTTR',
        v: '1-2 days manual',
        s: 'AMBER',
        n: 'NSO SPOC intervention required',
      },
    ],
    events: [
      {
        ts: '08:15',
        msg: 'Primavera: 12 invoices rejected — header/line amount mismatch',
        kind: 'warn',
      },
      {
        ts: '08:18',
        msg: 'ZeroOps: 9 invoices auto-corrected within €0.50 tolerance',
        kind: 'info',
      },
      {
        ts: '08:19',
        msg: '3 invoices flagged for NSO SPOC review',
        kind: 'warn',
      },
    ],
    recommendation:
      '9 of 12 invoices auto-corrected and redelivered. 3 require NSO review. MTTR: 45 min vs 1-2 business days. Pre-delivery validation now active.',
    tools: ['Primavera REST', 'Informatica IICS', 'XCURRENT'],
    agents: [
      {
        icon: '⚡',
        name: 'Remediation Agent',
        role: 'Auto-correct within tolerance + NSO escalation',
      },
    ],
    confidence: 84,
  },
  'pearlchain:cache': {
    title: 'Pearlchain — Pricing Cache Stale (Informatica Feed Delayed)',
    metrics: [
      {
        l: 'Cache Age',
        v: '2h stale',
        s: 'AMBER',
        n: 'Informatica feed delayed',
      },
      {
        l: 'Impact',
        v: 'CPQ pricing',
        s: 'AMBER',
        n: 'Sales quotes may use stale prices',
      },
    ],
    events: [
      {
        ts: 'now',
        msg: 'Pearlchain pricing cache stale — Informatica feed 2h delayed',
        kind: 'warn',
      },
    ],
    recommendation:
      'Informatica→Pearlchain feed retrigger queued. Cache refresh on completion. Sales team notified of potential price staleness.',
    tools: ['Informatica IICS', 'Pearlchain REST', 'XCURRENT'],
    agents: [
      {
        icon: '⚡',
        name: 'Remediation Agent',
        role: 'Feed retrigger + cache refresh',
      },
    ],
    confidence: 78,
  },
  'bizops:queue': {
    title: 'BizOps — Concurrent Request Queue Backing Up',
    metrics: [
      {
        l: 'Concurrent Requests',
        v: '147 pending',
        s: 'AMBER',
        n: 'Queue backing up — SCM operations delayed',
      },
      {
        l: 'Processing Time',
        v: '+40% avg',
        s: 'AMBER',
        n: 'Slower than baseline',
      },
    ],
    events: [
      {
        ts: 'now',
        msg: 'Oracle SCM concurrent request queue elevated — 147 pending',
        kind: 'warn',
      },
    ],
    recommendation:
      'ZeroOps monitoring concurrent queue — pre-emptive reprocessing if stuck threshold crossed.',
    tools: ['Oracle EBS Concurrent Manager', 'Oracle OEM'],
    agents: [
      {
        icon: '📊',
        name: 'Capacity Planner',
        role: 'Queue monitoring and pre-emptive action',
      },
    ],
    confidence: 81,
  },
};

// ── Elisa diagnostic templates — keyed by [status][inf.c] ───────────────────
const DIAG_GENERIC = {
  RED: {
    queue: {
      title: 'JMS Queue — Critical Backlog',
      metrics: [
        {
          l: 'Queue Depth',
          v: '2,847',
          s: 'RED',
          n: 'Messages accumulating — consumers disconnected',
        },
        {
          l: 'Consumers',
          v: '0 active',
          s: 'RED',
          n: 'All consumer threads idle',
        },
        {
          l: 'Processing',
          v: 'Halted',
          s: 'RED',
          n: 'Order/promo flow stopped',
        },
      ],
      events: [
        {
          ts: 'now',
          msg: 'JMS heartbeat failure — MSB consumer threads disconnected',
          kind: 'error',
        },
        {
          ts: '-8min',
          msg: 'Upstream Tellus CRM latency spike 340ms — root cause',
          kind: 'warn',
        },
      ],
      recommendation:
        'ZeroOps JMS reconnect executing. Amdocs auto-escalated. Order queue will resume within 9 minutes.',
      tools: ['WSO2 MI Admin', 'JMS Broker', 'ServiceNow', 'Mattermost'],
      agents: [
        {
          icon: '🔍',
          name: 'RCA Engine',
          role: 'Identify Tellus upstream root cause',
        },
        {
          icon: '⚡',
          name: 'Remediation Agent',
          role: 'JMS consumer thread reconnect',
        },
      ],
      confidence: 94,
    },
    pod: {
      title: 'Kubernetes Pod — CrashLoopBackOff',
      metrics: [
        { l: 'Pod Health', v: '1/3 Running', s: 'RED', n: '2 pods OOMKilled' },
        { l: 'Restarts', v: '14', s: 'RED', n: 'Crash loop active' },
        {
          l: 'Memory',
          v: '512Mi exceeded',
          s: 'RED',
          n: 'OOMKill threshold hit',
        },
      ],
      events: [
        {
          ts: 'now',
          msg: 'TAAPI pod OOMKill — cache miss forcing full DB scan',
          kind: 'error',
        },
        {
          ts: '-12min',
          msg: 'NIMS sync lag 4h — TAAPI DB cache stale',
          kind: 'warn',
        },
      ],
      recommendation:
        'Pod memory limit scaling to 1Gi. NIMS forced sync triggered. Cache invalidation executing. MTTR: 44 min.',
      tools: ['kubectl', 'GCP Monitoring', 'ServiceNow'],
      agents: [
        {
          icon: '⚡',
          name: 'Remediation Agent',
          role: 'Scale pod memory + restart',
        },
        { icon: '🔍', name: 'RCA Engine', role: 'NIMS sync lag root cause' },
      ],
      confidence: 87,
    },
    cache: {
      title: 'Application Cache — Stale Data',
      metrics: [
        { l: 'Cache Age', v: '4h stale', s: 'RED', n: 'SLA: 15 min refresh' },
        { l: 'Cache Hit', v: '0%', s: 'RED', n: 'All requests hitting DB' },
        { l: 'DB Load', s: 'RED', n: 'Full table scan on every request' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'TAAPI availability check returning empty — cache stale',
          kind: 'error',
        },
      ],
      recommendation:
        'Cache invalidation triggered. NIMS sync forced. Repopulation in progress.',
      tools: ['Redis', 'PostgreSQL', 'kubectl'],
      agents: [
        {
          icon: '⚡',
          name: 'Remediation Agent',
          role: 'Force cache invalidation + NIMS sync',
        },
      ],
      confidence: 87,
    },
    threads: {
      title: 'JVM Thread Pool — Exhausted',
      metrics: [
        { l: 'Thread Pool', v: '98% used', s: 'RED', n: 'Exhaustion imminent' },
        { l: 'CPU', v: '87%', s: 'RED', n: 'Processing overload' },
        {
          l: 'Dropped',
          v: '312 events',
          s: 'RED',
          n: 'CIL notifications lost',
        },
      ],
      events: [
        {
          ts: 'now',
          msg: 'CIL thread pool 98% — SAP mass notification overload',
          kind: 'error',
        },
        {
          ts: '-15min',
          msg: 'SAP Port-In campaign: 1,247 async notifications triggered',
          kind: 'warn',
        },
      ],
      recommendation:
        'Thread pool auto-scaling to 200. Retry queue activated for 312 dropped notifications.',
      tools: ['Java JVM', 'SAP API', 'ServiceNow'],
      agents: [
        {
          icon: '⚡',
          name: 'Remediation Agent',
          role: 'Scale thread pool + retry queue',
        },
        { icon: '🔍', name: 'RCA Engine', role: 'SAP mass event pattern' },
      ],
      confidence: 85,
    },
    db: {
      title: 'Database — Write Failures / Pressure',
      metrics: [
        {
          l: 'Failed Writes',
          v: '8/hr',
          s: 'RED',
          n: 'Silent failures — balance not credited',
        },
        { l: 'Connections', v: '94%', s: 'RED', n: 'Pool near exhaustion' },
        { l: 'Stuck Records', v: '12', s: 'RED', n: 'Inconsistent DB state' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'DB write failures detected — customer balances not credited',
          kind: 'error',
        },
      ],
      recommendation:
        'Auto-retry executing for eligible transactions. Connection pool expansion. Complex cases flagged for engineer.',
      tools: ['PostgreSQL', 'pgAdmin', 'ServiceNow'],
      agents: [
        {
          icon: '⚡',
          name: 'Remediation Agent',
          role: 'Auto-retry failed writes',
        },
        {
          icon: '📋',
          name: 'Log Analyzer',
          role: 'Identify write failure pattern',
        },
      ],
      confidence: 86,
    },
    pipeline: {
      title: 'GCP DataFlow Pipeline — Failed',
      metrics: [
        { l: 'Jobs Failed', v: '3', s: 'RED', n: 'Pipeline in ERROR state' },
        { l: 'BQ Query', v: '14.2s', s: 'RED', n: 'Above 10s SLA' },
        { l: 'Data Quality', s: 'RED', n: 'Mismatch at staging layer' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'CDW DataFlow 3 jobs FAILED — source schema drift',
          kind: 'error',
        },
      ],
      recommendation:
        'Bad records quarantined. Source re-send triggered. Business layer refresh scheduled. MTTR: 28 min.',
      tools: ['GCP DataFlow', 'BigQuery', 'Cloud Monitoring'],
      agents: [
        {
          icon: '☁',
          name: 'GCP Pipeline Agent',
          role: 'Quarantine bad records + re-ingest',
        },
      ],
      confidence: 83,
    },
    app: {
      title: 'Application — NullPointerException',
      metrics: [
        { l: 'Error Rate', v: '100% NPE', s: 'RED', n: 'All requests failing' },
        { l: 'DB Grants', v: '14 missing', s: 'RED', n: 'New schema objects' },
        {
          l: 'Users Blocked',
          v: '600',
          s: 'RED',
          n: 'Internal users affected',
        },
      ],
      events: [
        {
          ts: 'now',
          msg: 'JPD-Intra NPE — DB grants missing on new schema objects',
          kind: 'error',
        },
      ],
      recommendation:
        'DB grant verification tool identified 14 missing grants. Engineer approval required before execution.',
      tools: ['PostgreSQL', 'RHEL', 'ServiceNow'],
      agents: [
        {
          icon: '🔍',
          name: 'RCA Engine',
          role: 'Schema/grant drift detection',
        },
        {
          icon: '✋',
          name: 'HiTL Console',
          role: 'Engineer approval for DB fix',
        },
      ],
      confidence: 84,
    },
  },
  AMBER: {
    queue: {
      title: 'JMS Queue — Elevated Depth',
      metrics: [
        { l: 'Queue Depth', v: '847', s: 'AMBER', n: 'Above normal — monitor' },
        { l: 'Consumers', v: 'Degraded', s: 'AMBER', n: 'Slow processing' },
        { l: 'Lag', s: 'AMBER', n: 'Processing behind' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'JMS queue depth elevated — consumer processing slow',
          kind: 'warn',
        },
      ],
      recommendation:
        'ZeroOps monitoring. Auto-reconnect queued if consumer threads fall further.',
      tools: ['WSO2 MI Admin', 'ServiceNow'],
      agents: [
        {
          icon: '📋',
          name: 'Log Analyzer',
          role: 'Monitor consumer thread health',
        },
      ],
      confidence: 82,
    },
    pod: {
      title: 'Kubernetes Pod — Degraded',
      metrics: [
        {
          l: 'Pod Health',
          v: 'Degraded',
          s: 'AMBER',
          n: 'Performance below SLA',
        },
        { l: 'CPU', v: '74%', s: 'AMBER', n: 'Elevated' },
        { l: 'Restarts', v: 'Low', s: 'AMBER', n: 'Watch closely' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'KaaS pod performance degraded — ZeroOps monitoring',
          kind: 'warn',
        },
      ],
      recommendation: 'Auto-restart queued if no improvement in 5 minutes.',
      tools: ['kubectl', 'Grafana'],
      agents: [
        {
          icon: '📋',
          name: 'Log Analyzer',
          role: 'Analyse pod degradation signals',
        },
      ],
      confidence: 79,
    },
    cache: {
      title: 'Cache — Approaching Staleness',
      metrics: [
        { l: 'Cache Age', v: '28 min', s: 'AMBER', n: 'SLA: 15 min' },
        { l: 'Hit Rate', v: '62%', s: 'AMBER', n: 'Below 85% target' },
        {
          l: 'DB Load',
          v: 'Elevated',
          s: 'AMBER',
          n: 'Cache misses increasing',
        },
      ],
      events: [
        {
          ts: 'now',
          msg: 'Cache hit rate declining — approaching staleness threshold',
          kind: 'warn',
        },
      ],
      recommendation: 'Cache refresh scheduled. NIMS sync status checked.',
      tools: ['Redis', 'PostgreSQL'],
      agents: [
        {
          icon: '📊',
          name: 'Capacity Planner',
          role: 'Schedule pre-emptive cache refresh',
        },
      ],
      confidence: 82,
    },
    threads: {
      title: 'Thread Pool — Elevated',
      metrics: [
        {
          l: 'Thread Pool',
          v: '74%',
          s: 'AMBER',
          n: 'Monitor — approaching limit',
        },
        { l: 'CPU', v: '72%', s: 'AMBER', n: 'Elevated' },
        { l: 'Queue', v: 'Growing', s: 'AMBER', n: 'Watch trend' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'Thread pool approaching capacity — ZeroOps pre-emptive monitoring',
          kind: 'warn',
        },
      ],
      recommendation:
        'Pre-emptive thread pool scaling prepared. ZeroOps will auto-scale at 85% threshold.',
      tools: ['Java JVM', 'ServiceNow'],
      agents: [
        {
          icon: '📊',
          name: 'Capacity Planner',
          role: 'Pre-emptive thread pool scaling',
        },
      ],
      confidence: 80,
    },
    db: {
      title: 'Database — Performance Degraded',
      metrics: [
        { l: 'Write Errors', v: '2/hr', s: 'AMBER', n: 'Occasional failures' },
        { l: 'Connections', v: '71%', s: 'AMBER', n: 'Elevated' },
        { l: 'Query p99', v: '320ms', s: 'AMBER', n: 'Above 200ms SLA' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'DB write occasional failures — monitoring trend',
          kind: 'warn',
        },
      ],
      recommendation:
        'ZeroOps monitoring write failure pattern. Auto-retry configured.',
      tools: ['PostgreSQL', 'pgAdmin'],
      agents: [
        {
          icon: '📋',
          name: 'Log Analyzer',
          role: 'Write failure pattern analysis',
        },
      ],
      confidence: 79,
    },
    storage: {
      title: 'Storage — Capacity Warning',
      metrics: [
        { l: 'Used', v: '87%', s: 'AMBER', n: '8 days to breach' },
        {
          l: 'Growth Rate',
          v: '3.2 GB/day',
          s: 'AMBER',
          n: 'Trend increasing',
        },
        { l: 'Runway', v: '8 days', s: 'RED', n: 'Action required' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'NIMS storage 87% — capacity breach in 8 days at current growth',
          kind: 'warn',
        },
      ],
      recommendation:
        'Pre-emptive storage expansion scheduled. Growth rate 3.2GB/day. Automated expansion will execute in 48hrs.',
      tools: ['Linux df', 'ServiceNow'],
      agents: [
        {
          icon: '📊',
          name: 'Capacity Planner',
          role: 'Pre-emptive storage expansion',
        },
      ],
      confidence: 94,
    },
    cpu: {
      title: 'CPU — Elevated',
      metrics: [
        { l: 'CPU', v: '74%', s: 'AMBER', n: 'Above 70% threshold' },
        { l: 'Load Avg', v: 'Elevated', s: 'AMBER', n: 'Watch trend' },
        { l: 'GC', v: 'Active', s: 'AMBER', n: 'JVM GC pressure' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'CPU elevated — JVM GC pressure detected 8 min pre-impact',
          kind: 'warn',
        },
      ],
      recommendation:
        'Pre-emptive JVM heap tuning executed. ZeroOps detected GC pattern before user impact.',
      tools: ['JVM', 'RHEL', 'Grafana'],
      agents: [
        {
          icon: '⚡',
          name: 'Remediation Agent',
          role: 'Pre-emptive JVM heap tuning',
        },
      ],
      confidence: 79,
    },
    jvm: {
      title: 'JVM — GC Pressure',
      metrics: [
        { l: 'Heap Used', v: '91%', s: 'RED', n: 'Full GC cycles active' },
        { l: 'GC Pause', v: '2.4s', s: 'RED', n: 'Above 500ms SLA' },
        { l: 'API p99', v: '4200ms', s: 'RED', n: '4x above SLA' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'JVM full GC cycle — Elisa-Sites API latency 4200ms',
          kind: 'error',
        },
      ],
      recommendation:
        'Pre-emptive JVM heap tuning. ZeroOps detected GC pressure 8 min before user impact.',
      tools: ['JVM tuning', 'RHEL', 'Grafana'],
      agents: [
        {
          icon: '⚡',
          name: 'Remediation Agent',
          role: 'JVM heap tuning + GC trigger',
        },
      ],
      confidence: 79,
    },
    api: {
      title: 'API — Latency Elevated',
      metrics: [
        { l: 'API p99', v: '8200ms', s: 'RED', n: '8x above SLA' },
        { l: 'Timeout Rate', v: 'High', s: 'RED', n: 'Requests timing out' },
        {
          l: 'Error Rate',
          v: 'Elevated',
          s: 'RED',
          n: '5xx errors increasing',
        },
      ],
      events: [
        {
          ts: 'now',
          msg: 'TAAPI API timeout — availability check failing',
          kind: 'error',
        },
      ],
      recommendation:
        'Root cause: cache staleness forcing full DB scan. Cache invalidation in progress.',
      tools: ['Kubernetes', 'GCP Monitoring'],
      agents: [
        {
          icon: '🔍',
          name: 'RCA Engine',
          role: 'Identify API latency root cause',
        },
      ],
      confidence: 87,
    },
    pipeline: {
      title: 'GCP Pipeline — Degraded',
      metrics: [
        {
          l: 'DataFlow Jobs',
          v: 'Degraded',
          s: 'AMBER',
          n: 'Performance below SLA',
        },
        { l: 'BQ p99', v: '8.2s', s: 'AMBER', n: 'Above 5s target' },
        { l: 'Freshness', v: '12 min', s: 'AMBER', n: 'Above 5 min SLA' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'CDW pipeline degraded — data freshness lag',
          kind: 'warn',
        },
      ],
      recommendation:
        'ZeroOps monitoring pipeline health. Auto-restart prepared.',
      tools: ['GCP DataFlow', 'BigQuery'],
      agents: [
        {
          icon: '☁',
          name: 'GCP Pipeline Agent',
          role: 'Monitor and auto-restart if needed',
        },
      ],
      confidence: 80,
    },
    bq: {
      title: 'BigQuery — Query Performance',
      metrics: [
        { l: 'Query p99', v: '14.2s', s: 'RED', n: 'Above 10s SLA' },
        { l: 'Slot Usage', v: 'High', s: 'AMBER', n: 'Approaching quota' },
        { l: 'Scanned', v: 'Large', s: 'AMBER', n: 'Full table scans' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'BigQuery query performance degraded — slot contention',
          kind: 'warn',
        },
      ],
      recommendation:
        'Query optimization recommended. Partitioning review scheduled.',
      tools: ['BigQuery', 'Cloud Monitoring'],
      agents: [
        {
          icon: '☁',
          name: 'GCP Pipeline Agent',
          role: 'Query optimisation analysis',
        },
      ],
      confidence: 82,
    },
    net: {
      title: 'Network — Upstream Connectivity',
      metrics: [
        { l: 'Latency', v: '340ms', s: 'RED', n: 'SLA: 50ms' },
        { l: 'Packet Loss', v: '2.1%', s: 'AMBER', n: 'Above 0.1% threshold' },
        { l: 'Timeout Rate', v: 'High', s: 'RED', n: 'Connection timeouts' },
      ],
      events: [
        {
          ts: 'now',
          msg: 'Upstream Tellus CRM connectivity degraded — root cause',
          kind: 'error',
        },
      ],
      recommendation:
        'Amdocs vendor escalation auto-triggered. JMS reconnect executing in parallel.',
      tools: ['Network tools', 'ServiceNow'],
      agents: [
        {
          icon: '📞',
          name: 'Remediation Agent',
          role: 'Vendor auto-escalation + parallel fix',
        },
      ],
      confidence: 88,
    },
  },
};

// Maps AGFA and other customer-specific inf.c keys to DIAG_GENERIC template keys
const C_KEY_ALIASES = {
  heap: 'jvm',
  recv: 'app',
  jobs: 'pipeline',
  files: 'storage',
  pool: 'threads',
  thrd: 'threads',
  queue: 'queue',
  disk: 'storage',
  gpu: 'cpu',
  acc: 'api',
  lat: 'api',
  feed: 'pipeline',
  cache: 'cache',
  route: 'app',
  thru: 'pipeline',
  depth: 'queue',
  avail: 'api',
  rate: 'api',
  rep: 'db',
  retr: 'db',
  inv: 'app',
  pod: 'pod',
  cpu: 'cpu',
  net: 'net',
  ses: 'cpu',
  auth: 'api',
  wp: 'threads',
  bq: 'bq',
  mtl: 'queue',
  otc: 'pipeline',
  wsh: 'queue',
  ar: 'db',
  dd: 'pipeline',
  ing: 'pipeline',
};

const getDiag = (inf, appId) => {
  if (!inf) return null;
  const key = `${appId}:${inf.c}`;
  if (DIAG_APP[key]) return DIAG_APP[key];
  const templateKey = C_KEY_ALIASES[inf.c] || inf.c;
  const template =
    DIAG_GENERIC[inf.h]?.[templateKey] ||
    DIAG_GENERIC['AMBER']?.[templateKey] ||
    null;
  if (template) return template;
  // Fallback: build minimal diag from inf.detail if no template matches
  if (inf.detail)
    return {
      title: inf.label || inf.c,
      metrics: [{ l: 'Status', v: inf.val || '—', s: inf.h, n: inf.detail }],
      events: [
        {
          ts: 'now',
          msg: inf.detail,
          kind: inf.h === 'RED' ? 'error' : inf.h === 'AMBER' ? 'warn' : 'info',
        },
      ],
      recommendation: inf.detail,
      tools: [],
      agents: [],
      confidence: 80,
    };
  return null;
};

// Draws an arrow line from a source element to a target element
function ConnectorArrow({ fromRef, toRef, color }) {
  const [coords, setCoords] = useState(null);
  useEffect(() => {
    if (!fromRef?.current || !toRef?.current) return;
    const update = () => {
      const fr = fromRef.current?.getBoundingClientRect();
      const tr = toRef.current?.getBoundingClientRect();
      const container = fromRef.current?.closest('[data-topology]');
      if (!fr || !tr || !container) return;
      const cr = container.getBoundingClientRect();
      setCoords({
        x1: fr.left + fr.width / 2 - cr.left,
        y1: fr.bottom - cr.top,
        x2: tr.left + tr.width / 2 - cr.left,
        y2: tr.top - cr.top,
      });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [fromRef, toRef]);

  if (!coords) return null;
  const mx = (coords.x1 + coords.x2) / 2;
  const my = (coords.y1 + coords.y2) / 2;
  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
      width="100%"
      height="100%"
    >
      <defs>
        <marker
          id={`arr-${color.replace('#', '')}`}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="3"
          orient="auto"
        >
          <path d="M0,0 L0,6 L8,3 z" fill={color} opacity={0.7} />
        </marker>
      </defs>
      <path
        d={`M${coords.x1},${coords.y1} C${coords.x1},${my} ${coords.x2},${my} ${coords.x2},${coords.y2}`}
        fill="none"
        stroke={color}
        strokeWidth={2}
        opacity={0.6}
        strokeDasharray="5,3"
        markerEnd={`url(#arr-${color.replace('#', '')})`}
      />
      <circle cx={coords.x1} cy={coords.y1} r={4} fill={color} opacity={0.8} />
    </svg>
  );
}

// ── STATUS dot ────────────────────────────────────────────────
const Dot = ({ status, pulse }) => (
  <div
    style={{
      width: 9,
      height: 9,
      borderRadius: '50%',
      background: sc(status),
      flexShrink: 0,
      boxShadow:
        pulse && status === 'RED' ? `0 0 0 3px ${sc(status)}40` : 'none',
    }}
  />
);

// ── LAYER HEADER ──────────────────────────────────────────────
const LayerHeader = ({ n, label, sublabel, color = '#94A3B8' }) => (
  <div
    style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}
  >
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: 6,
        background: color + '22',
        border: `1px solid ${color}44`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        color,
        flexShrink: 0,
      }}
    >
      {n}
    </div>
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>
        {label}
      </div>
      {sublabel && (
        <div style={{ fontSize: 11, color: C.MUTED }}>{sublabel}</div>
      )}
    </div>
  </div>
);

// ── INFRA DRAWER (right panel) ────────────────────────────────
function InfraDrawer({ inf, appName, healed, onClose, runHC, appId }) {
  const status = healed ? 'GREEN' : inf.h;
  const diag = status !== 'GREEN' ? getDiag(inf, appId) : null;
  return (
    <div
      style={{
        width: 340,
        flexShrink: 0,
        background: 'rgba(255,255,255,0.98)',
        border: `1px solid ${sc(status)}30`,
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 180px)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: `1px solid ${C.BORDER}`,
          background: `${sc(status)}08`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: sb(status),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              {INFRA_ICONS[inf.c] || '⬡'}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                {inf.label || inf.c}
              </div>
              <div style={{ fontSize: 11, color: C.MUTED }}>
                {inf.type} · {appName}
              </div>
            </div>
          </div>
          <div
            onClick={onClose}
            style={{
              cursor: 'pointer',
              color: C.MUTED,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ✕
          </div>
        </div>
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <Rag status={status} lg />
          <div
            style={{
              flex: 1,
              background: 'rgba(0,0,0,0.05)',
              borderRadius: 4,
              height: 7,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${inf.m}%`,
                height: '100%',
                background: sc(status),
                transition: 'width 0.5s',
                borderRadius: 4,
              }}
            />
          </div>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 16,
              fontWeight: 700,
              color: sc(status),
            }}
          >
            {inf.m}%
          </span>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, color: C.MUTED }}>
          {inf.detail}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        {status === 'GREEN' ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>✅</div>
            <div style={{ fontSize: 14, color: C.GREEN, fontWeight: 600 }}>
              Component Healthy
            </div>
            <div style={{ fontSize: 12, color: C.MUTED, marginTop: 6 }}>
              No issues detected. All metrics within normal range.
            </div>
          </div>
        ) : diag ? (
          <>
            <div
              style={{
                fontSize: 11,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
                marginBottom: 10,
              }}
            >
              LIVE DIAGNOSTICS
            </div>
            {diag.metrics.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  padding: '9px 0',
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                <div>
                  <div style={{ fontSize: 13, color: '#1E293B' }}>{m.l}</div>
                  <div style={{ fontSize: 11, color: C.MUTED, marginTop: 1 }}>
                    {m.n}
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 14,
                    fontWeight: 700,
                    color: sc(m.s),
                    marginLeft: 10,
                    flexShrink: 0,
                  }}
                >
                  {m.v}
                </span>
              </div>
            ))}
            <div
              style={{
                fontSize: 11,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
                margin: '14px 0 10px',
              }}
            >
              RECENT EVENTS
            </div>
            {diag.events.map((ev, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 7,
                  padding: '8px 10px',
                  background:
                    ev.kind === 'error'
                      ? 'rgba(239,68,68,0.07)'
                      : 'rgba(245,158,11,0.07)',
                  borderRadius: 7,
                  border: `1px solid ${
                    ev.kind === 'error'
                      ? 'rgba(239,68,68,0.2)'
                      : 'rgba(245,158,11,0.2)'
                  }`,
                }}
              >
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: 10,
                    color: C.MUTED,
                    flexShrink: 0,
                  }}
                >
                  {ev.ts}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: ev.kind === 'error' ? '#DC2626' : '#B45309',
                    lineHeight: 1.5,
                  }}
                >
                  {ev.msg}
                </span>
              </div>
            ))}
            <div
              style={{
                marginTop: 14,
                background: 'rgba(59,130,246,0.07)',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 8,
                padding: 12,
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
                    fontSize: 11,
                    color: C.BLUE,
                    fontFamily: 'monospace',
                    letterSpacing: 1,
                  }}
                >
                  RECOMMENDED ACTION
                </div>
                {diag.hosting && (
                  <span
                    style={{
                      fontSize: 9,
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: diag.hosting.includes('OCI')
                        ? '#CC0000'
                        : diag.hosting.includes('Salesforce')
                        ? '#00A1E0'
                        : diag.hosting.includes('Azure')
                        ? '#0078D4'
                        : '#64748B',
                      background: diag.hosting.includes('OCI')
                        ? 'rgba(204,0,0,0.07)'
                        : diag.hosting.includes('Salesforce')
                        ? 'rgba(0,161,224,0.08)'
                        : diag.hosting.includes('Azure')
                        ? 'rgba(0,120,212,0.1)'
                        : 'rgba(100,116,139,0.08)',
                      border: `1px solid ${
                        diag.hosting.includes('OCI')
                          ? 'rgba(204,0,0,0.25)'
                          : diag.hosting.includes('Salesforce')
                          ? 'rgba(0,161,224,0.25)'
                          : diag.hosting.includes('Azure')
                          ? 'rgba(0,120,212,0.3)'
                          : 'rgba(100,116,139,0.25)'
                      }`,
                      borderRadius: 4,
                      padding: '2px 8px',
                    }}
                  >
                    {getHostingLabel(diag.hosting)}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.8 }}>
                {diag.recommendation}
              </div>
            </div>
            {/* ── REMEDIATION PANEL ── */}
            <div
              style={{
                marginTop: 14,
                background:
                  status === 'RED'
                    ? 'rgba(239,68,68,0.06)'
                    : 'rgba(245,158,11,0.06)',
                border: `1px solid ${
                  status === 'RED'
                    ? 'rgba(239,68,68,0.2)'
                    : 'rgba(245,158,11,0.2)'
                }`,
                borderRadius: 8,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: status === 'RED' ? C.RED : C.AMBER,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  marginBottom: 10,
                }}
              >
                ⚡ AI REMEDIATION
              </div>
              {/* Agent responsible */}
              {(
                diag.agents || [
                  status === 'RED'
                    ? {
                        icon: '🔍',
                        name: 'RCA Engine',
                        model: 'Claude Sonnet',
                        role: 'Diagnose root cause + generate runbook',
                      }
                    : {
                        icon: '📋',
                        name: 'Log Analyzer',
                        model: 'GPT-4-turbo',
                        role: 'Analyse degraded signals + classify cause',
                      },
                  {
                    icon: '⚡',
                    name: 'Remediation Agent',
                    model: 'GPT-4o',
                    role: 'Execute fix via OneEngine runbook',
                  },
                  {
                    icon: '🔗',
                    name: 'Alert Correlator',
                    model: 'Mistral-Large',
                    role: 'Suppress duplicate alerts during remediation',
                  },
                ]
              ).map((agent, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 9,
                    alignItems: 'flex-start',
                    marginBottom: 8,
                    padding: '8px 10px',
                    background: 'rgba(0,0,0,0.03)',
                    borderRadius: 6,
                  }}
                >
                  <span style={{ fontSize: 16 }}>{agent.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#1E293B',
                        }}
                      >
                        {agent.name}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontFamily: 'monospace',
                          color: C.MUTED,
                          background: 'rgba(0,0,0,0.05)',
                          borderRadius: 3,
                          padding: '1px 6px',
                        }}
                      >
                        {agent.model}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: C.MUTED, marginTop: 2 }}>
                      {agent.role}
                    </div>
                  </div>
                </div>
              ))}
              {/* Tools */}
              <div
                style={{
                  fontSize: 10,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                  margin: '10px 0 6px',
                }}
              >
                TOOLS IN REMEDIATION
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  flexWrap: 'wrap',
                  marginBottom: 12,
                }}
              >
                {(
                  diag.tools ||
                  (status === 'RED'
                    ? ['OneEngine', 'K8s API', 'Ansible', 'ServiceNow']
                    : ['ManageEngine OpManager', 'Ansible', 'ServiceNow'])
                ).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 9,
                      padding: '2px 7px',
                      background: 'rgba(245,158,11,0.1)',
                      color: C.AMBER,
                      border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: 4,
                      fontFamily: 'monospace',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 0',
              color: C.MUTED,
              fontSize: 13,
            }}
          >
            Diagnostic data unavailable for this component.
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────

// ── Blast Radius — Elisa Oyj app dependency map ──────────────
const BLAST_RADIUS = {
  msb: {
    label: 'MSB (WSO2 Integration)',
    downstream: [
      {
        id: 'flowone',
        name: 'FlowOne Order Mgmt',
        impact: 'Order processing halted · backlog accumulating silently',
        severity: 'RED',
      },
      {
        id: 'cil',
        name: 'CIL SAP Integration',
        impact: 'SAP notifications queued — status mismatches likely',
        severity: 'AMBER',
      },
      {
        id: 'crm-api',
        name: 'CRM-API',
        impact: 'CRM order updates stalled',
        severity: 'AMBER',
      },
    ],
  },
  flowone: {
    label: 'FlowOne Order Management',
    downstream: [
      {
        id: 'msb',
        name: 'MSB WSO2',
        impact: 'Integration layer backlog — 2,847 msgs queued',
        severity: 'RED',
      },
      {
        id: 'cil',
        name: 'CIL SAP Layer',
        impact: 'SAP order status updates blocked',
        severity: 'RED',
      },
      {
        id: 'prepaid',
        name: 'Prepaid System',
        impact: 'Refill order processing delayed',
        severity: 'AMBER',
      },
      {
        id: 'crm-api',
        name: 'CRM-API',
        impact: 'Customer order history unavailable',
        severity: 'AMBER',
      },
    ],
  },
  cil: {
    label: 'CIL (SAP Integration Layer)',
    downstream: [
      {
        id: 'flowone',
        name: 'FlowOne Order Mgmt',
        impact: 'Order status mismatch — SAP vs FlowOne vs CRM',
        severity: 'RED',
      },
      {
        id: 'crm-api',
        name: 'CRM-API',
        impact: 'CRM provisioning status out of sync',
        severity: 'RED',
      },
      {
        id: 'jpd-intra',
        name: 'JPD-Intra',
        impact: 'Customer order management data stale',
        severity: 'AMBER',
      },
    ],
  },
  taapi: {
    label: 'TAAPI (Tech Availability API)',
    downstream: [
      {
        id: 'webshop',
        name: 'Webshop',
        impact: 'Technology availability check fails — orders blocked',
        severity: 'RED',
      },
      {
        id: 'omaelisa',
        name: 'OmaElisa',
        impact: 'Self-service upgrade/change unavailable',
        severity: 'AMBER',
      },
      {
        id: 'nims',
        name: 'NIMS',
        impact: 'Inventory data not surfaced to sales systems',
        severity: 'AMBER',
      },
    ],
  },
  nims: {
    label: 'NIMS (Network Inventory)',
    downstream: [
      {
        id: 'taapi',
        name: 'TAAPI',
        impact: 'Availability check data stale — sales blocked',
        severity: 'RED',
      },
      {
        id: 'mappo',
        name: 'Mappo Provisioning',
        impact: 'GSM provisioning data source unavailable',
        severity: 'AMBER',
      },
      {
        id: 'webshop',
        name: 'Webshop',
        impact: 'Broadband/cable TV ordering impacted',
        severity: 'AMBER',
      },
    ],
  },
  'jpd-intra': {
    label: 'JPD-Intra / Wagner',
    downstream: [
      {
        id: 'crm-api',
        name: 'CRM-API',
        impact: 'Customer order operations degraded',
        severity: 'AMBER',
      },
      {
        id: 'mappo',
        name: 'Mappo',
        impact: 'Provisioning task management impacted',
        severity: 'AMBER',
      },
    ],
  },
  'dapl-cdw': {
    label: 'CDW (Customer Data Warehouse)',
    downstream: [
      {
        id: 'hy-ai',
        name: 'HY AI Services',
        impact: 'Contact classification input data unavailable',
        severity: 'AMBER',
      },
      {
        id: 'dapl-fdw',
        name: 'FDW Finance DW',
        impact: 'Cross-domain analytics impacted',
        severity: 'AMBER',
      },
    ],
  },

  // ── Canon Europa blast radius ─────────────────────────────────
  informatica: {
    label: 'Informatica (Integration Platform)',
    downstream: [
      {
        id: 'oracle-ebs',
        name: 'Oracle EBS',
        impact: 'Ship confirm jobs lose data feed — OTC blocked',
        severity: 'RED',
      },
      {
        id: 'oracle-finance',
        name: 'Oracle Finance',
        impact: 'AR and GL data feeds interrupted — reporting stale',
        severity: 'RED',
      },
      {
        id: 'sfdc-crm',
        name: 'Salesforce CRM',
        impact: 'Opportunity and order data sync stopped',
        severity: 'AMBER',
      },
      {
        id: 'pearlchain',
        name: 'Pearlchain CPQ',
        impact: 'Pricing data stale — sales quotes unreliable',
        severity: 'AMBER',
      },
      {
        id: 'oas',
        name: 'OAS Analytics',
        impact: 'All Oracle data reports show stale data',
        severity: 'AMBER',
      },
      {
        id: 'primavera',
        name: 'Primavera',
        impact: 'Invoice delivery pipeline stopped',
        severity: 'AMBER',
      },
    ],
  },
  'oracle-ebs': {
    label: 'Oracle EBS (Order to Cash)',
    downstream: [
      {
        id: 'oracle-finance',
        name: 'Oracle Finance',
        impact: 'Revenue recognition blocked — AR cannot close invoices',
        severity: 'RED',
      },
      {
        id: 'bizops',
        name: 'BizOps (SCM)',
        impact: 'Supply chain order status out of sync',
        severity: 'AMBER',
      },
      {
        id: 'oas',
        name: 'OAS Analytics',
        impact: 'OTC and revenue dashboards show incomplete data',
        severity: 'AMBER',
      },
    ],
  },
  'oracle-finance': {
    label: 'Oracle Finance',
    downstream: [
      {
        id: 'oas',
        name: 'OAS Analytics',
        impact: 'Finance dashboards and reports unavailable',
        severity: 'AMBER',
      },
      {
        id: 'sfdc-crm',
        name: 'Salesforce CRM',
        impact: 'Revenue actuals not syncing to CRM forecasting',
        severity: 'AMBER',
      },
    ],
  },
  bizops: {
    label: 'BizOps (Oracle SCM)',
    downstream: [
      {
        id: 'oracle-ebs',
        name: 'Oracle EBS',
        impact: 'SCM→OTC data flow interrupted — order processing delayed',
        severity: 'RED',
      },
      {
        id: 'pearlchain',
        name: 'Pearlchain CPQ',
        impact: 'Product availability data stale in quoting',
        severity: 'AMBER',
      },
    ],
  },
  primavera: {
    label: 'Primavera (Project/Invoice)',
    downstream: [
      {
        id: 'oracle-finance',
        name: 'Oracle Finance',
        impact: 'Project invoice recognition delayed — cash flow impact',
        severity: 'AMBER',
      },
    ],
  },
  mappo: {
    label: 'Mappo (GSM Provisioning)',
    downstream: [
      {
        id: 'nims',
        name: 'NIMS',
        impact: 'Network element sync delayed',
        severity: 'AMBER',
      },
      {
        id: 'webshop',
        name: 'Webshop',
        impact: 'New SIM connection orders delayed',
        severity: 'AMBER',
      },
    ],
  },
  // ── Canon Europa ─────────────────────────────────────────────
  informatica: {
    label: 'Informatica (Integration Platform)',
    downstream: [
      {
        id: 'oracle-ebs',
        name: 'Oracle EBS OTC',
        impact: 'Ship confirm jobs lose data feed — revenue blocked',
        severity: 'RED',
      },
      {
        id: 'oracle-finance',
        name: 'Oracle Finance',
        impact: 'AR and GL feeds interrupted — reporting stale',
        severity: 'RED',
      },
      {
        id: 'sfdc-crm',
        name: 'Salesforce CRM',
        impact: 'Opportunity and order data sync stopped',
        severity: 'AMBER',
      },
      {
        id: 'pearlchain',
        name: 'Pearlchain CPQ',
        impact: 'Pricing data stale — sales quotes unreliable',
        severity: 'AMBER',
      },
      {
        id: 'oas',
        name: 'OAS Analytics',
        impact: 'All Oracle data reports show stale data',
        severity: 'AMBER',
      },
      {
        id: 'primavera',
        name: 'Primavera',
        impact: 'Invoice delivery pipeline stopped',
        severity: 'AMBER',
      },
    ],
  },
  'oracle-ebs': {
    label: 'Oracle EBS (Order to Cash)',
    downstream: [
      {
        id: 'oracle-finance',
        name: 'Oracle Finance',
        impact: 'Revenue recognition blocked — AR cannot close invoices',
        severity: 'RED',
      },
      {
        id: 'bizops',
        name: 'BizOps SCM',
        impact: 'Supply chain order status out of sync',
        severity: 'AMBER',
      },
      {
        id: 'oas',
        name: 'OAS Analytics',
        impact: 'OTC and revenue dashboards show incomplete data',
        severity: 'AMBER',
      },
    ],
  },
  'oracle-finance': {
    label: 'Oracle Finance',
    downstream: [
      {
        id: 'oas',
        name: 'OAS Analytics',
        impact: 'Finance dashboards and reports unavailable',
        severity: 'AMBER',
      },
      {
        id: 'sfdc-crm',
        name: 'Salesforce CRM',
        impact: 'Revenue actuals not syncing to CRM forecasting',
        severity: 'AMBER',
      },
    ],
  },
  bizops: {
    label: 'BizOps (Oracle SCM)',
    downstream: [
      {
        id: 'oracle-ebs',
        name: 'Oracle EBS OTC',
        impact: 'SCM→OTC data flow interrupted — order processing delayed',
        severity: 'RED',
      },
      {
        id: 'pearlchain',
        name: 'Pearlchain CPQ',
        impact: 'Product availability data stale in quoting',
        severity: 'AMBER',
      },
    ],
  },
  primavera: {
    label: 'Primavera (Project/Invoice)',
    downstream: [
      {
        id: 'oracle-finance',
        name: 'Oracle Finance',
        impact: 'Project invoice recognition delayed — cash flow impact',
        severity: 'AMBER',
      },
    ],
  },

  // ── Generic Enterprise blast radius ──────────────────────────
  'sap-int': {
    label: 'SAP Integration Suite',
    downstream: [
      {
        id: 's4hana',
        name: 'SAP S/4HANA',
        impact:
          'iDoc processing halted — finance and procurement transactions queuing',
        severity: 'RED',
      },
      {
        id: 'ariba',
        name: 'SAP Ariba',
        impact:
          'Purchase order confirmations not flowing — procurement blocked',
        severity: 'RED',
      },
      {
        id: 'esb',
        name: 'ESB / Message Broker',
        impact:
          'Dead letter queue accumulating — downstream integrations failing',
        severity: 'AMBER',
      },
      {
        id: 'etl',
        name: 'ETL Pipeline',
        impact: 'Data warehouse not receiving ERP updates — reporting stale',
        severity: 'AMBER',
      },
      {
        id: 'apigw',
        name: 'API Gateway',
        impact: 'SAP-dependent API calls timing out — error rate elevated',
        severity: 'AMBER',
      },
    ],
  },
  s4hana: {
    label: 'SAP S/4HANA',
    downstream: [
      {
        id: 'ariba',
        name: 'SAP Ariba Procurement',
        impact: 'Purchase order creation and approval blocked',
        severity: 'RED',
      },
      {
        id: 'bw4hana',
        name: 'BW/4HANA Analytics',
        impact: 'Financial reporting data not updating — period-end at risk',
        severity: 'RED',
      },
      {
        id: 'sap-int',
        name: 'SAP Integration Suite',
        impact: 'iDoc processing degraded — partner notifications delayed',
        severity: 'AMBER',
      },
      {
        id: 'esb',
        name: 'ESB / Message Broker',
        impact: 'ERP event stream stalled — downstream systems out of sync',
        severity: 'AMBER',
      },
    ],
  },
  edi: {
    label: 'EDI Gateway',
    downstream: [
      {
        id: 'wms',
        name: 'Warehouse Mgmt System',
        impact:
          'Inbound goods receipts not processing — warehouse operations halted',
        severity: 'RED',
      },
      {
        id: 'inv',
        name: 'Inventory Platform',
        impact: 'Stock levels not updating from supplier confirmations',
        severity: 'RED',
      },
      {
        id: 'tms',
        name: 'Transport Mgmt System',
        impact: 'Delivery confirmations and ASNs not received from carriers',
        severity: 'AMBER',
      },
      {
        id: 's4hana',
        name: 'SAP S/4HANA',
        impact: 'Purchase order confirmations and invoices not processing',
        severity: 'AMBER',
      },
      {
        id: 'esb',
        name: 'ESB / Message Broker',
        impact: 'EDI message overflow to dead letter queue',
        severity: 'AMBER',
      },
    ],
  },
  wms: {
    label: 'Warehouse Management System',
    downstream: [
      {
        id: 'inv',
        name: 'Inventory Platform',
        impact:
          'Real-time stock positions unavailable — inventory accuracy at risk',
        severity: 'RED',
      },
      {
        id: 'edi',
        name: 'EDI Gateway',
        impact:
          'Despatch advice (DESADV) messages not generating for shipments',
        severity: 'RED',
      },
      {
        id: 'tms',
        name: 'Transport Mgmt System',
        impact: 'Shipment handoff to carrier delayed — delivery SLAs at risk',
        severity: 'AMBER',
      },
      {
        id: 's4hana',
        name: 'SAP S/4HANA',
        impact:
          'Goods receipt postings stalled — goods movement blocked in ERP',
        severity: 'AMBER',
      },
    ],
  },
  sso: {
    label: 'SSO / MFA Gateway',
    downstream: [
      {
        id: 'm365',
        name: 'Microsoft 365',
        impact: 'Email and Teams authentication failing for remote users',
        severity: 'RED',
      },
      {
        id: 'workday',
        name: 'Workday HCM',
        impact:
          'HR self-service inaccessible — payroll and leave requests blocked',
        severity: 'RED',
      },
      {
        id: 's4hana',
        name: 'SAP S/4HANA',
        impact:
          'SAP Fiori authentication degraded — business transactions impacted',
        severity: 'AMBER',
      },
      {
        id: 'ariba',
        name: 'SAP Ariba',
        impact: 'Procurement portal login failing for approvers',
        severity: 'AMBER',
      },
      {
        id: 'jira',
        name: 'Jira / Confluence',
        impact:
          'Engineering tools inaccessible — development workflows blocked',
        severity: 'AMBER',
      },
    ],
  },
  vpn: {
    label: 'VPN Gateway',
    downstream: [
      {
        id: 'm365',
        name: 'Microsoft 365',
        impact: 'Remote users unable to access corporate resources',
        severity: 'RED',
      },
      {
        id: 's4hana',
        name: 'SAP S/4HANA',
        impact:
          'Remote SAP access unavailable — finance and HR transactions blocked',
        severity: 'RED',
      },
      {
        id: 'wms',
        name: 'Warehouse Mgmt System',
        impact: 'Remote warehouse management access unavailable',
        severity: 'AMBER',
      },
      {
        id: 'jenkins',
        name: 'Jenkins CI/CD',
        impact: 'Remote developer access to build farm blocked',
        severity: 'AMBER',
      },
    ],
  },
  jenkins: {
    label: 'Jenkins CI/CD',
    downstream: [
      {
        id: 'nexus',
        name: 'Nexus Repository',
        impact:
          'Build artefacts not publishing — downstream deploy pipelines blocked',
        severity: 'RED',
      },
      {
        id: 'github',
        name: 'GitHub Enterprise',
        impact: 'PR merges blocked — no build validation possible',
        severity: 'AMBER',
      },
    ],
  },
  apigw: {
    label: 'API Gateway',
    downstream: [
      {
        id: 's4hana',
        name: 'SAP S/4HANA',
        impact: 'ERP API calls failing — integration touchpoints down',
        severity: 'RED',
      },
      {
        id: 'workday',
        name: 'Workday HCM',
        impact: 'HR data sync failing — employee record updates blocked',
        severity: 'AMBER',
      },
      {
        id: 'wms',
        name: 'Warehouse Mgmt System',
        impact: 'WMS API calls timing out — real-time stock queries failing',
        severity: 'AMBER',
      },
      {
        id: 'esb',
        name: 'ESB / Message Broker',
        impact: 'API-triggered ESB flows failing — message routing degraded',
        severity: 'AMBER',
      },
    ],
  },
  esb: {
    label: 'ESB / Message Broker',
    downstream: [
      {
        id: 's4hana',
        name: 'SAP S/4HANA',
        impact:
          'ERP event notifications not delivering — business process gaps',
        severity: 'RED',
      },
      {
        id: 'wms',
        name: 'Warehouse Mgmt System',
        impact:
          'Inventory event stream broken — stock movements not propagating',
        severity: 'RED',
      },
      {
        id: 'edi',
        name: 'EDI Gateway',
        impact: 'B2B message routing to trading partners stalled',
        severity: 'AMBER',
      },
      {
        id: 'etl',
        name: 'ETL Pipeline',
        impact:
          'Event-driven ETL jobs not triggering — data warehouse staleness',
        severity: 'AMBER',
      },
    ],
  },
};

// ── Blast Radius Visualiser ───────────────────────────────────
function BlastRadiusPanel({ appId, appName, onClose }) {
  const blast = BLAST_RADIUS[appId];
  const [revealed, setRevealed] = useState([]);
  const [animDone, setAnimDone] = useState(false);

  useEffect(() => {
    if (!blast) return;
    setRevealed([]);
    setAnimDone(false);
    blast.downstream.forEach((_, i) => {
      setTimeout(() => {
        setRevealed((prev) => [...prev, i]);
        if (i === blast.downstream.length - 1) {
          setTimeout(() => setAnimDone(true), 400);
        }
      }, 300 + i * 500);
    });
  }, [appId]);

  if (!blast) return null;

  const totalImpacted = blast.downstream.length;
  const redCount = blast.downstream.filter((d) => d.severity === 'RED').length;

  return (
    <div
      style={{
        width: 340,
        flexShrink: 0,
        background: 'rgba(255,255,255,0.98)',
        border: '2px solid rgba(220,38,38,0.3)',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 180px)',
      }}
    >
      <div style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                color: '#DC2626',
                fontFamily: 'monospace',
                letterSpacing: 3,
                marginBottom: 5,
              }}
            >
              ⚠ BLAST RADIUS ANALYSIS — WITHOUT ZEROOPS
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
              {appName} failure propagation
            </div>
            <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
              If this is not resolved — {totalImpacted} downstream systems
              affected
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: '#94A3B8',
            }}
          >
            ✕
          </button>
        </div>

        {/* Summary bar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {[
            [`${redCount} Critical`, '#DC2626'],
            [`${totalImpacted - redCount} Degraded`, '#D97706'],
            [`${totalImpacted} Total`, '#475569'],
          ].map(([label, color]) => (
            <div
              key={label}
              style={{
                background: `${color}10`,
                border: `1px solid ${color}30`,
                borderRadius: 6,
                padding: '6px 12px',
                fontSize: 11,
                fontWeight: 600,
                color,
              }}
            >
              {label}
            </div>
          ))}
          {animDone && (
            <div
              style={{
                marginLeft: 'auto',
                fontSize: 11,
                color: '#16A34A',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#16A34A',
                  display: 'inline-block',
                  boxShadow: '0 0 6px #16A34A',
                }}
              />
              ZeroOps resolving — cascade prevented
            </div>
          )}
        </div>

        {/* Root cause node */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
          }}
        >
          <div
            style={{
              background: 'rgba(220,38,38,0.1)',
              border: '2px solid #DC2626',
              borderRadius: 9,
              padding: '10px 20px',
              fontSize: 13,
              fontWeight: 700,
              color: '#DC2626',
              fontFamily: 'monospace',
              textAlign: 'center',
              width: 'fit-content',
            }}
          >
            🔴 {appName}
            <div
              style={{
                fontSize: 9,
                fontWeight: 400,
                color: '#94A3B8',
                marginTop: 2,
              }}
            >
              ROOT CAUSE
            </div>
          </div>

          {/* Propagation lines */}
          <div
            style={{ width: 2, height: 16, background: 'rgba(220,38,38,0.4)' }}
          />

          {/* Downstream nodes */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              width: '100%',
            }}
          >
            {blast.downstream.map((dep, i) => {
              const isVisible = revealed.includes(i);
              const sColor = dep.severity === 'RED' ? '#DC2626' : '#D97706';
              return (
                <div
                  key={dep.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    alignItems: 'flex-start',
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible
                      ? 'translateX(0)'
                      : 'translateX(-12px)',
                    transition: 'opacity 0.35s ease, transform 0.35s ease',
                  }}
                >
                  {/* Connector */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      paddingTop: 12,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 2,
                        height: 12,
                        background: `${sColor}40`,
                      }}
                    />
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: `${sColor}20`,
                        border: `2px solid ${sColor}`,
                      }}
                    />
                  </div>
                  {/* Node */}
                  <div
                    style={{
                      flex: 1,
                      background: `${sColor}08`,
                      border: `1px solid ${sColor}25`,
                      borderRadius: 8,
                      padding: '8px 12px',
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
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#1E293B',
                        }}
                      >
                        {dep.name}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: '#fff',
                          background: sColor,
                          borderRadius: 4,
                          padding: '2px 7px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {dep.severity}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>
                      {dep.impact}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ZeroOps prevention message */}
        {animDone && (
          <div
            style={{
              marginTop: 16,
              padding: '10px 14px',
              background:
                'linear-gradient(135deg,rgba(22,163,74,0.08),rgba(37,99,235,0.06))',
              border: '1px solid rgba(22,163,74,0.25)',
              borderRadius: 8,
              fontSize: 12,
              color: '#064E3B',
              display: 'flex',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 18 }}>🛡</span>
            <div>
              <div style={{ fontWeight: 700, marginBottom: 2 }}>
                ZeroOps is actively preventing this cascade
              </div>
              <div style={{ color: '#065F46' }}>
                RCA Engine has identified the root cause. Remediation Agent
                preparing autonomous fix. Estimated resolution:{' '}
                {appId === 'msb' || appId === 'cil'
                  ? '47 min'
                  : appId === 'taapi'
                  ? '44 min'
                  : '28 min'}
                .
              </div>
            </div>
          </div>
        )}
      </div>
      {/* end scroll */}
    </div>
  );
}

export default function TopologyPage({
  chains,
  healed,
  runHC,
  liveMetrics,
  predictAlerts,
  demoDegrade,
  onStartDegrade,
  onStopDegrade,
}) {
  const [selChain, setSelChain] = useState(null);
  const [selApp, setSelApp] = useState(null);
  const [selInf, setSelInf] = useState(null);
  const [showBlast, setShowBlast] = useState(false);

  // Refs for connector arrows
  const chainRefs = useRef({});
  const appRefs = useRef({});
  const infRefs = useRef({});

  // Clear infRefs and infra state when app or chain changes
  useEffect(() => {
    infRefs.current = {};
    setSelInf(null);
    setShowBlast(false);
  }, [selApp]);

  useEffect(() => {
    infRefs.current = {};
    setSelApp(null);
    setSelInf(null);
    setShowBlast(false);
  }, [selChain]);

  const selChainData = selChain
    ? (chains || []).find((c) => c.id === selChain)
    : null;
  const selAppData =
    selChainData && selApp
      ? selChainData.apps.find((a) => a.id === selApp)
      : null;
  const selInfData =
    selAppData && selInf ? selAppData.infra.find((i) => i.c === selInf) : null;

  const getAppStatus = (app) => (healed.has(app.id) ? 'GREEN' : app.status);
  const getInfStatus = (appId, inf) => (healed.has(appId) ? 'GREEN' : inf.h);
  const getChainStatus = (ch) => {
    if (ch.apps.every((a) => healed.has(a.id))) return 'GREEN';
    return ch.status;
  };

  const cd = selChainData ? getCD(selChainData.id) : null;

  // Channel overall status
  const chanStatus = (ch) =>
    ch.up >= 90 ? 'GREEN' : ch.up >= 75 ? 'AMBER' : 'RED';

  // ── No chain selected: show rich value chain cards ───────────
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
          <Lbl n="3">Service Map</Lbl>
          {/* Demo degradation controls */}
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
                  onClick={() => onStartDegrade('engineering-platform')}
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
                  ⚙ Engineering Platform Crisis
                </button>
                <button
                  onClick={() => onStartDegrade('identity-access')}
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
                  ☁ Azure Identity Storm
                </button>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: 12, fontSize: 12, color: C.MUTED }}>
          {(chains || []).length} service domains — click any card to drill into
          applications and infrastructure
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
            gap: 14,
          }}
        >
          {(chains || []).map((ch) => {
            const cd = getCDChain(ch.id, ch);
            const status = ch.apps.every((a) => healed.has(a.id))
              ? 'GREEN'
              : ch.status;
            const alerts = (predictAlerts || []).filter(
              (a) => a.chainId === ch.id
            );
            const redApps = ch.apps.filter(
              (a) => !healed.has(a.id) && a.status === 'RED'
            ).length;
            const ambApps = ch.apps.filter(
              (a) => !healed.has(a.id) && a.status === 'AMBER'
            ).length;
            return (
              <div
                key={ch.id}
                data-demo={`chain-${ch.id}`}
                onClick={() => {
                  setSelChain(ch.id);
                  setSelApp(null);
                  setSelInf(null);
                  setShowBlast(false);
                }}
                style={{
                  background: '#FAFBFC',
                  border: `2px solid ${
                    alerts.length ? 'rgba(217,119,6,0.4)' : sc(status) + '28'
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
                    '0 6px 20px rgba(0,0,0,0.09)';
                  e.currentTarget.style.borderColor = sc(status) + '66';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = alerts.length
                    ? 'rgba(217,119,6,0.4)'
                    : sc(status) + '28';
                }}
              >
                {/* Top colour strip */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 3,
                    background: `linear-gradient(90deg,${sc(
                      status
                    )},transparent)`,
                  }}
                />

                {/* Header */}
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
                    <span style={{ fontSize: 20, opacity: 0.8 }}>
                      {ch.icon}
                    </span>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: '#1E293B',
                        }}
                      >
                        {ch.name}
                      </div>
                      {ch.hosting && (
                        <div
                          style={{
                            fontSize: 10,
                            color: ch.hostingColor || C.MUTED,
                            fontFamily: 'monospace',
                            marginTop: 1,
                          }}
                        >
                          {getHostingLabel(ch.hosting)}
                        </div>
                      )}
                    </div>
                  </div>
                  <Rag status={status} />
                </div>

                {/* Uptime + sparkline */}
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
                        fontSize: 24,
                        fontWeight: 800,
                        color: sc(status),
                        fontFamily: 'monospace',
                        lineHeight: 1,
                      }}
                    >
                      {ch.uptime}%
                    </div>
                    <div style={{ fontSize: 10, color: C.MUTED, marginTop: 2 }}>
                      uptime
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
                    {ch.trend && (
                      <Sparkline data={ch.trend} color={sc(status)} />
                    )}
                    {cd.sessions > 0 && (
                      <div
                        style={{
                          fontSize: 10,
                          color: C.MUTED,
                          fontFamily: 'monospace',
                        }}
                      >
                        👥 {cd.sessions.toLocaleString()} sessions
                      </div>
                    )}
                  </div>
                </div>
                <Bar value={ch.uptime} status={status} h={3} />

                {/* App status summary */}
                {(redApps > 0 || ambApps > 0) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {redApps > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          color: C.RED,
                          fontFamily: 'monospace',
                          background: 'rgba(220,38,38,0.07)',
                          padding: '2px 7px',
                          borderRadius: 4,
                        }}
                      >
                        ✕ {redApps} critical
                      </span>
                    )}
                    {ambApps > 0 && (
                      <span
                        style={{
                          fontSize: 10,
                          color: C.AMBER,
                          fontFamily: 'monospace',
                          background: 'rgba(217,119,6,0.07)',
                          padding: '2px 7px',
                          borderRadius: 4,
                        }}
                      >
                        ⚠ {ambApps} degraded
                      </span>
                    )}
                  </div>
                )}

                {/* Channel bars — only on top-level overview, hidden in drill-down */}
                {!selChain && (
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
                )}

                {/* Predictive alert */}
                <PredictBanner
                  alerts={predictAlerts}
                  chainId={ch.id}
                  onRunHC={runHC}
                />

                <div
                  style={{
                    marginTop: 10,
                    fontSize: 11,
                    color: C.BLUE,
                    fontWeight: 500,
                  }}
                >
                  Drill into applications →
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );

  return (
    <div style={{ padding: 22 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 6,
        }}
      >
        <Lbl n="3">Service Map</Lbl>
        <div
          style={{
            fontSize: 11,
            color: C.MUTED,
            background: 'rgba(0,0,0,0.05)',
            border: `1px solid ${C.BORDER}`,
            borderRadius: 6,
            padding: '5px 12px',
          }}
        >
          Click any item to drill down through layers
        </div>
      </div>

      {/* ── Breadcrumb path ── */}
      {selChainData && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 14,
            padding: '8px 14px',
            background: 'rgba(59,130,246,0.06)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12, color: C.MUTED }}>Viewing:</span>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>
            {selChainData.name}
          </span>
          {selAppData && (
            <>
              <span style={{ color: C.MUTED }}>›</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1D4ED8' }}>
                {selAppData.name}
              </span>
            </>
          )}
          {selInfData && (
            <>
              <span style={{ color: C.MUTED }}>›</span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: sc(getInfStatus(selAppData?.id, selInfData)),
                }}
              >
                {selInfData.c}
              </span>
            </>
          )}
          <button
            onClick={() => {
              setSelChain(null);
              setSelApp(null);
              setSelInf(null);
              setShowBlast(false);
            }}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: `1px solid ${C.BORDER}`,
              color: C.MUTED,
              borderRadius: 5,
              padding: '2px 10px',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            Clear ✕
          </button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 14, alignItems: 'start' }}>
        {/* ── LEFT: 4 stacked layers ── */}
        <div
          style={{ flex: 1, minWidth: 0, position: 'relative' }}
          data-topology="1"
        >
          {/* ━━ LAYER 0: User Channels — hidden when chain selected ━━ */}
          {!selChain && (
            <div
              style={{
                background: C.PANEL,
                border: `1px solid ${C.BORDER}`,
                borderRadius: 10,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <LayerHeader
                n="0"
                label="User Channels"
                sublabel="How end-users reach the platform"
                color={C.BLUE}
              />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3,1fr)',
                  gap: 10,
                }}
              >
                {[
                  ['🌐', 'Web', cd?.web || { up: 90, rt: 800, err: 1.2 }],
                  [
                    '📱',
                    'Mobile',
                    cd?.mobile || { up: 88, rt: 1100, err: 1.5 },
                  ],
                  [
                    '⚡',
                    'API / Integration',
                    cd?.api || { up: 92, rt: 350, err: 0.9 },
                  ],
                ].map(([icon, name, data]) => (
                  <div
                    key={name}
                    style={{
                      background: `${upColor(data.up)}0a`,
                      border: `1px solid ${upColor(data.up)}28`,
                      borderRadius: 8,
                      padding: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{icon}</span>
                      <div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: '#1E293B',
                          }}
                        >
                          {name}
                        </div>
                        <Dot
                          status={
                            upColor(data.up) === 'GREEN'
                              ? 'GREEN'
                              : upColor(data.up) === 'AMBER'
                              ? 'AMBER'
                              : 'RED'
                          }
                        />
                      </div>
                      <div
                        style={{
                          marginLeft: 'auto',
                          fontSize: 18,
                          fontWeight: 800,
                          color: upColor(data.up),
                          fontFamily: 'monospace',
                        }}
                      >
                        {data.up}%
                      </div>
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 6,
                      }}
                    >
                      {[
                        ['Response', `${data.rt}ms`, rtColor(data.rt)],
                        ['Error Rate', `${data.err}%`, errColor(data.err)],
                      ].map(([l, v, col]) => (
                        <div
                          key={l}
                          style={{
                            background: 'rgba(0,0,0,0.03)',
                            borderRadius: 5,
                            padding: '6px 8px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              color: C.MUTED,
                              marginBottom: 2,
                            }}
                          >
                            {l}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
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
                    {!selChainData && (
                      <div
                        style={{ marginTop: 8, fontSize: 10, color: C.MUTED }}
                      >
                        ↓ Select a chain for live data
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ━━ LAYER 1: Value Chains ━━ */}
          <div
            style={{
              background: C.PANEL,
              border: `1px solid ${C.BORDER}`,
              borderRadius: 10,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <LayerHeader
              n="1"
              label="Value Chains"
              sublabel={`${(chains || []).length} chains — click to explore`}
              color="#8b5cf6"
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))',
                gap: 8,
              }}
            >
              {(chains || []).map((ch) => {
                const status = getChainStatus(ch);
                const isSel = selChain === ch.id;
                const redApps = ch.apps.filter(
                  (a) => getAppStatus(a) === 'RED'
                ).length;
                return (
                  <div
                    key={ch.id}
                    ref={(el) => (chainRefs.current[ch.id] = el)}
                    onClick={() => {
                      setSelChain(ch.id);
                      setSelApp(null);
                      setSelInf(null);
                      setShowBlast(false);
                    }}
                    style={{
                      background: isSel ? `${sc(status)}18` : sb(status),
                      border: `2px solid ${
                        isSel ? sc(status) : sc(status) + '44'
                      }`,
                      borderRadius: 9,
                      padding: '12px 14px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSel) {
                        e.currentTarget.style.borderColor = sc(status);
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel) {
                        e.currentTarget.style.borderColor = sc(status) + '44';
                        e.currentTarget.style.transform = 'none';
                      }
                    }}
                  >
                    {isSel && (
                      <div
                        style={{
                          position: 'absolute',
                          top: -1,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          width: 2,
                          height: 6,
                          background: sc(status),
                        }}
                      />
                    )}
                    <div
                      style={{ fontSize: 20, marginBottom: 5, opacity: 0.8 }}
                    >
                      {ch.icon}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#1E293B',
                        lineHeight: 1.4,
                        marginBottom: 4,
                      }}
                    >
                      {ch.name}
                    </div>
                    {ch.hosting && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 3,
                          background: `${ch.hostingColor || '#64748B'}14`,
                          border: `1px solid ${ch.hostingColor || '#64748B'}30`,
                          borderRadius: 4,
                          padding: '1px 6px',
                          marginBottom: 5,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            color: ch.hostingColor || '#64748B',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                          }}
                        >
                          {getHostingLabel(ch.hosting)}
                        </span>
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 14,
                          fontWeight: 800,
                          color: sc(status),
                        }}
                      >
                        {ch.uptime}%
                      </span>
                      <Rag status={status} />
                    </div>
                    {redApps > 0 && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 10,
                          color: C.RED,
                          fontFamily: 'monospace',
                        }}
                      >
                        ⚠ {redApps} app{redApps > 1 ? 's' : ''} critical
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ━━ LAYER 2: Applications ━━ */}
          <div
            style={{
              background: C.PANEL,
              border: `1px solid ${
                selChainData
                  ? sc(getChainStatus(selChainData)) + '44'
                  : C.BORDER
              }`,
              borderRadius: 10,
              padding: 16,
              marginBottom: 16,
              opacity: selChainData ? 1 : 0.45,
              transition: 'opacity 0.3s, border-color 0.3s',
            }}
          >
            <LayerHeader
              n="2"
              label={
                selChainData
                  ? `${selChainData.name} — Applications`
                  : 'Applications'
              }
              sublabel={
                selChainData
                  ? 'Click an app to view infrastructure'
                  : '← Select a value chain first'
              }
              color={C.AMBER}
            />
            {!selChainData ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5,1fr)',
                  gap: 8,
                }}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 60,
                      background: 'rgba(0,0,0,0.025)',
                      borderRadius: 7,
                      border: `1px solid ${C.BORDER}`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
                  gap: 8,
                }}
              >
                {selChainData.apps.map((app) => {
                  const status = getAppStatus(app);
                  const isSel = selApp === app.id;
                  return (
                    <div
                      key={app.id}
                      ref={(el) => (appRefs.current[app.id] = el)}
                      data-demo={`app-${app.id}`}
                      onClick={() => {
                        setSelApp(app.id);
                        setSelInf(null);
                        setShowBlast(false);
                      }}
                      style={{
                        background: isSel ? `${sc(status)}18` : sb(status),
                        border: `2px solid ${
                          isSel ? sc(status) : sc(status) + '44'
                        }`,
                        borderRadius: 9,
                        padding: '12px 14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSel) {
                          e.currentTarget.style.borderColor = sc(status);
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSel) {
                          e.currentTarget.style.borderColor = sc(status) + '44';
                          e.currentTarget.style.transform = 'none';
                        }
                      }}
                    >
                      {isSel && (
                        <div
                          style={{
                            position: 'absolute',
                            top: -1,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: 2,
                            height: 6,
                            background: sc(status),
                          }}
                        />
                      )}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: '#1E293B',
                            lineHeight: 1.4,
                          }}
                        >
                          {app.name}
                        </div>
                        <Rag status={status} />
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.MUTED,
                          marginBottom: 6,
                        }}
                      >
                        {app.ver}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 14,
                            fontWeight: 700,
                            color: sc(status),
                          }}
                        >
                          {app.perf}%
                        </span>
                        <div style={{ display: 'flex', gap: 3 }}>
                          {(healed?.has(app.id) && app.resolvedInfra
                            ? app.resolvedInfra
                            : app.infra || []
                          )
                            .filter((i) => i.anom)
                            .map((i) => (
                              <span
                                key={i.c}
                                style={{ fontSize: 9, color: C.AMBER }}
                              >
                                ⚠{i.c[0]}
                              </span>
                            ))}
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: 6,
                          background: 'rgba(0,0,0,0.05)',
                          borderRadius: 3,
                          height: 4,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${app.perf}%`,
                            height: '100%',
                            background: sc(status),
                            transition: 'width 0.5s',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ━━ LAYER 3: Infrastructure ━━ */}
          <div
            style={{
              background: C.PANEL,
              border: `1px solid ${
                selAppData ? sc(getAppStatus(selAppData)) + '44' : C.BORDER
              }`,
              borderRadius: 10,
              padding: 16,
              opacity: selAppData ? 1 : 0.35,
              transition: 'opacity 0.3s, border-color 0.3s',
            }}
          >
            <LayerHeader
              n="3"
              label={
                selAppData
                  ? `${selAppData.name} — Infrastructure / Integrations / Interfaces`
                  : 'Infrastructure / Integrations / Interfaces'
              }
              sublabel={
                selAppData
                  ? 'Click a component for diagnostics'
                  : '← Select an application first'
              }
              color={C.GREEN}
            />
            {!selAppData ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5,1fr)',
                  gap: 8,
                }}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: 54,
                      background: 'rgba(0,0,0,0.025)',
                      borderRadius: 7,
                      border: `1px solid ${C.BORDER}`,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))',
                  gap: 8,
                }}
              >
                {(healed?.has(selAppData.id) && selAppData.resolvedInfra
                  ? selAppData.resolvedInfra
                  : selAppData.infra || []
                ).map((inf, _idx) => {
                  const status = getInfStatus(selAppData.id, inf);
                  const isSel = selInf === inf.c;
                  const isDrillable = status === 'RED' || status === 'AMBER';
                  return (
                    <div
                      key={`${selAppData.id}-${inf.c}`}
                      ref={(el) => (infRefs.current[inf.c] = el)}
                      onClick={() =>
                        isDrillable &&
                        (setSelInf(isSel ? null : inf.c), setShowBlast(false))
                      }
                      style={{
                        background: isSel ? `${sc(status)}18` : sb(status),
                        border: `2px solid ${
                          isSel ? sc(status) : sc(status) + '44'
                        }`,
                        borderRadius: 9,
                        padding: '12px 14px',
                        cursor: isDrillable ? 'pointer' : 'default',
                        transition: 'all 0.2s',
                        position: 'relative',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSel && isDrillable)
                          e.currentTarget.style.borderColor = sc(status);
                      }}
                      onMouseLeave={(e) => {
                        if (!isSel)
                          e.currentTarget.style.borderColor = sc(status) + '44';
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          marginBottom: 8,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>
                          {INFRA_ICONS[inf.c] || '⬡'}
                        </span>
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: '#1E293B',
                            }}
                          >
                            {inf.label || inf.c}
                          </div>
                          <div style={{ fontSize: 10, color: C.MUTED }}>
                            {inf.detail || ''}{' '}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: 16,
                            fontWeight: 700,
                            color: sc(status),
                          }}
                        >
                          {inf.val || inf.m + (inf.unit === '%' ? '%' : '')}
                        </span>
                        <Rag status={status} />
                      </div>
                      <div
                        style={{
                          background: 'rgba(0,0,0,0.05)',
                          borderRadius: 3,
                          height: 5,
                          overflow: 'hidden',
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(inf.m || 0, 100)}%`,
                            height: '100%',
                            background: sc(status),
                            transition: 'width 0.5s',
                          }}
                        />
                      </div>
                      {isDrillable && !isSel && (
                        <div
                          style={{
                            fontSize: 10,
                            color: sc(status),
                            fontFamily: 'monospace',
                            textAlign: 'center',
                            padding: '3px 0',
                            background: `${sc(status)}12`,
                            borderRadius: 4,
                          }}
                        >
                          Tap for diagnostics →
                        </div>
                      )}
                      {isDrillable && BLAST_RADIUS[selAppData.id] && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowBlast(true);
                            setSelInf(null);
                          }}
                          style={{
                            marginTop: 6,
                            fontSize: 10,
                            color: '#DC2626',
                            fontFamily: 'monospace',
                            textAlign: 'center',
                            padding: '3px 0',
                            background: 'rgba(220,38,38,0.08)',
                            borderRadius: 4,
                            cursor: 'pointer',
                            border: '1px solid rgba(220,38,38,0.2)',
                          }}
                        >
                          ⚠ Blast Radius →
                        </div>
                      )}
                      {inf.anom && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: C.AMBER,
                            boxShadow: `0 0 5px ${C.AMBER}`,
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Blast Radius Panel ── */}
        {showBlast && selAppData && BLAST_RADIUS[selAppData.id] && (
          <BlastRadiusPanel
            appId={selAppData.id}
            appName={selAppData.name}
            onClose={() => setShowBlast(false)}
          />
        )}

        {/* ── RIGHT: Infra Diagnostic Drawer ── */}
        {!showBlast && selInfData && selAppData && (
          <InfraDrawer
            inf={selInfData}
            appName={selAppData.name}
            healed={healed.has(selAppData.id)}
            onClose={() => setSelInf(null)}
            runHC={runHC}
            appId={selAppData.id}
          />
        )}
      </div>

      {/* Legend */}
      <div
        style={{
          marginTop: 12,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          padding: '10px 14px',
          background: 'rgba(0,0,0,0.025)',
          borderRadius: 8,
          border: `1px solid ${C.BORDER}`,
        }}
      >
        <span style={{ fontSize: 11, color: C.MUTED }}>Layer flow:</span>
        {[
          'Value Chains (L1)',
          'Applications (L2)',
          'Infrastructure / Integrations / Interfaces (L3)',
        ].map((l, i, arr) => (
          <span
            key={l}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <span style={{ fontSize: 11, color: C.MUTED }}>{l}</span>
            {i < arr.length - 1 && <span style={{ color: C.MUTED }}>›</span>}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          {[
            ['🔴 Critical', C.RED],
            ['🟡 Degraded', C.AMBER],
            ['🟢 Healthy', C.GREEN],
          ].map(([l, col]) => (
            <span key={l} style={{ fontSize: 11, color: col }}>
              {l}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}
