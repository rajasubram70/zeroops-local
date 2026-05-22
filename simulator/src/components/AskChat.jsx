import { useState, useRef, useEffect } from 'react';
import { C } from '../config/theme.js';

const SUGGESTIONS = [
  'Status of SAP AP1?',
  'Top causes of P1 incidents?',
  'Remediation steps for INC0002068?',
  'Which agent handles RCA?',
  'What is our automation rate?',
];

export default function AskChat({
  chains,
  incidents,
  open,
  onClose,
  industry,
}) {
  const [msgs, setMsgs] = useState([
    {
      role: 'assistant',
      content:
        "Hello! I'm ZeroOps AI — I have live context of your operations environment. Ask me about incidents, health status, remediation steps, or anything operations-related.",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  const activeInc = (incidents || []).filter(
    (i) => i.status !== 'Resolved' && i.status !== 'Auto-Resolved'
  );

  const systemCtx = `You are ZeroOps AI, an intelligent autonomous operations assistant for ${
    industry?.name || 'a manufacturing enterprise'
  }.

LIVE ENVIRONMENT CONTEXT:
Industry: ${industry?.name || 'AGFA HealthCare IT'} — ${industry?.tagline || ''}
Value Chains: ${(chains || [])
    .map(
      (c) =>
        `${c.name}: ${c.status} (${c.uptime}% uptime) — Apps: ${c.apps
          .map((a) => `${a.name} ${a.status} ${a.perf}%`)
          .join(', ')}`
    )
    .join('. ')}

Active Incidents: ${
    activeInc
      .map((i) => `${i.id} [${i.pri}] ${i.svc}: ${i.desc?.substring(0, 60)}`)
      .join('. ') || 'None'
  }

Knowledge Base Highlights:
- SAP AP1 work process saturation: fix = resize WP allocation via RZ10 + reschedule batch jobs via SM37
- PostgreSQL replication lag: drop inactive slot (scada_analytics_slot) then CHECKPOINT
- SAP MDM sync queue: alert threshold 200 records, check MDM sync job schedule
- MQSeries iDoc queue stall: restart MQ consumer via OneEngine runbook MQ-CONSUMER-RESTART

Active Agents: Log Analyzer (GPT-4-turbo), RCA Engine (Claude-3.5-Sonnet), Remediation Agent (GPT-4-turbo), Alert Correlator (Mistral-Large), Capacity Planner (GPT-4o)

Be specific, concise, and actionable. Reference incident IDs and component names. When recommending remediation, name which agent would execute it.`;

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    setMsgs((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer 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`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 1000,
          messages: [
            { role: 'system', content: systemCtx },
            ...[...msgs, userMsg]
              .filter((m) => m.role === 'user' || m.role === 'assistant')
              .map((m) => ({ role: m.role, content: m.content })),
          ],
        }),
      });
      const data = await resp.json();
      // Show exact API error so we can diagnose
      if (!resp.ok) {
        const errMsg = data?.error?.message || JSON.stringify(data);
        setMsgs((m) => [
          ...m,
          {
            role: 'assistant',
            content: `API Error (${resp.status}): ${errMsg}`,
          },
        ]);
        setLoading(false);
        return;
      }
      const text =
        data.choices?.[0]?.message?.content || 'No response content returned.';
      setMsgs((m) => [...m, { role: 'assistant', content: text }]);
    } catch (e) {
      setMsgs((m) => [
        ...m,
        { role: 'assistant', content: `Connection error: ${e.message}` },
      ]);
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 72,
        right: 20,
        width: 400,
        height: 500,
        background: 'rgba(255,255,255,0.98)',
        border: `1px solid rgba(59,130,246,0.24)`,
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 200,
        boxShadow: '0 20px 70px rgba(0,0,0,0.6)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 14px',
          borderBottom: `1px solid ${C.BORDER}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
              borderRadius: 7,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            Z
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              Ask ZeroOps AI
            </div>
            <div
              style={{
                fontSize: 8,
                color: C.GREEN,
                fontFamily: 'monospace',
                display: 'flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: C.GREEN,
                }}
              />
              Live context · {(chains || []).length} chains · {activeInc.length}{' '}
              active incidents
            </div>
          </div>
        </div>
        <div
          onClick={onClose}
          style={{ cursor: 'pointer', color: C.MUTED, fontSize: 17 }}
        >
          ✕
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
        }}
      >
        {msgs.map((m, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 7,
              justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            {m.role === 'assistant' && (
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                  borderRadius: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  fontWeight: 800,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                Z
              </div>
            )}
            <div
              style={{
                maxWidth: '85%',
                background:
                  m.role === 'user'
                    ? 'rgba(59,130,246,0.14)'
                    : 'rgba(0,0,0,0.05)',
                border: `1px solid ${
                  m.role === 'user' ? 'rgba(59,130,246,0.24)' : C.BORDER
                }`,
                borderRadius:
                  m.role === 'user'
                    ? '10px 10px 2px 10px'
                    : '10px 10px 10px 2px',
                padding: '8px 11px',
                fontSize: 12,
                color: m.role === 'user' ? '#1E40AF' : '#94A3B8',
                lineHeight: 1.7,
                whiteSpace: 'pre-wrap',
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', gap: 7 }}>
            <div
              style={{
                width: 20,
                height: 20,
                background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
                borderRadius: 5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              Z
            </div>
            <div
              style={{
                background: 'rgba(0,0,0,0.05)',
                border: `1px solid ${C.BORDER}`,
                borderRadius: '10px 10px 10px 2px',
                padding: '9px 12px',
                display: 'flex',
                gap: 3,
                alignItems: 'center',
              }}
            >
              {[0, 1, 2].map((j) => (
                <div
                  key={j}
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: C.BLUE,
                    opacity: 0.7,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Quick suggestions */}
      <div
        style={{
          padding: '5px 10px',
          display: 'flex',
          gap: 5,
          overflowX: 'auto',
          borderTop: `1px solid rgba(255,255,255,0.04)`,
        }}
      >
        {SUGGESTIONS.map((s) => (
          <div
            key={s}
            onClick={() => setInput(s)}
            style={{
              whiteSpace: 'nowrap',
              fontSize: 9,
              padding: '3px 9px',
              background: 'rgba(59,130,246,0.08)',
              color: '#2563EB',
              border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: 20,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            {s}
          </div>
        ))}
      </div>

      {/* Input */}
      <div
        style={{
          display: 'flex',
          gap: 7,
          padding: '9px 10px',
          borderTop: `1px solid ${C.BORDER}`,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask about incidents, health, remediation..."
          style={{
            flex: 1,
            background: 'rgba(0,0,0,0.05)',
            border: `1px solid ${C.BORDER}`,
            borderRadius: 7,
            padding: '7px 11px',
            fontSize: 12,
            color: '#1E293B',
            outline: 'none',
          }}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          style={{
            background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
            color: '#fff',
            border: 'none',
            borderRadius: 7,
            padding: '7px 13px',
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading || !input.trim() ? 0.45 : 1,
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
