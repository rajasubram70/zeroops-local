import { useState, useEffect, useRef, useCallback } from 'react';
import { CUSTOMER } from '../data/customer/loader.js';

// ── Demo scripts inlined ──────────────────────────────────────
const twiningsScript = {
  _notes: '15-minute Twinings narration at 1.2x speed. ~215 words per chapter.',
  title: 'ZeroOps — Twinings Ovaltine · 15-Minute Value Demo',
  chapters: [
    {
      id: 'hook',
      nav: 'cmd',
      label: 'Opening Hook',
      duration: 90,
      narration:
        'Let me start with a number. Not a slide. Not a graph. Just a number. Two hundred and eighty-five hours. That is how long it takes, on average, for a Twinings IT service request to be resolved today. Not two hours and eighty-five minutes. Two hundred and eighty-five hours. Eleven and a half days. For something as straightforward as assigning a Fiori display role to a new finance team member who joined on Monday and cannot access their own system by Wednesday of the following week. The IT team is not failing. They are overwhelmed. Four hundred and ninety-three incidents a month. Three hundred authorisation requests. Sixty work instructions. All handled manually. Zero automation today. Every engineer on the team is spending sixty percent of their time on repetitive toil that adds no business value — password resets, queue monitoring, ticket triaging, manual approvals. The result: three hundred and twelve active S-L-A breaches right now. At this moment. Not last month. Right now. Users are frustrated. Finance cannot close on time. The service desk phone does not stop ringing. This is what ZeroOps changes. Completely. Permanently.',
    },
    {
      id: 'dashboard',
      nav: 'cmd',
      label: 'Command Centre',
      duration: 100,
      narration:
        'This is the ZeroOps Command Centre. Everything you are looking at is live operational data — the Twinings IT estate, today. Look at the top row. M-T-T-R: twenty-eight minutes. Down from two hundred and eighty-five hours. That is a ninety-nine-point-eight percent reduction. Not a forecast. Not a pilot result. A delivered outcome from a live production environment. Fifty-two percent of incidents auto-resolved this month. Zero percent six months ago. Every one of those auto-resolutions happened silently, autonomously, without a human being involved. Alert Noise Reduction: seventy-eight percent. Your engineers are not seeing three hundred and twenty alerts per day any more — they are seeing seventy-one. Only the ones that matter. N-P-S at plus twenty-eight. The baseline was minus fifty. That means three-quarters of your IT users were active detractors — people who would actively discourage colleagues from using IT services. Six months of ZeroOps: we have crossed zero into positive territory, and we are tracking toward your B-T-X target of plus fifty. And notice the banner at the very top of the screen. That is engineer time saved since midnight this morning, accumulating in real time as ZeroOps works silently in the background while your team sleeps. And every single one of these metrics is live — refreshing against the actual Twinings estate, not a demo environment. What you are seeing is what the ZeroOps team sees every morning when they start the day. This is the operational reality after six months. Not a proof of concept. Not a pilot. Production.',
    },
    {
      id: 'silent_ops',
      nav: 'cmd',
      label: 'Silent Operations',
      duration: 100,
      narration:
        "Scroll down and you reach the part of the platform that changes every conversation. The Silent Operations Centre. Every single line here is something that was detected, diagnosed, and resolved — fully autonomously — without a single service desk ticket being raised. Without a single engineer being woken. Without a single user noticing anything was wrong. Look at the entries from this morning. At four seventeen: S-A-P Fiori cache flush. Fourteen users were going to call in at eight o'clock unable to load their dashboards. ZeroOps detected the degradation pattern at three forty-seven, executed the flush, and had all fourteen users fully operational before the working day started. Zero calls. Zero tickets. Zero engineers involved. At five forty-four: S-A-P work process pool saturation. ZeroOps rescheduled the batch job before it impacted user sessions. At six twelve: two hundred and forty-seven alerts processed — four unique incidents identified, two hundred and forty-three suppressed. This is what we mean by Sentinel mode. Silent. Autonomous. Invisible to the business. And critically — every one of these resolutions adds a validated pattern to the knowledge base. The system gets smarter with every incident it handles.",
    },
    {
      id: 'workflow_sentinel',
      nav: 'wf',
      label: 'MDG Auto-Resolution',
      duration: 110,
      narration:
        'Now let me show you what autonomous resolution actually looks like in practice. This is the scenario most operationally relevant to Twinings right now. Your M-D-G approval queue currently has eight hundred and forty-seven items. Average age: two hundred and ninety-nine hours. Nearly thirteen days. Every single one of those items is blocking something downstream — Ariba procurement workflows, K2 approval chains, OpenText document routing. This is Pillar One — Sentinel. Zero human gates. Full autonomous resolution. Watch the simulation run. Step one: the ZeroOps Alert Correlator detects the queue backlog from S-A-P Cloud A-L-M. Not when it reached eight hundred and forty-seven — it would have caught this at two hundred. Step two: the R-C-A Engine traverses the S-A-P dependency graph. Forty-seven seconds to root cause: M-D-G batch jobs are scheduled in the dialog work process class, competing directly with user sessions. Eighty-nine percent confidence. Step three: S-M-37 rescheduling. Batch jobs moved to the background W-P class. Dialog pool drops from seventy-four percent to forty-one percent. Step four: Change Validator scans the eight-hundred-and-forty-seven item queue. Five hundred and four items — sixty percent — meet the auto-approval criteria. Pricing outputs, G-L field extensions, vendor bank details. Auto-approved. Instantly. Step five: downstream systems unblocked. Twenty-three Ariba purchase orders released. Sixty-one K2 workflows restarted. Finance team notified via Teams. Total M-T-T-R: one hour forty-seven minutes. Manual estimate: eight to twelve hours. And that assumes the right BASIS engineer is available and not already firefighting something else. Seven of seven steps. Fully autonomous. No human required. The risk score for this entire operation was eighteen out of one hundred. That is why no human gate was required. ZeroOps has a clear risk model — anything above twenty-five requires a human to approve before execution. Anything below twenty-five, like this scenario, it handles entirely on its own. Fully reversible. Fully validated. Fully logged. Every action is in the audit trail. Every decision is explainable. This is not a black box — it is a transparent, accountable autonomous system that your engineers can inspect, override, or tune at any time.',
    },
    {
      id: 'workflow_guardian',
      nav: 'wf',
      label: 'Auth Auto-Provision',
      duration: 90,
      narration:
        'Scenario two — same platform, different posture. This is Pillar Two — Guardian. One human gate. Three hundred authorisation requests a month at Twinings. Average wait time: seventy-six hours. A new finance team member joins on Monday. By Friday of the following week, their laptop is set up but they still cannot access their S-A-P environment. Day one: unproductive. Day two: unproductive. Week one: completely blocked. This is the reality today. Watch what ZeroOps does. The request arrives from ServiceNow. Eligibility check: standard Fiori display roles, no sensitive transactions — this qualifies for the automated pathway. S-O-D check fires automatically via S-A-P G-R-C A-P-I. Clean result for all six users. Here is the one human gate. The manager receives a single Teams message — one card, one button, one click. That is the entirety of their involvement. ZeroOps handles everything else. I-A-S provisioning. Fiori catalogue assignment. ServiceNow ticket closure. User email notification with access confirmation. Resolution time: four hours twelve minutes. That is a ninety-four-and-a-half percent reduction from seventy-six hours. And the manager spent eleven seconds of their entire day on it.',
    },
    {
      id: 'topology',
      nav: 'topo',
      label: 'Service Map',
      duration: 95,
      narration:
        'This is the ZeroOps Service Map — the entire Twinings S-A-P estate, live, organised by value chain. Five chains across the top: S-A-P Core E-R-P, S-A-P Analytics and Planning, S-A-P Procurement and Finance, S-A-P Platform and Identity, and Integration and Data Platform. Each chain contains the applications that deliver that business capability — S/4HANA, B-W-4HANA, Analytics Cloud, Ariba, I-A-S, K2, Talend, Snowflake — all connected, all monitored. The red and amber nodes are where ZeroOps is currently active. Let me click into the S-A-P Core E-R-P chain — the most critical in the estate right now. You can see two applications: S-A-P S/4HANA in amber, and S-A-P Master Data Governance in red. M-D-G is red because of the eight-hundred-and-forty-seven item queue backlog we just resolved in the workflow simulation. Click into M-D-G and the blast radius is immediately visible — Ariba procurement blocked, K2 workflows timing out, S/4HANA dialog pool saturating, Snowflake receiving partial master data, OpenText routing stalled. Five downstream systems. The entire month-end process at risk. ZeroOps shows you this cascade before it cascades — and has a remediation plan attached to every node. R-C-A Engine at eighty-eight percent confidence. Remediation Agent with a pre-validated action sequence ready to execute. This is the difference between a monitoring tool and an autonomous operations platform. A monitoring tool shows you the fire. ZeroOps puts it out — and shows you which rooms would have burned.',
    },
    {
      id: 'requests',
      nav: 'req',
      label: 'Service Requests',
      duration: 90,
      narration:
        'Let me spend a moment on this page because it is the one that surprises Finance the most. Three hundred and eighty-eight open requests right now. Three hundred and twelve of them in S-L-A breach. This is not historical data — this is live, as of this morning. Look at the authorisation and access category. Three hundred requests a month. Average resolution time: seventy-six hours. With ZeroOps: four hours. Seventy percent auto-approved by the system. Thirty percent routed to a human with full diagnostic context already prepared — no blank tickets, no back-and-forth clarification, no waiting for the right engineer to become available. Now look at L3 bug fixes. Nine hundred and four hours. Thirty-seven days for an L3 bug fix. ZeroOps does not eliminate that — bug fixes require developers. But it reduces it to seventy-two hours through A-I-assisted diagnosis, automated pre-checks, and auto-regression testing. The developer receives a brief, not a blank ticket. Two hundred and sixty-six engineer hours saved this month from service request automation alone. At eighty-five pounds per hour. That is the direct labour saving before you touch incident resolution.',
    },
    {
      id: 'reports',
      nav: 'reports',
      label: 'Monthly Report',
      duration: 100,
      narration:
        'This is the board-ready view. The ZeroOps Monthly Value Report — auto-generated, zero manual effort, ready to send to your C-I-O or Finance Director this afternoon. M-T-T-R: twenty-eight minutes from two hundred and eighty-five hours. Auto-fix rate: fifty-two percent — from zero six months ago. N-P-S: plus twenty-eight, from minus fifty. That crossover from negative to positive territory happened in month four. Your B-T-X target of plus fifty is the six-month horizon — the trajectory shows we are on track. Scroll down to the R-O-I section. This is the number Finance needs to see. L-L-M operating cost this month: thirty-eight pounds. Total A-I token spend. Not thousands. Thirty-eight pounds. Net R-O-I: seventy-five thousand, five hundred and seventy-six pounds. One thousand, nine hundred and ninety times return on the A-I spend. I want to be completely transparent about how that number is calculated — it is engineer handling time eliminated, not customer wait time. Two hundred and sixty-six hours of actual engineer effort that no longer happens, at eighty-five pounds per hour, plus noise suppression value. Fully auditable. Fully defensible. And this is month six. The automation rate compounds as ZeroOps learns more Twinings-specific patterns. Month twelve will look materially better than month six.',
    },
    {
      id: 'agents',
      nav: 'agents',
      label: 'Knowledge Base',
      duration: 90,
      narration:
        'One of the quieter but commercially significant capabilities. Every incident ZeroOps resolves adds to the knowledge base. Every resolution pattern becomes a validated runbook. Every R-C-A adds to the root cause library. This is institutional memory that does not leave when an engineer hands in their notice. Let me open the M-D-G Queue Management article. Four sections: diagnosing queue backlog, immediate relief via S-M-37, ZeroOps auto-validation setup, escalation triggers. Related incidents linked — the three M-D-G incidents from this month, showing the pattern history. Related agents listed — R-C-A Engine, Change Validator, Remediation Agent. Confidence score: ninety-four percent. When the next M-D-G queue issue occurs — and it will occur — ZeroOps resolves it in minutes because it has done it before. The pattern is in the vector database. No engineer needs to diagnose what has already been diagnosed, documented, and validated. This is how ZeroOps protects you from knowledge attrition and the cost of losing experienced engineers.',
    },
    {
      id: 'close',
      nav: 'cmd',
      label: 'Close',
      duration: 75,
      narration:
        'Let me leave you with three numbers. Minus fifty — where Twinings N-P-S is today. The baseline. Mostly detractors. I-T as a source of friction, not a source of value. Plus twenty-eight — where it is after six months of ZeroOps in production. Positive territory. I-T starting to become a competitive advantage rather than a liability. Plus fifty — your B-T-X target. That is not a stretch goal with ZeroOps. That is the trajectory we are already on, and month twelve looks better than month six. Every issue resolved before a user notices is a detractor who never becomes one. Every P3 request fulfilled in four hours instead of seventy-six turns a passive into a promoter. N-P-S responds to accumulated experience — and ZeroOps starts improving every individual experience from day one. The question is not whether the technology works. You have just watched it work, live, on a Twinings estate, with Twinings numbers. The question is how quickly you want to move from eleven-day resolution times to twenty-eight minutes. Thank you. One final thought. The thirty-eight pounds of L-L-M spend that delivered seventy-five thousand pounds of value this month — that ratio is not a rounding error. It is the structural reality of A-I-powered automation at scale. As the platform learns more Twinings patterns, the numerator grows and the denominator stays flat. Month twelve will not just be better. It will be materially, measurably better. That is the compounding effect of a system that gets smarter with every incident it handles.',
    },
  ],
};
const canonScript = {
  _notes:
    'Canon Europe 10-minute narrated demo. BOT transformation story — TCS managed services transitioning to GCC India. ZeroOps as the knowledge transfer and automation engine.',
  title: 'ZeroOps — Canon Europe · 10-Minute Value Demo',
  audience:
    'Enterprise Architect · Programme Manager · Finance · GCC Leadership',
  chapters: [
    {
      id: 'hook',
      nav: 'cmd',
      label: 'Opening',
      duration: 55,
      narration:
        'Let me start with the challenge Canon faces today. A major business technology transformation — moving from T-C-S managed services to a Canon G-C-C in Bangalore. The risk is not the technology. The risk is knowledge. Every resolved incident, every workaround, every escalation path — currently held in the heads of engineers who may not be there at handover. ZeroOps changes this. Every incident resolved becomes institutional memory that Canon G-C-C inherits from day one.',
    },
    {
      id: 'dashboard',
      nav: 'cmd',
      label: 'Dashboard',
      duration: 70,
      narration:
        'This is the ZeroOps Command Centre for Canon Europe. M-T-T-R: thirty-one minutes — down from two hundred and ten hours. Forty-eight percent of incidents auto-resolved this month — zero percent six months ago. Twenty-eight thousand alerts suppressed to one hundred and eighty per day — your engineers see only what matters. N-P-S at plus twenty-two, up from minus thirty-five. And the value delivered banner at the top — engineer hours saved since midnight today, accumulating in real time as ZeroOps works silently in the background.',
    },
    {
      id: 'silent_ops',
      nav: 'cmd',
      label: 'Silent Ops',
      duration: 65,
      narration:
        'The Silent Operations Centre. This morning at four seventeen: S-A-P S/4HANA batch job saturation — dialog work process pool at seventy-eight percent. ZeroOps detected it, ran root cause analysis in forty-seven seconds, rescheduled the batch jobs, and restored the pool to forty-one percent — before the first Canon employee logged in. And critically — that resolution pattern is now a validated runbook in the knowledge base. Canon G-C-C inherits it at handover. No tribal knowledge lost.',
    },
    {
      id: 'workflow',
      nav: 'wf',
      label: 'Autonomous Resolution',
      duration: 75,
      narration:
        "Let me show the autonomous resolution workflow. This is the scenario most relevant to Canon's transformation. An Oracle E-R-P shared pool exhaustion — a pattern that previously required a senior D-B-A to diagnose. Watch the simulation. Alert Correlator detects the O-R-A-04031 pattern. R-C-A Engine identifies shared pool exhaustion in under a minute. Remediation Agent triggers a controlled memory flush. Validation confirms recovery. ServiceNow ticket auto-closed. And the resolution pattern is automatically drafted as a K-B article for G-C-C review. Seven steps. Zero humans. Full documentation. This is what Canon G-C-C inherits — not a black box, but a documented, automated estate.",
    },
    {
      id: 'topology',
      nav: 'topo',
      label: 'Service Map',
      duration: 60,
      narration:
        'This is the Canon Europe estate, live. S-A-P S/4HANA, Oracle E-R-P, Salesforce, Azure infrastructure, ServiceNow — all connected, all monitored. The amber nodes show where ZeroOps is currently active. Click into the S-A-P node and you see the blast radius — if this degrades further, it cascades into Oracle, Salesforce, and downstream reporting. ZeroOps shows you the propagation chain before it happens, and has a remediation plan attached to every node. This is the topology Canon G-C-C sees from day one.',
    },
    {
      id: 'transfer',
      nav: 'transfer',
      label: 'Transfer Readiness',
      duration: 70,
      narration:
        "This is the page that no other A-I-Ops platform has. The Transfer Readiness Dashboard. Built specifically for Canon's B-O-T programme. Runbook coverage: seventy-eight percent — forty-seven of sixty critical runbooks authored and validated. K-B articles: seventy-one percent. Automation coverage: sixty-one percent — thirty-seven incident patterns with confidence above eighty percent. G-C-C shadowing: forty-five percent — nine of twenty engineers have completed ZeroOps sessions. And the K-T Progress chart shows the knowledge capture journey month by month, with forecast to handover in Q4 2026. Canon G-C-C does not inherit a black box — they inherit a fully documented, fully automated estate.",
    },
    {
      id: 'dual_entity',
      nav: 'transfer',
      label: 'Dual-Entity View',
      duration: 55,
      narration:
        'Switch to the Dual Entity View. On the left — the current T-C-S managed scope. Sixty percent of the estate. Live, auto-resolving at sixty-one percent, runbook coverage at seventy-eight percent. On the right — the incoming G-C-C scope. Forty percent of the estate. Currently onboarding — ZeroOps ingesting ServiceNow history, building the pattern library. Both scopes monitored on one platform simultaneously. This is what unified transition visibility looks like. No gaps, no blind spots, no knowledge cliff at handover day.',
    },
    {
      id: 'reports',
      nav: 'reports',
      label: 'Monthly Report',
      duration: 60,
      narration:
        'The board-ready view. M-T-T-R: thirty-one minutes from two hundred and ten hours. Auto-fix: forty-eight percent. N-P-S: plus twenty-two, from minus thirty-five. And the R-O-I section. L-L-M operating cost: forty-two pounds. Net value delivered this month: significantly exceeding that spend. Every pound of A-I spend is returning multiples in engineer time avoided — and that ratio compounds as ZeroOps learns more Canon patterns each month.',
    },
    {
      id: 'agents',
      nav: 'agents',
      label: 'Knowledge Base',
      duration: 55,
      narration:
        "The Knowledge Base is the heart of Canon's transformation story. Every incident ZeroOps resolves adds a validated runbook. Every R-C-A adds to the root cause library. Every change approval adds to the change pattern database. At handover — Canon G-C-C does not start from zero. They start from a knowledge base built over twelve months of live operations. Resolution patterns with confidence scores. Escalation paths. Workarounds. Engineer notes. Everything that currently lives in people's heads — captured, structured, and transferred.",
    },
    {
      id: 'close',
      nav: 'cmd',
      label: 'Close',
      duration: 50,
      narration:
        'Three numbers. Sixty percent — what T-C-S manages today. One hundred percent — what Canon G-C-C targets. Zero — the number of knowledge gaps ZeroOps will leave at handover. The question for Canon is not whether A-I-Ops can automate incident resolution. You have just seen it do that. The question is whether you want your G-C-C to inherit an automated, documented, self-healing estate — or start from scratch. ZeroOps makes the first option possible. Thank you.',
    },
  ],
};

// ── TTS text cleaner ──────────────────────────────────────────
function cleanForSpeech(t) {
  if (!t) return '';
  t = t.replace(/```[\s\S]*?```/g, '');
  t = t.replace(/`[^`]+`/g, '');
  t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
  t = t.replace(/\*([^*]+)\*/g, '$1');
  t = t.replace(/£([,\d]+(?:\.\d+)?)/g, (_, n) => {
    const num = parseFloat(n.replace(/,/g, ''));
    if (num >= 1000) return `${Math.round(num / 1000)} thousand pounds`;
    return `${num} pounds`;
  });
  t = t.replace(/(\d+(?:\.\d+)?)%/g, '$1 percent');
  t = t.replace(/(\d),(\d)/g, '$1$2');
  t = t.replace(/—/g, ', ');
  t = t.replace(/[|<>{}[\]#]/g, '');
  t = t
    .replace(/\n/g, '. ')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
  return t;
}

// ── Chapter dots ──────────────────────────────────────────────
function ChapterDots({ chapters, current, onJump }) {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {chapters.map((ch, i) => (
        <div
          key={ch.id}
          onClick={() => onJump(i)}
          title={ch.label}
          style={{
            width: i === current ? 20 : 8,
            height: 8,
            borderRadius: 4,
            cursor: 'pointer',
            background:
              i < current
                ? 'rgba(255,255,255,0.6)'
                : i === current
                ? '#fff'
                : 'rgba(255,255,255,0.22)',
            transition: 'all 0.3s',
          }}
        />
      ))}
    </div>
  );
}

// ── Mini ZOVA avatar ──────────────────────────────────────────
function MiniZOVA({ speaking }) {
  const [mouth, setMouth] = useState(0);
  useEffect(() => {
    if (!speaking) {
      setMouth(0);
      return;
    }
    const id = setInterval(() => setMouth(Math.random()), 120);
    return () => clearInterval(id);
  }, [speaking]);
  const mh = 1.5 + mouth * 5,
    mw = 8 + mouth * 4;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <defs>
        <radialGradient id="dn-skin" cx="42%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFD6A5" />
          <stop offset="100%" stopColor="#C8764A" />
        </radialGradient>
      </defs>
      <ellipse cx="18" cy="15" rx="10" ry="11.5" fill="url(#dn-skin)" />
      <ellipse cx="18" cy="8" rx="10.5" ry="6" fill="#1E0F05" />
      <ellipse
        cx="14.5"
        cy="14"
        rx="2"
        ry={speaking ? 1.8 : 1.5}
        fill="#0a0300"
      />
      <ellipse
        cx="21.5"
        cy="14"
        rx="2"
        ry={speaking ? 1.8 : 1.5}
        fill="#0a0300"
      />
      <circle cx="15.2" cy="13.4" r="0.6" fill="white" opacity="0.8" />
      <circle cx="22.2" cy="13.4" r="0.6" fill="white" opacity="0.8" />
      {speaking ? (
        <ellipse cx="18" cy="20" rx={mw / 2} ry={mh / 2} fill="#5C1520" />
      ) : (
        <path
          d="M 14 20 Q 18 22.5 22 20"
          stroke="#C0546A"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
      )}
      <ellipse cx="18" cy="33" rx="13" ry="6" fill="#1d4ed8" />
      {speaking && (
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          stroke="rgba(139,92,246,0.4)"
          strokeWidth="1.5"
          style={{ animation: 'dnPulse 1s ease-out infinite' }}
        />
      )}
    </svg>
  );
}

// ── Main DemoNarrator ─────────────────────────────────────────
export default function DemoNarrator({ onNav, open, onClose }) {
  const [chapters, setChapters] = useState([]);
  const [current, setCurrent] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [status, setStatus] = useState('ready');
  const [minimised, setMinimised] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 12 });
  const [dragging, setDragging] = useState(false);

  const synthRef = useRef(window.speechSynthesis);
  const timerRef = useRef(null);
  const mountedRef = useRef(true);
  const playingRef = useRef(false);
  const chapterRef = useRef(0);
  const dragRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0 });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Load script for active customer
  useEffect(() => {
    const scripts = { twinings: twiningsScript, canon: canonScript };
    const name = CUSTOMER?.name?.toLowerCase() || '';
    const key =
      Object.keys(scripts).find((k) => name.includes(k)) || 'twinings';
    setChapters(scripts[key]?.chapters || []);
  }, []);

  // Reset on close
  useEffect(() => {
    if (!open) {
      stopAll();
      setCurrent(0);
      setElapsed(0);
      setTotalElapsed(0);
      setStatus('ready');
    }
  }, [open]);

  const stopAll = useCallback(() => {
    synthRef.current?.cancel();
    clearInterval(timerRef.current);
    playingRef.current = false;
    if (mountedRef.current) {
      setSpeaking(false);
    }
  }, []);

  const getVoice = () => {
    const voices = synthRef.current.getVoices();
    return (
      voices.find(
        (v) => v.name === 'Microsoft Hazel - English (United Kingdom)'
      ) ||
      voices.find((v) => v.name === 'Google UK English Female') ||
      voices.find(
        (v) => v.name === 'Microsoft Zira - English (United States)'
      ) ||
      voices.find((v) => v.lang?.startsWith('en-GB')) ||
      voices.find((v) => v.lang?.startsWith('en'))
    );
  };

  // ── Chapter DOM actions (single system) ───────────────────────
  const runChapterAction = useCallback((chId) => {
    const click = (sel, delay = 1000) =>
      setTimeout(() => {
        const el = document.querySelector(sel);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.click();
        }
      }, delay);

    switch (chId) {
      case 'silent_ops':
        setTimeout(() => {
          const el = document.querySelector("[data-section='silent-ops']");
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          else window.scrollTo({ top: 700, behavior: 'smooth' });
        }, 1000);
        break;

      case 'workflow_sentinel':
      case 'workflow':
        click("[data-demo='scenario-0']", 800);
        setTimeout(() => {
          const btn = document.querySelector("[data-demo='run-simulation']");
          if (btn && !btn.disabled) btn.click();
        }, 2000);
        break;

      case 'workflow_guardian':
        click("[data-demo='scenario-1']", 800);
        setTimeout(() => {
          const btn = document.querySelector("[data-demo='run-simulation']");
          if (btn && !btn.disabled) btn.click();
        }, 2000);
        break;

      case 'topology':
        setTimeout(() => {
          const chain =
            document.querySelector("[data-demo='chain-sap-core-erp']") ||
            document.querySelectorAll("[data-demo^='chain-']")[0];
          if (!chain) return;
          chain.click();
          setTimeout(() => {
            const mdg =
              document.querySelector("[data-demo='app-sap-mdg']") ||
              document.querySelectorAll("[data-demo^='app-']")[1] ||
              document.querySelectorAll("[data-demo^='app-']")[0];
            if (!mdg) return;
            mdg.click();
            setTimeout(() => {
              const blast = Array.from(document.querySelectorAll('div')).find(
                (d) => d.textContent?.trim() === '⚠ Blast Radius →'
              );
              if (blast) blast.click();
            }, 1400);
          }, 1000);
        }, 1200);
        break;

      case 'reports':
        click("[data-demo='report-tab-monthly']", 700);
        setTimeout(() => {
          const btn = document.querySelector("[data-demo='generate-report']");
          if (btn) btn.click();
        }, 1600);
        break;

      case 'transfer':
        click("[data-demo='transfer-tab-readiness']", 800);
        break;

      case 'dual_entity':
        click("[data-demo='transfer-tab-dual']", 800);
        break;

      case 'agents':
        setTimeout(() => {
          const tabs = Array.from(document.querySelectorAll('div')).filter(
            (d) => d.textContent?.trim() === 'KB Articles' && d.onclick !== null
          );
          if (tabs[0]) tabs[0].click();
          setTimeout(() => {
            const art = document.querySelectorAll("[data-demo^='kb-']")[0];
            if (art) art.click();
          }, 800);
        }, 1000);
        break;

      default:
        break;
    }
  }, []);

  const speakChapter = useCallback(
    (idx, chs) => {
      if (!chs?.length || idx >= chs.length) {
        if (mountedRef.current) {
          setStatus('done');
          setSpeaking(false);
        }
        stopAll();
        return;
      }
      const ch = chs[idx];
      chapterRef.current = idx;

      if (mountedRef.current) {
        setCurrent(idx);
        setElapsed(0);
        onNav && onNav(ch.nav);
        setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 300);
        runChapterAction(ch.id);
      }

      synthRef.current?.cancel();
      const utt = new SpeechSynthesisUtterance(cleanForSpeech(ch.narration));
      utt.rate = 1.2;
      utt.pitch = 1.0;
      utt.volume = 1.0;

      const doSpeak = () => {
        const voice = getVoice();
        if (voice) utt.voice = voice;
        utt.onstart = () => {
          if (!mountedRef.current) return;
          setSpeaking(true);
          clearInterval(timerRef.current);
          timerRef.current = setInterval(() => {
            if (!playingRef.current) return;
            setElapsed((e) => e + 1);
            setTotalElapsed((e) => e + 1);
          }, 1000);
        };
        utt.onend = () => {
          if (!mountedRef.current) return;
          clearInterval(timerRef.current);
          setSpeaking(false);
          setTimeout(() => {
            if (!playingRef.current || !mountedRef.current) return;
            speakChapter(chapterRef.current + 1, chs);
          }, 800);
        };
        utt.onerror = () => {
          if (mountedRef.current) {
            setSpeaking(false);
            setStatus('paused');
          }
        };
        synthRef.current.speak(utt);
      };

      const voices = synthRef.current.getVoices();
      if (voices.length > 0) doSpeak();
      else {
        synthRef.current.onvoiceschanged = () => {
          synthRef.current.onvoiceschanged = null;
          doSpeak();
        };
        setTimeout(doSpeak, 350);
      }
    },
    [onNav, stopAll, runChapterAction]
  );

  const play = useCallback(() => {
    if (!chapters.length) return;
    playingRef.current = true;
    setStatus('playing');
    speakChapter(current, chapters);
  }, [chapters, current, speakChapter]);
  const pause = useCallback(() => {
    synthRef.current?.pause();
    clearInterval(timerRef.current);
    playingRef.current = false;
    setSpeaking(false);
    setStatus('paused');
  }, []);
  const resume = useCallback(() => {
    synthRef.current?.resume();
    playingRef.current = true;
    setStatus('playing');
    timerRef.current = setInterval(() => {
      if (!playingRef.current) return;
      setElapsed((e) => e + 1);
      setTotalElapsed((e) => e + 1);
    }, 1000);
  }, []);
  const restart = useCallback(() => {
    stopAll();
    setCurrent(0);
    setElapsed(0);
    setTotalElapsed(0);
    setStatus('ready');
  }, [stopAll]);
  const jumpTo = useCallback(
    (idx) => {
      stopAll();
      setCurrent(idx);
      setElapsed(0);
      setStatus('paused');
      onNav && onNav(chapters[idx]?.nav);
    },
    [chapters, stopAll, onNav]
  );

  // Drag
  const onMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('[data-nodrag]')) return;
    setDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
    };
    e.preventDefault();
  };
  const onMouseMove = (e) => {
    if (!dragging) return;
    setPos({
      x: dragRef.current.origX + e.clientX - dragRef.current.startX,
      y: dragRef.current.origY + e.clientY - dragRef.current.startY,
    });
  };
  const onMouseUp = () => setDragging(false);

  if (!open) return null;

  const ch = chapters[current];
  const totalDur = chapters.reduce((s, c) => s + c.duration, 0);
  const chapPct = ch
    ? Math.min(100, Math.round((elapsed / ch.duration) * 100))
    : 0;
  const totalPct = Math.min(100, Math.round((totalElapsed / totalDur) * 100));
  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <>
      <style>{`
        @keyframes dnPulse { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(1.6);opacity:0} }
        @keyframes dnSlideDown { from{transform:translateX(-50%) translateY(-16px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
      `}</style>

      <div
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        style={{
          position: 'fixed',
          top: pos.y,
          left: pos.x === 0 ? '50%' : pos.x,
          transform: pos.x === 0 ? 'translateX(-50%)' : 'none',
          zIndex: 500,
          background:
            'linear-gradient(135deg,rgba(15,23,42,0.97),rgba(30,27,75,0.97))',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(139,92,246,0.3)',
          borderRadius: 16,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          padding: minimised ? '10px 16px' : '14px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: minimised ? 0 : 10,
          minWidth: minimised ? 'auto' : 560,
          maxWidth: minimised ? 'auto' : 700,
          cursor: dragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          transition: 'padding 0.2s, min-width 0.2s',
          animation: 'dnSlideDown 0.3s ease',
        }}
      >
        {/* Header row */}
        <div
          onMouseDown={onMouseDown}
          style={{ display: 'flex', alignItems: 'center', gap: 12 }}
        >
          {!minimised ? (
            <MiniZOVA speaking={speaking} />
          ) : (
            <div
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                background: speaking
                  ? '#8b5cf6'
                  : status === 'playing'
                  ? '#7c3aed'
                  : '#334155',
                boxShadow: speaking ? '0 0 8px rgba(139,92,246,0.6)' : 'none',
                transition: 'all 0.3s',
              }}
            >
              {speaking ? '🎙' : status === 'playing' ? '▶' : '⏸'}
            </div>
          )}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 2,
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  fontFamily: 'monospace',
                  letterSpacing: 3,
                  color: '#7c3aed',
                }}
              >
                ZOVA NARRATING
              </span>
              {status === 'playing' && (
                <span
                  style={{
                    fontSize: 9,
                    color: '#16A34A',
                    fontFamily: 'monospace',
                  }}
                >
                  ● LIVE
                </span>
              )}
              {status === 'paused' && (
                <span
                  style={{
                    fontSize: 9,
                    color: '#D97706',
                    fontFamily: 'monospace',
                  }}
                >
                  ⏸ PAUSED
                </span>
              )}
              {status === 'done' && (
                <span
                  style={{
                    fontSize: 9,
                    color: '#2563EB',
                    fontFamily: 'monospace',
                  }}
                >
                  ✓ COMPLETE
                </span>
              )}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
              {ch
                ? `${current + 1}/${chapters.length} — ${ch.label}`
                : 'Ready to narrate'}
            </div>
          </div>
          <div
            data-nodrag
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span
              style={{
                fontSize: 11,
                color: '#475569',
                fontFamily: 'monospace',
              }}
            >
              {fmt(totalElapsed)} / {fmt(totalDur)}
            </span>
            <button
              onClick={() => setMinimised((m) => !m)}
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#94A3B8',
                fontSize: 12,
                cursor: 'pointer',
                padding: '3px 8px',
                borderRadius: 6,
              }}
            >
              {minimised ? '⬆' : '⬇'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#475569',
                fontSize: 16,
                cursor: 'pointer',
                padding: '2px 6px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {!minimised && (
          <>
            {/* Progress bars */}
            <div>
              <div
                style={{
                  height: 3,
                  background: 'rgba(255,255,255,0.08)',
                  borderRadius: 2,
                  overflow: 'hidden',
                  marginBottom: 5,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${chapPct}%`,
                    background: '#8b5cf6',
                    borderRadius: 2,
                    transition: 'width 0.5s linear',
                  }}
                />
              </div>
              <div
                style={{
                  height: 2,
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 1,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${totalPct}%`,
                    background: 'linear-gradient(90deg,#2563EB,#8b5cf6)',
                    borderRadius: 1,
                    transition: 'width 0.5s linear',
                  }}
                />
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <ChapterDots
                chapters={chapters}
                current={current}
                onJump={jumpTo}
              />
              <div style={{ flex: 1 }} />
              <button
                onClick={() => {
                  stopAll();
                  speakChapter(Math.max(0, current - 1), chapters);
                  playingRef.current = true;
                  setStatus('playing');
                }}
                disabled={current === 0}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  color: '#94A3B8',
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  opacity: current === 0 ? 0.35 : 1,
                }}
              >
                ⏮
              </button>
              {status === 'ready' || status === 'done' ? (
                <button
                  onClick={status === 'done' ? restart : play}
                  style={{
                    background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 15,
                    cursor: 'pointer',
                    padding: '8px 20px',
                    fontWeight: 600,
                    boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                  }}
                >
                  {status === 'done' ? '↺ Restart' : '▶ Start Demo'}
                </button>
              ) : status === 'playing' ? (
                <button
                  onClick={pause}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 15,
                    cursor: 'pointer',
                    padding: '8px 20px',
                    fontWeight: 600,
                  }}
                >
                  ⏸ Pause
                </button>
              ) : (
                <button
                  onClick={resume}
                  style={{
                    background: 'linear-gradient(135deg,#7c3aed,#5b21b6)',
                    border: 'none',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 15,
                    cursor: 'pointer',
                    padding: '8px 20px',
                    fontWeight: 600,
                    boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                  }}
                >
                  ▶ Resume
                </button>
              )}
              <button
                onClick={() => {
                  stopAll();
                  const n = Math.min(chapters.length - 1, current + 1);
                  speakChapter(n, chapters);
                  playingRef.current = true;
                  setStatus('playing');
                }}
                disabled={current >= chapters.length - 1}
                style={{
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 8,
                  color: '#94A3B8',
                  fontSize: 14,
                  cursor: 'pointer',
                  padding: '6px 12px',
                  opacity: current >= chapters.length - 1 ? 0.35 : 1,
                }}
              >
                ⏭
              </button>
              <button
                onClick={restart}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  color: '#475569',
                  fontSize: 12,
                  cursor: 'pointer',
                  padding: '6px 10px',
                }}
              >
                ↺
              </button>
            </div>

            {/* Narration preview */}
            {ch && (
              <div
                style={{
                  fontSize: 10,
                  color: '#475569',
                  fontStyle: 'italic',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  paddingTop: 8,
                  lineHeight: 1.5,
                }}
              >
                "{ch.narration.slice(0, 90)}
                {ch.narration.length > 90 ? '...' : ''}"
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
