import { useState, useEffect, useRef, useCallback } from 'react';
import {
  CUSTOMER,
  INCIDENTS_DATA,
  METRICS,
  APP_DOMAINS,
  AGENT_DEFS,
  SCENARIOS_JSON,
  DAILY_STATS,
  REQUEST_STATS,
  REQUEST_CATALOGUE,
  KB_ARTICLES,
} from '../data/customer/loader.js';

// ── Text cleaner — strips markdown before TTS ─────────────────
function cleanForSpeech(text) {
  if (!text) return '';
  let t = text;
  t = t.replace(/```[\s\S]*?```/g, '');
  t = t.replace(/`[^`]+`/g, '');
  t = t.replace(/^#{1,6}\s+/gm, '');
  t = t.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
  t = t.replace(/\*([^*]+)\*/g, '$1');
  t = t.replace(/^[\s]*[-*+]\s+/gm, '');
  t = t.replace(/^[\s]*\d+\.\s+/gm, '');
  t = t.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  t = t.replace(/<[^>]+>/g, '');
  t = t.replace(/\$([,\d]+(?:\.\d+)?)/g, (_, n) => {
    const num = parseFloat(n.replace(/,/g, ''));
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)} million dollars`;
    if (num >= 1000) return `${Math.round(num / 1000)} thousand dollars`;
    return `${num} dollars`;
  });
  t = t.replace(/£([,\d]+(?:\.\d+)?)/g, (_, n) => {
    const num = parseFloat(n.replace(/,/g, ''));
    if (num >= 1000) return `${Math.round(num / 1000)} thousand pounds`;
    return `${num} pounds`;
  });
  t = t.replace(/(\d+(?:\.\d+)?)%/g, '$1 percent');
  t = t.replace(/(\d),(\d)/g, '$1$2');
  t = t.replace(/→/g, 'to');
  t = t.replace(/←/g, 'from');
  t = t.replace(/↑/g, 'up');
  t = t.replace(/↓/g, 'down');
  t = t.replace(/×/g, 'times');
  t = t.replace(/·/g, '.');
  t = t.replace(/—/g, ', ');
  t = t.replace(/–/g, ' to ');
  t = t.replace(/[|<>{}[\]]/g, '');
  t = t.replace(/#/g, '');
  t = t.replace(/\bMTTR\b/g, 'mean time to resolve');
  t = t.replace(/\bNPS\b/g, 'N P S');
  t = t.replace(/\bCSAT\b/g, 'C SAT');
  t = t.replace(/\bROI\b/g, 'R O I');
  t = t.replace(/\bSLA\b/g, 'S L A');
  t = t.replace(/\bSAP\b/g, 'S A P');
  t = t.replace(/\bRCA\b/g, 'root cause analysis');
  t = t.replace(/\bHiTL\b/gi, 'human in the loop');
  t = t.replace(/\bAI\b/g, 'A I');
  t = t
    .replace(/\n/g, '. ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  if (t.length > 900) {
    const cutoff = t.lastIndexOf('.', 900);
    t = cutoff > 700 ? t.slice(0, cutoff + 1) : t.slice(0, 900);
  }
  return t;
}

// ── Compact combined human avatar ────────────────────────────
function FaceAvatar({ speaking, listening }) {
  const [blink, setBlink] = useState(false);
  const [mouth, setMouth] = useState(0);
  const [gaze, setGaze] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const id = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 130);
    }, 2800 + Math.random() * 1200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (!speaking && !listening)
        setGaze({
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 1.5,
        });
    }, 2200);
    return () => clearInterval(id);
  }, [speaking, listening]);

  useEffect(() => {
    if (!speaking) {
      setMouth(0);
      return;
    }
    const id = setInterval(() => setMouth(Math.random()), 110);
    return () => clearInterval(id);
  }, [speaking]);

  const irisCol = listening ? '#4A90D9' : speaking ? '#9B72CF' : '#3B6FC4';
  const mw = 14 + mouth * 7;
  const mh = 2 + mouth * 8;
  const my = 96;

  return (
    <svg
      width="180"
      height="180"
      viewBox="0 0 130 155"
      style={{
        filter:
          speaking || listening
            ? `drop-shadow(0 0 16px ${listening ? '#3b82f6' : '#8b5cf6'}55)`
            : 'none',
        transition: 'filter 0.4s',
      }}
    >
      <defs>
        <radialGradient id="fp-skin" cx="42%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFD6A5" />
          <stop offset="45%" stopColor="#F0A96A" />
          <stop offset="100%" stopColor="#C8764A" />
        </radialGradient>
        <linearGradient id="fp-hair" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#3D2610" />
          <stop offset="100%" stopColor="#0F0700" />
        </linearGradient>
        <radialGradient id="fp-iris" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor={irisCol} stopOpacity="0.9" />
          <stop offset="100%" stopColor="#0f0500" />
        </radialGradient>
        <linearGradient id="fp-lip" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D4607A" />
          <stop offset="100%" stopColor="#A83050" />
        </linearGradient>
        <radialGradient id="fp-blush" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4A0A8" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#F4A0A8" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Shoulders */}
      <ellipse cx="65" cy="150" rx="48" ry="18" fill="#1e293b" />
      <path
        d="M 26 136 Q 46 143 65 145 Q 84 143 104 136 L 101 155 L 29 155 Z"
        fill="#1d4ed8"
        opacity="0.9"
      />
      <ellipse cx="65" cy="140" rx="32" ry="12" fill="#334155" />
      {/* Neck */}
      <rect x="54" y="110" width="22" height="18" rx="8" fill="url(#fp-skin)" />
      {/* Head */}
      <path
        d="M 34 54 Q 33 32 65 27 Q 97 32 96 54 Q 101 82 93 102 Q 83 116 65 118 Q 47 116 37 102 Q 29 82 34 54 Z"
        fill="url(#fp-skin)"
      />
      {/* Hair */}
      <path
        d="M 34 52 Q 33 20 65 16 Q 97 20 96 52 Q 93 30 65 26 Q 37 30 34 52 Z"
        fill="url(#fp-hair)"
      />
      <path
        d="M 33 54 Q 20 56 17 78 Q 15 94 21 106 Q 28 90 30 74 Q 31 62 34 54 Z"
        fill="url(#fp-hair)"
      />
      <path
        d="M 97 54 Q 110 56 113 78 Q 115 94 109 106 Q 102 90 100 74 Q 99 62 96 54 Z"
        fill="url(#fp-hair)"
      />
      <ellipse cx="53" cy="22" rx="9" ry="8" fill="url(#fp-hair)" />
      <ellipse cx="65" cy="18" rx="10" ry="8" fill="url(#fp-hair)" />
      <ellipse cx="77" cy="22" rx="9" ry="8" fill="url(#fp-hair)" />
      {/* Ears */}
      <ellipse cx="30" cy="76" rx="6" ry="10" fill="url(#fp-skin)" />
      <ellipse cx="100" cy="76" rx="6" ry="10" fill="url(#fp-skin)" />
      {/* Brows */}
      <path
        d="M 40 54 Q 49 49 60 51"
        stroke="#2D1505"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 70 51 Q 81 49 90 54"
        stroke="#2D1505"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left eye */}
      <ellipse
        cx="50"
        cy="65"
        rx="10"
        ry={blink ? 0.8 : 8.5}
        fill="white"
        style={{ transition: 'ry 0.08s' }}
      />
      {!blink && (
        <>
          <ellipse
            cx={50 + gaze.x}
            cy={65 + gaze.y}
            r={6.5}
            fill="url(#fp-iris)"
            style={{ transition: 'cx 0.4s,cy 0.4s' }}
          />
          <circle
            cx={50 + gaze.x}
            cy={65 + gaze.y}
            r={4}
            fill="#0a0300"
            style={{ transition: 'cx 0.4s,cy 0.4s' }}
          />
          <circle
            cx={51.5 + gaze.x}
            cy={63.5 + gaze.y}
            r={1.5}
            fill="white"
            opacity="0.88"
            style={{ transition: 'cx 0.4s,cy 0.4s' }}
          />
        </>
      )}
      <path
        d="M 40 60 Q 50 55 60 60"
        stroke="#1E0F05"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {!blink && (
        <path
          d="M 42 71 Q 50 75 58 71"
          stroke="#C8764A"
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
      )}
      {/* Right eye */}
      <ellipse
        cx="80"
        cy="65"
        rx="10"
        ry={blink ? 0.8 : 8.5}
        fill="white"
        style={{ transition: 'ry 0.08s' }}
      />
      {!blink && (
        <>
          <ellipse
            cx={80 + gaze.x}
            cy={65 + gaze.y}
            r={6.5}
            fill="url(#fp-iris)"
            style={{ transition: 'cx 0.4s,cy 0.4s' }}
          />
          <circle
            cx={80 + gaze.x}
            cy={65 + gaze.y}
            r={4}
            fill="#0a0300"
            style={{ transition: 'cx 0.4s,cy 0.4s' }}
          />
          <circle
            cx={81.5 + gaze.x}
            cy={63.5 + gaze.y}
            r={1.5}
            fill="white"
            opacity="0.88"
            style={{ transition: 'cx 0.4s,cy 0.4s' }}
          />
        </>
      )}
      <path
        d="M 70 60 Q 80 55 90 60"
        stroke="#1E0F05"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      {!blink && (
        <path
          d="M 72 71 Q 80 75 88 71"
          stroke="#C8764A"
          strokeWidth="0.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.4"
        />
      )}
      {/* Nose */}
      <path
        d="M 62 76 Q 59 84 58 89 Q 61 93 65 94 Q 69 93 72 89 Q 71 84 68 76"
        stroke="#A05030"
        strokeWidth="1.1"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M 58 89 Q 55 93 58 96"
        stroke="#A05030"
        strokeWidth="1.1"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M 72 89 Q 75 93 72 96"
        stroke="#A05030"
        strokeWidth="1.1"
        fill="none"
        opacity="0.5"
      />
      {/* Blush */}
      <ellipse cx="39" cy="80" rx="13" ry="8" fill="url(#fp-blush)" />
      <ellipse cx="91" cy="80" rx="13" ry="8" fill="url(#fp-blush)" />
      {/* Lips */}
      {speaking ? (
        <ellipse
          cx="65"
          cy={my}
          rx={mw / 2}
          ry={mh / 2}
          fill="#5C1520"
          style={{ transition: 'rx 0.08s,ry 0.08s' }}
        />
      ) : (
        <path
          d={`M ${65 - 14} ${my - 1} Q 65 ${my + 8} ${65 + 14} ${my - 1}`}
          fill="url(#fp-lip)"
          stroke="#A83050"
          strokeWidth="0.5"
        />
      )}
      <path
        d={`M ${65 - 14} ${my - 1} Q ${65 - 7} ${my - 7} 65 ${my - 4} Q ${
          65 + 7
        } ${my - 7} ${65 + 14} ${my - 1}`}
        fill="url(#fp-lip)"
        opacity="0.85"
      />
      <ellipse cx="65" cy={my + 1} rx="7" ry="2.5" fill="white" opacity="0.1" />
      {/* Badge */}
      <rect
        x="46"
        y="132"
        width="38"
        height="12"
        rx="6"
        fill={speaking ? '#7c3aed' : listening ? '#1d4ed8' : '#1e293b'}
        style={{ transition: 'fill 0.3s' }}
      />
      <text
        x="65"
        y="141"
        textAnchor="middle"
        fill="white"
        fontSize="6"
        fontFamily="monospace"
        letterSpacing="2.5"
        fontWeight="600"
      >
        HAKIRA
      </text>
    </svg>
  );
}
// ── Ripple ring — animated while listening ─────────────────────
function RippleRing({ active, color }) {
  if (!active) return null;
  return (
    <div
      style={{
        position: 'absolute',
        inset: -16,
        borderRadius: '50%',
        pointerEvents: 'none',
      }}
    >
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `1.5px solid ${color}`,
            animation: `ariaRipple 1.8s ease-out ${i * 0.6}s infinite`,
            opacity: 0,
          }}
        />
      ))}
    </div>
  );
}

// ── Main ARIA Voice Popup ──────────────────────────────────────
export default function ARIAVoicePopup({ open, onClose }) {
  const [state, setState] = useState('idle'); // idle | listening | thinking | speaking
  const [error, setError] = useState('');
  const [hint, setHint] = useState('Click the mic to speak');
  const [apiKey, setApiKey] = useState(
    () => localStorage.getItem('zo_openai_key') || ''
  );
  const [showKey, setShowKey] = useState(false);

  const synthRef = useRef(window.speechSynthesis);
  const recogRef = useRef(null);
  const historyRef = useRef([]); // keeps voice conversation context
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Stop everything when popup closes
  useEffect(() => {
    if (!open) {
      synthRef.current?.cancel();
      recogRef.current?.abort();
      if (mountedRef.current) {
        setState('idle');
        setError('');
        setHint('Click the mic to speak');
      }
    }
  }, [open]);

  const buildSystemPrompt = () => {
    const customer = CUSTOMER?.name || 'the customer';
    const kpis = METRICS?.kpis || {};
    const roi = METRICS?.roi || {};
    const incidents = INCIDENTS_DATA || [];
    const domains = APP_DOMAINS || [];
    const allApps = domains.flatMap((d) =>
      (d.apps || []).map((a) => ({ ...a, domain: d.name }))
    );
    const redApps = allApps.filter((a) => a.status === 'RED');
    const amberApps = allApps.filter((a) => a.status === 'AMBER');
    const greenApps = allApps.filter((a) => a.status === 'GREEN');
    const p1 = incidents.filter((i) => i.pri === 'P1');
    const autoRes = incidents.filter((i) => i.status === 'Auto-Resolved');
    const inProg = incidents.filter(
      (i) => i.status === 'In Progress' || i.status === 'Open'
    );
    const agents = AGENT_DEFS || [];
    const scenarios = SCENARIOS_JSON || [];
    const reqStats = REQUEST_STATS || {};

    const incidentLines = incidents
      .map(
        (i) =>
          `[${i.pri}][${i.status}] ${i.id}: ${i.svc} — ${i.desc?.slice(0, 120)}`
      )
      .join('\n');

    const appLines = domains
      .map(
        (d) =>
          `${d.name} [${d.status}]: ` +
          (d.apps || []).map((a) => `${a.name}[${a.status}]`).join(', ')
      )
      .join('\n');

    const agentLines = agents
      .map(
        (a) =>
          `${a.name}: ${a.runs} runs, ${a.success} success, ${a.costOK}/run`
      )
      .join('\n');

    const scenarioLines = scenarios
      .map(
        (s) => `${s.title}: MTTR ${s.outcome?.mttr}, ${s.outcome?.automation}`
      )
      .join('\n');

    const dailyLines = (DAILY_STATS || [])
      .map((d) => `${d.label}: ${d.value}`)
      .join('\n');

    const kbLines = (KB_ARTICLES || [])
      .map((k) => `${k.id}: ${k.title}`)
      .join('\n');

    return `You are HAKIRA, the ZeroOps Virtual Assistant for ${customer}. You speak calmly and precisely like a knowledgeable colleague.

THIS IS A VOICE CONVERSATION — CRITICAL RULES:
- Maximum 2-3 short sentences per answer. Never more.
- No bullet points, no lists, no markdown.
- Natural spoken sentences only.
- Lead with the answer immediately — no preamble.
- Never say "certainly", "of course", "great question", or "I'd be happy to".
- Always use specific numbers from the data below — never say you do not have access.
- If something is not in the data, say "I do not see that in the current ZeroOps view."

CUSTOMER: ${customer} | ITSM: ${CUSTOMER?.itsm || ''} | Cloud: ${
      CUSTOMER?.primaryCloud || ''
    }

LIVE METRICS:
MTTR: ${kpis.mttr_baseline_min} min baseline, now ${
      kpis.mttr_current_min
    } min (${kpis.mttr_target_reduction_pct}% reduction)
Auto-fix: ${kpis.auto_fix_baseline_pct}% baseline, now ${
      kpis.auto_fix_rate_pct
    }% (target ${kpis.auto_fix_target_pct}%)
Alerts: ${kpis.alert_volume_per_day}/day reduced to ${
      kpis.actionable_alerts_per_day
    } actionable
CSAT: ${kpis.csat_baseline} baseline, now ${kpis.csat_current}
Engineer toil: ${kpis.engineer_toil_baseline_pct}% baseline, now ${
      kpis.engineer_toil_current_pct
    }%
ROI: $${roi.netROI} net on $${roi.llmCost} LLM cost = ${
      roi.roiMultiplier
    }x return

INCIDENTS (${incidents.length} total — P1: ${p1.length}, Auto-resolved: ${
      autoRes.length
    }, In progress: ${inProg.length}):
${incidentLines}

APPLICATIONS (${allApps.length} total — RED: ${redApps.length}, AMBER: ${
      amberApps.length
    }, GREEN: ${greenApps.length}):
RED apps: ${redApps.map((a) => a.name).join(', ') || 'none'}
AMBER apps: ${amberApps.map((a) => a.name).join(', ') || 'none'}
${appLines}

AGENTS (${agents.length} active):
${agentLines}

SCENARIOS:
${scenarioLines}

SILENT OPS TODAY:
${dailyLines}

SERVICE REQUESTS: ${reqStats.totalToday} today, ${
      reqStats.autoFulfilled
    } auto-fulfilled (${reqStats.autoRate}%)

KNOWLEDGE BASE:
${kbLines}

THREE PILLARS:
Pillar 1 SENTINEL: autonomous resolution, risk score under 25, zero human gates.
Pillar 2 GUARDIAN: human in the loop, one approval gate.
Pillar 3 ADVISOR: AI-assisted human decision.`;
  };

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    if (mountedRef.current) setState('idle');
  };

  const speakResponse = useCallback((text) => {
    if (!mountedRef.current) return;
    synthRef.current?.cancel();
    const clean = cleanForSpeech(text);
    if (!clean) {
      setState('idle');
      return;
    }

    const doSpeak = () => {
      const utt = new SpeechSynthesisUtterance(clean);
      utt.rate = 0.93;
      utt.pitch = 1.0;
      utt.volume = 1.0;
      const voices = synthRef.current.getVoices();
      const pick =
        voices.find(
          (v) => v.name === 'Microsoft Hazel - English (United Kingdom)'
        ) ||
        voices.find((v) => v.name === 'Google UK English Female') ||
        voices.find(
          (v) => v.name === 'Microsoft Susan - English (United Kingdom)'
        ) ||
        voices.find(
          (v) => v.name === 'Microsoft Zira - English (United States)'
        ) ||
        voices.find((v) => v.lang?.startsWith('en-GB')) ||
        voices.find((v) => v.lang?.startsWith('en'));
      if (pick) utt.voice = pick;
      utt.onstart = () => {
        if (mountedRef.current) {
          setState('speaking');
          setHint('Speaking — click to stop');
        }
      };
      utt.onend = () => {
        if (mountedRef.current) {
          setState('idle');
          setHint('Click the mic to speak');
        }
      };
      utt.onerror = () => {
        if (mountedRef.current) {
          setState('idle');
          setHint('Click the mic to speak');
        }
      };
      synthRef.current.speak(utt);
    };

    // setState("speaking") is set by utt.onstart — not here — so lips only move when audio plays
    const voices = synthRef.current.getVoices();
    if (voices.length > 0) {
      doSpeak();
    } else {
      synthRef.current.onvoiceschanged = () => {
        synthRef.current.onvoiceschanged = null;
        doSpeak();
      };
      setTimeout(doSpeak, 350);
    }
  }, []);

  const sendToZOVA = useCallback(
    async (transcript) => {
      if (!transcript.trim() || !apiKey.trim()) return;
      if (mountedRef.current) {
        setState('thinking');
        setHint('Thinking...');
      }

      historyRef.current.push({ role: 'user', content: transcript });

      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            max_tokens: 180,
            temperature: 0.35,
            messages: [
              { role: 'system', content: buildSystemPrompt() },
              ...historyRef.current.slice(-6), // keep last 3 exchanges for context
            ],
          }),
        });

        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content || '';
        historyRef.current.push({ role: 'assistant', content: reply });

        if (mountedRef.current) speakResponse(reply);
      } catch (e) {
        if (mountedRef.current) {
          setError('Could not reach HAKIRA — check your API key');
          setState('idle');
          setHint('Click the mic to speak');
          setTimeout(() => {
            if (mountedRef.current) setError('');
          }, 4000);
        }
      }
    },
    [apiKey, speakResponse]
  );

  const startListening = useCallback(() => {
    if (state === 'speaking') {
      stopSpeaking();
      return;
    }
    if (state === 'listening') {
      recogRef.current?.stop();
      return;
    }
    if (!apiKey.trim()) {
      setError('Add your OpenAI API key below first');
      return;
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setError('Voice not supported in this browser');
      return;
    }

    synthRef.current?.cancel();
    const recog = new SR();
    recog.lang = 'en-GB';
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recogRef.current = recog;

    recog.onstart = () => {
      if (mountedRef.current) {
        setState('listening');
        setHint('Listening... speak now');
      }
    };
    recog.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      if (transcript && mountedRef.current) sendToZOVA(transcript);
    };
    recog.onerror = (e) => {
      if (e.error !== 'aborted' && mountedRef.current) {
        setError(
          e.error === 'not-allowed'
            ? 'Mic blocked — allow mic in browser settings'
            : `Mic error: ${e.error}`
        );
        setState('idle');
        setHint('Click the mic to speak');
        setTimeout(() => {
          if (mountedRef.current) setError('');
        }, 4000);
      }
    };
    recog.onend = () => {
      if (mountedRef.current && state !== 'thinking')
        setState((s) => (s === 'listening' ? 'idle' : s));
    };
    recog.start();
  }, [state, apiKey, sendToZOVA]);

  if (!open) return null;

  const micColor =
    state === 'listening'
      ? '#ef4444'
      : state === 'speaking'
      ? '#8b5cf6'
      : '#1d4ed8';
  const micGlow =
    state === 'listening'
      ? '0 0 0 10px rgba(239,68,68,0.18), 0 0 32px rgba(239,68,68,0.35)'
      : state === 'speaking'
      ? '0 0 0 10px rgba(139,92,246,0.18), 0 0 32px rgba(139,92,246,0.35)'
      : '0 4px 20px rgba(29,78,216,0.35)';
  const micIcon =
    state === 'listening' ? '⏹' : state === 'speaking' ? '⏸' : '🎤';

  return (
    <>
      <style>{`
        @keyframes ariaRipple {
          0%   { transform:scale(1);   opacity:0.6; }
          100% { transform:scale(2.2); opacity:0;   }
        }
        @keyframes ariaFloat {
          0%,100% { transform:translateY(0);   }
          50%      { transform:translateY(-5px); }
        }
        @keyframes ariaDot {
          0%,80%,100% { transform:scale(0.6); opacity:0.4; }
          40%          { transform:scale(1);   opacity:1;   }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 998,
        }}
      />

      {/* Popup */}
      <div
        style={{
          position: 'fixed',
          zIndex: 999,
          bottom: 80,
          right: 24,
          width: 300,
          background: 'linear-gradient(160deg,#0f172a,#1e1b4b)',
          borderRadius: 24,
          border: '1px solid rgba(139,92,246,0.25)',
          boxShadow:
            '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
          padding: '28px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 16,
            background: 'transparent',
            border: 'none',
            color: '#64748b',
            fontSize: 18,
            cursor: 'pointer',
            lineHeight: 1,
            padding: 4,
          }}
        >
          ✕
        </button>

        {/* ARIA label */}
        <div style={{ textAlign: 'center', marginBottom: -8 }}>
          <div
            style={{
              fontSize: 18,
              fontFamily: 'monospace',
              letterSpacing: 2,
              color: '#ffffff',
              fontWeight: 700,
            }}
          >
            HAKIRA
          </div>
          <div
            style={{
              fontSize: 10,
              fontFamily: 'monospace',
              letterSpacing: 3,
              color: '#94a3b8',
            }}
          >
            ZeroOps Virtual Agent
          </div>
        </div>

        {/* Avatar */}
        <div
          style={{
            position: 'relative',
            animation: 'ariaFloat 3.5s ease-in-out infinite',
          }}
        >
          <RippleRing active={state === 'listening'} color="#3b82f6" />
          <RippleRing active={state === 'speaking'} color="#8b5cf6" />
          <FaceAvatar
            speaking={state === 'speaking'}
            listening={state === 'listening'}
          />
        </div>

        {/* Hint / status */}
        <div
          style={{
            fontSize: 12,
            color: '#94a3b8',
            textAlign: 'center',
            minHeight: 18,
            letterSpacing: 0.3,
          }}
        >
          {state === 'thinking' ? (
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                justifyContent: 'center',
              }}
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#7c3aed',
                    display: 'inline-block',
                    animation: `ariaDot 1.2s ${i * 0.2}s ease-in-out infinite`,
                  }}
                />
              ))}
            </span>
          ) : (
            hint
          )}
        </div>

        {/* Mic button */}
        <button
          onClick={startListening}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            border: 'none',
            cursor: 'pointer',
            background: `linear-gradient(135deg,${micColor},${micColor}cc)`,
            color: '#fff',
            fontSize: state === 'listening' || state === 'speaking' ? 24 : 28,
            boxShadow: micGlow,
            transition: 'all 0.25s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {micIcon}
        </button>

        {/* Subtle context line */}
        <div
          style={{
            fontSize: 10,
            color: '#475569',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {state === 'listening' && 'Say anything about the ZeroOps estate'}
          {state === 'speaking' && 'Click to interrupt'}
          {state === 'idle' &&
            `${CUSTOMER?.name || 'Enterprise'} IT · ${
              METRICS?.kpis?.incidents_per_month || 493
            } incidents/month`}
          {state === 'thinking' && 'HAKIRA is reasoning...'}
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              fontSize: 11,
              color: '#fca5a5',
              textAlign: 'center',
              background: 'rgba(220,38,38,0.1)',
              border: '1px solid rgba(220,38,38,0.2)',
              borderRadius: 8,
              padding: '6px 12px',
            }}
          >
            {error}
          </div>
        )}

        {/* API key — only show if not set */}
        {!apiKey && (
          <div
            style={{
              width: '100%',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: 14,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: '#64748b',
                fontFamily: 'monospace',
                letterSpacing: 1,
                marginBottom: 6,
              }}
            >
              OPENAI API KEY
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  localStorage.setItem('zo_openai_key', e.target.value);
                }}
                placeholder="sk-proj-..."
                style={{
                  width: '100%',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  padding: '7px 32px 7px 10px',
                  borderRadius: 7,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#e2e8f0',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              <span
                onClick={() => setShowKey((s) => !s)}
                style={{
                  position: 'absolute',
                  right: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#64748b',
                }}
              >
                {showKey ? '🙈' : '👁'}
              </span>
            </div>
          </div>
        )}
        {apiKey && (
          <button
            onClick={() => {
              setApiKey('');
              localStorage.removeItem('zo_openai_key');
              historyRef.current = [];
            }}
            style={{
              fontSize: 10,
              color: '#475569',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            ✕ clear key
          </button>
        )}
      </div>
    </>
  );
}
