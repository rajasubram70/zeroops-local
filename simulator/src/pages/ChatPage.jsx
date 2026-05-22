import { useState, useRef, useEffect, useCallback } from 'react';
import { C } from '../config/theme.js';
import {
  INCIDENTS_DATA,
  KB_ARTICLES,
  CHAT_SUGGESTIONS,
  CUSTOMER,
  APP_DOMAINS,
  METRICS,
  AGENT_DEFS,
  SCENARIOS_JSON,
  DAILY_STATS,
  REQUEST_STATS,
  REQUEST_CATALOGUE,
} from '../data/customer/loader.js';

// ── OpenAI config ─────────────────────────────────────────────
const MODEL = 'gpt-4o';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const SUGGESTIONS =
  CHAT_SUGGESTIONS && CHAT_SUGGESTIONS.length > 0
    ? CHAT_SUGGESTIONS
    : [
        'What is currently broken?',
        'How much engineer time has ZeroOps saved this month?',
        'Which incidents are at risk of breaching SLA?',
      ];

// ── System prompt ─────────────────────────────────────────────
const buildSystemPrompt = () => {
  const customer = CUSTOMER?.name || 'the customer';
  const kpis = METRICS?.kpis || {};
  const roi = METRICS?.roi || {};

  // ── Live incident data ───────────────────────────────────────
  const incidents = INCIDENTS_DATA || [];
  const p1 = incidents.filter((i) => i.pri === 'P1');
  const p2 = incidents.filter((i) => i.pri === 'P2');
  const autoResolved = incidents.filter((i) => i.status === 'Auto-Resolved');
  const inProgress = incidents.filter(
    (i) => i.status === 'In Progress' || i.status === 'Open'
  );
  const incidentSummary = incidents
    .map(
      (i) =>
        `  [${i.pri}][${i.status}] ${i.id}: ${i.svc} — ${i.desc?.slice(0, 150)}`
    )
    .join('\n');

  // ── Application estate ───────────────────────────────────────
  const domains = APP_DOMAINS || [];
  const allApps = domains.flatMap((d) =>
    (d.apps || []).map((a) => ({ ...a, domain: d.name }))
  );
  const redApps = allApps.filter((a) => a.status === 'RED');
  const amberApps = allApps.filter((a) => a.status === 'AMBER');
  const greenApps = allApps.filter((a) => a.status === 'GREEN');
  const appSummary = domains
    .map(
      (d) =>
        `  ${d.name} [${d.status}] ${d.uptime}% uptime:\n` +
        (d.apps || [])
          .map(
            (a) =>
              `    - ${a.name} [${a.status}]: ${(a.infra || [])
                .map((i) => `${i.label}=${i.val}`)
                .join(', ')}`
          )
          .join('\n')
    )
    .join('\n');

  // ── Agents ───────────────────────────────────────────────────
  const agents = AGENT_DEFS || [];
  const agentSummary = agents
    .map(
      (a) =>
        `  ${a.name}: ${a.runs} runs · ${a.success} success · ${a.costOK}/run · ${a.human} human`
    )
    .join('\n');

  // ── Scenarios ────────────────────────────────────────────────
  const scenarios = SCENARIOS_JSON || [];
  const scenarioSummary = scenarios
    .map(
      (s) =>
        `  ${s.title}: MTTR ${s.outcome?.mttr} (was ${
          s.subtitle?.split('→')[0]?.split('·').slice(-1)[0]?.trim() || 'manual'
        }) · ${s.outcome?.automation}`
    )
    .join('\n');

  // ── Silent ops today ─────────────────────────────────────────
  const dailyStats = DAILY_STATS || [];
  const silentSummary = dailyStats
    .map((d) => `  ${d.label}: ${d.value}`)
    .join('\n');

  // ── Service requests ─────────────────────────────────────────
  const reqStats = REQUEST_STATS || {};
  const reqCats = REQUEST_CATALOGUE || [];
  const reqSummary = reqCats
    .map(
      (c) =>
        `  ${c.type}: ${(c.requests || [])
          .map(
            (r) =>
              `${r.name} (${r.monthly}/month · ${r.autoRate}% auto · baseline ${
                r.baselineTime || r.avgTime
              })`
          )
          .join(', ')}`
    )
    .join('\n');

  // ── KB articles ──────────────────────────────────────────────
  const kbSummary = (KB_ARTICLES || [])
    .map((k) => `  ${k.id}: ${k.title} — confidence ${k.confidence}%`)
    .join('\n');

  return `You are ZOVA — the ZeroOps Virtual Assistant. You are an intelligent, calm and concise AI embedded in the ZeroOps AIOps platform for ${customer}.

You have FULL ACCESS to the live ${customer} operational data shown in the ZeroOps dashboard. Always answer with the specific numbers and details below — never say you do not have access. If something is not in the data below, say you do not see it in the current view.

For voice responses: 2-3 sentences maximum. For text: be thorough and specific.

════════════════════════════════════════════════
CUSTOMER: ${customer}
ITSM: ${CUSTOMER?.itsm || ''}
Cloud: ${CUSTOMER?.primaryCloud || ''}
════════════════════════════════════════════════

## LIVE METRICS (current period)
- MTTR: ${kpis.mttr_baseline_min} min baseline → ${
    kpis.mttr_current_min
  } min now (${kpis.mttr_target_reduction_pct}% reduction target)
- Auto-fix rate: ${kpis.auto_fix_baseline_pct}% baseline → ${
    kpis.auto_fix_rate_pct
  }% now (target: ${kpis.auto_fix_target_pct}%)
- Alert volume: ${kpis.alert_volume_per_day}/day → ${
    kpis.actionable_alerts_per_day
  } actionable (${kpis.alert_noise_red_pct}% noise reduction)
- CSAT: ${kpis.csat_baseline} baseline → ${kpis.csat_current} now
- Engineer toil: ${kpis.engineer_toil_baseline_pct}% baseline → ${
    kpis.engineer_toil_current_pct
  }% now
- MTTD: ${kpis.mttd_baseline_min} min baseline → ${
    kpis.mttd_current_min
  } min now
- Net ROI: $${roi.netROI?.toLocaleString?.() || roi.netROI} on $${
    roi.llmCost
  } LLM cost = ${roi.roiMultiplier}x return

## CURRENT INCIDENTS (${incidents.length} total)
- P1 active: ${p1.length} | P2: ${p2.length} | Auto-resolved: ${
    autoResolved.length
  } | In progress: ${inProgress.length}
${incidentSummary}

## APPLICATION ESTATE (${allApps.length} apps across ${domains.length} domains)
- CRITICAL (RED): ${redApps.length} apps — ${
    redApps.map((a) => a.name).join(', ') || 'none'
  }
- WARNING (AMBER): ${amberApps.length} apps — ${
    amberApps.map((a) => a.name).join(', ') || 'none'
  }
- HEALTHY (GREEN): ${greenApps.length} apps — ${
    greenApps.map((a) => a.name).join(', ') || 'none'
  }
${appSummary}

## AGENTS (${agents.length} active)
${agentSummary}

## DEMO SCENARIOS
${scenarioSummary}

## SILENT OPS TODAY
${silentSummary}

## SERVICE REQUESTS
- Total today: ${reqStats.totalToday} | Auto-fulfilled: ${
    reqStats.autoFulfilled
  } | Auto rate: ${reqStats.autoRate}%
${reqSummary}

## KNOWLEDGE BASE (${(KB_ARTICLES || []).length} articles)
${kbSummary}

## THREE-PILLAR MODEL
- PILLAR 1 — SENTINEL: Silent autonomous resolution. Risk score <25. Zero human gates.
- PILLAR 2 — GUARDIAN: Human-in-the-Loop. ZeroOps prepares everything, human approves one gate.
- PILLAR 3 — ADVISOR: AI-assisted human. Senior engineer decides with full ZeroOps diagnostic brief.

## BEHAVIOUR RULES
- ALWAYS use the specific numbers above — never say "I do not have access"
- Reference actual incident IDs, application names and metric values from above
- If asked about something not in the data, say "I do not see that in the current ZeroOps view"
- For voice: answer in 2-3 sentences, then stop
- For text: be specific, cite numbers, reference real incident IDs`;
};

// ── Text-to-speech cleaner ────────────────────────────────────
// Strips markdown formatting and normalises numbers/symbols so the
// browser TTS engine reads the text naturally rather than literally.
function cleanForSpeech(text) {
  if (!text) return '';
  let t = text;

  // Remove code blocks entirely — don't speak code
  t = t.replace(/```[\s\S]*?```/g, '');
  t = t.replace(/`[^`]+`/g, '');

  // Headers — strip # symbols, keep text
  t = t.replace(/^#{1,6}\s+/gm, '');

  // Bold and italic — strip markers, keep text
  t = t.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
  t = t.replace(/\*([^*]+)\*/g, '$1');
  t = t.replace(/___([^_]+)___/g, '$1');
  t = t.replace(/__([^_]+)__/g, '$1');
  t = t.replace(/_([^_]+)_/g, '$1');

  // Blockquotes
  t = t.replace(/^>\s+/gm, '');

  // Bullet points and numbered lists — replace with natural pause
  t = t.replace(/^[\s]*[-*+]\s+/gm, '');
  t = t.replace(/^[\s]*\d+\.\s+/gm, '');

  // Horizontal rules
  t = t.replace(/^[-*_]{3,}$/gm, '');

  // Links — keep link text, drop URL
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Images — drop entirely
  t = t.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

  // HTML tags
  t = t.replace(/<[^>]+>/g, '');

  // Currency — read naturally
  t = t.replace(/\$([\d,]+(?:\.\d+)?)/g, (_, n) => {
    const num = parseFloat(n.replace(/,/g, ''));
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)} million dollars`;
    if (num >= 1000)
      return `${Math.round(num / 1000).toLocaleString()} thousand dollars`;
    return `${num} dollars`;
  });
  t = t.replace(/£([\d,]+(?:\.\d+)?)/g, (_, n) => {
    const num = parseFloat(n.replace(/,/g, ''));
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)} million pounds`;
    if (num >= 1000)
      return `${Math.round(num / 1000).toLocaleString()} thousand pounds`;
    return `${num} pounds`;
  });

  // Percentages — read naturally
  t = t.replace(/(\d+(?:\.\d+)?)%/g, '$1 percent');

  // Numbers with commas — remove commas so TTS reads them correctly
  t = t.replace(/(\d),(\d)/g, '$1$2');

  // Common symbols that TTS reads literally
  t = t.replace(/→/g, 'to');
  t = t.replace(/←/g, 'from');
  t = t.replace(/↑/g, 'up');
  t = t.replace(/↓/g, 'down');
  t = t.replace(/≥/g, 'or more');
  t = t.replace(/≤/g, 'or less');
  t = t.replace(/×/g, 'times');
  t = t.replace(/·/g, '.');
  t = t.replace(/—/g, ', ');
  t = t.replace(/–/g, ' to ');
  t = t.replace(/[]/g, ' ');
  t = t.replace(/\|/g, '.');
  t = t.replace(/:/g, '.');
  t = t.replace(/[<>]/g, '');
  t = t.replace(/\[|\]/g, '');
  t = t.replace(/[{}()]/g, '');
  t = t.replace(/#/g, '');
  t = t.replace(/@/g, 'at');
  t = t.replace(/&/g, 'and');
  t = t.replace(/\+/g, 'plus');

  // Abbreviations — expand common ones for cleaner TTS
  t = t.replace(/\bMTTR\b/g, 'mean time to resolve');
  t = t.replace(/\bCSAT\b/g, 'C-SAT');
  t = t.replace(/\bNPS\b/g, 'N-P-S');
  t = t.replace(/\bROI\b/g, 'R-O-I');
  t = t.replace(/\bSLA\b/g, 'S-L-A');
  t = t.replace(/\bLLM\b/g, 'L-L-M');
  t = t.replace(/\bAI\b/g, 'A-I');
  t = t.replace(/\bKPI\b/g, 'K-P-I');
  t = t.replace(/\bAPI\b/g, 'A-P-I');
  t = t.replace(/\bUI\b/g, 'U-I');
  t = t.replace(/\bINC\b/g, 'incident');
  t = t.replace(/\bRCA\b/g, 'root cause analysis');
  t = t.replace(/\bHiTL\b/gi, 'human in the loop');
  t = t.replace(/\bBTX\b/g, 'B-T-X');
  t = t.replace(/\bSAP\b/g, 'S-A-P');
  t = t.replace(/\bMDG\b/g, 'M-D-G');
  t = t.replace(/\bIAS\b/g, 'I-A-S');
  t = t.replace(/\bSoD\b/g, 'segregation of duties');
  t = t.replace(/\bWP\b/g, 'work process');

  // Clean up multiple spaces and blank lines
  t = t.replace(/\n{3,}/g, '\n\n');
  t = t.replace(/[ \t]{2,}/g, ' ');
  t = t.replace(/\n/g, '. ');
  t = t.trim();

  // Limit length — TTS chops long utterances on some browsers
  // Keep first 800 characters for voice responses
  if (t.length > 800) {
    const cutoff = t.lastIndexOf('.', 800);
    t = cutoff > 600 ? t.slice(0, cutoff + 1) : t.slice(0, 800);
  }

  return t;
}

// ── ARIA Human Avatar — Final Combined Version ───────────────
// Warm skin · shaped jaw · textured hair · strong brows
// Defined lashes · fuller lips · animated blink + gaze + mouth
function Avatar({ speaking, listening, idle }) {
  const [blink, setBlink] = useState(false);
  const [mouthOpen, setMouthOpen] = useState(0);
  const [eyeGaze, setEyeGaze] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const loop = () => {
      setBlink(true);
      setTimeout(() => setBlink(false), 140);
    };
    const id = setInterval(loop, 2800 + Math.random() * 1400);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!speaking && !listening)
        setEyeGaze({
          x: (Math.random() - 0.5) * 2.5,
          y: (Math.random() - 0.5) * 1.5,
        });
    }, 2200);
    return () => clearInterval(id);
  }, [speaking, listening]);

  useEffect(() => {
    if (!speaking) {
      setMouthOpen(0);
      return;
    }
    const id = setInterval(() => setMouthOpen(Math.random()), 110);
    return () => clearInterval(id);
  }, [speaking]);

  const accent = listening ? '#3b82f6' : speaking ? '#8b5cf6' : '#64748b';
  const irisCol = listening ? '#4A90D9' : speaking ? '#9B72CF' : '#3B6FC4';
  const glow =
    speaking || listening
      ? `drop-shadow(0 0 22px ${listening ? '#3b82f6' : '#8b5cf6'}55)`
      : 'drop-shadow(0 4px 18px rgba(0,0,0,0.25))';

  const mouthY = 140;
  const mw = 22 + mouthOpen * 8;
  const mh = 2.5 + mouthOpen * 10;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <style>{`
        @keyframes ariaFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        @keyframes ariaPulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
      `}</style>

      <div
        style={{
          position: 'relative',
          animation: 'ariaFloat 3.5s ease-in-out infinite',
          filter: glow,
          transition: 'filter 0.4s',
          width: 170,
          height: 200,
        }}
      >
        {/* Listening pulse ring */}
        {listening && (
          <div
            style={{
              position: 'absolute',
              inset: -10,
              borderRadius: '50%',
              border: '2px solid #3b82f6',
              opacity: 0.55,
              animation: 'ariaPulse 1.1s ease-in-out infinite',
            }}
          />
        )}

        <svg width="170" height="200" viewBox="0 0 170 200">
          <defs>
            {/* Skin — warm medium tone, good for all audiences */}
            <radialGradient id="av-skin" cx="42%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#FFD6A5" />
              <stop offset="45%" stopColor="#F0A96A" />
              <stop offset="100%" stopColor="#C8764A" />
            </radialGradient>
            {/* Hair — rich dark brown with depth */}
            <linearGradient id="av-hair" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#3D2610" />
              <stop offset="50%" stopColor="#1E0F05" />
              <stop offset="100%" stopColor="#0F0700" />
            </linearGradient>
            {/* Hair highlight */}
            <linearGradient id="av-hairHL" x1="15%" y1="0%" x2="70%" y2="50%">
              <stop offset="0%" stopColor="#6B4528" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#6B4528" stopOpacity="0" />
            </linearGradient>
            {/* Iris */}
            <radialGradient id="av-iris" cx="35%" cy="30%" r="70%">
              <stop offset="0%" stopColor={irisCol} stopOpacity="0.9" />
              <stop offset="60%" stopColor={irisCol} />
              <stop offset="100%" stopColor="#0f0500" />
            </radialGradient>
            {/* Lip */}
            <linearGradient id="av-lip" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D4607A" />
              <stop offset="100%" stopColor="#A83050" />
            </linearGradient>
            {/* Blush */}
            <radialGradient id="av-blush" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#F4A0A8" stopOpacity="0.42" />
              <stop offset="100%" stopColor="#F4A0A8" stopOpacity="0" />
            </radialGradient>
            {/* Neck shadow */}
            <linearGradient id="av-nshad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B4220" stopOpacity="0.45" />
              <stop offset="30%" stopColor="#8B4220" stopOpacity="0" />
              <stop offset="70%" stopColor="#8B4220" stopOpacity="0" />
              <stop offset="100%" stopColor="#8B4220" stopOpacity="0.45" />
            </linearGradient>
            {/* Chin shadow */}
            <radialGradient id="av-chin" cx="50%" cy="0%" r="100%">
              <stop offset="0%" stopColor="#8B4220" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8B4220" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* ── Shoulders ── */}
          <ellipse cx="85" cy="195" rx="60" ry="22" fill="#1e293b" />
          <path
            d="M 34 176 Q 60 185 85 187 Q 110 185 136 176 L 132 200 L 38 200 Z"
            fill="#1d4ed8"
            opacity="0.92"
          />
          <ellipse cx="85" cy="183" rx="40" ry="15" fill="#334155" />

          {/* ── Neck ── */}
          <rect
            x="70"
            y="142"
            width="30"
            height="24"
            rx="10"
            fill="url(#av-skin)"
          />
          <rect
            x="70"
            y="142"
            width="30"
            height="24"
            rx="10"
            fill="url(#av-nshad)"
          />

          {/* ── Head — shaped jaw ── */}
          <path
            d="M 46 68 Q 44 42 85 36 Q 126 42 124 68 Q 130 105 121 130 Q 110 148 85 152 Q 60 148 49 130 Q 40 105 46 68 Z"
            fill="url(#av-skin)"
          />
          <ellipse cx="85" cy="150" rx="30" ry="7" fill="url(#av-chin)" />

          {/* ── Hair — voluminous layered ── */}
          {/* Main crown */}
          <path
            d="M 46 66 Q 44 28 85 22 Q 126 28 124 66 Q 120 38 85 34 Q 50 38 46 66 Z"
            fill="url(#av-hair)"
          />
          {/* Side volumes */}
          <path
            d="M 44 68 Q 28 70 24 100 Q 22 120 30 136 Q 38 118 40 98 Q 42 78 46 68 Z"
            fill="url(#av-hair)"
          />
          <path
            d="M 126 68 Q 142 70 146 100 Q 148 120 140 136 Q 132 118 130 98 Q 128 78 124 68 Z"
            fill="url(#av-hair)"
          />
          {/* Hair texture bumps (Option B influence) */}
          <ellipse cx="68" cy="30" rx="12" ry="10" fill="url(#av-hair)" />
          <ellipse cx="85" cy="24" rx="14" ry="11" fill="url(#av-hair)" />
          <ellipse cx="102" cy="28" rx="12" ry="10" fill="url(#av-hair)" />
          <ellipse cx="76" cy="26" rx="9" ry="8" fill="#0F0700" opacity="0.5" />
          <ellipse cx="96" cy="24" rx="9" ry="8" fill="#0F0700" opacity="0.5" />
          {/* Highlight */}
          <path
            d="M 56 32 Q 76 24 100 28 Q 85 20 70 26 Q 60 28 56 32 Z"
            fill="url(#av-hairHL)"
          />

          {/* ── Ears ── */}
          <ellipse cx="41" cy="96" rx="8" ry="12" fill="url(#av-skin)" />
          <ellipse
            cx="41"
            cy="96"
            rx="4.5"
            ry="7.5"
            fill="#C8764A"
            opacity="0.4"
          />
          <ellipse cx="129" cy="96" rx="8" ry="12" fill="url(#av-skin)" />
          <ellipse
            cx="129"
            cy="96"
            rx="4.5"
            ry="7.5"
            fill="#C8764A"
            opacity="0.4"
          />

          {/* ── Eyebrows — strong, defined (Option B) ── */}
          <path
            d="M 54 70 Q 65 64 78 67"
            stroke="#2D1505"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 92 67 Q 105 64 116 70"
            stroke="#2D1505"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* ── Eyes ── */}
          {/* Left */}
          <ellipse
            cx="66"
            cy="81"
            rx="12"
            ry={blink ? 1 : 10}
            fill="white"
            style={{ transition: 'ry 0.08s' }}
          />
          {!blink && (
            <>
              <ellipse
                cx={66 + eyeGaze.x}
                cy={81 + eyeGaze.y}
                rx="8"
                ry="8"
                fill="url(#av-iris)"
                style={{ transition: 'cx 0.4s,cy 0.4s' }}
              />
              <circle
                cx={66 + eyeGaze.x}
                cy={81 + eyeGaze.y}
                r="5"
                fill="#0a0300"
                style={{ transition: 'cx 0.4s,cy 0.4s' }}
              />
              <circle
                cx={68 + eyeGaze.x}
                cy={79 + eyeGaze.y}
                r="1.8"
                fill="white"
                opacity="0.88"
                style={{ transition: 'cx 0.4s,cy 0.4s' }}
              />
              <circle
                cx={65 + eyeGaze.x}
                cy={83 + eyeGaze.y}
                r="0.9"
                fill="white"
                opacity="0.38"
                style={{ transition: 'cx 0.4s,cy 0.4s' }}
              />
            </>
          )}
          {/* Lashes top */}
          <path
            d="M 54 75 Q 66 70 78 75"
            stroke="#1E0F05"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Lashes bottom */}
          {!blink && (
            <path
              d="M 56 88 Q 66 92 76 88"
              stroke="#C8764A"
              strokeWidth="0.9"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />
          )}

          {/* Right */}
          <ellipse
            cx="104"
            cy="81"
            rx="12"
            ry={blink ? 1 : 10}
            fill="white"
            style={{ transition: 'ry 0.08s' }}
          />
          {!blink && (
            <>
              <ellipse
                cx={104 + eyeGaze.x}
                cy={81 + eyeGaze.y}
                rx="8"
                ry="8"
                fill="url(#av-iris)"
                style={{ transition: 'cx 0.4s,cy 0.4s' }}
              />
              <circle
                cx={104 + eyeGaze.x}
                cy={81 + eyeGaze.y}
                r="5"
                fill="#0a0300"
                style={{ transition: 'cx 0.4s,cy 0.4s' }}
              />
              <circle
                cx={106 + eyeGaze.x}
                cy={79 + eyeGaze.y}
                r="1.8"
                fill="white"
                opacity="0.88"
                style={{ transition: 'cx 0.4s,cy 0.4s' }}
              />
              <circle
                cx={103 + eyeGaze.x}
                cy={83 + eyeGaze.y}
                r="0.9"
                fill="white"
                opacity="0.38"
                style={{ transition: 'cx 0.4s,cy 0.4s' }}
              />
            </>
          )}
          <path
            d="M 92 75 Q 104 70 116 75"
            stroke="#1E0F05"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {!blink && (
            <path
              d="M 94 88 Q 104 92 114 88"
              stroke="#C8764A"
              strokeWidth="0.9"
              strokeLinecap="round"
              fill="none"
              opacity="0.4"
            />
          )}

          {/* ── Nose — bridge + nostril curves (Option A+B combined) ── */}
          <path
            d="M 82 94 Q 79 106 77 114 Q 81 119 85 120 Q 89 119 93 114 Q 91 106 88 94"
            stroke="#A05030"
            strokeWidth="1.2"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M 77 115 Q 73 120 77 123"
            stroke="#A05030"
            strokeWidth="1.2"
            fill="none"
            opacity="0.5"
          />
          <path
            d="M 93 115 Q 97 120 93 123"
            stroke="#A05030"
            strokeWidth="1.2"
            fill="none"
            opacity="0.5"
          />

          {/* ── Blush ── */}
          <ellipse cx="53" cy="105" rx="16" ry="10" fill="url(#av-blush)" />
          <ellipse cx="117" cy="105" rx="16" ry="10" fill="url(#av-blush)" />

          {/* ── Philtrum ── */}
          <path
            d="M 81 127 Q 85 131 89 127"
            stroke="#A05030"
            strokeWidth="0.8"
            fill="none"
            opacity="0.35"
          />

          {/* ── Lips — fuller shape (Option B) warmer colour (Option A) ── */}
          {speaking ? (
            <ellipse
              cx="85"
              cy={mouthY}
              rx={mw / 2}
              ry={mh / 2}
              fill="#5C1520"
              style={{ transition: 'rx 0.08s,ry 0.08s' }}
            />
          ) : (
            <path
              d={`M ${85 - 18} ${mouthY - 2} Q 85 ${mouthY + 10} ${85 + 18} ${
                mouthY - 2
              }`}
              fill="url(#av-lip)"
              stroke="#A83050"
              strokeWidth="0.5"
            />
          )}
          {/* Upper lip — cupid's bow */}
          <path
            d={`M ${85 - 18} ${mouthY - 2} Q ${85 - 9} ${mouthY - 8} 85 ${
              mouthY - 5
            } Q ${85 + 9} ${mouthY - 8} ${85 + 18} ${mouthY - 2}`}
            fill="url(#av-lip)"
            opacity="0.85"
          />
          {/* Lip highlight */}
          <ellipse
            cx="85"
            cy={mouthY + 1}
            rx="9"
            ry="3"
            fill="white"
            opacity="0.1"
          />

          {/* ── ZOVA badge ── */}
          <rect
            x="63"
            y="176"
            width="44"
            height="13"
            rx="6.5"
            fill={speaking ? '#7c3aed' : listening ? '#1d4ed8' : '#1e293b'}
            style={{ transition: 'fill 0.3s' }}
          />
          <text
            x="85"
            y="185.5"
            textAnchor="middle"
            fill="white"
            fontSize="6.5"
            fontFamily="monospace"
            letterSpacing="2.5"
            fontWeight="600"
          >
            ARIA
          </text>
        </svg>
      </div>

      {/* State label */}
      <div
        style={{
          fontSize: 11,
          fontFamily: 'monospace',
          letterSpacing: 2,
          color: listening ? '#3b82f6' : speaking ? '#8b5cf6' : '#64748b',
          transition: 'color 0.3s',
        }}
      >
        {listening ? '◉ LISTENING...' : speaking ? '◈ SPEAKING...' : '◎ READY'}
      </div>
    </div>
  );
}
// ── Voice wave visualiser ─────────────────────────────────────
function VoiceWave({ active }) {
  const bars = 12;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 32 }}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            borderRadius: 2,
            background: active ? '#8b5cf6' : '#334155',
            height: active ? `${20 + Math.sin(i) * 12}px` : '4px',
            animation: active
              ? `voiceBar 0.8s ease-in-out ${i * 0.06}s infinite alternate`
              : 'none',
            transition: 'background 0.3s, height 0.3s',
          }}
        />
      ))}
      <style>{`
        @keyframes voiceBar {
          from { transform:scaleY(0.4); }
          to { transform:scaleY(1.4); }
        }
      `}</style>
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────
function Bubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        gap: 10,
        marginBottom: 16,
        alignItems: 'flex-start',
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: '50%',
          flexShrink: 0,
          background: isUser
            ? '#1d4ed8'
            : 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 12,
          color: '#fff',
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        {isUser ? 'U' : 'A'}
      </div>
      <div style={{ maxWidth: '72%' }}>
        <div
          style={{
            fontSize: 10,
            color: '#94A3B8',
            fontFamily: 'monospace',
            marginBottom: 4,
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {isUser ? 'You' : 'ARIA · ZeroOps AI'} · {msg.ts}
        </div>
        <div
          style={{
            background: isUser ? '#1d4ed8' : '#fff',
            color: isUser ? '#fff' : '#1E293B',
            border: isUser ? 'none' : '1px solid #E2E8F0',
            borderRadius: isUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
            padding: '10px 14px',
            fontSize: 13,
            lineHeight: 1.7,
            boxShadow: isUser
              ? '0 2px 8px rgba(29,78,216,0.2)'
              : '0 2px 8px rgba(0,0,0,0.06)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {msg.content}
        </div>
        {msg.streaming && (
          <div
            style={{ display: 'flex', gap: 3, marginTop: 5, paddingLeft: 4 }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#CBD5E1',
                  animation: `zoBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ChatPage ─────────────────────────────────────────────
export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem('zo_oai_key') || ''
  );
  const [showKey, setShowKey] = useState(false);
  const [showCfg, setShowCfg] = useState(!localStorage.getItem('zo_oai_key'));
  const [error, setError] = useState('');

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');

  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const saveKey = (k) => {
    setApiKey(k);
    localStorage.setItem('zo_oai_key', k);
  };
  const ts = () =>
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ── GPT-4o call ───────────────────────────────────────────
  const sendToGPT = useCallback(
    async (text, isVoice = false) => {
      if (!text.trim() || loading) return;
      if (!apiKey.trim()) {
        setError('Please enter your OpenAI API key in settings.');
        setShowCfg(true);
        return;
      }
      setError('');
      setInput('');

      const userMsg = { role: 'user', content: text.trim(), ts: ts() };
      const history = [...messages, userMsg];
      setMessages(history);
      setLoading(true);

      const placeholderId = Date.now();
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: '',
          ts: ts(),
          streaming: true,
          id: placeholderId,
        },
      ]);

      // Stop any current speech
      synthRef.current?.cancel();

      try {
        const res = await fetch(OPENAI_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: MODEL,
            stream: true,
            max_tokens: isVoice ? 200 : 1200,
            temperature: 0.3,
            messages: [
              { role: 'system', content: buildSystemPrompt() },
              ...history.map((m) => ({ role: m.role, content: m.content })),
            ],
          }),
        });

        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e?.error?.message || `API error ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk
            .split('\n')
            .filter((l) => l.startsWith('data: ') && l !== 'data: [DONE]');
          for (const line of lines) {
            try {
              const json = JSON.parse(line.replace('data: ', ''));
              const delta = json.choices?.[0]?.delta?.content || '';
              full += delta;
              setMessages((m) =>
                m.map((msg) =>
                  msg.id === placeholderId ? { ...msg, content: full } : msg
                )
              );
            } catch {}
          }
        }

        setMessages((m) =>
          m.map((msg) =>
            msg.id === placeholderId
              ? { ...msg, content: full, streaming: false }
              : msg
          )
        );

        // Speak the response if in voice mode
        if (isVoice && full && synthRef.current) {
          const speak = () => {
            const utt = new SpeechSynthesisUtterance(cleanForSpeech(full));
            utt.rate = 0.95;
            utt.pitch = 1.0;
            utt.volume = 1.0;

            // getVoices() may be empty on first call — pick best available
            const voices = synthRef.current.getVoices();
            const preferred =
              voices.find((v) => v.name.includes('Google UK English Female')) ||
              voices.find((v) => v.name.includes('Google US English')) ||
              voices.find((v) => v.name.includes('Samantha')) ||
              voices.find((v) => v.name.includes('Karen')) ||
              voices.find((v) => v.name.includes('Daniel')) ||
              voices.find(
                (v) => v.lang === 'en-GB' && !v.localService === false
              ) ||
              voices.find(
                (v) => v.lang === 'en-US' && !v.localService === false
              ) ||
              voices.find((v) => v.lang.startsWith('en'));

            if (preferred) utt.voice = preferred;

            utt.onstart = () => setSpeaking(true);
            utt.onend = () => {
              setSpeaking(false);
            };
            utt.onerror = (e) => {
              setSpeaking(false);
              console.warn('TTS error', e);
            };

            synthRef.current.cancel(); // clear queue
            setSpeaking(true);
            synthRef.current.speak(utt);
          };

          // voices may not be loaded yet — wait for them
          const voices = synthRef.current.getVoices();
          if (voices.length > 0) {
            speak();
          } else {
            // voices load asynchronously — wait for the event
            synthRef.current.onvoiceschanged = () => {
              synthRef.current.onvoiceschanged = null;
              speak();
            };
            // Fallback: try anyway after 300ms in case onvoiceschanged never fires
            setTimeout(() => {
              speak();
            }, 350);
          }
        }
      } catch (e) {
        setMessages((m) => m.filter((msg) => msg.id !== placeholderId));
        setError(e.message || 'Something went wrong. Check your API key.');
      }

      setLoading(false);
      if (!isVoice) inputRef.current?.focus();
    },
    [messages, apiKey, loading]
  );

  // ── Speech recognition ────────────────────────────────────
  // Use a ref to hold the latest sendToGPT to avoid stale closure in onresult
  const sendToGPTRef = useRef(sendToGPT);
  useEffect(() => {
    sendToGPTRef.current = sendToGPT;
  }, [sendToGPT]);

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Speech recognition not supported. Please use Chrome or Edge.');
      return;
    }

    // Stop any ongoing speech before listening
    synthRef.current?.cancel();
    setSpeaking(false);

    const recog = new SR();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = 'en-US';
    recognRef.current = recog;

    // Use object to avoid closure staleness across onresult → onend
    const capture = { text: '', lastInterim: '' };

    recog.onstart = () => {
      setListening(true);
      setTranscript('');
      capture.text = '';
      capture.lastInterim = '';
    };

    recog.onresult = (e) => {
      let interim = '';
      // Walk ALL results — not just from resultIndex — to get full picture
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          // Only add if not already in capture.text
          const t = e.results[i][0].transcript;
          if (!capture.text.includes(t)) capture.text += t + ' ';
        } else {
          interim += e.results[i][0].transcript;
        }
      }
      capture.lastInterim = interim;
      setTranscript((capture.text + interim).trim());
    };

    recog.onend = () => {
      setListening(false);
      // Best available text: final transcript OR last interim captured
      const best = (capture.text + capture.lastInterim).trim();
      setTranscript('');
      if (best) {
        sendToGPTRef.current(best, true);
      } else {
        setError(
          'Mic captured nothing — check browser mic permission and speak clearly.'
        );
        setTimeout(() => setError(''), 4000);
      }
      capture.text = '';
      capture.lastInterim = '';
    };

    recog.onerror = (e) => {
      setListening(false);
      setTranscript('');
      capture.text = '';
      capture.lastInterim = '';
      if (e.error === 'not-allowed') {
        setError(
          'Mic blocked — click the 🔒 icon in the browser address bar and allow microphone.'
        );
      } else if (e.error !== 'aborted' && e.error !== 'no-speech') {
        setError(`Mic error: ${e.error}`);
      }
      setTimeout(() => setError(''), 5000);
    };

    recog.start();
  }, []);

  const stopListening = useCallback(() => {
    // Calling stop() triggers onend which fires sendToGPT with whatever was captured
    recognRef.current?.stop();
  }, []);

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setSpeaking(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendToGPT(input);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        height: 'calc(100vh - 48px)',
        background: '#F8FAFC',
      }}
    >
      <style>{`
        @keyframes zoBounce { 0%,80%,100%{transform:translateY(0);opacity:0.4} 40%{transform:translateY(-5px);opacity:1} }
      `}</style>

      {/* ── Left: Avatar panel ── */}

      {/* ── Right: Chat panel ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div
          style={{
            background: '#fff',
            borderBottom: '1px solid #E2E8F0',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                color: '#fff',
                fontWeight: 900,
              }}
            >
              A
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                ZOVA — ZeroOps Virtual Agent
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: '#94A3B8',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#22C55E',
                    boxShadow: '0 0 6px rgba(34,197,94,0.5)',
                  }}
                />
                {`GPT-4o · ${CUSTOMER?.name || 'Enterprise'} context loaded`}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {messages.length > 0 && (
              <button
                onClick={() => {
                  setMessages([]);
                  setError('');
                }}
                style={{
                  fontSize: 12,
                  color: '#94A3B8',
                  background: 'transparent',
                  border: '1px solid #E2E8F0',
                  borderRadius: 6,
                  padding: '5px 12px',
                  cursor: 'pointer',
                }}
              >
                New conversation
              </button>
            )}
            <button
              onClick={() => setShowCfg((s) => !s)}
              style={{
                fontSize: 12,
                color: showCfg ? '#1d4ed8' : '#64748B',
                background: showCfg ? 'rgba(29,78,216,0.07)' : 'transparent',
                border: `1px solid ${
                  showCfg ? 'rgba(29,78,216,0.25)' : '#E2E8F0'
                }`,
                borderRadius: 6,
                padding: '5px 12px',
                cursor: 'pointer',
              }}
            >
              ⚙ API
            </button>
          </div>
        </div>

        {/* API key config */}
        {showCfg && (
          <div
            style={{
              background: '#FFFBEB',
              borderBottom: '1px solid #FDE68A',
              padding: '12px 20px',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                maxWidth: 600,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#92400E',
                    marginBottom: 5,
                  }}
                >
                  OpenAI API key — stored locally, never sent anywhere except
                  OpenAI
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => saveKey(e.target.value)}
                    placeholder="sk-proj-..."
                    style={{
                      width: '100%',
                      fontSize: 13,
                      fontFamily: 'monospace',
                      background: '#fff',
                      border: '1.5px solid #FCD34D',
                      borderRadius: 7,
                      padding: '8px 38px 8px 12px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <span
                    onClick={() => setShowKey((s) => !s)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    {showKey ? '🙈' : '👁'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowCfg(false)}
                disabled={!apiKey.trim()}
                style={{
                  padding: '8px 18px',
                  background: apiKey.trim() ? '#1d4ed8' : '#CBD5E1',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 7,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: apiKey.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px' }}>
          {messages.length === 0 && (
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: 28,
                  paddingTop: 20,
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>"🤖"</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#0F172A',
                    marginBottom: 6,
                  }}
                >
                  "Ask ARIA anything"
                </div>
                <div
                  style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}
                >
                  `ZOVA has full context on the $
                  {CUSTOMER?.name || 'Enterprise'} IT estate. Ask about
                  incidents, agents, KPIs, or what ZeroOps would do. For voice —
                  use the 🎤 button in the corner.`
                </div>
              </div>
              {true && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}
                >
                  {(SUGGESTIONS || []).map((s) => (
                    <div
                      key={s.text}
                      onClick={() => sendToGPT(s.text)}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        padding: '12px 14px',
                        background: '#fff',
                        border: '1px solid #E2E8F0',
                        borderRadius: 10,
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#93C5FD';
                        e.currentTarget.style.background = '#F0F7FF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#E2E8F0';
                        e.currentTarget.style.background = '#fff';
                      }}
                    >
                      <span style={{ fontSize: 17, flexShrink: 0 }}>
                        {s.icon}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          color: '#374151',
                          lineHeight: 1.5,
                        }}
                      >
                        {s.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {messages.length > 0 && (
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
              {messages.map((msg, i) => (
                <Bubble key={i} msg={msg} />
              ))}
            </div>
          )}

          {error && (
            <div
              style={{
                maxWidth: 800,
                margin: '8px auto 0',
                padding: '10px 14px',
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.2)',
                borderRadius: 8,
                fontSize: 13,
                color: '#B91C1C',
              }}
            >
              ⚠ {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        {true && (
          <div
            style={{
              background: '#fff',
              borderTop: '1px solid #E2E8F0',
              padding: '14px 20px',
              flexShrink: 0,
            }}
          >
            <div
              style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about an incident, request a briefing, or ask what ZeroOps would do…"
                rows={1}
                style={{
                  width: '100%',
                  fontSize: 14,
                  color: '#0F172A',
                  background: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  padding: '11px 50px 11px 14px',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  lineHeight: 1.6,
                  maxHeight: 160,
                  overflowY: 'auto',
                }}
                onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                onBlur={(e) => (e.target.style.borderColor = '#E2E8F0')}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height =
                    Math.min(e.target.scrollHeight, 160) + 'px';
                }}
              />
              <button
                onClick={() => sendToGPT(input)}
                disabled={loading || !input.trim()}
                style={{
                  position: 'absolute',
                  right: 10,
                  bottom: 10,
                  width: 32,
                  height: 32,
                  background:
                    loading || !input.trim()
                      ? '#CBD5E1'
                      : 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
                  border: 'none',
                  borderRadius: 7,
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 15,
                }}
              >
                {loading ? '…' : '↑'}
              </button>
            </div>
            <div
              style={{
                maxWidth: 800,
                margin: '5px auto 0',
                fontSize: 11,
                color: '#94A3B8',
                textAlign: 'center',
              }}
            >
              Enter to send · Shift+Enter for new line
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
