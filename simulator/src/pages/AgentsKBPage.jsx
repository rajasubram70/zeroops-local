import { useState } from 'react';
import { C } from '../config/theme.js';
import { Tag, Lbl } from '../components/atoms.jsx';
import {
  CUSTOMER,
  KB_ARTICLES,
  AGENT_DEFS,
  INTEGRATION_GROUPS,
} from '../data/customer/loader.js';

// ── KB data — from customer JSON via loader (falls back to legacy for Ericsson)
const KB_DATA =
  KB_ARTICLES && KB_ARTICLES.length > 0
    ? KB_ARTICLES.map((a) => ({
        id: a.id,
        title: a.title,
        category: a.domain || a.category || 'General',
        tags: a.tags || [],
        summary: a.body || a.summary || '',
        status: a.status || 'active',
      }))
    : [];

// Build detail map from KB_ARTICLES sections — works for any customer JSON
const KB_DETAIL =
  KB_ARTICLES && KB_ARTICLES.length > 0
    ? Object.fromEntries(
        KB_ARTICLES.map((a) => [
          a.id,
          {
            summary: a.body || a.summary || '',
            lastUpdated: 'This month',
            author: 'ZeroOps Knowledge Engine',
            sections: (a.sections || []).map((s) => ({
              title: s.title,
              content: s.content,
            })),
            relatedIncidents: a.relatedIncidents || a.related_incidents || [],
            relatedAgents:
              a.relatedAgents ||
              a.related_agents ||
              a.relatedAgents ||
              (a.tags || []).slice(0, 3),
          },
        ])
      )
    : {};

// ── Integration Ecosystem loaded from customer JSON ────────────

// ── KB DETAIL PANEL

// ── KB DETAIL PANEL

// ── KB DETAIL PANEL ───────────────────────────────────────────
function KBDetailPanel({ article, detail, onClose }) {
  const [openSection, setOpenSection] = useState(0);
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.98)',
        border: '1px solid rgba(59,130,246,0.25)',
        borderRadius: 10,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: 'calc(100vh - 180px)',
      }}
    >
      <div
        style={{
          padding: '14px 18px',
          borderBottom: `1px solid ${C.BORDER}`,
          background: 'rgba(59,130,246,0.06)',
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
          <div style={{ flex: 1, marginRight: 12 }}>
            <div
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: C.BLUE,
                marginBottom: 4,
              }}
            >
              {article.id}
            </div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#0F172A',
                lineHeight: 1.4,
                marginBottom: 8,
              }}
            >
              {article.title}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.7 }}>
              {detail.summary}
            </div>
          </div>
          <div
            onClick={onClose}
            style={{
              cursor: 'pointer',
              color: C.MUTED,
              fontSize: 20,
              flexShrink: 0,
            }}
          >
            ✕
          </div>
        </div>
        <div
          style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}
        >
          {(article.tags || []).map((t) => (
            <Tag key={t} color={C.PURPLE}>
              {t}
            </Tag>
          ))}
          <Tag color="#64748B">{article.domain}</Tag>
          <span
            style={{
              fontSize: 10,
              color: C.MUTED,
              fontFamily: 'monospace',
              marginLeft: 'auto',
            }}
          >
            Updated {detail.lastUpdated} · By {detail.author}
          </span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {detail.sections.map((sec, i) => (
          <div
            key={i}
            style={{
              marginBottom: 10,
              border: `1px solid ${
                openSection === i ? 'rgba(59,130,246,0.3)' : C.BORDER
              }`,
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <div
              onClick={() => setOpenSection(openSection === i ? -1 : i)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                cursor: 'pointer',
                background:
                  openSection === i
                    ? 'rgba(59,130,246,0.08)'
                    : 'rgba(0,0,0,0.025)',
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: openSection === i ? '#1D4ED8' : '#1E293B',
                }}
              >
                {sec.title}
              </span>
              <span
                style={{
                  color: C.MUTED,
                  fontSize: 14,
                  transition: 'transform 0.2s',
                  transform: openSection === i ? 'rotate(180deg)' : 'none',
                }}
              >
                ▾
              </span>
            </div>
            {openSection === i && (
              <div style={{ padding: '0 14px 14px' }}>
                {sec.content && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748B',
                      lineHeight: 1.8,
                      marginTop: 10,
                      background: 'rgba(0,0,0,0.025)',
                      borderRadius: 6,
                      padding: 12,
                    }}
                  >
                    {sec.content}
                  </div>
                )}
                {sec.steps && (
                  <div style={{ marginTop: 10 }}>
                    {(sec.steps || []).map((step, si) => {
                      const isCode =
                        step.startsWith('SELECT') ||
                        step.startsWith('kubectl') ||
                        step.startsWith('ansible') ||
                        step.startsWith('aws') ||
                        step.startsWith('curl') ||
                        step.startsWith('systemctl') ||
                        step.startsWith('logrotate');
                      return (
                        <div
                          key={si}
                          style={{ display: 'flex', gap: 10, marginBottom: 8 }}
                        >
                          <div
                            style={{
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: 'rgba(59,130,246,0.15)',
                              border: '1px solid rgba(59,130,246,0.3)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 10,
                              color: C.BLUE,
                              flexShrink: 0,
                              fontFamily: 'monospace',
                              fontWeight: 700,
                            }}
                          >
                            {si + 1}
                          </div>
                          <div
                            style={{
                              flex: 1,
                              fontSize: isCode ? 11 : 12,
                              color: '#64748B',
                              lineHeight: 1.7,
                              paddingTop: 2,
                              fontFamily: isCode ? 'monospace' : 'inherit',
                              background: isCode
                                ? 'rgba(0,0,0,0.05)'
                                : 'transparent',
                              borderRadius: isCode ? 5 : 0,
                              padding: isCode ? '6px 10px' : 0,
                            }}
                          >
                            {step}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            marginTop: 8,
          }}
        >
          <div
            style={{
              background: C.PANEL,
              border: `1px solid ${C.BORDER}`,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              RELATED INCIDENTS
            </div>
            {detail.relatedIncidents.map((id) => (
              <div
                key={id}
                style={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  color: C.BLUE,
                  padding: '3px 0',
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                {id}
              </div>
            ))}
          </div>
          <div
            style={{
              background: C.PANEL,
              border: `1px solid ${C.BORDER}`,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: C.MUTED,
                fontFamily: 'monospace',
                letterSpacing: 2,
                marginBottom: 8,
              }}
            >
              AGENTS THAT USE THIS
            </div>
            {detail.relatedAgents.map((name) => (
              <div
                key={name}
                style={{
                  fontSize: 12,
                  color: '#1D4ED8',
                  padding: '3px 0',
                  borderBottom: '1px solid rgba(0,0,0,0.08)',
                }}
              >
                ◈ {name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CHAIN OF THOUGHT ──────────────────────────────────────────
function ChainOfThought({ cot, conclusion }) {
  return (
    <div
      style={{
        marginTop: 12,
        borderTop: `1px solid ${C.BORDER}`,
        paddingTop: 12,
      }}
    >
      <div
        style={{
          fontSize: 9,
          color: C.MUTED,
          letterSpacing: 2,
          fontFamily: 'monospace',
          marginBottom: 10,
        }}
      >
        🧠 CHAIN OF THOUGHT & REASONING
      </div>
      <div style={{ position: 'relative', paddingLeft: 14 }}>
        <div
          style={{
            position: 'absolute',
            left: 6,
            top: 6,
            bottom: 32,
            width: 1,
            background: 'rgba(59,130,246,0.25)',
          }}
        />
        {cot.map((step, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 9,
              marginBottom: 10,
              position: 'relative',
            }}
          >
            <div
              style={{
                width: 13,
                height: 13,
                borderRadius: '50%',
                background: C.BLUE,
                flexShrink: 0,
                marginTop: 2,
                zIndex: 1,
                fontSize: 7,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
              }}
            >
              {step.step}
            </div>
            <div
              style={{
                flex: 1,
                background: 'rgba(59,130,246,0.05)',
                border: '1px solid rgba(59,130,246,0.15)',
                borderRadius: 6,
                padding: '8px 10px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: '#1D4ED8',
                  lineHeight: 1.6,
                  marginBottom: 5,
                  fontStyle: 'italic',
                }}
              >
                "{step.thought}"
              </div>
              <div
                style={{
                  fontSize: 9,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  marginBottom: 3,
                }}
              >
                ▶ {step.action}
              </div>
              <div style={{ fontSize: 10, color: C.GREEN }}>
                ✓ {step.result}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div
        style={{
          background: 'rgba(34,197,94,0.06)',
          border: '1px solid rgba(34,197,94,0.2)',
          borderRadius: 7,
          padding: 10,
          marginTop: 6,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: C.GREEN,
            letterSpacing: 2,
            fontFamily: 'monospace',
            marginBottom: 5,
          }}
        >
          AGENT CONCLUSION
        </div>
        <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.7 }}>
          {conclusion}
        </div>
      </div>
    </div>
  );
}

// ── AGENT ANATOMY MODAL ───────────────────────────────────────
// ── Safe field accessor — prevents any .map crash in AnatomyModal ──
function safeArr(v) {
  return Array.isArray(v) ? v : [];
}
function safeStr(v) {
  return v && typeof v === 'string' ? v : '';
}

function AnatomyModal({ agent, onClose }) {
  if (!agent?.anatomy) return null;
  // Deep-normalise every field the modal could possibly access
  const tools = safeArr(agent.tools);
  const integrations = safeArr(agent.integrations);
  const caps = safeArr(agent.caps);
  const tags = safeArr(agent.tags);
  const drift = agent.drift || { dir: 'stable', label: 'Stable', delta: '' };
  const a = {
    //trigger: safeStr(agent.anatomy.trigger),
    process: safeStr(agent.anatomy.process),
    output: safeStr(agent.anatomy.output),
    role: safeStr(agent.anatomy.role),
    expectedOutput: safeStr(
      agent.anatomy.expectedOutput || agent.anatomy.output
    ),
    decisionCriteria: safeStr(agent.anatomy.decisionCriteria),
    memoryType: safeStr(agent.anatomy.memoryType || 'Contextual'),
    llmReasoning: safeStr(agent.anatomy.llmReasoning),
    tasks: safeArr(agent.anatomy.tasks),
    contextUsed: safeArr(agent.anatomy.contextUsed),
    steps: safeArr(agent.anatomy.steps),
    inputs: safeArr(agent.anatomy.inputs),
    outputs: safeArr(agent.anatomy.outputs),
    metrics: safeArr(agent.anatomy.metrics),
    events: safeArr(agent.anatomy.events),
    actions: safeArr(agent.anatomy.actions),
    phases: safeArr(agent.anatomy.phases),
  };
  // Rebuild agent with safe fields for any direct agent.X access in JSX below
  agent = { ...agent, tools, integrations, caps, tags, drift, anatomy: a };
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.99)',
          border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 12,
          width: '100%',
          maxWidth: 680,
          maxHeight: '85vh',
          overflow: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${C.BORDER}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(37,99,235,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background:
                  'linear-gradient(135deg,rgba(37,99,235,0.15),rgba(124,58,237,0.15))',
                border: '1px solid rgba(37,99,235,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
              }}
            >
              {agent.icon}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
                {agent.name} — Agent Anatomy
              </div>
              <div style={{ fontSize: 11, color: C.MUTED }}>
                {agent.model} · {agent.provider}
              </div>
            </div>
          </div>
          <div
            onClick={onClose}
            style={{ cursor: 'pointer', color: C.MUTED, fontSize: 20 }}
          >
            ✕
          </div>
        </div>
        <div
          style={{
            padding: 20,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 14,
          }}
        >
          <div
            style={{
              gridColumn: 'span 2',
              background: 'rgba(37,99,235,0.06)',
              border: '1px solid rgba(37,99,235,0.15)',
              borderRadius: 8,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: C.BLUE,
                letterSpacing: 3,
                fontFamily: 'monospace',
                marginBottom: 4,
              }}
            >
              AGENT ROLE
            </div>
            <div style={{ fontSize: 13, color: '#1E293B', fontWeight: 500 }}>
              {a.role}
            </div>
          </div>
          <div
            style={{
              background: 'rgba(0,0,0,0.02)',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 8,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: C.MUTED,
                letterSpacing: 3,
                fontFamily: 'monospace',
                marginBottom: 10,
              }}
            >
              LIST OF TASKS
            </div>
            {a.tasks.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 6 }}>
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: 'rgba(37,99,235,0.12)',
                    border: '1px solid rgba(37,99,235,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    color: C.BLUE,
                    flexShrink: 0,
                    fontFamily: 'monospace',
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}
                >
                  {t}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              background: 'rgba(0,0,0,0.02)',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 8,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: C.MUTED,
                letterSpacing: 3,
                fontFamily: 'monospace',
                marginBottom: 8,
              }}
            >
              EXPECTED OUTPUT
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#475569',
                lineHeight: 1.7,
                marginBottom: 10,
              }}
            >
              {a.expectedOutput}
            </div>
            <div
              style={{
                fontSize: 9,
                color: C.MUTED,
                letterSpacing: 3,
                fontFamily: 'monospace',
                marginBottom: 6,
              }}
            >
              DECISION CRITERIA
            </div>
            <div
              style={{
                fontSize: 11,
                color: '#475569',
                lineHeight: 1.7,
                background: 'rgba(217,119,6,0.05)',
                border: '1px solid rgba(217,119,6,0.15)',
                borderRadius: 5,
                padding: '8px 10px',
              }}
            >
              {a.decisionCriteria}
            </div>
          </div>
          <div
            style={{
              background: 'rgba(0,0,0,0.02)',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 8,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: C.MUTED,
                letterSpacing: 3,
                fontFamily: 'monospace',
                marginBottom: 8,
              }}
            >
              CONTEXT USED
            </div>
            {a.contextUsed.map((ctx, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 6,
                  marginBottom: 5,
                }}
              >
                <span style={{ color: C.BLUE, fontSize: 12, flexShrink: 0 }}>
                  ◈
                </span>
                <span style={{ fontSize: 11, color: '#475569' }}>{ctx}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              background: 'rgba(0,0,0,0.02)',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 8,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: C.MUTED,
                letterSpacing: 3,
                fontFamily: 'monospace',
                marginBottom: 8,
              }}
            >
              MEMORY TYPE
            </div>
            <Tag
              color={C.BLUE}
              style={{ marginBottom: 10, display: 'inline-block' }}
            >
              {a.memoryType}
            </Tag>
            <div
              style={{
                fontSize: 9,
                color: C.MUTED,
                letterSpacing: 3,
                fontFamily: 'monospace',
                marginBottom: 6,
                marginTop: 10,
              }}
            >
              LLM REASONING
            </div>
            <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.7 }}>
              {a.llmReasoning}
            </div>
          </div>
          <div
            style={{
              gridColumn: 'span 2',
              background: 'rgba(0,0,0,0.02)',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 8,
              padding: 14,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: C.MUTED,
                letterSpacing: 3,
                fontFamily: 'monospace',
                marginBottom: 8,
              }}
            >
              TOOLS USED
            </div>
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
                marginBottom: 12,
              }}
            >
              {(agent.tools || []).map((t) => (
                <Tag key={t} color={C.AMBER}>
                  {t}
                </Tag>
              ))}
            </div>
            <div
              style={{
                fontSize: 9,
                color: C.MUTED,
                letterSpacing: 3,
                fontFamily: 'monospace',
                marginBottom: 8,
              }}
            >
              INTEGRATIONS
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(agent.integrations || []).map((t) => (
                <Tag key={t} color="#0891B2">
                  {t}
                </Tag>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────
export default function AgentsKBPage({ runHC }) {
  const [tab, setTab] = useState('agents');
  const [selA, setSelA] = useState(null);
  const [showCot, setShowCot] = useState(null);
  const [anatomyAgent, setAnatomyAgent] = useState(null);
  const [selKB, setSelKB] = useState(null);
  const [kbQ, setKbQ] = useState('');

  const filtered = KB_DATA.filter(
    (a) =>
      !kbQ ||
      a.title.toLowerCase().includes(kbQ.toLowerCase()) ||
      (a.tags || []).some((t) => t.toLowerCase().includes(kbQ.toLowerCase()))
  );

  return (
    <div style={{ padding: 22 }}>
      {anatomyAgent && (
        <AnatomyModal
          agent={anatomyAgent}
          onClose={() => setAnatomyAgent(null)}
        />
      )}

      <Lbl n="4">AI Agents & Knowledge Base</Lbl>
      <div style={{ display: 'flex', gap: 7, marginBottom: 14 }}>
        {[
          ['agents', '🤖 Agent Library'],
          ['kb', '📚 Knowledge Base'],
          ['integrations', '🔌 Integrations'],
        ].map(([t, l]) => (
          <div
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '6px 14px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: tab === t ? 600 : 400,
              background:
                tab === t ? 'rgba(37,99,235,0.1)' : 'rgba(0,0,0,0.03)',
              color: tab === t ? '#1D4ED8' : C.MUTED,
              border: `1px solid ${
                tab === t ? 'rgba(37,99,235,0.28)' : C.BORDER
              }`,
              transition: 'all 0.15s',
            }}
          >
            {l}
          </div>
        ))}
      </div>

      {/* ── AGENTS ── */}
      {tab === 'agents' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))',
            gap: 12,
          }}
        >
          {AGENT_DEFS.map((agent) => (
            <div
              key={agent.id}
              style={{
                background: C.PANEL,
                border: `1px solid ${
                  selA?.id === agent.id ? 'rgba(37,99,235,0.35)' : C.BORDER
                }`,
                borderRadius: 10,
                padding: 16,
                transition: 'all 0.2s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 9,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 9,
                    background:
                      'linear-gradient(135deg,rgba(37,99,235,0.12),rgba(124,58,237,0.12))',
                    border: '1px solid rgba(37,99,235,0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                  }}
                >
                  {agent.icon}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 20,
                    background:
                      agent.status === 'Active'
                        ? 'rgba(22,163,74,0.1)'
                        : 'rgba(107,114,128,0.1)',
                    color: agent.status === 'Active' ? C.GREEN : '#6b7280',
                    fontFamily: 'monospace',
                  }}
                >
                  {agent.status}
                </span>
              </div>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: '#1E293B',
                  marginBottom: 5,
                }}
              >
                {agent.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: C.MUTED,
                  lineHeight: 1.5,
                  marginBottom: 9,
                }}
              >
                {agent.desc}
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  marginBottom: 9,
                  flexWrap: 'wrap',
                }}
              >
                <Tag>{agent.model}</Tag>
                <Tag color={C.BLUE}>{agent.provider}</Tag>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 6,
                  borderTop: `1px solid ${C.BORDER}`,
                  paddingTop: 9,
                  marginBottom: 9,
                }}
              >
                {[
                  ['Runs', agent.runs.toLocaleString()],
                  ['Success', `${agent.ok}%`],
                  ['Avg', agent.dur],
                ].map(([l, v]) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#1E293B',
                        fontFamily: 'monospace',
                      }}
                    >
                      {v}
                    </div>
                    <div style={{ fontSize: 10, color: C.MUTED }}>{l}</div>
                  </div>
                ))}
              </div>
              {/* ── AGENT ECONOMICS ── */}
              <div
                style={{
                  background: 'rgba(37,99,235,0.04)',
                  border: `1px solid rgba(37,99,235,0.12)`,
                  borderRadius: 7,
                  padding: '10px 12px',
                  marginBottom: 9,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: C.BLUE,
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                    marginBottom: 8,
                  }}
                >
                  AGENT ECONOMICS
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                    marginBottom: 7,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        color: C.MUTED,
                        fontFamily: 'monospace',
                        marginBottom: 2,
                      }}
                    >
                      TOKENS / MONTH
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#1E293B',
                        fontFamily: 'monospace',
                      }}
                    >
                      {agent.tokensMonth || '—'}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        color: C.MUTED,
                        fontFamily: 'monospace',
                        marginBottom: 2,
                      }}
                    >
                      COST / SUCCESS
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: C.GREEN,
                        fontFamily: 'monospace',
                      }}
                    >
                      {agent.costOK || '—'}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 6,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        color: C.MUTED,
                        fontFamily: 'monospace',
                        marginBottom: 2,
                      }}
                    >
                      HUMAN TOUCH
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 4,
                          background: 'rgba(0,0,0,0.08)',
                          borderRadius: 2,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${agent.humanTouchPct || 0}%`,
                            background:
                              agent.humanTouchPct > 20
                                ? C.AMBER
                                : agent.humanTouchPct > 5
                                ? C.BLUE
                                : C.GREEN,
                            borderRadius: 2,
                            transition: 'width 0.3s',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          color:
                            agent.humanTouchPct > 20
                              ? C.AMBER
                              : agent.humanTouchPct > 5
                              ? C.BLUE
                              : C.GREEN,
                        }}
                      >
                        {agent.humanTouchPct || 0}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 9,
                        color: C.MUTED,
                        fontFamily: 'monospace',
                        marginBottom: 2,
                      }}
                    >
                      DRIFT
                    </div>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <span style={{ fontSize: 14 }}>
                        {agent.drift?.dir === 'up'
                          ? '↑'
                          : agent.drift?.dir === 'down'
                          ? '↓'
                          : '→'}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          color:
                            agent.drift?.dir === 'up'
                              ? C.GREEN
                              : agent.drift?.dir === 'down'
                              ? C.RED
                              : C.AMBER,
                        }}
                      >
                        {agent.drift?.label || 'Stable'}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          color: C.MUTED,
                          fontFamily: 'monospace',
                        }}
                      >
                        {agent.drift?.delta || ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ marginBottom: 9 }}>
                <div
                  style={{
                    fontSize: 9,
                    color: C.MUTED,
                    letterSpacing: 2,
                    fontFamily: 'monospace',
                    marginBottom: 5,
                  }}
                >
                  INTEGRATIONS
                </div>
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  {(agent.integrations || []).slice(0, 4).map((t) => (
                    <Tag key={t} color="#0891B2" style={{ fontSize: 9 }}>
                      {t}
                    </Tag>
                  ))}
                  {(agent.integrations || []).length > 4 && (
                    <span style={{ fontSize: 10, color: C.MUTED }}>
                      +{(agent.integrations || []).length - 4}
                    </span>
                  )}
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 6,
                  borderTop: `1px solid ${C.BORDER}`,
                  paddingTop: 9,
                }}
              >
                <button
                  onClick={() => setSelA(selA?.id === agent.id ? null : agent)}
                  style={{
                    background: 'rgba(37,99,235,0.08)',
                    color: '#1D4ED8',
                    border: '1px solid rgba(37,99,235,0.18)',
                    borderRadius: 5,
                    padding: '6px 8px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {selA?.id === agent.id ? '▲ Hide' : '▼ Details'}
                </button>
                <button
                  onClick={() => setAnatomyAgent(agent)}
                  style={{
                    background: 'rgba(124,58,237,0.08)',
                    color: '#6D28D9',
                    border: '1px solid rgba(124,58,237,0.18)',
                    borderRadius: 5,
                    padding: '6px 8px',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  🔬 Anatomy
                </button>
              </div>
              {selA?.id === agent.id && (
                <div
                  style={{
                    marginTop: 11,
                    borderTop: `1px solid ${C.BORDER}`,
                    paddingTop: 11,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      color: C.MUTED,
                      letterSpacing: 2,
                      fontFamily: 'monospace',
                      marginBottom: 5,
                    }}
                  >
                    TOOLS
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 3,
                      flexWrap: 'wrap',
                      marginBottom: 9,
                    }}
                  >
                    {(agent.tools || []).map((t) => (
                      <Tag key={t} color={C.AMBER}>
                        {t}
                      </Tag>
                    ))}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: C.MUTED,
                      letterSpacing: 2,
                      fontFamily: 'monospace',
                      marginBottom: 4,
                    }}
                  >
                    MEMORY
                  </div>
                  <Tag
                    color={C.BLUE}
                    style={{ marginBottom: 9, display: 'inline-block' }}
                  >
                    {agent.mem}
                  </Tag>
                  <div
                    style={{
                      fontSize: 9,
                      color: C.MUTED,
                      letterSpacing: 2,
                      fontFamily: 'monospace',
                      margin: '4px 0 5px',
                    }}
                  >
                    CAPABILITIES
                  </div>
                  {(agent.caps || []).map((cap) => (
                    <div
                      key={cap}
                      style={{
                        fontSize: 12,
                        color: '#64748B',
                        padding: '2px 0',
                      }}
                    >
                      · {cap}
                    </div>
                  ))}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 6,
                      marginTop: 10,
                    }}
                  >
                    <button
                      onClick={() =>
                        setShowCot(showCot === agent.id ? null : agent.id)
                      }
                      style={{
                        background: 'rgba(37,99,235,0.08)',
                        color: '#1D4ED8',
                        border: '1px solid rgba(37,99,235,0.18)',
                        borderRadius: 5,
                        padding: '6px 8px',
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      🧠 {showCot === agent.id ? 'Hide' : 'Reasoning'}
                    </button>
                    <button
                      onClick={() => runHC('sap-ap1')}
                      style={{
                        background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 5,
                        padding: '6px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      ▶ Simulate
                    </button>
                  </div>
                  {showCot === agent.id && agent.chainOfThought && (
                    <ChainOfThought
                      cot={agent.chainOfThought}
                      conclusion={agent.conclusion}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── KNOWLEDGE BASE ── */}
      {tab === 'kb' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: selKB ? '1fr 480px' : '1fr',
            gap: 14,
            alignItems: 'start',
          }}
        >
          <div>
            <input
              value={kbQ}
              onChange={(e) => setKbQ(e.target.value)}
              placeholder="Search articles, tags, domains..."
              style={{
                width: '100%',
                background: C.PANEL,
                border: `1px solid ${C.BORDER}`,
                borderRadius: 7,
                padding: '10px 14px',
                fontSize: 13,
                color: '#1E293B',
                outline: 'none',
                marginBottom: 14,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'grid', gap: 10 }}>
              {filtered.map((art) => {
                const isSel = selKB === art.id;
                return (
                  <div
                    key={art.id}
                    onClick={() => setSelKB(isSel ? null : art.id)}
                    style={{
                      background: isSel ? 'rgba(37,99,235,0.05)' : C.PANEL,
                      border: `1px solid ${
                        isSel ? 'rgba(37,99,235,0.35)' : C.BORDER
                      }`,
                      borderRadius: 9,
                      padding: 16,
                      cursor: 'pointer',
                      transition: 'all 0.18s',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSel)
                        e.currentTarget.style.borderColor =
                          'rgba(37,99,235,0.2)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel) e.currentTarget.style.borderColor = C.BORDER;
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 5,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: 11,
                              color: C.BLUE,
                            }}
                          >
                            {art.id}
                          </span>
                          <Tag color="#64748B">{art.domain}</Tag>
                          <span
                            style={{
                              fontSize: 10,
                              color: C.MUTED,
                              fontFamily: 'monospace',
                              marginLeft: 'auto',
                            }}
                          >
                            {art.reads} reads
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#1E293B',
                            lineHeight: 1.4,
                          }}
                        >
                          {art.title}
                        </div>
                      </div>
                      <span
                        style={{
                          color: isSel ? C.BLUE : C.MUTED,
                          fontSize: 14,
                          marginLeft: 10,
                          flexShrink: 0,
                        }}
                      >
                        {isSel ? '✕' : '→'}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#64748B',
                        lineHeight: 1.7,
                        marginBottom: 9,
                      }}
                    >
                      {art.body}
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                      {art.tags.map((t) => (
                        <Tag key={t} color={C.BLUE}>
                          {t}
                        </Tag>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    color: C.MUTED,
                    padding: '32px 0',
                    fontSize: 13,
                  }}
                >
                  No articles match "{kbQ}"
                </div>
              )}
            </div>
          </div>
          {selKB && KB_DETAIL[selKB] && (
            <KBDetailPanel
              article={KB_DATA.find((a) => a.id === selKB)}
              detail={KB_DETAIL[selKB]}
              onClose={() => setSelKB(null)}
            />
          )}
        </div>
      )}

      {/* ── INTEGRATIONS ── */}
      {tab === 'integrations' && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: '#1E293B',
                marginBottom: 4,
              }}
            >
              Integration Ecosystem
            </div>
            <div
              style={{ fontSize: 12, color: C.MUTED }}
            >{`All systems ZeroOps connects to in the ${
              CUSTOMER?.name || 'Enterprise'
            } IT environment — live status, last activity, and agent usage.`}</div>
          </div>
          {INTEGRATION_GROUPS.map((group) => (
            <div key={group.cat} style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 3,
                    height: 16,
                    background: group.color,
                    borderRadius: 2,
                  }}
                />
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}
                >
                  {group.cat}
                </div>
                <div
                  style={{ flex: 1, height: 1, background: `${group.color}20` }}
                />
                <div style={{ fontSize: 11, color: C.MUTED }}>
                  {group.items.filter((i) => i.status === 'Live').length} live ·{' '}
                  {group.items.filter((i) => i.status === 'Configured').length}{' '}
                  configured ·{' '}
                  {group.items.filter((i) => i.status === 'Available').length}{' '}
                  available
                </div>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))',
                  gap: 8,
                }}
              >
                {group.items.map((item) => {
                  const statusColor =
                    item.status === 'Live'
                      ? C.GREEN
                      : item.status === 'Configured'
                      ? C.AMBER
                      : '#94A3B8';
                  const statusBg =
                    item.status === 'Live'
                      ? 'rgba(22,163,74,0.07)'
                      : item.status === 'Configured'
                      ? 'rgba(217,119,6,0.07)'
                      : 'rgba(0,0,0,0.025)';
                  return (
                    <div
                      key={item.name}
                      style={{

                        border: `2px solid ${statusColor}25`,
                        borderRadius: 8,
                        padding: '11px 12px',
                        position: 'relative',
                      }}
                    >
                      
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{item.icon}</span>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: item.highlight ? 700 : 500,
                              color: item.highlight ? '#1D4ED8' : '#1E293B',
                            }}
                          >
                            {item.name}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 9,
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: statusBg,
                            color: statusColor,
                            border: `1px solid ${statusColor}25`,
                            fontFamily: 'monospace',
                            flexShrink: 0,
                            marginLeft: 6,
                          }}
                        >
                          {item.status === 'Live' && (
                            <span style={{ marginRight: 4 }}>●</span>
                          )}
                          {item.status}
                        </span>
                      </div>
                      {item.note && (
                        <div
                          style={{
                            fontSize: 11,
                            color: '#475569',
                            lineHeight: 1.5,
                            marginBottom: 6,
                          }}
                        >
                          {item.note}
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 10,
                          color: C.MUTED,
                          marginBottom: 3,
                        }}
                      >
                        <span style={{ color: '#64748B' }}>Agents: </span>
                        {item.agent}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: '#94A3B8',
                          fontFamily: 'monospace',
                        }}
                      >
                        Last activity: {item.last}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
