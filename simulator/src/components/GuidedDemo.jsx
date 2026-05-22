import { useState, useEffect } from 'react';
import { C } from '../config/theme.js';

const SCRIPT = [
  {
    step: 1,
    title: 'The ZeroOps Vision',
    pillar: null,
    nav: 'cmd',
    talking:
      'ZeroOps is the journey from reactive, manual IT operations to fully autonomous, self-healing infrastructure. We achieve this in three stages — silent autonomous operations, human-supervised AI action, and AI-augmented human decision-making. This dashboard shows you the live state of that journey.',
    spotlight:
      'Look at the Silent Operations Centre below — 47 issues resolved today with zero human intervention. Your team never saw them.',
    duration: '~90 sec',
  },
  {
    step: 2,
    title: 'Sentinel — Silent Autonomous Operations',
    pillar: 1,
    nav: 'cmd',
    talking:
      'Sentinel is ZeroOps watching and acting alone. AI agents operate continuously — detecting anomalies, correlating alerts, running RCA, executing low-risk remediations. Risk score below 25, action fully reversible: no human gate, no pager, no ticket.',
    spotlight:
      "The Silent Operations log shows every autonomous action in the last 24 hours. Filter by 'Silent Auto' to see only P1 activity. Notice 1,284 alerts suppressed — your NOC only saw 27.",
    duration: '~60 sec',
    badge: '🤖 P1 SILENT',
    badgeColor: '#2563EB',
  },
  {
    step: 3,
    title: 'Business Value Chart',
    pillar: null,
    nav: 'cmd',
    talking:
      'The AIOps Business Value chart shows 6 months of measurable improvement. MTTR dropped from 142 minutes to 28 — an 80% reduction. Auto-fix rate went from 31% to 75%. Ticket deflection from 28% to 84%. And CSAT improved by 1.4 points.',
    spotlight:
      'Use the range toggle to show 1-month vs 12-month view. The trend is consistent — every metric moving in the right direction every month.',
    duration: '~75 sec',
  },
  {
    step: 4,
    title: 'Advisor — AI-Assisted Human Operations',
    pillar: 3,
    nav: 'inc',
    talking:
      'Advisor is ZeroOps as an expert co-pilot. When an incident needs senior judgment, ZeroOps has already done the hard work — root cause confirmed at 94% confidence, causal chain mapped, remediation staged. The human makes the call; ZeroOps executes it perfectly.',
    spotlight:
      'Click on INC0001847 — the P1 MES Controller incident. Look at the Probable Cause tab: causal chain, confidence score, detection signals. Everything a Level 3 engineer needs — surfaced in seconds.',
    duration: '~90 sec',
    badge: '👤 P3 AI-ASSISTED',
    badgeColor: '#16A34A',
  },
  {
    step: 5,
    title: 'AI-Guided Remediation',
    pillar: 3,
    nav: 'inc',
    talking:
      'In the Runbook tab, the AI has generated a 7-step resolution plan with risk levels, estimated times, and tool assignments. The NOC engineer can trigger the entire auto-executable sequence with one click — every action logged to the audit trail.',
    spotlight:
      "Click 'Runbook' tab. LOW risk steps are marked 🤖 Auto and HIGH risk steps are 👤 Manual. The human stays in control of what matters while AI handles the rest.",
    duration: '~60 sec',
  },
  {
    step: 6,
    title: 'Live Healing — Single Pane',
    pillar: 1,
    nav: 'glass',
    talking:
      'Now watch what happens when we trigger the healthcheck. The AI runs its analysis pipeline — 10 seconds of autonomous work that would have taken an engineer 55 minutes. The Wafer Fabrication chain heals in real time.',
    spotlight:
      "Click 'Run Healthcheck' on the MES Controller app. Watch the AIOps log panel at the top. When it completes, the chain flips from RED to GREEN automatically.",
    duration: '~90 sec',
  },
  {
    step: 7,
    title: 'Dependency Topology',
    pillar: 1,
    nav: 'topo',
    talking:
      'The dependency topology gives any engineer instant situational awareness — from user channels down to bare metal. Four layers: user channels, value chains, applications, and infrastructure. Click any RED or AMBER component to see live diagnostics.',
    spotlight:
      'Click the Wafer Fab chain, then MES Controller app, then the Server component. The diagnostic panel shows metrics, events, recommended action, and the agents that would execute the fix.',
    duration: '~75 sec',
  },
  {
    step: 8,
    title: 'Guardian — Human-in-the-Loop Operations',
    pillar: 2,
    nav: 'wf',
    talking:
      'Guardian is ZeroOps protecting with oversight. Too important to auto-execute, too well-understood to need a full change process. ZeroOps prepares everything — risk assessment, blast radius, simulation outcome. One human approval. The key insight: the approver decides with full context, not instinct.',
    spotlight:
      'Select the SAP Production Patch scenario. Start the simulation and watch it pause at the approval gate. The HiTL decision console shows exactly why human judgment is needed. Minimise this panel to see the full approval screen.',
    duration: '~90 sec',
    badge: '🤝 P2 HITL',
    badgeColor: '#D97706',
  },
  {
    step: 9,
    title: 'When AI Knows Its Limits',
    pillar: 2,
    nav: 'wf',
    talking:
      "ZeroOps is trustworthy because it knows when to ask for help. When RCA returns below 70% confidence, the system doesn't guess — it escalates to L3 with a complete context package. The engineer resolves it fast without starting from scratch.",
    spotlight:
      "Select the 'Agent Escalation' scenario — confidence 61%, fix attempted, metrics bounce. Watch the system page L3 automatically with the full diagnostic context. MTTR is 31 minutes instead of the 3-hour average for escalated incidents.",
    duration: '~75 sec',
  },
  {
    step: 10,
    title: 'The ZeroOps Promise',
    pillar: null,
    nav: 'cmd',
    talking:
      "ZeroOps is not a destination — it's a continuous journey. Every month the automation rate improves. Every month the MTTR drops. Every month the CSAT rises. The goal is an operations team that spends 80% of its time on innovation, not firefighting.",
    spotlight:
      'The CSAT trend says it best — 3.2 to 4.6 in 6 months. When your systems fix themselves, your engineers are happier, your users are happier, and your business moves faster.',
    duration: '~60 sec',
  },
];

const PILLAR_COLORS = { 1: '#2563EB', 2: '#D97706', 3: '#16A34A' };
const PILLAR_NAMES = { 1: 'Silent Auto', 2: 'HiTL', 3: 'AI-Assisted' };

export default function GuidedDemo({
  step,
  onStep,
  onNav,
  onExit,
  currentNav,
}) {
  const [minimised, setMinimised] = useState(false);
  const current = SCRIPT[step] || SCRIPT[0];
  const total = SCRIPT.length;
  const pct = ((step + 1) / total) * 100;

  // Auto-navigate when step changes
  useEffect(() => {
    if (current.nav && current.nav !== currentNav) {
      onNav({ nav: current.nav });
    }
    // eslint-disable-next-line
  }, [step]);

  // Auto-minimise during HiTL step so approve button is accessible
  useEffect(() => {
    if (current.pillar === 2 && step === 7) {
      // Don't force minimise — let user control it — but show hint
    }
  }, [step, current]);

  const goNext = () => {
    if (step < total - 1) {
      setMinimised(false);
      onStep((s) => s + 1);
    }
  };
  const goPrev = () => {
    if (step > 0) {
      setMinimised(false);
      onStep((s) => s - 1);
    }
  };

  return (
    <>
      {/* Progress bar — always visible at top */}
      <div
        style={{
          position: 'fixed',
          top: 48,
          left: 0,
          right: 0,
          height: 3,
          background: 'rgba(0,0,0,0.08)',
          zIndex: 500,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            height: '100%',
            background: 'linear-gradient(90deg,#7C3AED,#2563EB,#16A34A)',
            width: `${pct}%`,
            transition: 'width 0.4s',
          }}
        />
      </div>

      {/* ── DEMO PANEL — fixed lower-right corner ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          width: minimised ? 220 : 400,
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(124,58,237,0.25)',
          borderRadius: 12,
          boxShadow:
            '0 8px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(124,58,237,0.1)',
          zIndex: 490,
          overflow: 'hidden',
          transition: 'width 0.25s ease',
        }}
      >
        {/* ── HEADER — always visible ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '9px 12px',
            background:
              'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(37,99,235,0.06))',
            borderBottom: minimised ? 'none' : '1px solid rgba(0,0,0,0.08)',
            cursor: minimised ? 'pointer' : 'default',
          }}
          onClick={() => minimised && setMinimised(false)}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 0,
            }}
          >
            <span style={{ fontSize: 13, flexShrink: 0 }}>🎯</span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#7C3AED',
                fontFamily: 'monospace',
                whiteSpace: 'nowrap',
              }}
            >
              DEMO {step + 1}/{total}
            </span>
            {!minimised && current.pillar && (
              <span
                style={{
                  fontSize: 9,
                  padding: '1px 6px',
                  background: `${PILLAR_COLORS[current.pillar]}15`,
                  color: PILLAR_COLORS[current.pillar],
                  border: `1px solid ${PILLAR_COLORS[current.pillar]}35`,
                  borderRadius: 3,
                  fontFamily: 'monospace',
                  whiteSpace: 'nowrap',
                }}
              >
                P{current.pillar}
              </span>
            )}
            {minimised && (
              <span
                style={{
                  fontSize: 11,
                  color: '#64748B',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {current.title}
              </span>
            )}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              flexShrink: 0,
            }}
          >
            {/* Minimise / Restore button */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                setMinimised((m) => !m);
              }}
              title={minimised ? 'Expand' : 'Minimise'}
              style={{
                cursor: 'pointer',
                width: 22,
                height: 22,
                borderRadius: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.05)',
                fontSize: 12,
                color: '#64748B',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {minimised ? '□' : '—'}
            </div>
            {/* Exit button */}
            <div
              onClick={onExit}
              title="Exit Demo Mode"
              style={{
                cursor: 'pointer',
                width: 22,
                height: 22,
                borderRadius: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.05)',
                fontSize: 12,
                color: '#64748B',
              }}
            >
              ✕
            </div>
          </div>
        </div>

        {/* ── BODY — hidden when minimised ── */}
        {!minimised && (
          <div style={{ padding: '12px 14px' }}>
            {/* Step title */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#0F172A',
                marginBottom: 8,
                lineHeight: 1.4,
              }}
            >
              {current.title}
            </div>

            {/* Talking point */}
            <div
              style={{
                fontSize: 11,
                color: '#475569',
                lineHeight: 1.75,
                marginBottom: 10,
              }}
            >
              {current.talking}
            </div>

            {/* Spotlight */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '9px 10px',
                background: 'rgba(217,119,6,0.06)',
                border: '1px solid rgba(217,119,6,0.2)',
                borderRadius: 7,
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 14, flexShrink: 0 }}>👆</span>
              <div style={{ fontSize: 11, color: '#92400E', lineHeight: 1.65 }}>
                {current.spotlight}
              </div>
            </div>

            {/* Duration */}
            <div
              style={{
                fontSize: 10,
                color: '#94A3B8',
                fontFamily: 'monospace',
                marginBottom: 10,
                textAlign: 'right',
              }}
            >
              {current.duration}
            </div>

            {/* Navigation */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <button
                onClick={goPrev}
                disabled={step === 0}
                style={{
                  background: 'rgba(0,0,0,0.04)',
                  color: step === 0 ? '#CBD5E1' : '#475569',
                  border: '1px solid rgba(0,0,0,0.1)',
                  borderRadius: 6,
                  padding: '6px 12px',
                  fontSize: 11,
                  cursor: step === 0 ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                ← Prev
              </button>

              {/* Dot pills */}
              <div
                style={{
                  display: 'flex',
                  gap: 3,
                  flex: 1,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                }}
              >
                {SCRIPT.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      onStep(i);
                      setMinimised(false);
                    }}
                    style={{
                      width: i === step ? 16 : 6,
                      height: 6,
                      borderRadius: 3,
                      cursor: 'pointer',
                      background:
                        i < step
                          ? 'rgba(124,58,237,0.4)'
                          : i === step
                          ? '#7C3AED'
                          : 'rgba(0,0,0,0.12)',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>

              {step < total - 1 ? (
                <button
                  onClick={goNext}
                  style={{
                    background: 'linear-gradient(135deg,#6D28D9,#7C3AED)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={onExit}
                  style={{
                    background: 'linear-gradient(135deg,#14532D,#16A34A)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 12px',
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  ✓ Done
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
