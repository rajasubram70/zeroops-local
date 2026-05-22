import { useState, useEffect, useRef, useCallback } from 'react';
import { CUSTOMER, INCIDENTS_DATA, METRICS } from '../data/customer/loader.js';

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

// ── Compact illustrated face avatar ───────────────────────────
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
          x: (Math.random() - 0.5) * 2.5,
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

  const irisCol = listening ? '#3b82f6' : speaking ? '#8b5cf6' : '#2563eb';
  const mw = 14 + mouth * 8;
  const mh = 2.5 + mouth * 9;
  const my = 74;

  return (
    <svg
      width="130"
      height="150"
      viewBox="0 0 130 150"
      style={{
        filter:
          speaking || listening
            ? `drop-shadow(0 0 18px ${listening ? '#3b82f6' : '#8b5cf6'}60)`
            : 'none',
        transition: 'filter 0.4s',
      }}
    >
      <defs>
        <radialGradient id="ap-skin" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FEEBC8" />
          <stop offset="100%" stopColor="#F6AD7B" />
        </radialGradient>
        <radialGradient id="ap-hair" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0f172a" />
        </radialGradient>
        <radialGradient id="ap-blush" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FDA4AF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FDA4AF" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Shoulders */}
      <ellipse cx="65" cy="155" rx="45" ry="22" fill="#1e293b" />
      <ellipse cx="65" cy="145" rx="30" ry="16" fill="#334155" />
      <path
        d="M 46 138 Q 65 148 84 138 L 82 150 Q 65 158 48 150 Z"
        fill="#1d4ed8"
        opacity="0.9"
      />
      {/* Neck */}
      <rect x="55" y="108" width="20" height="18" rx="7" fill="url(#ap-skin)" />
      {/* Head */}
      <ellipse cx="65" cy="70" rx="38" ry="44" fill="url(#ap-skin)" />
      {/* Hair */}
      <ellipse cx="65" cy="34" rx="38" ry="22" fill="url(#ap-hair)" />
      <ellipse cx="29" cy="64" rx="11" ry="22" fill="url(#ap-hair)" />
      <ellipse cx="101" cy="64" rx="11" ry="22" fill="url(#ap-hair)" />
      {/* Ears */}
      <ellipse cx="27" cy="74" rx="6" ry="8" fill="url(#ap-skin)" />
      <ellipse cx="27" cy="74" rx="3.5" ry="5.5" fill="#F6AD7B" opacity="0.7" />
      <ellipse cx="103" cy="74" rx="6" ry="8" fill="url(#ap-skin)" />
      <ellipse
        cx="103"
        cy="74"
        rx="3.5"
        ry="5.5"
        fill="#F6AD7B"
        opacity="0.7"
      />
      {/* Eyebrows */}
      <path
        d="M 42 52 Q 50 48 58 50"
        stroke="#1e293b"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 72 50 Q 80 48 88 52"
        stroke="#1e293b"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Eyes */}
      <ellipse
        cx="50"
        cy="61"
        rx="8.5"
        ry={blink ? 1 : 7}
        fill="white"
        style={{ transition: 'ry 0.08s' }}
      />
      <ellipse
        cx="80"
        cy="61"
        rx="8.5"
        ry={blink ? 1 : 7}
        fill="white"
        style={{ transition: 'ry 0.08s' }}
      />
      {!blink && (
        <>
          <circle
            cx={50 + gaze.x}
            cy={61 + gaze.y}
            r="4.5"
            fill={irisCol}
            style={{ transition: 'cx 0.4s,cy 0.4s,fill 0.3s' }}
          />
          <circle
            cx={80 + gaze.x}
            cy={61 + gaze.y}
            r="4.5"
            fill={irisCol}
            style={{ transition: 'cx 0.4s,cy 0.4s,fill 0.3s' }}
          />
          <circle
            cx={50 + gaze.x}
            cy={61 + gaze.y}
            r="2.5"
            fill="#0f172a"
            style={{ transition: 'cx 0.4s,cy 0.4s' }}
          />
          <circle
            cx={80 + gaze.x}
            cy={61 + gaze.y}
            r="2.5"
            fill="#0f172a"
            style={{ transition: 'cx 0.4s,cy 0.4s' }}
          />
          <circle
            cx={51.5 + gaze.x}
            cy={59.5 + gaze.y}
            r="1.3"
            fill="white"
            opacity="0.9"
            style={{ transition: 'cx 0.4s,cy 0.4s' }}
          />
          <circle
            cx={81.5 + gaze.x}
            cy={59.5 + gaze.y}
            r="1.3"
            fill="white"
            opacity="0.9"
            style={{ transition: 'cx 0.4s,cy 0.4s' }}
          />
        </>
      )}
      {/* Nose */}
      <path
        d="M 63 72 Q 61 78 63 81 Q 65 83 67 81 Q 69 78 67 72"
        stroke="#E8956D"
        strokeWidth="1"
        fill="none"
        opacity="0.55"
      />
      {/* Blush */}
      <ellipse cx="42" cy="80" rx="10" ry="6" fill="url(#ap-blush)" />
      <ellipse cx="88" cy="80" rx="10" ry="6" fill="url(#ap-blush)" />
      {/* Mouth */}
      {speaking ? (
        <ellipse
          cx="65"
          cy={my}
          rx={mw / 2}
          ry={mh / 2}
          fill="#7f1d1d"
          style={{ transition: 'rx 0.08s,ry 0.08s' }}
        />
      ) : (
        <path
          d={`M ${65 - 12} ${my - 1} Q 65 ${my + 7} ${65 + 12} ${my - 1}`}
          stroke="#d4849a"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
      )}
      <path
        d={`M ${65 - 12} ${my - 1} Q ${65 - 5} ${my - 5} 65 ${my - 3} Q ${
          65 + 5
        } ${my - 5} ${65 + 12} ${my - 1}`}
        stroke="#d4849a"
        strokeWidth="1.2"
        fill="none"
        opacity="0.65"
      />
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

  const buildSystemPrompt =
    () => `You are ARIA — the ZeroOps AI Operations Assistant for ${
      CUSTOMER?.name || 'the enterprise'
    }. You are calm, precise, and speak like a knowledgeable colleague — not a chatbot.

This is a VOICE conversation. Rules:
- Answer in 2-3 sentences maximum. Never more.
- No bullet points, no markdown, no lists.
- Speak in complete natural sentences only.
- Be direct. Lead with the answer, not the preamble.
- Use numbers when they matter: MTTR is ${
      METRICS?.kpis?.mttr_current_min || 28
    } minutes, down from ${
      METRICS?.kpis?.mttr_baseline_hrs || 285
    } hours. Auto-fix rate is ${METRICS?.kpis?.auto_fix_rate_pct || 52} percent.
- If asked about NPS: baseline was ${
      METRICS?.kpis?.nps_baseline || -50
    }, currently ${METRICS?.kpis?.nps_current || 28}, target is ${
      METRICS?.kpis?.nps_target || 50
    }.
- Never say "certainly", "of course", "great question", or "I'd be happy to".
- End with one concrete recommendation or next action.`;

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
        voices.find((v) => v.name.includes('Google UK English Female')) ||
        voices.find((v) => v.name.includes('Samantha')) ||
        voices.find((v) => v.name.includes('Karen')) ||
        voices.find((v) => v.name.includes('Google US English')) ||
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

    setState('speaking');
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

  const sendToARIA = useCallback(
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
          setError('Could not reach ARIA — check your API key');
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
      if (transcript && mountedRef.current) sendToARIA(transcript);
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
  }, [state, apiKey, sendToARIA]);

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
        <div
          style={{
            fontSize: 9,
            fontFamily: 'monospace',
            letterSpacing: 4,
            color: '#7c3aed',
            marginBottom: -8,
          }}
        >
          ARIA — ZEROOPS AI
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
          {state === 'thinking' && 'ARIA is reasoning...'}
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
