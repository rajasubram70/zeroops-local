import { useState, useRef, useEffect, useCallback } from 'react';
import { C, lc, oc } from '../config/theme.js';
import { Tag, Lbl } from '../components/atoms.jsx';
import { CUSTOMER, SCENARIOS_JSON } from '../data/customer/loader.js';

// Use customer JSON scenarios if available, fall back to full Ericsson set
const SCENARIOS =
  SCENARIOS_JSON && SCENARIOS_JSON.length > 0 ? SCENARIOS_JSON : [];

// COT_BY_SCENARIO: customer scenario reasoning entries can be added here.
// An empty object is safe — the "View Reasoning" link simply won't appear.
const COT_BY_SCENARIO = {};

// ── AGENT DEFINITIONS — orchestrator-native view (Azure AI Foundry) ─────────
const AGENT_DEFS = {
  'Alert Correlator': {
    orchestrator: 'Azure AI Foundry',
    orchType: 'Prompt Flow',
    model: 'GPT-4o (2025-04)',
    icon: '🔗',
    color: '#2563EB',
    purpose:
      'Ingests raw alert streams from CrowdStrike, Azure Monitor, Dynatrace and Zscaler. Deduplicates, clusters semantically, and reduces to unique causal incidents.',
    systemPrompt:
      'You are an alert correlation specialist. Given a stream of monitoring alerts, identify duplicate signals, cluster alerts sharing a common root cause, and produce a minimal set of unique incidents. Apply semantic similarity — two alerts with different text but identical underlying cause are duplicates. Return a JSON array of incidents with: id, priority, rootCauseHypothesis, evidenceAlerts[], suppressedCount.',
    tools: [
      'CrowdStrike Falcon API',
      'Azure Monitor REST',
      'Dynatrace Events API',
      'Zscaler NSS',
      'ServiceNow Incident API',
    ],
    inputSchema:
      'Alert stream: [{alertId, source, severity, message, timestamp, ciRef}]',
    outputSchema:
      'Incidents: [{incidentId, pri, hypothesis, confidence, evidenceCount, suppressedCount}]',
    maxTokens: 2048,
    temperature: 0.1,
    successRate: '99.1%',
    avgDuration: '0.7s',
    costPerRun: '$0.001',
    runsToday: 4291,
    humanEscRate: '0%',
    lastUsed: '03:41:22',
  },
  'RCA Engine': {
    orchestrator: 'Azure AI Foundry',
    orchType: 'Prompt Flow',
    model: 'Claude Sonnet 4 (Anthropic)',
    icon: '🔍',
    color: '#7C3AED',
    purpose:
      'Performs causal chain analysis across the ZeroOps topology graph. Traverses CI dependencies in the CMDB, queries monitoring telemetry, matches against the vector DB of historical incidents, and produces a ranked root cause hypothesis with confidence score.',
    systemPrompt:
      'You are a senior site reliability engineer performing root cause analysis. You have access to the full CMDB topology graph, live monitoring metrics, log streams, and a vector database of 10,000+ historical incidents. Given an incident, traverse the dependency graph from the affected CI backwards, identify the furthest upstream cause, and return a structured RCA: rootCause, causalChain[], confidence (0-100), similarIncidents[], recommendedRunbook. Think step by step. Prefer specific evidence over conjecture.',
    tools: [
      'CMDB Graph API',
      'Azure Monitor Metrics',
      'K8s Events API',
      'SAP CCMS API',
      'Incident Vector DB',
      'Log Analytics',
    ],
    inputSchema:
      'Incident: {id, affectedCI, symptoms[], alertEvidence[], topologyContext}',
    outputSchema:
      'RCA: {rootCause, causalChain[], confidence, similarIncidents[], runbook, blastRadius}',
    maxTokens: 4096,
    temperature: 0.2,
    successRate: '94.7%',
    avgDuration: '12.4s',
    costPerRun: '$0.019',
    runsToday: 923,
    humanEscRate: '8%',
    lastUsed: '03:38:55',
  },
  'Remediation Agent': {
    orchestrator: 'Azure AI Foundry',
    orchType: 'Agent (tool-use)',
    model: 'GPT-4o (2025-04)',
    icon: '⚡',
    color: '#16A34A',
    purpose:
      'Translates RCA output into an executable remediation plan. Calls OneEngine runbooks, executes Ansible playbooks, invokes K8s API and Azure ARM — monitoring each step and validating outcomes before proceeding to the next.',
    systemPrompt:
      'You are an autonomous remediation agent. Given a validated RCA and approved remediation plan, execute each step via the available tools. Validate the outcome of each step before proceeding. If a step fails or produces unexpected output, halt and escalate — never retry a failing action more than twice. Log every action to the audit trail. Your priority: system stability above speed. Confirm recovery metrics after each action.',
    tools: [
      'ZeroOps OneEngine API',
      'K8s API',
      'Azure ARM API',
      'Ansible Tower API',
      'SAP Solution Manager API',
      'ServiceNow API',
      'Artifact Repository API',
    ],
    inputSchema:
      'RemediationPlan: {incidentId, steps[{action, tool, params, riskLevel, reversible}], approvedBy}',
    outputSchema:
      'ExecutionLog: {steps[{action, outcome, duration, validationResult}], overallOutcome, mttr}',
    maxTokens: 2048,
    temperature: 0.0,
    successRate: '91.2%',
    avgDuration: '28.4s',
    costPerRun: '$0.013',
    runsToday: 612,
    humanEscRate: '22%',
    lastUsed: '14:30:00',
  },
  'Change Validator': {
    orchestrator: 'Azure AI Foundry',
    orchType: 'Prompt Flow',
    model: 'GPT-4o (2025-04)',
    icon: '✅',
    color: '#0369A1',
    purpose: `Assesses proposed changes and auto-approvals against risk thresholds, CMDB topology, and change governance policy. Generates blast radius calculations and validates that change parameters comply with ${
      CUSTOMER?.name || 'Enterprise'
    } change governance rules before execution.`,
    systemPrompt: `You are a change management specialist. Given a proposed change, assess: (1) risk score 0-100 based on blast radius, reversibility, and historical change success rates; (2) compliance with ${
      CUSTOMER?.name || 'Enterprise'
    } change governance policy; (3) required approval tier — auto-approve <25, HiTL 25-70, senior engineer >70. Return structured assessment with explicit governance references. For SAP production changes and security policy changes, always escalate regardless of risk score.`,
    tools: [
      'CMDB Graph API',
      'Change History DB',
      `${CUSTOMER?.name || 'Enterprise'} Policy Engine`,
      'ServiceNow Change API',
      'Azure Policy API',
    ],
    inputSchema:
      'ChangeRequest: {changeId, affectedCIs[], proposedAction, params, requestedBy}',
    outputSchema:
      'Assessment: {riskScore, approvalTier, blastRadius, complianceStatus, recommendation}',
    maxTokens: 2048,
    temperature: 0.1,
    successRate: '100%',
    avgDuration: '5.9s',
    costPerRun: '$0.000',
    runsToday: 341,
    humanEscRate: '18%',
    lastUsed: '03:28:11',
  },
  'Capacity Planner': {
    orchestrator: 'Azure AI Foundry',
    orchType: 'Prompt Flow',
    model: 'GPT-4o (2025-04)',
    icon: '📊',
    color: '#D97706',
    purpose:
      'Monitors resource utilisation trends across cloud VMs, on-premises DCs, and managed services. Forecasts capacity exhaustion, generates right-sizing CHG requests, and triggers proactive alerts before engineers or users are impacted.',
    systemPrompt: `You are a capacity planning specialist. Monitor resource utilisation trends for the ${
      CUSTOMER?.name || 'Enterprise'
    } IT estate — cloud VMs, on-premises servers, and managed services. For each resource trending above 70% sustained utilisation: project time-to-exhaustion at current growth rate, recommend right-sizing action with cost delta, and file a CHG request if action is needed within 30 days. Prioritise by business impact — ERP period-end and business-critical platforms have highest priority.`,
    tools: [
      'Azure Monitor Metrics API',
      'AWS CloudWatch API',
      'Dynatrace Capacity API',
      'ServiceNow CHG API',
      'Azure Pricing API',
    ],
    inputSchema:
      'MetricsTrend: {resource, utilisation[], timestamps[], forecastDays}',
    outputSchema:
      'CapacityReport: {resourcesAtRisk[], recommendations[], chgRequests[], forecastCharts}',
    maxTokens: 2048,
    temperature: 0.1,
    successRate: '96.6%',
    avgDuration: '41.8s',
    costPerRun: '$0.031',
    runsToday: 89,
    humanEscRate: '5%',
    lastUsed: '11:30:00',
  },
  'Log Analyzer': {
    orchestrator: 'Azure AI Foundry',
    orchType: 'Prompt Flow',
    model: 'GPT-4o (2025-04)',
    icon: '📋',
    color: '#64748B',
    purpose: `Continuously ingests and analyses log streams across the ${
      CUSTOMER?.name || 'Enterprise'
    } IT endpoint estate. Detects anomaly patterns, silent failures, and degradation signals that do not generate monitoring alerts — the events you would not otherwise see until they become incidents.`,
    systemPrompt:
      "You are a log analysis specialist. Ingest log streams from ${CUSTOMER?.name||'Enterprise'} IT endpoints. Identify: (1) error patterns above baseline frequency; (2) silent failures — operations that complete with exit code 0 but produce anomalous output (e.g. zero records written when >1000 expected); (3) degradation signals — latency creep, retry storms, heap pressure. Cluster related log events by causal proximity. Return anomalies with severity, affected component, evidence log lines, and hypothesis.",
    tools: [
      'Azure Log Analytics',
      'Splunk API',
      'K8s Pod Logs API',
      'SAP Solution Manager API',
      'Entra Audit Log API',
    ],
    inputSchema:
      'LogStream: [{timestamp, source, level, message, ciRef, correlationId}]',
    outputSchema:
      'Anomalies: [{severity, component, pattern, evidenceLines[], hypothesis, recommendedAction}]',
    maxTokens: 4096,
    temperature: 0.1,
    successRate: '98.3%',
    avgDuration: '6.2s',
    costPerRun: '$0.008',
    runsToday: 1847,
    humanEscRate: '0%',
    lastUsed: '03:40:11',
  },
};

// Normalise agent name → lookup key (strip suffixes like "→ OneEngine")
const resolveAgent = (raw) => {
  if (!raw) return null;
  const clean = raw.split('→')[0].split('(')[0].trim();
  return (
    Object.keys(AGENT_DEFS).find(
      (k) =>
        clean.toLowerCase().includes(k.toLowerCase()) ||
        k.toLowerCase().includes(clean.toLowerCase())
    ) || null
  );
};

function OutcomeCard({ outcome, scenario }) {
  const pillarColor = scenario.pillarColor;
  return (
    <div
      style={{
        background: `${pillarColor}0a`,
        border: `1px solid ${pillarColor}30`,
        borderRadius: 10,
        padding: 18,
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 9,
              color: pillarColor,
              fontFamily: 'monospace',
              letterSpacing: 3,
              marginBottom: 6,
            }}
          >
            ✓ COMPLETED — {scenario.title.toUpperCase()}
          </div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: '#0F172A',
              marginBottom: 4,
            }}
          >
            {outcome.result}
          </div>
          <div style={{ fontSize: 12, color: '#64748B' }}>
            SLA:{' '}
            <span
              style={{
                color:
                  (outcome.sla || '').includes('MET') ||
                  outcome.sla.includes('on schedule') ||
                  (outcome.sla || '').includes('Within')
                    ? C.GREEN
                    : C.AMBER,
                fontWeight: 600,
              }}
            >
              {outcome.sla}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 9,
              padding: '3px 10px',
              background: `${pillarColor}18`,
              color: pillarColor,
              border: `1px solid ${pillarColor}30`,
              borderRadius: 4,
              fontFamily: 'monospace',
            }}
          >
            {scenario.pillarLabel}
          </span>
        </div>
      </div>
      {outcome.mttr === '—' && (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 16px',
            background: 'rgba(8,145,178,0.07)',
            border: '1px solid rgba(8,145,178,0.25)',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>🛡</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0891B2' }}>
              Incident prevented — never created
            </div>
            <div style={{ fontSize: 12, color: '#64748B' }}>
              ZeroOps detected the pattern 47 minutes before any user impact.
              Zero engineers woken. Zero SLA at risk.
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(172px,1fr))',
          gap: 8,
        }}
      >
        {[
          [
            'MTTR',
            outcome.mttr === '—' ? 'N/A — prevented' : outcome.mttr,
            pillarColor,
          ],
          ['Time Saved', outcome.saved, C.GREEN],
          ['Agents', outcome.agents, C.BLUE],
          ['Auto Steps', outcome.autoSteps, C.BLUE],
          ['HiTL Steps', outcome.hitlSteps, C.AMBER],
          [
            'SLA',
            (outcome.sla || '—').split(' ')[0],
            (outcome.sla || '').includes('MET') ||
            (outcome.sla || '').includes('Within') ||
            (outcome.sla || '').includes('on') ||
            (outcome.sla || '').includes('prevented')
              ? C.GREEN
              : C.AMBER,
          ],
        ].map(([l, v, col]) => (
          <div
            key={l}
            style={{
              background: 'rgba(0,0,0,0.03)',
              borderRadius: 6,
              padding: '9px 10px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: col,
                fontFamily: 'monospace',
                lineHeight: 1.2,
              }}
            >
              {v}
            </div>
            <div
              style={{
                fontSize: 9,
                color: C.MUTED,
                marginTop: 3,
                fontFamily: 'monospace',
              }}
            >
              {l}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HITL DECISION CONSOLE ─────────────────────────────────────
function HiTLConsole({
  scenario,
  countdown,
  onApprove,
  onReject,
  selAgent,
  setSelAgent,
}) {
  const pc = scenario.pillarColor;
  const rs = scenario.riskScore;
  const rsColor = rs >= 75 ? C.RED : rs >= 25 ? C.AMBER : C.GREEN;

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.98)',
        border: `2px solid ${C.AMBER}50`,
        borderRadius: 10,
        padding: 18,
        marginTop: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: C.AMBER,
            boxShadow: `0 0 8px ${C.AMBER}`,
          }}
        />
        <span style={{ fontSize: 14, fontWeight: 700, color: '#B45309' }}>
          Human Decision Required
        </span>
        <span style={{ fontSize: 11, color: C.MUTED, fontFamily: 'monospace' }}>
          · {scenario.incident}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 12,
          marginBottom: 14,
        }}
      >
        {/* Left — risk assessment */}
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
            RISK ASSESSMENT
          </div>
          {[
            ['Risk Score', `${rs}/100`, rsColor, 'Auto-approve threshold: 25'],
            [
              'Blast Radius',
              (scenario.blastRadius || '—').split(' — ')[0],
              rs >= 75 ? C.RED : C.AMBER,
              (scenario.blastRadius || '').split(' — ')[1] || '',
            ],
            [
              'Reversibility',
              (scenario.reversibility || '—').split(' — ')[0],
              (scenario.reversibility || '').startsWith('HIGH')
                ? C.GREEN
                : (scenario.reversibility || '').startsWith('MEDIUM')
                ? C.AMBER
                : C.RED,
              (scenario.reversibility || '').split(' — ')[1] || '',
            ],
            [
              'SLA Context',
              (scenario.slaStatus || '—').split(' · ')[0],
              C.BLUE,
              (scenario.slaStatus || '').split(' · ')[1] || '',
            ],
          ].map(([l, v, col, sub]) => (
            <div
              key={l}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                padding: '7px 0',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#64748B' }}>{l}</div>
                {sub && (
                  <div style={{ fontSize: 10, color: C.MUTED, marginTop: 1 }}>
                    {sub}
                  </div>
                )}
              </div>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  fontWeight: 700,
                  color: col,
                  marginLeft: 10,
                  flexShrink: 0,
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>

        {/* Right — remediation plan */}
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
            REMEDIATION PLAN
          </div>
          <div style={{ maxHeight: 160, overflowY: 'auto' }}>
            {(scenario.remediationPlan || []).map((step) => (
              <div
                key={step.n}
                style={{
                  display: 'flex',
                  gap: 7,
                  alignItems: 'flex-start',
                  marginBottom: 6,
                }}
              >
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: step.auto
                      ? 'rgba(59,130,246,0.2)'
                      : 'rgba(245,158,11,0.2)',
                    border: `1px solid ${
                      step.auto
                        ? 'rgba(59,130,246,0.4)'
                        : 'rgba(245,158,11,0.4)'
                    }`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontFamily: 'monospace',
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  {step.n}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: step.auto ? '#64748B' : '#B45309',
                      lineHeight: 1.4,
                    }}
                  >
                    {step.act}
                  </div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    <span
                      style={{
                        fontSize: 9,
                        color:
                          step.risk === 'LOW'
                            ? C.GREEN
                            : step.risk === 'MEDIUM'
                            ? C.AMBER
                            : C.RED,
                        fontFamily: 'monospace',
                      }}
                    >
                      {step.risk}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: step.auto ? C.BLUE : C.AMBER,
                        fontFamily: 'monospace',
                      }}
                    >
                      {step.auto ? '🤖 Auto' : '👤 Human'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Why HiTL */}
      <div
        style={{
          background: 'rgba(245,158,11,0.06)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 7,
          padding: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: C.AMBER,
            fontFamily: 'monospace',
            letterSpacing: 2,
            marginBottom: 6,
          }}
        >
          WHY THIS REQUIRES YOUR DECISION
        </div>
        <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.8 }}>
          {scenario.whyHitl}
        </div>
      </div>

      {/* Agents involved */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 10,
            color: C.MUTED,
            fontFamily: 'monospace',
            letterSpacing: 2,
            marginBottom: 6,
          }}
        >
          AGENTS INVOLVED
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {(
            scenario.agentsInvolved ||
            scenario.steps
              ?.map((s) => s.agent)
              .filter((a, i, arr) => arr.indexOf(a) === i) ||
            []
          ).map((a) => (
            <span
              key={a}
              onClick={() => {
                const k = resolveAgent(a);
                if (k) setSelAgent(selAgent === k ? null : k);
              }}
              style={{
                fontSize: 11,
                padding: '3px 10px',
                background: 'rgba(59,130,246,0.1)',
                color: '#1D4ED8',
                border: '1px solid rgba(59,130,246,0.2)',
                borderRadius: 5,
                cursor: 'pointer',
                textDecoration: 'underline dotted',
              }}
            >
              ◈ {a}
            </span>
          ))}
        </div>
      </div>

      {/* Approval buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 8 }}>
        <button
          onClick={onApprove}
          style={{
            background: `linear-gradient(135deg,#92400e,#d97706)`,
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            padding: '11px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ✓ Approve — Proceed with Remediation
        </button>
        <button
          onClick={onReject}
          style={{
            background: 'transparent',
            color: C.MUTED,
            border: `1px solid ${C.BORDER}`,
            borderRadius: 7,
            padding: '11px',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          ✕ Reject & Hold
        </button>
      </div>
    </div>
  );
}

// ── AGENT DEFINITION PANEL ────────────────────────────────────
function AgentDefPanel({ agentKey, onClose }) {
  const def = AGENT_DEFS[agentKey];
  if (!def)
    return (
      <div
        style={{
          background: '#F8FAFC',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 10,
          padding: 20,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 28, opacity: 0.3 }}>◈</div>
        <div
          style={{
            fontSize: 12,
            color: '#94A3B8',
            textAlign: 'center',
            lineHeight: 1.7,
          }}
        >
          Click any agent name
          <br />
          in the pipeline or HiTL console
          <br />
          to see its orchestrator definition
        </div>
      </div>
    );

  return (
    <div
      style={{
        background: '#FAFBFC',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 500,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: `${def.color}10`,
          borderBottom: `1px solid ${def.color}22`,
          padding: '12px 14px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: `${def.color}18`,
                border: `1px solid ${def.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                flexShrink: 0,
              }}
            >
              {def.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0F172A',
                  lineHeight: 1.2,
                }}
              >
                {agentKey}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: def.color,
                  fontFamily: 'monospace',
                  marginTop: 2,
                  letterSpacing: 1,
                }}
              >
                DEFINED IN {def.orchestrator.toUpperCase()}
              </div>
            </div>
          </div>
          <div
            onClick={onClose}
            style={{
              cursor: 'pointer',
              color: '#94A3B8',
              fontSize: 16,
              lineHeight: 1,
              padding: '0 2px',
            }}
          >
            ✕
          </div>
        </div>
        <div
          style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}
        >
          <span
            style={{
              fontSize: 9,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(37,99,235,0.1)',
              color: '#1D4ED8',
              fontFamily: 'monospace',
            }}
          >
            ☁ {def.orchestrator}
          </span>
          <span
            style={{
              fontSize: 9,
              padding: '2px 8px',
              borderRadius: 4,
              background: `${def.color}12`,
              color: def.color,
              fontFamily: 'monospace',
            }}
          >
            {def.orchType}
          </span>
          <span
            style={{
              fontSize: 9,
              padding: '2px 8px',
              borderRadius: 4,
              background: 'rgba(0,0,0,0.05)',
              color: '#64748B',
              fontFamily: 'monospace',
            }}
          >
            🤖 {def.model}
          </span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
        {/* Purpose */}
        <div
          style={{
            fontSize: 11,
            color: '#475569',
            lineHeight: 1.7,
            marginBottom: 12,
            paddingBottom: 12,
            borderBottom: '1px solid rgba(0,0,0,0.07)',
          }}
        >
          {def.purpose}
        </div>

        {/* System prompt */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 9,
              color: '#94A3B8',
              fontFamily: 'monospace',
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            SYSTEM PROMPT
          </div>
          <div
            style={{
              fontSize: 10,
              color: '#475569',
              lineHeight: 1.65,
              fontFamily: 'monospace',
              background: 'rgba(0,0,0,0.03)',
              borderRadius: 6,
              padding: '8px 10px',
              border: '1px solid rgba(0,0,0,0.06)',
            }}
          >
            {def.systemPrompt}
          </div>
        </div>

        {/* Tool bindings */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 9,
              color: '#94A3B8',
              fontFamily: 'monospace',
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            TOOL BINDINGS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {def.tools.map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 9,
                  padding: '2px 7px',
                  borderRadius: 4,
                  background: 'rgba(245,158,11,0.08)',
                  color: '#B45309',
                  border: '1px solid rgba(245,158,11,0.18)',
                  fontFamily: 'monospace',
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Schema */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 9,
              color: '#94A3B8',
              fontFamily: 'monospace',
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            I/O SCHEMA
          </div>
          <div
            style={{
              fontSize: 10,
              color: '#64748B',
              lineHeight: 1.6,
              fontFamily: 'monospace',
              marginBottom: 4,
            }}
          >
            <span style={{ color: '#94A3B8' }}>IN </span>
            {def.inputSchema}
          </div>
          <div
            style={{
              fontSize: 10,
              color: '#64748B',
              lineHeight: 1.6,
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#94A3B8' }}>OUT </span>
            {def.outputSchema}
          </div>
        </div>

        {/* Model config */}
        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              fontSize: 9,
              color: '#94A3B8',
              fontFamily: 'monospace',
              letterSpacing: 2,
              marginBottom: 6,
            }}
          >
            MODEL CONFIG
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div
              style={{
                fontSize: 10,
                color: '#64748B',
                fontFamily: 'monospace',
              }}
            >
              max_tokens:{' '}
              <span style={{ color: '#1E293B' }}>{def.maxTokens}</span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: '#64748B',
                fontFamily: 'monospace',
              }}
            >
              temperature:{' '}
              <span style={{ color: '#1E293B' }}>{def.temperature}</span>
            </div>
          </div>
        </div>

        {/* ZeroOps operational record */}
        <div
          style={{ borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 12 }}
        >
          <div
            style={{
              fontSize: 9,
              color: '#94A3B8',
              fontFamily: 'monospace',
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            ZEROOPS OPERATIONAL RECORD
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 6,
            }}
          >
            {[
              ['Success rate', def.successRate, '#16A34A'],
              ['Avg duration', def.avgDuration, '#2563EB'],
              ['Cost / run', def.costPerRun, '#16A34A'],
              ['Runs today', def.runsToday, '#2563EB'],
              [
                'Human esc.',
                def.humanEscRate,
                def.humanEscRate === '0%' ? '#16A34A' : '#D97706',
              ],
              ['Last used', def.lastUsed, '#64748B'],
            ].map(([label, val, col]) => (
              <div
                key={label}
                style={{
                  background: 'rgba(0,0,0,0.03)',
                  borderRadius: 5,
                  padding: '6px 8px',
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: '#94A3B8',
                    fontFamily: 'monospace',
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
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
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────────

// ── Token / model lookup ──────────────────────────────────────
const TOKEN_EST = {
  'Alert Correlator': {
    in: 1247,
    out: 184,
    model: 'claude-haiku-4-5',
    cost: '$0.001',
  },
  'Log Analyzer': {
    in: 3812,
    out: 428,
    model: 'claude-sonnet-4-5',
    cost: '$0.008',
  },
  'RCA Engine': {
    in: 8234,
    out: 692,
    model: 'claude-sonnet-4-5',
    cost: '$0.019',
  },
  'Remediation Agent': {
    in: 4156,
    out: 367,
    model: 'claude-sonnet-4-5',
    cost: '$0.013',
  },
  'Change Validator': {
    in: 1893,
    out: 218,
    model: 'claude-haiku-4-5',
    cost: '$0.001',
  },
  'SoD Check Agent': {
    in: 2341,
    out: 312,
    model: 'claude-sonnet-4-5',
    cost: '$0.007',
  },
  'HiTL Console': { in: 0, out: 0, model: '—', cost: '$0.000' },
};

// Infer reasoning type from event message
function reasonType(msg, kind) {
  const m = msg.toLowerCase();
  if (kind === 'success') return 'output';
  if (
    /loading|reading|connecting|querying|query|fetching|queue|sm37|sm04|rfc/.test(
      m
    )
  )
    return 'read';
  if (
    /analys|travers|check|compar|scan|monitor|pattern|match|history|vector/.test(
      m
    )
  )
    return 'think';
  if (/conflict|detected|anomal|lock|saturated|stall|breach|warn|⚠/.test(m))
    return 'anomaly';
  if (
    /risk score|confidence|approved|confirmed|threshold|decision|proceeding|sentinel/.test(
      m
    )
  )
    return 'decide';
  return 'think';
}

const RT_STYLE = {
  read: {
    icon: '📖',
    label: 'READ',
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.06)',
  },
  think: {
    icon: '💭',
    label: 'THINK',
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.06)',
  },
  anomaly: {
    icon: '⚠',
    label: 'ANOMALY',
    color: '#D97706',
    bg: 'rgba(217,119,6,0.08)',
  },
  decide: {
    icon: '⚡',
    label: 'DECIDE',
    color: '#D97706',
    bg: 'rgba(217,119,6,0.06)',
  },
  output: {
    icon: '✍',
    label: 'OUTPUT',
    color: '#16A34A',
    bg: 'rgba(22,163,74,0.06)',
  },
};

function ReasoningPanel({ step, stepsDone, liveLog, simState }) {
  if (!step)
    return (
      <div
        style={{
          background: C.PANEL,
          border: `1px solid ${C.BORDER}`,
          borderRadius: 10,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: 24,
        }}
      >
        <div style={{ fontSize: 28 }}>🤖</div>
        <div
          style={{
            fontSize: 12,
            color: C.MUTED,
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          Click any step in the pipeline to inspect agent reasoning
        </div>
      </div>
    );

  const tok = TOKEN_EST[step.agent] || {
    in: 2000,
    out: 300,
    model: 'claude-sonnet-4-5',
    cost: '$0.009',
  };
  const isDone = stepsDone.has(step.id);
  const stepLogs = liveLog.filter((l) => l.step === step.label);
  const events =
    isDone || simState === 'done'
      ? step.events
      : stepLogs.map((l) => ({ msg: l.msg, kind: l.kind }));

  return (
    <div
      style={{
        background: C.PANEL,
        border: `1px solid ${C.BORDER}`,
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Agent header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: `1px solid ${C.BORDER}`,
          background: `${step.type === 'hitl' ? C.AMBER : C.BLUE}08`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: step.type === 'hitl' ? '50%' : 8,
              background: `${step.type === 'hitl' ? C.AMBER : C.BLUE}18`,
              border: `1.5px solid ${
                step.type === 'hitl' ? C.AMBER : C.BLUE
              }44`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
            }}
          >
            {step.icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              {step.agent}
            </div>
            <div style={{ fontSize: 10, color: C.MUTED }}>{step.label}</div>
          </div>
          {isDone && (
            <span
              style={{
                fontSize: 10,
                color: C.GREEN,
                fontWeight: 600,
                background: 'rgba(22,163,74,0.1)',
                border: '1px solid rgba(22,163,74,0.2)',
                borderRadius: 4,
                padding: '2px 8px',
              }}
            >
              ✅ Done
            </span>
          )}
        </div>

        {/* LLM badge */}
        {tok.model !== '—' && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 9,
                color: '#7C3AED',
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
                borderRadius: 4,
                padding: '2px 8px',
                fontFamily: 'monospace',
                fontWeight: 600,
              }}
            >
              🤖 {tok.model}
            </span>
            <span
              style={{
                fontSize: 9,
                color: '#0891b2',
                background: 'rgba(8,145,178,0.08)',
                border: '1px solid rgba(8,145,178,0.2)',
                borderRadius: 4,
                padding: '2px 8px',
                fontFamily: 'monospace',
              }}
            >
              Anthropic · Claude
            </span>
          </div>
        )}
      </div>

      {/* Reasoning steps */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        <div
          style={{
            fontSize: 9,
            color: C.MUTED,
            fontFamily: 'monospace',
            letterSpacing: 2,
            marginBottom: 8,
          }}
        >
          AGENT REASONING
        </div>

        {events.length === 0 && (
          <div
            style={{
              fontSize: 11,
              color: C.MUTED,
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '16px 0',
            }}
          >
            {simState === 'running'
              ? 'Agent initialising…'
              : 'Run simulation to see reasoning'}
          </div>
        )}

        {events.map((ev, i) => {
          const rt = RT_STYLE[reasonType(ev.msg, ev.kind)];
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 8,
                marginBottom: 6,
                padding: '6px 10px',
                borderRadius: 6,
                background: rt.bg,
              }}
            >
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 12 }}>{rt.icon}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 8,
                    color: rt.color,
                    fontFamily: 'monospace',
                    fontWeight: 700,
                    letterSpacing: 1.5,
                    marginBottom: 2,
                  }}
                >
                  {rt.label}
                </div>
                <div
                  style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}
                >
                  {ev.msg}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Token usage footer */}
      {tok.model !== '—' && (
        <div
          style={{
            padding: '10px 14px',
            borderTop: `1px solid ${C.BORDER}`,
            background: 'rgba(0,0,0,0.02)',
            flexShrink: 0,
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
            TOKEN USAGE — ESTIMATED
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 6,
              marginBottom: 8,
            }}
          >
            {[
              ['Prompt tokens', tok.in.toLocaleString(), '#2563EB'],
              ['Output tokens', tok.out.toLocaleString(), '#7C3AED'],
              ['Total tokens', (tok.in + tok.out).toLocaleString(), '#0F172A'],
              ['Est. cost', tok.cost, C.GREEN],
            ].map(([l, v, col]) => (
              <div
                key={l}
                style={{
                  padding: '6px 8px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.7)',
                  border: `1px solid ${C.BORDER}`,
                }}
              >
                <div
                  style={{
                    fontSize: 8,
                    color: C.MUTED,
                    fontFamily: 'monospace',
                    letterSpacing: 1,
                    marginBottom: 2,
                  }}
                >
                  {l.toUpperCase()}
                </div>
                <div
                  style={{
                    fontSize: 14,
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
          <div style={{ fontSize: 9, color: C.MUTED, lineHeight: 1.5 }}>
            Tokens estimated from agent type and step complexity. Actual usage
            may vary by ±15% based on context window.
          </div>
        </div>
      )}
    </div>
  );
}

export default function WorkflowPage({ runHC }) {
  const [scenIdx, setScenIdx] = useState(0);
  const [simState, setSimState] = useState('idle');
  const [stepsDone, setStepsDone] = useState(new Set());
  const [stepActive, setStepActive] = useState(null);
  const [liveLog, setLiveLog] = useState([]);
  const [liveAudit, setLiveAudit] = useState([]);
  const [hitlMode, setHitlMode] = useState(true);
  const [countdown, setCountdown] = useState(null);
  const [outcome, setOutcome] = useState(null);
  const [auditF, setAuditF] = useState('all');
  const [expandCot, setExpandCot] = useState(null);
  const [selAgent, setSelAgent] = useState(null);
  const [selStepId, setSelStepId] = useState(null);
  const logRef = useRef(null);
  const timerRefs = useRef([]);

  const scenario = SCENARIOS[scenIdx] || SCENARIOS[0];
  const steps = scenario?.steps || [];

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [liveLog]);
  useEffect(() => {
    if (stepActive) setSelStepId(stepActive);
  }, [stepActive]);
  const clearAll = () => {
    timerRefs.current.forEach((t) => clearTimeout(t));
    timerRefs.current = [];
  };
  const addLog = (e) =>
    setLiveLog((l) => [...l, { ...e, ts: new Date().toLocaleTimeString() }]);
  const addAudit = (e) =>
    setLiveAudit((l) => [{ ...e, ts: new Date().toLocaleTimeString() }, ...l]);

  const reset = (keepScenario = true) => {
    clearAll();
    setSimState('idle');
    setStepsDone(new Set());
    setStepActive(null);
    setLiveLog([]);
    setLiveAudit([]);
    setCountdown(null);
    setOutcome(null);
    setExpandCot(null);
    if (!keepScenario) setScenIdx(0);
  };

  const finishSim = useCallback(() => {
    setSimState('done');
    setStepActive(null);
    if (runHC && scenario.appId) setTimeout(() => runHC(scenario.appId), 800);
    setOutcome(scenario.outcome);
  }, [runHC, scenario]);

  const runStep = useCallback(
    (idx) => {
      if (idx >= steps.length) {
        finishSim();
        return;
      }
      const step = steps[idx];
      setStepActive(step.id);
      step.events.forEach((ev) => {
        const tid = setTimeout(
          () =>
            addLog({
              msg: ev.msg,
              kind: ev.kind,
              step: step.label,
              highlight: !!(step.highlight && ev.kind !== 'info'),
            }),
          ev.t
        );
        timerRefs.current.push(tid);
      });
      if (step.type === 'hitl' && hitlMode) {
        setSimState('hitl_wait');
        setCountdown(null);
        return;
      }
      const tid = setTimeout(() => {
        addAudit({
          agent: step.agent,
          action: step.summary,
          target: scenario.incident,
          out: 'SUCCESS',
          dur: `${(step.duration / 1000).toFixed(1)}s`,
          auth: step.type === 'hitl' ? 'HiTL' : 'Auto',
        });
        setStepsDone((s) => new Set([...s, step.id]));
        setStepActive(null);
        runStep(idx + 1);
      }, step.duration);
      timerRefs.current.push(tid);
      // eslint-disable-next-line
    },
    [hitlMode, steps, finishSim]
  );

  const approveStep = useCallback(
    (idx, by = 'Operator') => {
      setSimState('running');
      setCountdown(null);
      const step = steps[idx];
      addLog({
        msg: `[HiTL] ✓ Approved by ${by} — proceeding`,
        kind: 'success',
        step: step.label,
      });
      addAudit({
        agent: by,
        action: `Approved: ${step.summary}`,
        target: scenario.incident,
        out: 'APPROVED',
        dur: '—',
        auth: 'HiTL',
      });
      const tid = setTimeout(() => {
        setStepsDone((s) => new Set([...s, step.id]));
        setStepActive(null);
        runStep(idx + 1);
      }, 600);
      timerRefs.current.push(tid);
    },
    [steps, runStep, scenario]
  );

  const startSim = () => {
    reset();
    setTimeout(() => {
      setSimState('running');
      addLog({
        msg: `[ZeroOps] ══ SIMULATION — ${scenario.title} · ${scenario.incident} ══`,
        kind: 'info',
        step: 'Init',
      });
      runStep(0);
    }, 100);
  };

  const hitlIdx = steps.findIndex(
    (s) => s.type === 'hitl' && stepActive === s.id
  );
  const hitlWaitIdx = steps.findIndex(
    (s) => s.id === stepActive && simState === 'hitl_wait'
  );
  const fa = liveAudit.filter(
    (e) => auditF === 'all' || e.out.toLowerCase().includes(auditF)
  );
  const stepColor = (step) =>
    stepsDone.has(step.id)
      ? C.GREEN
      : stepActive === step.id
      ? C.BLUE
      : 'rgba(0,0,0,0.07)';
  const stepBg = (step) =>
    stepsDone.has(step.id)
      ? 'rgba(34,197,94,0.12)'
      : stepActive === step.id
      ? 'rgba(59,130,246,0.12)'
      : step.type === 'hitl'
      ? 'rgba(245,158,11,0.06)'
      : 'rgba(0,0,0,0.025)';

  const PILLAR_DESC = {
    1: {
      icon: '👁',
      color: '#2563EB',
      label: 'Sentinel — Silent Autonomous',
      desc: 'ZeroOps watches continuously and acts alone on known threats. Risk score < 25, reversible action, no user impact — no human gate required. The AI detects, diagnoses, and remediates before anyone notices.',
    },
    2: {
      icon: '🛡',
      color: '#D97706',
      label: 'Guardian — Human-in-the-Loop',
      desc: 'ZeroOps prepares everything — RCA, blast radius, remediation plan, simulation. One human approval gate, then automation executes. The human is accountable for the decision; ZeroOps for the execution.',
    },
    3: {
      icon: '🧠',
      color: '#16A34A',
      label: 'Advisor — AI-Assisted Human',
      desc: 'ZeroOps surfaces the richest diagnostic brief the engineer has ever received — root cause confirmed, confidence scored, causal chain mapped, remediation staged. The senior engineer makes the call and executes.',
    },
  };
  const pd = PILLAR_DESC[scenario.pillar];

  return (
    <div style={{ padding: 22 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 0,
        }}
      >
        <Lbl n="5">Workflow Simulation</Lbl>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              background: C.PANEL,
              border: `1px solid ${C.BORDER}`,
              borderRadius: 7,
              padding: '6px 12px',
            }}
          >
            <span style={{ fontSize: 11, color: C.MUTED }}>Human-in-Loop</span>
            <div
              onClick={() => simState === 'idle' && setHitlMode((m) => !m)}
              style={{
                width: 34,
                height: 17,
                borderRadius: 9,
                background: hitlMode ? C.AMBER : C.GREEN,
                cursor: simState === 'idle' ? 'pointer' : 'not-allowed',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2.5,
                  left: hitlMode ? 2.5 : 18,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </div>
            <Tag color={hitlMode ? C.AMBER : C.GREEN}>
              {hitlMode ? 'ON' : 'OFF'}
            </Tag>
          </div>
          {simState === 'done' ? (
            <button
              onClick={() => reset()}
              style={{
                background: 'rgba(0,0,0,0.05)',
                color: '#1E293B',
                border: `1px solid ${C.BORDER}`,
                borderRadius: 7,
                padding: '7px 16px',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              ↺ Reset
            </button>
          ) : (
            <button
              data-demo="run-simulation"
              onClick={startSim}
              disabled={simState === 'running' || simState === 'hitl_wait'}
              style={{
                background:
                  simState === 'idle'
                    ? 'linear-gradient(135deg,#1d4ed8,#7c3aed)'
                    : 'rgba(0,0,0,0.05)',
                color: simState === 'idle' ? '#fff' : '#64748B',
                border: 'none',
                borderRadius: 7,
                padding: '7px 18px',
                fontSize: 12,
                fontWeight: 700,
                cursor: simState === 'idle' ? 'pointer' : 'not-allowed',
              }}
            >
              {simState === 'idle'
                ? '▶ Start Simulation'
                : simState === 'running'
                ? '⏳ Running…'
                : '⏸ Waiting for Approval'}
            </button>
          )}
        </div>
      </div>

      {/* ── SCENARIO PICKER ── */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontSize: 11,
            color: C.MUTED,
            fontFamily: 'monospace',
            letterSpacing: 2,
            marginBottom: 10,
          }}
        >
          SELECT SCENARIO — DEMONSTRATING ZEROOPS 3-PILLAR MODEL
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(8,1fr)',
            gap: 5,
          }}
        >
          {SCENARIOS.map((s, i) => {
            const pd2 = PILLAR_DESC[s.pillar];
            const isSel = scenIdx === i;
            const isBridge = s.id === 'p1-bridge-gitlab-full';
            return (
              <div
                key={s.id}
                data-demo={`scenario-${i}`}
                onClick={() => {
                  if (simState === 'idle' || simState === 'done') {
                    setScenIdx(i);
                    reset();
                  }
                }}
                style={{
                  background: isSel
                    ? `${s.pillarColor}12`
                    : isBridge
                    ? 'rgba(220,38,38,0.04)'
                    : C.PANEL,
                  border: `2px solid ${
                    isSel
                      ? s.pillarColor
                      : isBridge
                      ? 'rgba(220,38,38,0.35)'
                      : C.BORDER
                  }`,
                  borderRadius: 8,
                  padding: '9px 9px',
                  cursor:
                    simState === 'idle' || simState === 'done'
                      ? 'pointer'
                      : 'not-allowed',
                  transition: 'all 0.18s',
                }}
                onMouseEnter={(e) => {
                  if (!isSel && (simState === 'idle' || simState === 'done'))
                    e.currentTarget.style.borderColor = s.pillarColor + '66';
                }}
                onMouseLeave={(e) => {
                  if (!isSel)
                    e.currentTarget.style.borderColor = isBridge
                      ? 'rgba(220,38,38,0.35)'
                      : C.BORDER;
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 12 }}>
                    {isBridge ? '🚨' : pd2.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 8,
                      padding: '1px 5px',
                      background: `${s.pillarColor}18`,
                      color: s.pillarColor,
                      border: `1px solid ${s.pillarColor}30`,
                      borderRadius: 3,
                      fontFamily: 'monospace',
                    }}
                  >
                    {isBridge ? 'BRIDGE' : 'P' + s.pillar}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: isBridge ? '#DC2626' : '#1E293B',
                    lineHeight: 1.35,
                    marginBottom: 3,
                  }}
                >
                  {(s.title || '').split(' — ')[0]}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: s.pillarColor,
                    fontFamily: 'monospace',
                    marginTop: 3,
                  }}
                >
                  {isBridge
                    ? 'Multi-track'
                    : (s.pillarLabel || '').split('·')[0].trim()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PILLAR EXPLAINER ── */}
      <div
        style={{
          background: `${pd.color}08`,
          border: `1px solid ${pd.color}25`,
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${pd.color}18`,
            border: `1px solid ${pd.color}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            flexShrink: 0,
          }}
        >
          {pd.icon}
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: pd.color,
              marginBottom: 3,
            }}
          >
            {pd.label}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.6 }}>
            {pd.desc}
          </div>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: C.MUTED, marginBottom: 2 }}>
            {scenario.incident}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>
            {scenario.category}
          </div>
          <div
            style={{ fontSize: 11, color: scenario.pillarColor, marginTop: 2 }}
          >
            {(scenario.subtitle || '').split(' · ')[0]}
          </div>
        </div>
      </div>

      {/* ── AIOps ENGINE STATUS BANNER ── */}
      {simState !== 'idle' && (
        <div
          style={{
            marginBottom: 14,
            borderRadius: 10,
            overflow: 'hidden',
            border: `1px solid ${
              simState === 'done'
                ? C.GREEN + '44'
                : simState === 'hitl_wait'
                ? C.AMBER + '44'
                : C.BLUE + '44'
            }`,
            background:
              simState === 'done'
                ? 'rgba(22,163,74,0.05)'
                : simState === 'hitl_wait'
                ? 'rgba(217,119,6,0.05)'
                : 'rgba(37,99,235,0.05)',
          }}
        >
          <div
            style={{
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            {/* Status dot */}
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                flexShrink: 0,
                background:
                  simState === 'done'
                    ? C.GREEN
                    : simState === 'hitl_wait'
                    ? C.AMBER
                    : C.BLUE,
                boxShadow:
                  simState === 'done'
                    ? `0 0 8px ${C.GREEN}`
                    : simState === 'hitl_wait'
                    ? `0 0 8px ${C.AMBER}`
                    : `0 0 8px ${C.BLUE}`,
                animation:
                  simState === 'running' ? 'pulse 1.2s infinite' : 'none',
              }}
            />

            {/* Engine label */}
            <div style={{ flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 9,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                  marginBottom: 2,
                }}
              >
                ZEROOPS AI ENGINE
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color:
                    simState === 'done'
                      ? C.GREEN
                      : simState === 'hitl_wait'
                      ? C.AMBER
                      : C.BLUE,
                }}
              >
                {simState === 'done'
                  ? '✅ Simulation Complete'
                  : simState === 'hitl_wait'
                  ? '⏸ Awaiting Human Approval'
                  : '▶ Running Autonomously'}
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 32,
                background: `${C.BORDER}`,
                flexShrink: 0,
              }}
            />

            {/* Step progress */}
            <div style={{ flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 9,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                  marginBottom: 2,
                }}
              >
                STEP PROGRESS
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {steps.map((step, i) => {
                  const isDone = stepsDone.has(step.id);
                  const isActive = stepActive === step.id;
                  const col = isDone
                    ? C.GREEN
                    : isActive
                    ? C.BLUE
                    : isActive && simState === 'hitl_wait'
                    ? C.AMBER
                    : '#CBD5E1';
                  return (
                    <div
                      key={step.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 0 }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: step.type === 'hitl' ? '50%' : 6,
                          background: isDone
                            ? 'rgba(22,163,74,0.15)'
                            : isActive
                            ? 'rgba(37,99,235,0.12)'
                            : 'rgba(0,0,0,0.04)',
                          border: `1.5px solid ${col}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          boxShadow: isActive ? `0 0 8px ${C.BLUE}60` : 'none',
                          transition: 'all 0.3s',
                        }}
                      >
                        {isDone ? (
                          '✓'
                        ) : isActive ? (
                          <span
                            style={{
                              animation: 'pulse 1s infinite',
                              display: 'block',
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: col,
                            }}
                          />
                        ) : (
                          step.icon
                        )}
                      </div>
                      {i < steps.length - 1 && (
                        <div
                          style={{
                            width: 16,
                            height: 2,
                            background: isDone
                              ? `${C.GREEN}60`
                              : 'rgba(0,0,0,0.08)',
                            transition: 'background 0.4s',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
                <span
                  style={{
                    fontSize: 10,
                    color: C.MUTED,
                    fontFamily: 'monospace',
                    marginLeft: 8,
                  }}
                >
                  {stepsDone.size}/{steps.length}
                </span>
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 32,
                background: `${C.BORDER}`,
                flexShrink: 0,
              }}
            />

            {/* Active step detail */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {stepActive &&
                (() => {
                  const activeStep = steps.find((s) => s.id === stepActive);
                  return activeStep ? (
                    <div>
                      <div
                        style={{
                          fontSize: 9,
                          color: C.MUTED,
                          fontFamily: 'monospace',
                          letterSpacing: 2,
                          marginBottom: 2,
                        }}
                      >
                        ACTIVE AGENT
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#1E293B',
                        }}
                      >
                        {activeStep.icon} {activeStep.agent}
                        <span
                          style={{
                            fontSize: 10,
                            color: C.MUTED,
                            fontWeight: 400,
                            marginLeft: 8,
                          }}
                        >
                          — {activeStep.label}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.MUTED,
                          lineHeight: 1.4,
                          marginTop: 2,
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {activeStep.summary}
                      </div>
                    </div>
                  ) : null;
                })()}
              {simState === 'done' && outcome && (
                <div style={{ fontSize: 12, color: C.GREEN, fontWeight: 600 }}>
                  {outcome.result} · MTTR {outcome.mttr}
                </div>
              )}
              {simState === 'hitl_wait' && (
                <div style={{ fontSize: 12, color: C.AMBER, fontWeight: 600 }}>
                  Human approval required — ZeroOps is ready to execute on your
                  decision
                </div>
              )}
            </div>

            {/* Incident ref */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 9,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  marginBottom: 2,
                }}
              >
                REFERENCE
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: simState === 'done' ? C.GREEN : scenario.pillarColor,
                }}
              >
                {scenario.incident}
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  marginTop: 1,
                }}
              >
                {scenario.pillarLabel?.split('·')[0]?.trim()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '260px 1fr 340px',
          gap: 14,
          marginBottom: 14,
        }}
      >
        {/* ── PIPELINE ── */}
        <div
          style={{
            background: C.PANEL,
            border: `1px solid ${C.BORDER}`,
            borderRadius: 10,
            padding: 16,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: C.MUTED,
              fontFamily: 'monospace',
              letterSpacing: 2,
              marginBottom: 14,
            }}
          >
            PIPELINE — {steps.length} STEPS
          </div>
          {steps.map((step, i) => (
            <div
              key={step.id}
              style={{ display: 'flex', gap: 10, position: 'relative' }}
            >
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
                    width: 32,
                    height: 32,
                    borderRadius: step.type === 'hitl' ? '50%' : 7,
                    background: stepBg(step),
                    border: `2px solid ${stepColor(step)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    position: 'relative',
                    zIndex: 1,
                    boxShadow:
                      stepActive === step.id
                        ? `0 0 10px ${C.BLUE}60`
                        : stepsDone.has(step.id)
                        ? `0 0 8px ${C.GREEN}50`
                        : 'none',
                    transition: 'all 0.4s',
                  }}
                >
                  {stepsDone.has(step.id) ? '✓' : step.icon}
                </div>
                {i < steps.length - 1 && (
                  <div
                    style={{
                      width: 2,
                      height: 20,
                      background: stepsDone.has(step.id)
                        ? `${C.GREEN}40`
                        : 'rgba(0,0,0,0.05)',
                      transition: 'background 0.4s',
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  paddingTop: 4,
                  paddingBottom: i < steps.length - 1 ? 14 : 0,
                  flex: 1,
                  minWidth: 0,
                  cursor:
                    stepsDone.has(step.id) || stepActive === step.id
                      ? 'pointer'
                      : 'default',
                }}
                onClick={() => {
                  if (stepsDone.has(step.id) || stepActive === step.id)
                    setSelStepId(step.id);
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 4,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 12,
                        color:
                          stepActive === step.id || stepsDone.has(step.id)
                            ? stepColor(step)
                            : '#64748B',
                        transition: 'color 0.3s',
                      }}
                    >
                      {step.label}
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        const k = resolveAgent(step.agent);
                        if (k) setSelAgent(selAgent === k ? null : k);
                      }}
                      style={{
                        fontSize: 9,
                        color: resolveAgent(step.agent) ? C.BLUE : C.MUTED,
                        fontFamily: 'monospace',
                        marginTop: 1,
                        cursor: resolveAgent(step.agent)
                          ? 'pointer'
                          : 'default',
                        textDecoration: resolveAgent(step.agent)
                          ? 'underline dotted'
                          : 'none',
                      }}
                    >
                      {(step.agent || '').split(' (')[0]}
                    </div>
                    {stepsDone.has(step.id) && step.metric && (
                      <div
                        style={{
                          fontSize: 9,
                          color: stepColor(step),
                          marginTop: 2,
                          fontFamily: 'monospace',
                        }}
                      >
                        {step.metric.label}: {step.metric.value}
                      </div>
                    )}

                    {stepsDone.has(step.id) &&
                      COT_BY_SCENARIO[scenario.id]?.[step.id] && (
                        <div
                          onClick={() =>
                            setExpandCot(expandCot === step.id ? null : step.id)
                          }
                          style={{
                            fontSize: 9,
                            color: C.BLUE,
                            cursor: 'pointer',
                            marginTop: 3,
                          }}
                        >
                          🧠 {expandCot === step.id ? 'Hide' : 'View'} Reasoning
                        </div>
                      )}
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    {stepsDone.has(step.id) ? (
                      <span
                        style={{
                          fontSize: 8,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: 'rgba(34,197,94,0.12)',
                          color: C.GREEN,
                          fontFamily: 'monospace',
                        }}
                      >
                        DONE
                      </span>
                    ) : stepActive === step.id ? (
                      <span
                        style={{
                          fontSize: 8,
                          padding: '1px 5px',
                          borderRadius: 3,
                          background: 'rgba(59,130,246,0.12)',
                          color: C.BLUE,
                          fontFamily: 'monospace',
                        }}
                      >
                        ACTIVE
                      </span>
                    ) : (
                      <Tag
                        color={step.type === 'hitl' ? C.AMBER : '#94A3B8'}
                        style={{ fontSize: 8 }}
                      >
                        {step.type === 'hitl' ? 'HiTL' : 'Auto'}
                      </Tag>
                    )}
                  </div>
                </div>
                {/* Inline CoT for done steps */}
                {expandCot === step.id &&
                  COT_BY_SCENARIO[scenario.id]?.[step.id] &&
                  (() => {
                    const cot = COT_BY_SCENARIO[scenario.id][step.id];
                    return (
                      <div
                        style={{
                          marginTop: 8,
                          background: 'rgba(59,130,246,0.05)',
                          border: '1px solid rgba(59,130,246,0.15)',
                          borderRadius: 7,
                          padding: 10,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 8,
                            color: C.BLUE,
                            letterSpacing: 2,
                            fontFamily: 'monospace',
                            marginBottom: 6,
                          }}
                        >
                          🧠 AGENT REASONING
                        </div>
                        {cot.thoughts.map((th, ti) => (
                          <div
                            key={ti}
                            style={{
                              fontSize: 11,
                              color: '#1D4ED8',
                              fontStyle: 'italic',
                              lineHeight: 1.6,
                              marginBottom: 4,
                            }}
                          >
                            "{th.t}"
                          </div>
                        ))}
                        <div
                          style={{
                            marginTop: 6,
                            display: 'flex',
                            gap: 3,
                            flexWrap: 'wrap',
                          }}
                        >
                          {cot.tools.map((t) => (
                            <span
                              key={t}
                              style={{
                                fontSize: 9,
                                padding: '1px 6px',
                                background: 'rgba(245,158,11,0.1)',
                                color: C.AMBER,
                                borderRadius: 3,
                                fontFamily: 'monospace',
                              }}
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
              </div>
            </div>
          ))}
        </div>

        {/* ── LIVE LOG ── */}
        <div
          style={{
            background: C.PANEL,
            border: `1px solid ${C.BORDER}`,
            borderRadius: 10,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            height: 500,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
              flexShrink: 0,
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
              LIVE EVENT LOG
            </div>
            {simState !== 'idle' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: simState === 'done' ? C.GREEN : C.BLUE,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    color: simState === 'done' ? C.GREEN : C.BLUE,
                    fontFamily: 'monospace',
                  }}
                >
                  {liveLog.length} events
                </span>
              </div>
            )}
          </div>

          {/* Log box — shrinks when HiTL console appears, never pushes page */}
          <div
            ref={logRef}
            style={{
              overflowY: 'auto',
              fontFamily: 'monospace',
              fontSize: 11,
              height: simState === 'hitl_wait' ? 120 : '100%',
              minHeight: simState === 'hitl_wait' ? 120 : 260,
              flexShrink: simState === 'hitl_wait' ? 0 : 1,
              background: 'rgba(0,0,0,0.05)',
              borderRadius: 6,
              padding: 10,
              transition: 'height 0.3s',
              marginBottom: 8,
            }}
          >
            {simState === 'idle' && (
              <div
                style={{
                  color: '#64748B',
                  textAlign: 'center',
                  paddingTop: 40,
                  fontSize: 12,
                  lineHeight: 2,
                }}
              >
                Press ▶ Start Simulation to begin
                <br />
                <span style={{ fontSize: 11, color: '#64748B' }}>
                  Scenario: {scenario.title}
                </span>
                <br />
                <span style={{ fontSize: 10 }}>{scenario.subtitle}</span>
              </div>
            )}
            {liveLog.map((log, i) => (
              <div
                key={i}
                style={{
                  marginBottom: log.highlight ? 6 : 3,
                  lineHeight: 1.7,
                  fontSize: log.highlight ? 13 : 12,
                  fontWeight: log.highlight ? 600 : 400,
                  color:
                    log.kind === 'success'
                      ? C.GREEN
                      : log.kind === 'warn'
                      ? C.AMBER
                      : '#64748B',
                  background: log.highlight
                    ? log.kind === 'success'
                      ? 'rgba(22,163,74,0.08)'
                      : log.kind === 'warn'
                      ? 'rgba(217,119,6,0.08)'
                      : 'rgba(37,99,235,0.06)'
                    : 'transparent',
                  borderLeft: log.highlight
                    ? `3px solid ${
                        log.kind === 'success'
                          ? C.GREEN
                          : log.kind === 'warn'
                          ? C.AMBER
                          : '#2563EB'
                      }`
                    : '3px solid transparent',
                  padding: log.highlight ? '4px 8px' : '1px 8px',
                  borderRadius: log.highlight ? 5 : 0,
                  transition: 'all 0.3s',
                }}
              >
                <span style={{ color: '#94A3B8', fontSize: 10 }}>
                  [{log.ts}]{' '}
                </span>
                {log.highlight && (
                  <span
                    style={{
                      fontSize: 10,
                      fontFamily: 'monospace',
                      opacity: 0.6,
                    }}
                  >
                    [{log.step}]{' '}
                  </span>
                )}
                {log.msg}
              </div>
            ))}
          </div>

          {/* HiTL Decision Console — sits inside fixed-height container, never pushes page */}
          {simState === 'hitl_wait' && (
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
              <HiTLConsole
                scenario={scenario}
                countdown={countdown}
                onApprove={() =>
                  approveStep(
                    steps.findIndex((s) => s.id === stepActive),
                    'Operator'
                  )
                }
                onReject={() => {
                  clearAll();
                  addLog({
                    msg: '[HiTL] Action rejected by operator — workflow held',
                    kind: 'warn',
                    step: 'Approve',
                  });
                  setSimState('idle');
                }}
                selAgent={selAgent}
                setSelAgent={setSelAgent}
              />
            </div>
          )}
        </div>

        {/* ── AGENT REASONING PANEL ── */}
        <ReasoningPanel
          step={
            steps.find((s) => s.id === selStepId) ||
            (stepActive ? steps.find((s) => s.id === stepActive) : null)
          }
          stepsDone={stepsDone}
          liveLog={liveLog}
          simState={simState}
        />
      </div>

      {/* Outcome */}
      {outcome && <OutcomeCard outcome={outcome} scenario={scenario} />}

      {/* Audit trail */}
      <div
        style={{
          background: C.PANEL,
          border: `1px solid ${C.BORDER}`,
          borderRadius: 10,
          padding: 16,
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
            AUDIT TRAIL{' '}
            {liveAudit.length > 0 && `— ${liveAudit.length} entries`}
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {['all', 'success', 'approved', 'pending'].map((f) => (
              <div
                key={f}
                onClick={() => setAuditF(f)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 5,
                  cursor: 'pointer',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  background:
                    auditF === f ? 'rgba(59,130,246,0.14)' : 'transparent',
                  color: auditF === f ? '#1D4ED8' : C.MUTED,
                  border: `1px solid ${
                    auditF === f ? 'rgba(59,130,246,0.28)' : C.BORDER
                  }`,
                  transition: 'all 0.15s',
                }}
              >
                {f}
              </div>
            ))}
          </div>
        </div>
        {fa.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: '#64748B',
              padding: '24px 0',
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          >
            Audit entries appear as simulation progresses
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 11,
              }}
            >
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.BORDER}` }}>
                  {[
                    'Timestamp',
                    'Agent',
                    'Action',
                    'Target',
                    'Outcome',
                    'Duration',
                    'Auth',
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '7px 9px',
                        textAlign: 'left',
                        fontSize: 9,
                        color: C.MUTED,
                        fontFamily: 'monospace',
                        letterSpacing: 2,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fa.map((e, i) => (
                  <tr
                    key={i}
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.07)' }}
                  >
                    <td
                      style={{
                        padding: '8px 9px',
                        fontFamily: 'monospace',
                        fontSize: 10,
                        color: C.MUTED,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {e.ts}
                    </td>
                    <td
                      style={{
                        padding: '8px 9px',
                        color: '#2563EB',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {e.agent}
                    </td>
                    <td style={{ padding: '8px 9px', color: '#64748B' }}>
                      {e.action}
                    </td>
                    <td
                      style={{
                        padding: '8px 9px',
                        fontFamily: 'monospace',
                        fontSize: 10,
                        color: '#64748B',
                      }}
                    >
                      {e.target}
                    </td>
                    <td style={{ padding: '8px 9px' }}>
                      <span
                        style={{
                          fontSize: 9,
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontFamily: 'monospace',
                          color: oc(e.out),
                          background: `${oc(e.out)}18`,
                          border: `1px solid ${oc(e.out)}28`,
                        }}
                      >
                        {e.out}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '8px 9px',
                        fontFamily: 'monospace',
                        fontSize: 10,
                        color: C.MUTED,
                      }}
                    >
                      {e.dur}
                    </td>
                    <td
                      style={{
                        padding: '8px 9px',
                        fontSize: 10,
                        color:
                          e.auth === 'HiTL' || e.auth === 'Operator'
                            ? C.AMBER
                            : C.MUTED,
                      }}
                    >
                      {e.auth}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
