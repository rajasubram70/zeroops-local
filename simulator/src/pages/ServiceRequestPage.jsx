import { useState, useEffect, useRef } from 'react';
import { C } from '../config/theme.js';
import { Lbl } from '../components/atoms.jsx';
import {
  REQUEST_CATALOGUE,
  REQUEST_QUEUE,
  REQUEST_STATS,
  CUSTOMER,
  ITSM,
} from '../data/customer/loader.js';

// ── Helpers ───────────────────────────────────────────────────
function HostBadge({ hosting }) {
  const isAzure = hosting?.includes('Azure');
  const color = isAzure ? '#0078D4' : '#64748B';
  const bg = isAzure ? 'rgba(0,120,212,0.08)' : 'rgba(100,116,139,0.08)';
  const bdr = isAzure ? 'rgba(0,120,212,0.25)' : 'rgba(100,116,139,0.25)';
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
      {isAzure ? '☁ Azure' : '🏢 On-Prem'}
    </span>
  );
}

function AutoBar({ rate }) {
  const color =
    rate === 100
      ? C.GREEN
      : rate >= 80
      ? C.BLUE
      : rate >= 50
      ? C.AMBER
      : '#DC2626';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 56,
          height: 5,
          background: 'rgba(0,0,0,0.07)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${rate}%`,
            background: color,
            borderRadius: 3,
          }}
        />
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          fontFamily: 'monospace',
          color,
          minWidth: 32,
          textAlign: 'right',
        }}
      >
        {rate}%
      </span>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = {
    'Auto-Fulfilling': { color: C.BLUE, bg: 'rgba(37,99,235,0.08)' },
    Fulfilled: { color: C.GREEN, bg: 'rgba(22,163,74,0.08)' },
    'SoD Check': { color: '#7C3AED', bg: 'rgba(124,58,237,0.08)' },
    'Awaiting Approval': { color: C.AMBER, bg: 'rgba(217,119,6,0.08)' },
    Pending: { color: C.MUTED, bg: 'rgba(0,0,0,0.04)' },
  }[status] || { color: C.MUTED, bg: 'rgba(0,0,0,0.04)' };
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.color}30`,
        borderRadius: 4,
        padding: '2px 8px',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

// ── SAP Access Simulation ─────────────────────────────────────
const SCENARIOS = [
  {
    id: 'clean',
    label: 'New Joiner — Clean',
    badge: 'PILLAR 1 · SENTINEL',
    badgeColor: '#16A34A',
    icon: '👤',
    color: '#16A34A',
    request: {
      ref: 'SR-AG-00158',
      user: 'Maria Hoffmann',
      email: 'm.hoffmann@enterprise.com',
      role: 'Finance Analyst',
      manager: 'Klaus Weber',
      dept: 'Group Finance',
      costCentre: 'FIN-4420',
      requested: [
        'FB01 — FI Document Posting',
        'FB03 — Document Display',
        'F110 — Payment Run (Display Only)',
      ],
      existing: ['SU01 — User Maintenance (Read Only)'],
    },
    desc: 'Standard new joiner access request. Roles requested are display/entry level — no sensitive transactions.',
    steps: [
      {
        id: 'recv',
        label: 'Request Received',
        icon: '📥',
        agent: 'Alert Correlator',
        color: '#2563EB',
        duration: 2000,
        auto: true,
        events: [
          {
            t: 400,
            kind: 'info',
            msg: `SR-AG-00158 received from ${ITSM} — Maria Hoffmann · Finance Analyst`,
          },
          {
            t: 1000,
            kind: 'info',
            msg: 'Request validated — user exists in HR system · manager confirmed',
          },
          {
            t: 1700,
            kind: 'success',
            msg: 'Request accepted — routing to SoD Check Agent',
          },
        ],
        output:
          'SR-AG-00158 validated · user m.hoffmann@enterprise.com · 3 roles requested · manager K.Weber confirmed',
      },
      {
        id: 'sod',
        label: 'SoD Check',
        icon: '🔍',
        agent: 'SoD Check Agent',
        color: '#7C3AED',
        duration: 5000,
        auto: true,
        events: [
          {
            t: 400,
            kind: 'info',
            msg: 'Connecting to SAP GRC API — querying role conflict matrix',
          },
          {
            t: 1200,
            kind: 'info',
            msg: 'Checking FB01 against existing role SU01 — no conflict',
          },
          {
            t: 2200,
            kind: 'info',
            msg: 'Checking FB03 against existing role SU01 — no conflict',
          },
          {
            t: 3200,
            kind: 'info',
            msg: 'Checking F110 (Display Only) against existing roles — no conflict',
          },
          {
            t: 4200,
            kind: 'success',
            msg: '✅ SoD check CLEAN — 3/3 roles conflict-free · risk score 12',
          },
        ],
        output:
          'SoD CLEAN · FB01 ✓ · FB03 ✓ · F110-Display ✓ · No segregation violations · Risk 12/100',
      },
      {
        id: 'prov',
        label: 'Auto-Provision',
        icon: '⚡',
        agent: 'Remediation Agent',
        color: '#D97706',
        duration: 4000,
        auto: true,
        events: [
          {
            t: 400,
            kind: 'info',
            msg: 'Risk score 12 — Sentinel threshold clear · auto-provisioning approved',
          },
          {
            t: 1200,
            kind: 'info',
            msg: 'SAP BAPI call: SUIM_ACL_GET_LOGINS — assigning FB01 to m.hoffmann',
          },
          {
            t: 2000,
            kind: 'info',
            msg: 'SAP BAPI call: assigning FB03, F110 (Display) — all roles applying',
          },
          {
            t: 3200,
            kind: 'success',
            msg: 'All 3 roles assigned in SAP · user profile active · login confirmed',
          },
        ],
        output:
          '3 roles assigned via SAP BAPI · m.hoffmann@enterprise.com active · SAP login verified',
      },
      {
        id: 'close',
        label: 'Close & Notify',
        icon: '✅',
        agent: 'Change Validator',
        color: '#16A34A',
        duration: 2500,
        auto: true,
        events: [
          {
            t: 400,
            kind: 'info',
            msg: 'Updating SR-AG-00158 in ServiceNow — status Fulfilled',
          },
          {
            t: 1200,
            kind: 'info',
            msg: 'Email notification → m.hoffmann@enterprise.com · access ready',
          },
          {
            t: 1800,
            kind: 'success',
            msg: 'SR-AG-00158 closed · MTTR: 4m 12s · audit trail complete',
          },
        ],
        output:
          'SR-AG-00158 closed in ServiceNow · Maria Hoffmann notified · full audit trail logged',
      },
    ],
  },
  {
    id: 'conflict',
    label: 'Role Change — SoD Conflict',
    badge: 'PILLAR 2 · GUARDIAN',
    badgeColor: '#2563EB',
    icon: '⚠',
    color: '#DC2626',
    request: {
      ref: 'SR-AG-00161',
      user: 'Thomas Bauer',
      email: 't.bauer@enterprise.com',
      role: 'Senior Finance Analyst',
      manager: 'Klaus Weber',
      dept: 'Group Finance',
      costCentre: 'FIN-4420',
      requested: [
        'F110 — Payment Run (Execute)',
        'FK01 — Vendor Create',
        'FB01 — FI Document Posting',
      ],
      existing: [
        'FB03 — Document Display',
        'F-53 — Post Outgoing Payment',
        'FBL1N — Vendor Line Items',
      ],
    },
    desc: 'Role change request for senior analyst. Requested roles include payment execution — potential SoD conflict with existing payment posting roles.',
    steps: [
      {
        id: 'recv',
        label: 'Request Received',
        icon: '📥',
        agent: 'Alert Correlator',
        color: '#2563EB',
        duration: 2000,
        auto: true,
        events: [
          {
            t: 400,
            kind: 'info',
            msg: 'SR-AG-00161 received from ServiceNow — Thomas Bauer · Senior Finance Analyst',
          },
          {
            t: 1000,
            kind: 'info',
            msg: 'Request validated — user exists · role change from Finance Analyst confirmed',
          },
          {
            t: 1700,
            kind: 'success',
            msg: 'Request accepted — routing to SoD Check Agent',
          },
        ],
        output:
          'SR-AG-00161 validated · t.bauer@enterprise.com · 3 new roles requested · role change scenario',
      },
      {
        id: 'sod',
        label: 'SoD Check',
        icon: '🔍',
        agent: 'SoD Check Agent',
        color: '#7C3AED',
        duration: 6000,
        auto: true,
        hasConflict: true,
        events: [
          {
            t: 400,
            kind: 'info',
            msg: 'Connecting to SAP GRC API — querying role conflict matrix',
          },
          {
            t: 1200,
            kind: 'info',
            msg: 'Checking F110 (Execute) against existing F-53 (Post Outgoing Payment)…',
          },
          {
            t: 2400,
            kind: 'warn',
            msg: '⚠ CONFLICT: F110-Execute + F-53 = Payment initiation AND posting · SoD violation',
          },
          {
            t: 3400,
            kind: 'info',
            msg: 'Checking FK01 (Vendor Create) against existing FBL1N (Vendor Line Items)…',
          },
          {
            t: 4400,
            kind: 'warn',
            msg: '⚠ CONFLICT: FK01 + FBL1N = Vendor create AND view · data manipulation risk',
          },
          {
            t: 5400,
            kind: 'warn',
            msg: 'SoD check result: 2 violations detected · risk score 72 · HiTL required',
          },
        ],
        output:
          'SoD CONFLICT · F110+F-53: payment cycle violation · FK01+FBL1N: vendor data risk · Risk 72/100 · HiTL required',
        conflict: {
          violations: [
            {
              rule: 'Payment Cycle SoD',
              role1: 'F110 — Payment Run (Execute)',
              role2: 'F-53 — Post Outgoing Payment',
              severity: 'HIGH',
              risk: 'User can initiate AND post payments — full payment cycle without segregation',
            },
            {
              rule: 'Vendor Master SoD',
              role1: 'FK01 — Vendor Create',
              role2: 'FBL1N — Vendor Line Items',
              severity: 'MEDIUM',
              risk: 'User can create vendors AND view their transaction history',
            },
          ],
        },
      },
      {
        id: 'hitl',
        label: 'Human Decision',
        icon: '👤',
        agent: 'HiTL Console',
        color: '#DC2626',
        duration: 0,
        auto: false,
        isHiTL: true,
        events: [],
        output: '',
      },
      {
        id: 'prov',
        label: 'Provision with Controls',
        icon: '⚡',
        agent: 'Remediation Agent',
        color: '#D97706',
        duration: 5000,
        auto: true,
        events: [
          {
            t: 400,
            kind: 'info',
            msg: 'HiTL approval received — provisioning with compensating controls',
          },
          {
            t: 1200,
            kind: 'info',
            msg: 'Assigning F110 (Execute) — payment workflow approval limit set: €50K',
          },
          {
            t: 2200,
            kind: 'info',
            msg: 'Assigning FK01 — vendor creation requires dual-control approval flag',
          },
          {
            t: 3000,
            kind: 'info',
            msg: 'Assigning FB01 — standard document posting, no restriction',
          },
          {
            t: 3800,
            kind: 'info',
            msg: 'Logging compensating controls in SAP GRC risk register',
          },
          {
            t: 4600,
            kind: 'success',
            msg: 'All 3 roles assigned with controls · mitigations logged · audit trail complete',
          },
        ],
        output:
          '3 roles assigned · F110 limit €50K · FK01 dual-control · GRC risk register updated · audit trail complete',
      },
      {
        id: 'close',
        label: 'Close & Notify',
        icon: '✅',
        agent: 'Change Validator',
        color: '#16A34A',
        duration: 2500,
        auto: true,
        events: [
          {
            t: 400,
            kind: 'info',
            msg: 'Updating SR-AG-00161 in ServiceNow — status Fulfilled',
          },
          {
            t: 1000,
            kind: 'info',
            msg: 'Notifying t.bauer@enterprise.com · K.Weber · Security Officer',
          },
          {
            t: 1800,
            kind: 'success',
            msg: 'SR-AG-00161 closed · MTTR: 12m 34s (incl. HiTL) · full audit trail',
          },
        ],
        output:
          'SR-AG-00161 closed · all parties notified · compensating controls documented in GRC',
      },
    ],
  },
];

function SoDConflictCard({ conflict }) {
  return (
    <div style={{ marginTop: 10 }}>
      {conflict.violations.map((v, i) => (
        <div
          key={i}
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 8,
            background: 'rgba(220,38,38,0.04)',
            border: '1px solid rgba(220,38,38,0.2)',
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
            <div style={{ fontSize: 11, fontWeight: 700, color: '#DC2626' }}>
              ⚠ {v.rule}
            </div>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: v.severity === 'HIGH' ? '#DC2626' : '#D97706',
                background:
                  v.severity === 'HIGH'
                    ? 'rgba(220,38,38,0.1)'
                    : 'rgba(217,119,6,0.1)',
                border: `1px solid ${
                  v.severity === 'HIGH'
                    ? 'rgba(220,38,38,0.3)'
                    : 'rgba(217,119,6,0.3)'
                }`,
                borderRadius: 4,
                padding: '2px 7px',
              }}
            >
              {v.severity} RISK
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginBottom: 6,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 10,
                background: 'rgba(220,38,38,0.08)',
                color: '#DC2626',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 4,
                padding: '2px 8px',
                fontFamily: 'monospace',
              }}
            >
              {v.role1}
            </span>
            <span style={{ fontSize: 11, color: C.MUTED, alignSelf: 'center' }}>
              +
            </span>
            <span
              style={{
                fontSize: 10,
                background: 'rgba(220,38,38,0.08)',
                color: '#DC2626',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 4,
                padding: '2px 8px',
                fontFamily: 'monospace',
              }}
            >
              {v.role2}
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.5 }}>
            {v.risk}
          </div>
        </div>
      ))}
    </div>
  );
}

function HiTLConsole({ request, conflict, onApprove, onReject }) {
  const [decision, setDecision] = useState(''); // "" | "approve" | "reject"
  const [mitigation, setMitigation] = useState(
    'Dual-control approval for payments over €50,000. Quarterly access review scheduled.'
  );

  if (decision === 'approved')
    return (
      <div
        style={{
          background: '#fff',
          border: '2px solid rgba(22,163,74,0.3)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {/* Approved header */}
        <div
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg,#15803D,#166534)',
            color: '#fff',
          }}
        >
          <div
            style={{
              fontSize: 9,
              opacity: 0.8,
              fontFamily: 'monospace',
              letterSpacing: 2,
              marginBottom: 4,
            }}
          >
            HUMAN-IN-THE-LOOP · DECISION RECORDED
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            ✅ Approved with Compensating Controls
          </div>
          <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
            {request.ref} · {request.user} · {request.dept}
          </div>
        </div>

        <div style={{ padding: '14px 16px' }}>
          {/* Approver + Security officer */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(22,163,74,0.04)',
                border: '1px solid rgba(22,163,74,0.2)',
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
                APPROVED BY
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>
                {request.manager}
              </div>
              <div style={{ fontSize: 10, color: C.MUTED }}>
                Group Finance Lead · 11 seconds
              </div>
            </div>
            <div
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(124,58,237,0.04)',
                border: '1px solid rgba(124,58,237,0.15)',
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
                SECURITY OFFICER
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>
                Anna Fischer
              </div>
              <div style={{ fontSize: 10, color: C.MUTED }}>
                IT Security Lead · notified
              </div>
            </div>
          </div>

          {/* SoD violations reviewed */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#DC2626',
              marginBottom: 6,
            }}
          >
            SoD violations reviewed and mitigated:
          </div>
          <SoDConflictCard conflict={conflict} />

          {/* Compensating controls applied */}
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(22,163,74,0.05)',
              border: '1px solid rgba(22,163,74,0.2)',
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: C.GREEN,
                fontFamily: 'monospace',
                letterSpacing: 1.5,
                marginBottom: 5,
              }}
            >
              COMPENSATING CONTROLS APPLIED
            </div>
            <div style={{ fontSize: 11, color: '#1E293B', lineHeight: 1.6 }}>
              {mitigation}
            </div>
          </div>

          {/* Audit trail */}
          <div style={{ marginTop: 14 }}>
            <div
              style={{
                fontSize: 9,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              AUDIT TRAIL
            </div>
            {[
              {
                t: '00:00',
                icon: '📋',
                label: 'SR raised in ServiceNow',
                color: '#2563EB',
                kind: 'info',
              },
              {
                t: '00:08',
                icon: '🔐',
                label: 'SoD check triggered via SAP GRC API',
                color: '#7C3AED',
                kind: 'info',
              },
              {
                t: '00:22',
                icon: '⚠',
                label: '2 violations detected · risk 72/100 · HiTL required',
                color: '#DC2626',
                kind: 'warn',
              },
              {
                t: '00:31',
                icon: '👤',
                label: `HiTL raised to ${request.manager} via Teams + Email`,
                color: '#D97706',
                kind: 'warn',
              },
              {
                t: '11:34',
                icon: '✓',
                label: `${request.manager} approved with controls · 11 seconds decision time`,
                color: C.GREEN,
                kind: 'success',
              },
              {
                t: '11:38',
                icon: '🔧',
                label:
                  'ZeroOps provisioning — BAPI_USER_ACTGROUPS_ASSIGN executed',
                color: '#2563EB',
                kind: 'info',
              },
              {
                t: '12:04',
                icon: '📊',
                label:
                  'GRC risk register updated · mitigations logged · evidence attached',
                color: '#7C3AED',
                kind: 'info',
              },
              {
                t: '12:34',
                icon: '✅',
                label:
                  'SR-AG-00161 closed in ServiceNow · Thomas Bauer notified',
                color: C.GREEN,
                kind: 'success',
              },
            ].map((row, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: C.MUTED,
                    fontFamily: 'monospace',
                    flexShrink: 0,
                    width: 36,
                    paddingTop: 1,
                  }}
                >
                  {row.t}
                </span>
                <span style={{ fontSize: 11, flexShrink: 0 }}>{row.icon}</span>
                <span
                  style={{
                    fontSize: 11,
                    color:
                      row.kind === 'success'
                        ? C.GREEN
                        : row.kind === 'warn'
                        ? '#DC2626'
                        : '#475569',
                    lineHeight: 1.5,
                  }}
                >
                  {row.label}
                </span>
              </div>
            ))}
          </div>

          {/* MTTR metric */}
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              borderRadius: 7,
              background: 'rgba(37,99,235,0.04)',
              border: '1px solid rgba(37,99,235,0.15)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 11, color: '#475569' }}>
              Total MTTR (incl. HiTL) · Full audit trail in ServiceNow and SAP
              GRC
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: C.GREEN,
                fontFamily: 'monospace',
              }}
            >
              12m 34s
            </span>
          </div>
        </div>
      </div>
    );

  if (decision === 'rejected')
    return (
      <div
        style={{
          padding: '14px 16px',
          borderRadius: 8,
          background: 'rgba(220,38,38,0.04)',
          border: '1px solid rgba(220,38,38,0.2)',
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#DC2626',
            marginBottom: 4,
          }}
        >
          ❌ Request rejected — SoD violation not mitigatable
        </div>
        <div style={{ fontSize: 11, color: '#64748B' }}>
          SR-AG-00161 returned to requestor with SoD violation detail.
        </div>
      </div>
    );

  return (
    <div
      style={{
        background: '#fff',
        border: '2px solid rgba(220,38,38,0.3)',
        borderRadius: 10,
        overflow: 'hidden',
      }}
    >
      {/* HiTL header */}
      <div
        style={{
          padding: '12px 16px',
          background: 'linear-gradient(135deg,#DC2626,#9F1239)',
          color: '#fff',
        }}
      >
        <div
          style={{
            fontSize: 9,
            opacity: 0.8,
            fontFamily: 'monospace',
            letterSpacing: 2,
            marginBottom: 4,
          }}
        >
          HUMAN-IN-THE-LOOP · APPROVAL REQUIRED
        </div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          SoD Conflict — Manager Review
        </div>
        <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
          {request.ref} · {request.user} · {request.dept}
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Approver info */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(37,99,235,0.04)',
              border: '1px solid rgba(37,99,235,0.15)',
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
              LINE MANAGER
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>
              {request.manager}
            </div>
            <div style={{ fontSize: 10, color: C.MUTED }}>
              Group Finance Lead
            </div>
          </div>
          <div
            style={{
              flex: 1,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(124,58,237,0.04)',
              border: '1px solid rgba(124,58,237,0.15)',
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
              SECURITY OFFICER
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>
              Anna Fischer
            </div>
            <div style={{ fontSize: 10, color: C.MUTED }}>IT Security Lead</div>
          </div>
        </div>

        {/* Violations summary */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#DC2626',
            marginBottom: 6,
          }}
        >
          2 SoD violations require review:
        </div>
        <SoDConflictCard conflict={conflict} />

        {/* Mitigation input */}
        <div style={{ marginTop: 12 }}>
          <div
            style={{
              fontSize: 11,
              color: '#0F172A',
              fontWeight: 600,
              marginBottom: 6,
            }}
          >
            Compensating controls (if approving):
          </div>
          <textarea
            value={mitigation}
            onChange={(e) => setMitigation(e.target.value)}
            style={{
              width: '100%',
              minHeight: 60,
              padding: '8px 10px',
              borderRadius: 7,
              border: '1px solid #CBD5E1',
              fontSize: 11,
              color: '#475569',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => {
              setDecision('approved');
              setTimeout(() => onApprove(mitigation), 800);
            }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 7,
              border: 'none',
              cursor: 'pointer',
              background: 'linear-gradient(135deg,#16A34A,#15803D)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'inherit',
            }}
          >
            ✓ Approve with Controls
          </button>
          <button
            onClick={() => {
              setDecision('rejected');
              setTimeout(onReject, 800);
            }}
            style={{
              flex: 1,
              padding: '9px 0',
              borderRadius: 7,
              border: '1px solid rgba(220,38,38,0.3)',
              cursor: 'pointer',
              background: 'rgba(220,38,38,0.04)',
              color: '#DC2626',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'inherit',
            }}
          >
            ✕ Reject
          </button>
        </div>
      </div>
    </div>
  );
}

// ── SAP Access Simulation Modal ───────────────────────────────
function SAPAccessSim({ onClose }) {
  const [selScenario, setSelScenario] = useState(null);
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [doneSteps, setDoneSteps] = useState([]);
  const [visEvents, setVisEvents] = useState([]);
  const [hitlDone, setHiTLDone] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [done, setDone] = useState(false);
  const [selStep, setSelStep] = useState(null);
  const logRef = useRef(null);
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const reset = (keepScenario = false) => {
    clearTimers();
    setRunning(false);
    setStepIdx(-1);
    setDoneSteps([]);
    setVisEvents([]);
    setHiTLDone(false);
    setRejected(false);
    setDone(false);
    setSelStep(null);
    if (!keepScenario) setSelScenario(null);
  };

  const runStep = (idx, scenario) => {
    const steps = scenario.steps;
    if (idx >= steps.length) {
      setRunning(false);
      setDone(true);
      return;
    }
    const step = steps[idx];

    // HiTL step — pause and wait for human action
    if (step.isHiTL) {
      setStepIdx(idx);
      setSelStep(step);
      setVisEvents([]);
      return;
    }

    setStepIdx(idx);
    setSelStep(step);
    setVisEvents([]);

    step.events.forEach((ev) => {
      const t = setTimeout(() => {
        setVisEvents((prev) => [...prev, { ...ev, visible: false }]);
        setTimeout(
          () =>
            setVisEvents((prev) =>
              prev.map((e, i) =>
                i === prev.length - 1 ? { ...e, visible: true } : e
              )
            ),
          50
        );
        if (logRef.current)
          logRef.current.scrollTop = logRef.current.scrollHeight;
      }, ev.t);
      timers.current.push(t);
    });

    const next = setTimeout(() => {
      setDoneSteps((prev) => [...prev, idx]);
      runStep(idx + 1, scenario);
    }, step.duration);
    timers.current.push(next);
  };

  const start = () => {
    reset(true);
    setRunning(true);
    runStep(0, selScenario);
  };

  const handleApprove = (mitigation) => {
    setHiTLDone(true);
    const idx = selScenario.steps.findIndex((s) => s.isHiTL);
    setDoneSteps((prev) => [...prev, idx]);
    setTimeout(() => runStep(idx + 1, selScenario), 400);
  };

  const handleReject = () => {
    setRejected(true);
    setRunning(false);
    setDone(true);
  };

  const steps = selScenario?.steps || [];
  const activeStep = stepIdx >= 0 ? steps[stepIdx] : null;
  const displayStep = selStep || activeStep;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#F8FAFC',
          borderRadius: 14,
          width: '100%',
          maxWidth: 960,
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div
          style={{
            padding: '16px 22px',
            background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
            color: '#fff',
            flexShrink: 0,
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
                marginBottom: 4,
              }}
            >
              SAP ACCESS PROVISIONING · {ITSM}
            </div>
            <div style={{ fontSize: 18, fontWeight: 800 }}>
              {selScenario
                ? selScenario.request.ref + ' — ' + selScenario.request.user
                : 'SAP User Access Request'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
              {selScenario
                ? `${selScenario.request.role} · ${selScenario.request.dept} · ${selScenario.request.costCentre}`
                : 'SoD check · auto-provision · HiTL conflict resolution'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {selScenario && !running && (
              <button
                onClick={() => reset()}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ← Scenarios
              </button>
            )}
            {selScenario && !running && !done && (
              <button
                onClick={start}
                style={{
                  padding: '6px 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ▶ Run Simulation
              </button>
            )}
            {done && (
              <button
                onClick={() => reset(true)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: 11,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ↺ Reset
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                border: 'none',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                fontSize: 16,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* ── SCENARIO SELECTOR ── */}
          {!selScenario && (
            <div style={{ padding: 24 }}>
              <div
                style={{
                  fontSize: 13,
                  color: C.MUTED,
                  marginBottom: 18,
                  textAlign: 'center',
                }}
              >
                Select a scenario to simulate
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                {SCENARIOS.map((sc) => (
                  <div
                    key={sc.id}
                    onClick={() => setSelScenario(sc)}
                    style={{
                      padding: '20px 22px',
                      borderRadius: 12,
                      cursor: 'pointer',
                      border: `2px solid ${sc.color}22`,
                      background: '#fff',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = `${sc.color}55`;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = `0 8px 24px ${sc.color}18`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${sc.color}22`;
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
                        height: 4,
                        background: sc.badgeColor,
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 12,
                        marginTop: 4,
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 11,
                          background: `${sc.color}15`,
                          border: `1px solid ${sc.color}25`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 22,
                        }}
                      >
                        {sc.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 10,
                            color: sc.badgeColor,
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            letterSpacing: 1.5,
                            marginBottom: 2,
                          }}
                        >
                          {sc.badge}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#0F172A',
                          }}
                        >
                          {sc.label}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#64748B',
                        lineHeight: 1.6,
                        marginBottom: 14,
                      }}
                    >
                      {sc.desc}
                    </div>
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: 'rgba(0,0,0,0.02)',
                        border: `1px solid ${C.BORDER}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: C.MUTED,
                          fontFamily: 'monospace',
                          letterSpacing: 1.5,
                          marginBottom: 6,
                        }}
                      >
                        REQUESTED ROLES
                      </div>
                      {sc.request.requested.map((r, i) => (
                        <div
                          key={i}
                          style={{
                            fontSize: 11,
                            color: '#1E293B',
                            fontFamily: 'monospace',
                            marginBottom: 3,
                          }}
                        >
                          → {r}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Context strip */}
              <div
                style={{
                  padding: '14px 18px',
                  background:
                    'linear-gradient(135deg,rgba(37,99,235,0.06),rgba(124,58,237,0.04))',
                  border: '1px solid rgba(37,99,235,0.15)',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div style={{ fontSize: 22 }}>🔐</div>
                <div
                  style={{ fontSize: 11, color: '#64748B', lineHeight: 1.7 }}
                >
                  <strong style={{ color: '#0F172A' }}>
                    ZeroOps SAP Access Provisioning
                  </strong>{' '}
                  — every request runs an automated SoD check via SAP GRC before
                  any role is assigned. Clean requests are auto-provisioned in
                  minutes. Conflicts surface for human review with full context
                  — risk, violation detail, and compensating controls suggested.
                  Full audit trail in ServiceNow.
                </div>
              </div>
            </div>
          )}

          {/* ── SIMULATION VIEW ── */}
          {selScenario && (
            <div
              style={{
                padding: 20,
                display: 'grid',
                gridTemplateColumns: '200px 1fr',
                gap: 16,
              }}
            >
              {/* Step pipeline */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Request card */}
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: '#fff',
                    border: `1px solid ${C.BORDER}`,
                    marginBottom: 4,
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
                    REQUEST
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#0F172A',
                      marginBottom: 2,
                    }}
                  >
                    {selScenario.request.user}
                  </div>
                  <div
                    style={{ fontSize: 10, color: '#64748B', marginBottom: 6 }}
                  >
                    {selScenario.request.role}
                  </div>
                  {selScenario.request.requested.map((r, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 9,
                        color: '#7C3AED',
                        fontFamily: 'monospace',
                        marginBottom: 2,
                        background: 'rgba(124,58,237,0.06)',
                        border: '1px solid rgba(124,58,237,0.15)',
                        borderRadius: 4,
                        padding: '2px 6px',
                      }}
                    >
                      {r.split(' — ')[0]}
                    </div>
                  ))}
                </div>

                {steps.map((step, i) => {
                  const isDone =
                    doneSteps.includes(i) || (step.isHiTL && hitlDone);
                  const isAct = stepIdx === i;
                  const col = isDone ? C.GREEN : isAct ? step.color : '#94A3B8';
                  return (
                    <div
                      key={step.id}
                      onClick={() => (isDone || isAct) && setSelStep(step)}
                      style={{
                        padding: '9px 11px',
                        borderRadius: 7,
                        cursor: isDone || isAct ? 'pointer' : 'default',
                        border: `1.5px solid ${
                          isAct
                            ? step.color + '55'
                            : isDone
                            ? C.GREEN + '44'
                            : C.BORDER
                        }`,
                        background: isAct
                          ? `${step.color}07`
                          : isDone
                          ? 'rgba(22,163,74,0.03)'
                          : '#FAFAFA',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {(isAct || isDone) && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            height: 2,
                            background: isDone ? C.GREEN : step.color,
                          }}
                        />
                      )}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 7,
                          marginBottom: 3,
                        }}
                      >
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 5,
                            flexShrink: 0,
                            background: isDone
                              ? 'rgba(22,163,74,0.12)'
                              : isAct
                              ? `${step.color}15`
                              : 'rgba(0,0,0,0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                          }}
                        >
                          {isDone && !step.isHiTL
                            ? '✅'
                            : step.isHiTL && hitlDone
                            ? '✅'
                            : step.icon}
                        </div>
                        <div
                          style={{ fontSize: 11, fontWeight: 700, color: col }}
                        >
                          {step.label}
                        </div>
                      </div>
                      <div style={{ fontSize: 9, color: '#94A3B8' }}>
                        {step.agent}
                      </div>
                      {step.isHiTL && isAct && !hitlDone && (
                        <div
                          style={{
                            fontSize: 9,
                            color: '#DC2626',
                            fontWeight: 600,
                            marginTop: 3,
                          }}
                        >
                          ⏳ Awaiting approval
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Detail panel */}
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {/* Active step detail */}
                {displayStep && !displayStep.isHiTL && (
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
                        padding: '12px 16px',
                        borderBottom: `1px solid ${C.BORDER}`,
                        background: `${displayStep.color}07`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                        }}
                      >
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: 7,
                            background: `${displayStep.color}15`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 15,
                          }}
                        >
                          {displayStep.icon}
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: '#0F172A',
                            }}
                          >
                            {displayStep.label}
                          </div>
                          <div style={{ fontSize: 10, color: C.MUTED }}>
                            Agent: {displayStep.agent}
                          </div>
                        </div>
                      </div>
                      {stepIdx === steps.indexOf(displayStep) && running && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <div
                            style={{
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: displayStep.color,
                              animation: 'pulse 1s infinite',
                            }}
                          />
                          <span
                            style={{
                              fontSize: 10,
                              color: displayStep.color,
                              fontFamily: 'monospace',
                              fontWeight: 600,
                            }}
                          >
                            RUNNING
                          </span>
                        </div>
                      )}
                      {doneSteps.includes(steps.indexOf(displayStep)) && (
                        <span
                          style={{
                            fontSize: 11,
                            color: C.GREEN,
                            fontWeight: 600,
                          }}
                        >
                          ✅ Complete
                        </span>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                      }}
                    >
                      {/* Event log */}
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRight: `1px solid ${C.BORDER}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            color: C.MUTED,
                            fontFamily: 'monospace',
                            letterSpacing: 2,
                            marginBottom: 8,
                          }}
                        >
                          ACTIVITY LOG
                        </div>
                        <div
                          ref={logRef}
                          style={{ maxHeight: 220, overflowY: 'auto' }}
                        >
                          {stepIdx === steps.indexOf(displayStep)
                            ? visEvents.map((ev, i) => {
                                const s = {
                                  info: { c: C.BLUE, icon: 'ℹ' },
                                  warn: { c: C.AMBER, icon: '⚠' },
                                  success: { c: C.GREEN, icon: '✓' },
                                }[ev.kind] || { c: C.MUTED, icon: '·' };
                                return (
                                  <div
                                    key={i}
                                    style={{
                                      display: 'flex',
                                      gap: 7,
                                      padding: '4px 0',
                                      opacity: ev.visible ? 1 : 0,
                                      transform: ev.visible
                                        ? 'translateY(0)'
                                        : 'translateY(4px)',
                                      transition:
                                        'opacity 0.3s, transform 0.3s',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: s.c,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {s.icon}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: '#475569',
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {ev.msg}
                                    </span>
                                  </div>
                                );
                              })
                            : displayStep.events.map((ev, i) => {
                                const s = {
                                  info: { c: C.BLUE, icon: 'ℹ' },
                                  warn: { c: C.AMBER, icon: '⚠' },
                                  success: { c: C.GREEN, icon: '✓' },
                                }[ev.kind] || { c: C.MUTED, icon: '·' };
                                return (
                                  <div
                                    key={i}
                                    style={{
                                      display: 'flex',
                                      gap: 7,
                                      padding: '4px 0',
                                    }}
                                  >
                                    <span
                                      style={{
                                        fontSize: 10,
                                        color: s.c,
                                        fontWeight: 700,
                                        flexShrink: 0,
                                      }}
                                    >
                                      {s.icon}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 11,
                                        color: '#475569',
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {ev.msg}
                                    </span>
                                  </div>
                                );
                              })}
                        </div>
                      </div>

                      {/* Output */}
                      <div style={{ padding: '12px 16px' }}>
                        <div
                          style={{
                            fontSize: 9,
                            color: C.MUTED,
                            fontFamily: 'monospace',
                            letterSpacing: 2,
                            marginBottom: 8,
                          }}
                        >
                          OUTPUT
                        </div>
                        {displayStep.output ? (
                          <div
                            style={{
                              padding: '10px 12px',
                              borderRadius: 7,
                              background: 'rgba(0,0,0,0.02)',
                              border: `1px solid ${C.BORDER}`,
                              fontSize: 11,
                              color: '#1E293B',
                              lineHeight: 1.6,
                            }}
                          >
                            {displayStep.output}
                          </div>
                        ) : (
                          <div
                            style={{
                              fontSize: 11,
                              color: C.MUTED,
                              fontStyle: 'italic',
                            }}
                          >
                            Run simulation to see output
                          </div>
                        )}
                        {displayStep.hasConflict &&
                          displayStep.conflict &&
                          doneSteps.includes(steps.indexOf(displayStep)) && (
                            <SoDConflictCard conflict={displayStep.conflict} />
                          )}
                      </div>
                    </div>
                  </div>
                )}

                {/* HiTL console */}
                {displayStep?.isHiTL &&
                  stepIdx === steps.indexOf(displayStep) &&
                  !hitlDone &&
                  !rejected && (
                    <HiTLConsole
                      request={selScenario.request}
                      conflict={steps.find((s) => s.hasConflict)?.conflict}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  )}

                {/* Done outcome */}
                {done && (
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: 10,
                      background: rejected
                        ? 'rgba(220,38,38,0.04)'
                        : 'linear-gradient(135deg,rgba(22,163,74,0.08),rgba(37,99,235,0.04))',
                      border: rejected
                        ? '1px solid rgba(220,38,38,0.2)'
                        : '1px solid rgba(22,163,74,0.2)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        color: rejected ? '#DC2626' : C.GREEN,
                        marginBottom: 6,
                      }}
                    >
                      {rejected
                        ? '❌ Request Rejected'
                        : '✅ Access Provisioned'}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#64748B',
                        marginBottom: 10,
                        lineHeight: 1.6,
                      }}
                    >
                      {rejected
                        ? `SR-AG-00161 returned to ${selScenario.request.user} — SoD violation cannot be mitigated. Request will require role redesign.`
                        : selScenario.id === 'clean'
                        ? `${selScenario.request.user} has full access to all 3 requested SAP roles. MTTR: 4 min 12 sec. Zero BASIS admin involvement.`
                        : `${selScenario.request.user} provisioned with compensating controls. MTTR: 12 min 34 sec including HiTL approval. Full GRC audit trail.`}
                    </div>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3,1fr)',
                        gap: 10,
                      }}
                    >
                      {(rejected
                        ? [
                            ['Outcome', 'Rejected', '#DC2626'],
                            ['SoD Violations', '2 found', '#DC2626'],
                            ['Audit Trail', 'Complete', C.MUTED],
                          ]
                        : selScenario.id === 'clean'
                        ? [
                            ['MTTR', '4m 12s', C.GREEN],
                            ['Roles Granted', '3 / 3', C.GREEN],
                            ['BASIS Admin', 'Zero', C.GREEN],
                          ]
                        : [
                            ['MTTR', '12m 34s', C.GREEN],
                            ['HiTL Time', '11 sec', C.BLUE],
                            ['GRC Controls', '2 added', '#7C3AED'],
                          ]
                      ).map(([l, v, c]) => (
                        <div
                          key={l}
                          style={{
                            background: 'rgba(255,255,255,0.8)',
                            borderRadius: 7,
                            padding: '10px 12px',
                            border: `1px solid ${c}22`,
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
                            {l.toUpperCase()}
                          </div>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 800,
                              color: c,
                              fontFamily: 'monospace',
                            }}
                          >
                            {v}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {!displayStep && !done && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 300,
                      background: '#fff',
                      borderRadius: 10,
                      border: `1px solid ${C.BORDER}`,
                    }}
                  >
                    <div style={{ fontSize: 36, marginBottom: 10 }}>🔐</div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: '#0F172A',
                        marginBottom: 6,
                      }}
                    >
                      {selScenario.label}
                    </div>
                    <div style={{ fontSize: 11, color: C.MUTED }}>
                      Click Run Simulation to start the access provisioning flow
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function ServiceRequestPage() {
  const [catFilter, setCatFilter] = useState('ALL');
  const [showSim, setShowSim] = useState(false);
  const [selGroup, setSelGroup] = useState(null);

  const allRequests = REQUEST_CATALOGUE.flatMap((g) =>
    (g.items || g.requests || []).map((r) => ({
      ...r,
      group: g.type,
      cat: g.category,
    }))
  );
  const filteredCat = REQUEST_CATALOGUE.filter(
    (g) => catFilter === 'ALL' || g.category === catFilter
  );
  const totalMonthly = allRequests.reduce(
    (s, r) => s + (r.volume ? parseInt(r.volume) : r.monthly || 1),
    0
  );
  const overallAuto = REQUEST_STATS.autoRate || 72;

  return (
    <div style={{ padding: 22 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 18,
        }}
      >
        <div>
          <Lbl n="6">Service Requests</Lbl>
          <div style={{ fontSize: 11, color: C.MUTED, marginTop: 2 }}>
            Incidents from {ITSM} — {overallAuto}% auto-fulfilled
          </div>
        </div>
        <button
          onClick={() => setShowSim(true)}
          style={{
            background: 'linear-gradient(135deg,#7C3AED,#1d4ed8)',
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            padding: '8px 18px',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 3px 12px rgba(124,58,237,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          🔐 Simulate SAP Access Provisioning
        </button>
      </div>

      {/* KPI strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: 10,
          marginBottom: 18,
        }}
      >
        {[
          {
            label: 'Total Today',
            value: REQUEST_STATS.totalToday || 22,
            color: C.BLUE,
            sub: 'requests received',
          },
          {
            label: 'Auto-Fulfilled',
            value: REQUEST_STATS.autoFulfilled || 8,
            color: C.GREEN,
            sub: `${overallAuto}% fulfilment rate`,
          },
          {
            label: 'Avg Fulfilment Time',
            value: REQUEST_STATS.avgTime || '6m',
            color: C.GREEN,
            sub: 'vs ~45 min manual',
          },
          {
            label: 'Awaiting Approval',
            value: REQUEST_STATS.awaitingApproval || 2,
            color: C.AMBER,
            sub: 'HiTL pending',
          },
          {
            label: 'Engineer Hours Saved',
            value: `${Math.round((REQUEST_STATS.timeSavedMins || 248) / 60)}h`,
            color: '#7C3AED',
            sub: 'this month',
          },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              background: '#fff',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 9,
              padding: '12px 14px',
              borderTop: `3px solid ${k.color}`,
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
              {k.label.toUpperCase()}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: k.color,
                fontFamily: 'monospace',
                lineHeight: 1,
              }}
            >
              {k.value}
            </div>
            <div style={{ fontSize: 10, color: C.MUTED, marginTop: 4 }}>
              {k.sub}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 14 }}
      >
        {/* Catalogue */}
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
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              Request Catalogue
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {['ALL', 'IT', 'SAP'].map((f) => (
                <div
                  key={f}
                  onClick={() => setCatFilter(f)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: 6,
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: catFilter === f ? 700 : 400,
                    background:
                      catFilter === f
                        ? 'rgba(37,99,235,0.1)'
                        : 'rgba(0,0,0,0.03)',
                    color: catFilter === f ? '#1D4ED8' : C.MUTED,
                    border: `1px solid ${
                      catFilter === f ? 'rgba(37,99,235,0.3)' : C.BORDER
                    }`,
                  }}
                >
                  {f === 'ALL' ? 'All' : f === 'IT' ? '🖥 IT' : '🏢 SAP'}
                </div>
              ))}
            </div>
          </div>

          {filteredCat.map((group) => (
            <div key={group.id || group.type} style={{ marginBottom: 12 }}>
              <div
                onClick={() =>
                  setSelGroup(selGroup === group.type ? null : group.type)
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  background:
                    selGroup === group.type
                      ? 'rgba(37,99,235,0.05)'
                      : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${
                    selGroup === group.type ? 'rgba(37,99,235,0.2)' : C.BORDER
                  }`,
                  marginBottom: selGroup === group.type ? 8 : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: 4,
                      background:
                        group.category === 'SAP' ? '#0078D4' : '#475569',
                    }}
                  >
                    {group.category}
                  </span>
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}
                  >
                    {group.type}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: C.MUTED }}>
                  {selGroup === group.type ? '▲' : '▼'}
                </span>
              </div>

              {selGroup === group.type && (
                <div
                  style={{
                    border: `1px solid ${C.BORDER}`,
                    borderRadius: 7,
                    overflow: 'hidden',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          background: 'rgba(0,0,0,0.02)',
                          borderBottom: `2px solid ${C.BORDER}`,
                        }}
                      >
                        {[
                          'Request Type',
                          'Volume/Month',
                          'Auto-Rate',
                          'Avg Time',
                          'SLA',
                        ].map((h) => (
                          <th
                            key={h}
                            style={{
                              padding: '7px 12px',
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
                      {(group.items || group.requests || []).map((req, i) => (
                        <tr
                          key={req.name || req.id}
                          style={{
                            borderBottom: `1px solid rgba(0,0,0,0.05)`,
                            background:
                              i % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.01)',
                          }}
                        >
                          <td
                            style={{
                              padding: '8px 12px',
                              fontWeight: 500,
                              color: '#1E293B',
                            }}
                          >
                            {req.name}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              fontFamily: 'monospace',
                              color: C.MUTED,
                            }}
                          >
                            {req.volume || `${req.monthly || '—'}/mo`}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <AutoBar
                              rate={parseInt(req.auto) || req.autoRate || 0}
                            />
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              fontFamily: 'monospace',
                              color: C.MUTED,
                            }}
                          >
                            {req.baseline || req.avgTime || '—'}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              fontFamily: 'monospace',
                              color: C.MUTED,
                            }}
                          >
                            {req.sla || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Live queue */}
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
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
              LIVE QUEUE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: C.GREEN,
                  boxShadow: `0 0 6px ${C.GREEN}`,
                  animation: 'livePulse 1.6s infinite',
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {(REQUEST_QUEUE || []).map((req) => (
              <div
                key={req.id}
                style={{
                  padding: '9px 12px',
                  borderRadius: 7,
                  background:
                    req.status === 'Awaiting Approval'
                      ? 'rgba(217,119,6,0.04)'
                      : 'rgba(0,0,0,0.02)',
                  border: `1px solid ${
                    req.status === 'Awaiting Approval'
                      ? 'rgba(217,119,6,0.25)'
                      : C.BORDER
                  }`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: 10,
                      color: C.BLUE,
                      fontWeight: 600,
                    }}
                  >
                    {req.id}
                  </span>
                  <StatusBadge status={req.status} />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#1E293B',
                    marginBottom: 3,
                  }}
                >
                  {req.name || req.type}
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontSize: 10, color: C.MUTED }}>
                    {req.user}
                  </span>
                  <span
                    style={{
                      fontSize: 9,
                      color: C.MUTED,
                      fontFamily: 'monospace',
                    }}
                  >
                    {req.raised || req.submitted}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Talking point */}
          <div
            style={{
              marginTop: 14,
              padding: '10px 14px',
              background: 'rgba(124,58,237,0.04)',
              border: '1px solid rgba(124,58,237,0.15)',
              borderRadius: 8,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: '#7C3AED',
                fontWeight: 600,
                marginBottom: 3,
              }}
            >
              🔐 Every SAP access request runs SoD check
            </div>
            <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.6 }}>
              Clean: auto-provisioned in minutes. Conflict: surfaced for human
              review with full context. No SAP BASIS admin involved unless
              genuinely needed.
            </div>
          </div>
        </div>
      </div>

      {showSim && <SAPAccessSim onClose={() => setShowSim(false)} />}
      <style>{`
        @keyframes livePulse{0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.4)}70%{box-shadow:0 0 0 6px rgba(22,163,74,0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>
    </div>
  );
}
