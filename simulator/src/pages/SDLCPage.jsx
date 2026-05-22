import { useState, useRef, useCallback, useEffect } from 'react';
import { C } from '../config/theme.js';
import { Lbl } from '../components/atoms.jsx';
import { ITSM, METRICS, CUSTOMER } from '../data/customer/loader.js';

// ── Inline markdown renderer ──────────────────────────────────
function renderMD(md) {
  if (!md) return '';
  return md
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(
      /^### (.+)$/gm,
      "<h3 style='font-size:13px;font-weight:700;color:#0F172A;margin:12px 0 4px'>$1</h3>"
    )
    .replace(
      /^## (.+)$/gm,
      "<h2 style='font-size:15px;font-weight:700;color:#0F172A;border-bottom:1px solid #E2E8F0;padding-bottom:4px;margin:16px 0 6px'>$1</h2>"
    )
    .replace(
      /^# (.+)$/gm,
      "<h1 style='font-size:18px;font-weight:800;color:#0F172A;margin:0 0 12px'>$1</h1>"
    )
    .replace(
      /```[\w]*\n?([\s\S]*?)```/gm,
      "<pre style='background:#1E293B;color:#E2E8F0;padding:12px 14px;border-radius:7px;font-size:11px;font-family:monospace;overflow-x:auto;margin:10px 0;line-height:1.6'>$1</pre>"
    )
    .replace(
      /`([^`]+)`/g,
      "<code style='background:#F1F5F9;color:#7C3AED;padding:2px 5px;border-radius:4px;font-size:11px;font-family:monospace'>$1</code>"
    )
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /^---$/gm,
      "<hr style='border:none;border-top:1px solid #E2E8F0;margin:12px 0'/>"
    )
    .replace(/^\| (.+) \|$/gm, (_, row) => {
      const cells = row.split(' | ').map((c) => c.trim());
      return `<tr>${cells
        .map(
          (c) =>
            `<td style='padding:5px 10px;border:1px solid #E2E8F0;font-size:11px'>${c}</td>`
        )
        .join('')}</tr>`;
    })
    .replace(
      /(<tr>[\s\S]*?<\/tr>)/g,
      "<table style='border-collapse:collapse;width:100%;margin:8px 0'>$1</table>"
    )
    .replace(
      /^[-*] (.+)$/gm,
      "<li style='font-size:12px;color:#475569;margin:3px 0;line-height:1.6'>$1</li>"
    )
    .replace(
      /^\d+\. (.+)$/gm,
      "<li style='font-size:12px;color:#475569;margin:3px 0;line-height:1.6'>$1</li>"
    )
    .replace(
      /(<li[\s\S]*?<\/li>\n?)+/g,
      (m) => `<ul style='padding-left:18px;margin:6px 0'>${m}</ul>`
    )
    .replace(/\n\n/g, '<br/>')
    .replace(/\n/g, '<br/>');
}

// ── Markdown modal ────────────────────────────────────────────
function MarkdownModal({ title, content, onClose }) {
  const [raw, setRaw] = useState(false);
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 14,
          width: '100%',
          maxWidth: 780,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#F8FAFC',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 16 }}>📄</span>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
              {title}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['Preview', 'Raw'].map((l, i) => (
              <button
                key={l}
                onClick={() => setRaw(i === 1)}
                style={{
                  padding: '4px 12px',
                  borderRadius: 5,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: 'inherit',
                  fontWeight: raw === !!i ? 600 : 400,
                  background:
                    raw === !!i ? 'rgba(37,99,235,0.1)' : 'transparent',
                  color: raw === !!i ? '#2563EB' : '#94A3B8',
                }}
              >
                {l}
              </button>
            ))}
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = URL.createObjectURL(
                  new Blob([content], { type: 'text/markdown' })
                );
                a.download = `${title.replace(/\s+/g, '-').toLowerCase()}.md`;
                a.click();
              }}
              style={{
                padding: '4px 12px',
                borderRadius: 5,
                border: '1px solid #E2E8F0',
                background: '#fff',
                fontSize: 11,
                cursor: 'pointer',
                color: '#64748B',
                fontFamily: 'inherit',
              }}
            >
              ⬇ .md
            </button>
            <button
              onClick={onClose}
              style={{
                padding: '4px 10px',
                borderRadius: 5,
                border: 'none',
                background: 'rgba(0,0,0,0.06)',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {raw ? (
            <pre
              style={{
                fontSize: 11,
                fontFamily: 'monospace',
                color: '#475569',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.7,
              }}
            >
              {content}
            </pre>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: renderMD(content) }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── File upload ───────────────────────────────────────────────
function FileUpload({ onFile, file }) {
  const ref = useRef(null);
  const [drag, setDrag] = useState(false);
  const handle = useCallback(
    async (f) => {
      if (!f) return;
      const ext = f.name.split('.').pop().toLowerCase();
      if (ext === 'md' || ext === 'txt') {
        onFile({ name: f.name, content: await f.text(), type: 'md' });
      } else if (ext === 'docx') {
        try {
          const buf = await f.arrayBuffer();
          const str = new TextDecoder('utf-8', { fatal: false }).decode(
            new Uint8Array(buf)
          );
          const words =
            str.match(/[a-zA-Z0-9][^\x00-\x1F\x7F-\x9F<>{}]{2,}/g) || [];
          onFile({
            name: f.name,
            content: words.join(' ').replace(/\s+/g, ' ').trim(),
            type: 'docx',
          });
        } catch {
          onFile({
            name: f.name,
            content: '(Could not extract text)',
            type: 'docx',
          });
        }
      }
    },
    [onFile]
  );
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        handle(e.dataTransfer.files[0]);
      }}
      style={{
        border: `2px dashed ${drag ? '#2563EB' : '#CBD5E1'}`,
        borderRadius: 10,
        padding: '16px 20px',
        cursor: 'pointer',
        textAlign: 'center',
        background: drag ? 'rgba(37,99,235,0.04)' : '#FAFAFA',
        transition: 'all 0.2s',
      }}
    >
      <input
        ref={ref}
        type="file"
        accept=".md,.txt,.docx"
        style={{ display: 'none' }}
        onChange={(e) => handle(e.target.files[0])}
      />
      {file ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>
            {file.type === 'docx' ? '📘' : '📝'}
          </span>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>
              {file.name}
            </div>
            <div style={{ fontSize: 11, color: '#64748B' }}>
              {file.content.length.toLocaleString()} chars · click to change
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              color: C.GREEN,
              fontWeight: 600,
              background: 'rgba(22,163,74,0.1)',
              border: '1px solid rgba(22,163,74,0.2)',
              borderRadius: 5,
              padding: '2px 8px',
            }}
          >
            ✓ Loaded
          </span>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 22, marginBottom: 6 }}>📄</div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: '#0F172A',
              marginBottom: 3,
            }}
          >
            Upload Requirements Document
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>
            Drop <strong>.md</strong> or <strong>.docx</strong> · or click to
            browse
          </div>
        </>
      )}
    </div>
  );
}

// ── Triggers ──────────────────────────────────────────────────
const TRIGGERS = [
  {
    id: 'problem',
    type: 'Problem Record',
    icon: '🔁',
    color: '#DC2626',
    ref: 'PRB-AG-00018',
    changeRef: 'CHG-8821',
    title: 'JVM Heap Exhaustion (Recurring)',
    desc: 'DicomReceiverThread.java object lifecycle leak · 2 P1 incidents in 18 hours',
    nature: 'Defect Fix — Reactive',
    badge: 'DEFECT FIX',
  },
  {
    id: 'service-request',
    type: 'Service Request',
    icon: '📋',
    color: '#2563EB',
    ref: 'SR-AG-00142',
    changeRef: 'CHG-8847',
    title: 'Agregation of study history API',
    desc: 'New REST endpoint aggregating multi-modality study history across the Legacy estate for Records integration',
    nature: 'New Capability — Proactive',
    badge: 'NEW FEATURE',
  },
  {
    id: 'change',
    type: 'Change Request',
    icon: '🔄',
    color: '#D97706',
    ref: 'CHG-AG-00089',
    changeRef: 'CHG-8863',
    title: 'SAP Cloud ALM — Custom ZeroOps Alert Rule Engine',
    desc: 'Develop custom ABAP alert rule library feeding ZeroOps with SAP-specific signals: WP saturation thresholds, batch SLA breach patterns, MDG queue anomalies',
    nature: 'Planned Change — Scheduled',
    badge: 'PLANNED CHANGE',
  },
  {
    id: 'open',
    type: 'Custom Requirement',
    icon: '📤',
    color: '#0891B2',
    ref: 'REQ-CUSTOM',
    changeRef: 'CHG-AUTO',
    title: 'Upload Your Own Requirements',
    desc: 'Drop any .md or .docx requirements document — the pipeline reads it, reasons through it, and generates full SDLC artefacts',
    nature: 'Open — Document Driven',
    badge: 'OPEN PIPELINE',
    isOpen: true,
  },
];

// ── Agent definitions with reasoning steps ────────────────────
const AGENTS = [
  {
    id: 'req',
    label: 'Requirements Agent',
    icon: '📋',
    color: '#7C3AED',
    role: 'Reads trigger document · extracts requirements · structures user story and acceptance criteria',
    thinking: (tr) => [
      { type: 'read', msg: `Reading ${tr.type}: ${tr.ref}` },
      { type: 'read', msg: 'Loading uploaded requirements document…' },
      {
        type: 'think',
        msg: 'Identifying functional requirements from document…',
      },
      {
        type: 'think',
        msg: 'Extracting non-functional requirements and constraints…',
      },
      {
        type: 'decide',
        msg: 'Structuring acceptance criteria — making each condition measurable',
      },
      { type: 'decide', msg: 'Flagging scope boundaries and assumptions' },
      {
        type: 'output',
        msg: 'Requirements Specification generated → streaming to output panel',
      },
    ],
    prompt: (
      doc,
      tr
    ) => `You are a senior requirements analyst for an enterprise IT AIOps platform.

${
  tr.isOpen
    ? `A custom requirements document has been uploaded. Use it as the SOLE source of truth — do not use the trigger reference ${tr.ref} as context. Your output must reflect the uploaded document only.`
    : `A ${tr.type} has been submitted: ${tr.ref} — ${tr.title}`
}

Requirements document:
---
${doc}
---

Write a professional Requirements Specification in markdown. ${
      tr.isOpen
        ? 'Infer the technology context from the document — do not assume enterprise or PACS.'
        : 'Be specific to enterprise PACS, HL7, DICOM, Kubernetes, ServiceNow and Jenkins technology context.'
    } Include:

# Requirements Specification — ${tr.isOpen ? 'Custom Requirement' : tr.ref}

## Executive Summary
(2–3 sentences explaining what and why)

## Functional Requirements
(numbered list — specific, testable)

## Non-Functional Requirements  
(numbered list — performance, security, availability)

## Acceptance Criteria
(numbered list — each must be measurable with a specific threshold)

## Out of Scope

## Assumptions & Dependencies

Keep it concise and actionable. Derive everything from the document — do not invent requirements not present in it.`,
  },
  {
    id: 'design',
    label: 'Design Agent',
    icon: '🎨',
    color: '#2563EB',
    role: 'Analyses requirements · maps impacted components · produces solution design with risk assessment',
    thinking: (tr) => [
      {
        type: 'read',
        msg: 'Loading Requirements Specification from previous step…',
      },
      {
        type: 'think',
        msg: 'Identifying impacted enterprise components and services…',
      },
      { type: 'think', msg: 'Assessing blast radius and dependency chain…' },
      { type: 'decide', msg: `Risk scoring proposed changes for ${tr.ref}…` },
      { type: 'think', msg: 'Designing technical solution approach…' },
      {
        type: 'decide',
        msg: 'Defining rollback strategy and change window estimate',
      },
      {
        type: 'output',
        msg: 'Solution Design Document generated → streaming to output panel',
      },
    ],
    prompt: (
      doc,
      tr,
      prev
    ) => `You are a senior solution architect for enterprise HealthCare IT.

Based on these requirements:
---
${prev || doc}
---

Write a professional Solution Design Document in markdown for ${
      tr.ref
    }. Be specific to enterprise PACS, HL7, DICOM, Kubernetes, Jenkins and ServiceNow context. Include real technical detail — component names, config keys, API calls.

# Solution Design — ${tr.ref}

## Approach Summary
(2–3 sentences — what we are doing and how)

## Impacted Components
(table: Component | Change Required | Risk Level)

## Technical Design
(key decisions with rationale — include specific config, code snippets or commands where helpful)

## Risk Assessment
(table: Risk | Likelihood | Impact | Mitigation)

## Rollback Strategy
(specific steps — kubectl commands or Ansible if applicable)

## Change Window Estimate
(duration and timing)`,
  },
  {
    id: 'build',
    label: 'Build Agent',
    icon: '🔨',
    color: '#D97706',
    role: 'Generates code and config changes · writes tests · raises ServiceNow change record',
    thinking: (tr) => [
      { type: 'read', msg: 'Loading Solution Design from previous step…' },
      { type: 'think', msg: 'Identifying files and components to change…' },
      {
        type: 'output',
        msg: 'Generating code changes with specific line references…',
      },
      { type: 'think', msg: 'Writing unit and integration test cases…' },
      {
        type: 'decide',
        msg: `Calculating risk score for ${tr.changeRef} change record…`,
      },
      {
        type: 'decide',
        msg: 'Determining CAB requirement based on risk threshold',
      },
      {
        type: 'output',
        msg: 'Build Specification generated → streaming to output panel',
      },
    ],
    prompt: (
      doc,
      tr,
      prev
    ) => `You are a senior software engineer for enterprise HealthCare IT.

Based on this solution design:
---
${prev || doc}
---

Write a professional Build Specification in markdown for ${
      tr.ref
    }. Include real code, real file names, real kubectl and Ansible commands. Use enterprise PACS, HL7, DICOM, Kubernetes and Jenkins context throughout.

# Build Specification — ${tr.ref}

## Deliverables
(list all artefacts to produce — files, configs, scripts, change records)

## Code Changes
(specific file names, function names, what changes — with code blocks)

## Configuration Changes
(YAML, ConfigMaps, environment variables — with actual values)

## Test Cases
(unit and integration tests — with specific test method names and assertions)

## ServiceNow Change Record
(type, risk score 0–100, CAB required yes/no, justification)

## Jenkins Pipeline
(actual pipeline stages with shell commands in code blocks)`,
  },
  {
    id: 'test',
    label: 'Test Agent',
    icon: '🧪',
    color: '#0891b2',
    role: 'Generates test plan · defines pass/fail criteria · produces sign-off checklist',
    thinking: (tr) => [
      { type: 'read', msg: 'Loading Build Specification from previous step…' },
      {
        type: 'think',
        msg: 'Identifying all test scenarios from build deliverables…',
      },
      {
        type: 'think',
        msg: 'Defining unit, integration and regression test cases…',
      },
      {
        type: 'decide',
        msg: 'Setting measurable pass/fail criteria for each test…',
      },
      { type: 'think', msg: 'Estimating test environment requirements…' },
      {
        type: 'output',
        msg: 'Test Plan generated → streaming to output panel',
      },
    ],
    prompt: (
      doc,
      tr,
      prev
    ) => `You are a senior QA engineer for enterprise HealthCare IT.

Based on this build specification:
---
${prev || doc}
---

Write a professional Test Plan in markdown for ${
      tr.ref
    }. Include specific test case names, commands and pass criteria relevant to enterprise PACS, HL7, DICOM and Kubernetes.

# Test Plan — ${tr.ref}

## Test Strategy
(approach, environments, tools)

## Unit Test Cases
(table: Test ID | Test Name | Scenario | Expected Result)

## Integration Test Cases  
(table: Test ID | Test Name | Scenario | Expected Result)

## Regression Scope
(what existing tests must pass)

## Performance / Load Criteria
(specific metrics with thresholds)

## Pass/Fail Criteria
(clear PASS and FAIL definitions)

## Sign-Off Checklist
(numbered checklist — each item a specific verifiable condition)`,
  },
  {
    id: 'deploy',
    label: 'Release Agent',
    icon: '🚀',
    color: '#16A34A',
    role: 'Compiles deployment runbook · configures Jenkins pipeline · monitors handoff',
    isHandoff: true,
    thinking: (tr) => [
      { type: 'read', msg: 'Loading Test Plan from previous step…' },
      {
        type: 'think',
        msg: 'Compiling pre-deployment checklist from all prior steps…',
      },
      { type: 'output', msg: 'Generating step-by-step deployment runbook…' },
      { type: 'think', msg: 'Configuring Jenkins pipeline stages…' },
      { type: 'decide', msg: 'Defining automated rollback triggers…' },
      {
        type: 'decide',
        msg: `Preparing ${ITSM} closure procedure for ${tr.ref}`,
      },
      {
        type: 'output',
        msg: `⚡ Handoff to Jenkins · control passed to enterprise release management`,
      },
    ],
    prompt: (
      doc,
      tr,
      prev
    ) => `You are a senior release engineer for enterprise HealthCare IT.

Based on this test plan:
---
${prev || doc}
---

Write a professional Deployment Runbook in markdown for ${
      tr.ref
    }. Include specific kubectl, Ansible and HL7 commands. The CI/CD system is Jenkins. ITSM is ServiceNow.

# Deployment Runbook — ${tr.ref}

## Pre-Deployment Checklist
(numbered list — each item a specific verifiable check with command or verification step)

## Deployment Steps
(numbered — each step with actual commands in code blocks)

## Jenkins Pipeline Configuration
(complete Groovy pipeline with all stages)

## Post-Deployment Validation
(specific health checks with exact pass criteria and commands)

## Rollback Procedure
(step-by-step with commands — including automatic trigger conditions)

## ServiceNow Closure
(exact steps to close ${tr.ref} and ${tr.changeRef} with work note template)`,
  },
];

// ── Thinking indicator entry ──────────────────────────────────
function ThinkEntry({ step, visible }) {
  const styles = {
    read: { color: '#2563EB', icon: '📖', bg: 'rgba(37,99,235,0.06)' },
    think: { color: '#7C3AED', icon: '💭', bg: 'rgba(124,58,237,0.06)' },
    decide: { color: '#D97706', icon: '⚡', bg: 'rgba(217,119,6,0.06)' },
    output: { color: '#16A34A', icon: '✍', bg: 'rgba(22,163,74,0.06)' },
  }[step.type] || { color: C.MUTED, icon: '·', bg: 'transparent' };
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: '6px 10px',
        marginBottom: 4,
        borderRadius: 6,
        background: styles.bg,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      <span style={{ fontSize: 13, flexShrink: 0 }}>{styles.icon}</span>
      <span style={{ fontSize: 11, color: styles.color, lineHeight: 1.5 }}>
        {step.msg}
      </span>
    </div>
  );
}

// ── Streaming output panel ────────────────────────────────────
function StreamingOutput({ text, done, color, onView, title }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [text]);
  if (!text)
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: C.MUTED,
          fontSize: 12,
          fontStyle: 'italic',
        }}
      >
        Output will stream here…
      </div>
    );
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 9,
            color: C.MUTED,
            fontFamily: 'monospace',
            letterSpacing: 2,
          }}
        >
          AI-GENERATED OUTPUT {done ? '✓' : '▌'}
        </div>
        {done && onView && (
          <button
            onClick={onView}
            style={{
              fontSize: 10,
              color: '#fff',
              background: color,
              border: 'none',
              borderRadius: 5,
              padding: '3px 10px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontWeight: 600,
            }}
          >
            📄 View full doc
          </button>
        )}
      </div>
      <div
        ref={ref}
        style={{
          flex: 1,
          overflowY: 'auto',
          background: '#fff',
          borderRadius: 8,
          padding: '16px 18px',
          border: `1px solid ${color}22`,
        }}
      >
        <div
          dangerouslySetInnerHTML={{
            __html:
              renderMD(text) +
              (!done
                ? `<span style="color:${color};animation:blink 1s step-end infinite">▌</span>`
                : ''),
          }}
        />
      </div>
    </div>
  );
}

// ── Main SDLCPage ─────────────────────────────────────────────
export default function SDLCPage() {
  const [trigger, setTrigger] = useState(null);
  const [file, setFile] = useState(null);
  const [phase, setPhase] = useState(-1); // active agent index
  const [debugLog, setDebugLog] = useState([]); // diagnostic log
  const [showDebug, setShowDebug] = useState(false);
  const [openAiKey, setOpenAiKey] = useState(''); // OpenAI API key (session only)
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [done, setDone] = useState(false);
  const [paused, setPaused] = useState(false);
  const [viewPhase, setViewPhase] = useState(0); // which phase to show in detail
  const [outputs, setOutputs] = useState({}); // phase id → full text
  const [streaming, setStreaming] = useState(''); // current streaming text
  const [streamDone, setStreamDone] = useState(false);
  const [thoughts, setThoughts] = useState([]); // visible thought indices
  const [modal, setModal] = useState(null);

  const pausedRef = useRef(false);
  const nextPhase = useRef(0);
  const outputsRef = useRef({});
  const timers = useRef([]);
  const abortRef = useRef(null);

  const clear = () => {
    timers.current.forEach((t) => {
      clearTimeout(t);
      clearInterval(t);
    });
    timers.current = [];
    abortRef.current?.abort();
  };

  const addDebug = (msg, level = 'info') => {
    const ts = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setDebugLog((prev) => [...prev.slice(-99), { ts, msg, level }]);
  };

  const reset = (keepTrigger = false) => {
    clear();
    setPhase(-1);
    setDone(false);
    setPaused(false);
    setOutputs({});
    setStreaming('');
    setStreamDone(false);
    setThoughts([]);
    setViewPhase(0);
    setModal(null);
    pausedRef.current = false;
    nextPhase.current = 0;
    outputsRef.current = {};
    if (!keepTrigger) {
      setTrigger(null);
      setFile(null);
    }
  };

  // Stream one agent phase
  const runPhase = async (idx) => {
    if (pausedRef.current || idx >= AGENTS.length) {
      if (idx >= AGENTS.length) {
        setDone(true);
        setPhase(-1);
      }
      return;
    }
    const agent = AGENTS[idx];
    setPhase(idx);
    setViewPhase(idx);
    setStreaming('');
    setStreamDone(false);
    setThoughts([]);
    nextPhase.current = idx;

    // Show thinking steps with delays
    const thinkSteps = agent.thinking(trigger);
    thinkSteps.forEach((_, i) => {
      const t = setTimeout(
        () => setThoughts((prev) => [...prev, i]),
        400 + i * 700
      );
      timers.current.push(t);
    });

    // Build prompt — truncate large files to avoid token limit issues
    const MAX_DOC_CHARS = 6000;
    const rawContent = file?.content || '';
    const trimmedContent =
      rawContent.length > MAX_DOC_CHARS
        ? rawContent.slice(0, MAX_DOC_CHARS) +
          '\n\n[... document truncated for processing ...]'
        : rawContent;
    const docContent = trimmedContent
      ? `${
          trigger.isOpen
            ? ''
            : `Trigger: ${trigger.type} ${trigger.ref} — ${trigger.title}\n\n`
        }${trimmedContent}`
      : `${trigger.type}: ${trigger.ref}\n${trigger.title}\n${trigger.desc}`;
    const prevOutput = outputsRef.current[AGENTS[idx - 1]?.id] || '';
    const prompt = agent.prompt(docContent, trigger, prevOutput);

    // Start streaming after thinking delay
    const streamDelay = Math.min(thinkSteps.length * 700 + 400, 4000);
    await new Promise((r) => {
      const t = setTimeout(r, streamDelay);
      timers.current.push(t);
    });
    if (pausedRef.current) return;
    addDebug(`[${agent.label}] thinking complete, starting output`);

    // ── API routing ──────────────────────────────────────────────
    // Open trigger  → OpenAI GPT-4o (user's key, document-driven)
    // Fixed triggers → Anthropic Claude (proxy handles auth)
    let fullText = '';

    const callOpenAI = async (userPrompt) => {
      if (!openAiKey) throw new Error('No OpenAI key — click 🔑 to add');
      addDebug(`[${agent.label}] calling OpenAI GPT-4o…`);
      const ctrl = new AbortController();
      const tmoId = setTimeout(() => ctrl.abort(), 30000);
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        signal: ctrl.signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 1600,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      clearTimeout(tmoId);
      addDebug(
        `[${agent.label}] OpenAI HTTP ${res.status}`,
        res.ok ? 'success' : 'error'
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || `HTTP ${res.status}`);
      return data.choices?.[0]?.message?.content || '';
    };

    const callAnthropic = async (userPrompt) => {
      addDebug(`[${agent.label}] calling Anthropic Claude…`);
      const ctrl = new AbortController();
      const tmoId = setTimeout(() => ctrl.abort(), 15000);
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1400,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      });
      clearTimeout(tmoId);
      addDebug(
        `[${agent.label}] Anthropic HTTP ${res.status}`,
        res.ok ? 'success' : 'error'
      );
      const data = await res.json();
      const text = data.content?.find((b) => b.type === 'text')?.text || '';
      if (!text) throw new Error('empty response');
      return text;
    };

    try {
      if (trigger.isOpen) {
        // Custom Requirement — OpenAI only
        fullText = await callOpenAI(prompt);
      } else {
        // Fixed triggers — Anthropic (fallback to OpenAI if blocked)
        try {
          fullText = await callAnthropic(prompt);
        } catch (anthErr) {
          addDebug(
            `[${agent.label}] Anthropic unavailable (${anthErr?.message}) — trying OpenAI`,
            'warn'
          );
          fullText = openAiKey ? await callOpenAI(prompt) : '';
        }
      }
      if (!fullText) throw new Error('empty response');
      addDebug(`[${agent.label}] API OK — ${fullText.length} chars`, 'success');
    } catch (err) {
      addDebug(
        `[${agent.label}] API error: ${
          err?.message || err
        } — using local fallback`,
        'warn'
      );
      try {
        fullText =
          buildFallback(agent.id, trigger, prevOutput, docContent) || '';
        addDebug(
          `[${agent.label}] local fallback built (${fullText.length} chars)`
        );
      } catch (fbErr) {
        addDebug(
          `[${agent.label}] fallback error: ${fbErr?.message} — using safety net`,
          'error'
        );
      }
    }

    // Absolute safety net — never let fullText be empty
    if (!fullText) {
      addDebug(`[${agent.label}] safety net triggered`, 'error');
      fullText = `# ${agent.label}\n\nOutput for ${trigger.ref} — ${trigger.title}\n\nProcessing complete. Please check diagnostic log for errors.`;
    }
    addDebug(`[${agent.label}] streaming ${fullText.length} chars…`);

    // Simulate streaming — always runs
    if (!pausedRef.current) {
      const CHUNK = 6,
        DELAY = 18;
      setStreaming('');
      for (let i = CHUNK; i <= fullText.length + CHUNK; i += CHUNK) {
        if (pausedRef.current) break;
        setStreaming(fullText.slice(0, i));
        await new Promise((r) => {
          const t = setTimeout(r, DELAY);
          timers.current.push(t);
        });
      }
    }

    if (!pausedRef.current) {
      setStreaming(fullText);
      setStreamDone(true);
      outputsRef.current = { ...outputsRef.current, [agent.id]: fullText };
      setOutputs((prev) => ({ ...prev, [agent.id]: fullText }));
      addDebug(`[${agent.label}] complete ✓`, 'success');
      await new Promise((r) => {
        const t = setTimeout(r, 1200);
        timers.current.push(t);
      });
      runPhase(idx + 1);
    }
  };

  // Fallback output when API unavailable — unique content per step per trigger
  const buildFallback = (stepId, tr, prev, docContent) => {
    // If real document content available, generate fallback that references it
    const hasDoc = docContent && docContent.length > 80;
    const docPreview = hasDoc ? docContent.slice(0, 300) : null;
    const ctx =
      {
        problem: {
          component: 'DicomReceiverThread.java',
          system: 'PACS IMPAX/EI',
          fix: 'Add dataset.clear() + null assignment in finally block',
          risk: '18/100 — Low · surgical fix · no API changes',
          cmd: 'kubectl rollout restart deployment/pacs-app',
          test: 'Heap stable < 40% after 72h · 0 OOM kills · 847 regression tests',
          deploy:
            'Rolling restart · maxUnavailable=0 · rollback via kubectl rollout undo',
        },
        'service-request': {
          component: 'HL7 Gateway',
          system: 'HL7 ADT/ORM message routing',
          fix: 'New HL7 listener port 2575 · AE title SF7_PACS · TLS 1.3 · routing rules for ADT/ORM/ORU',
          risk: '24/100 — Medium · new addition · existing routes unchanged',
          cmd: 'ansible-playbook deploy-hl7-site7.yml',
          test: '42 HL7 test messages · ADT 18/18 · ORM 14/14 · ORU 10/10 · Sites 1–6 unaffected',
          deploy:
            'Ansible playbook · Saturday 02:00–04:00 change window · CAB Friday 14:00',
        },
        change: {
          component: 'DICOM Router',
          system: 'DICOM AE title routing engine',
          fix: 'Upgrade v3.4.1→v3.5.0 · AE title migration · TLS cert renewal · CVE-2024-9812 patch',
          risk: '31/100 — Medium · service restart required · CAB needed',
          cmd: 'kubectl set image deployment/dicom-router dicom-router=3.5.0',
          test: '47 AE titles preserved · 120 DICOM studies routed correctly · CVE scan clean',
          deploy:
            'Saturday 02:00–02:15 · transit drain first · rollback in 4 min if errors detected',
        },
      }[tr.id] || {};

    // For open trigger with real doc — extract title from first heading or filename
    const openTitle =
      tr.isOpen && hasDoc
        ? docContent.match(/^#\s+(.+)$/m)?.[1] || tr.title
        : tr.title;
    const openRef = tr.isOpen ? 'CUSTOM-REQ' : tr.ref;

    // For open trigger, redirect to open_ prefixed keys that use docContent
    const contentKey = tr.isOpen ? `open_${stepId}` : stepId;
    const CONTENT = {
      req: `# Requirements Specification — ${tr.ref}

## Executive Summary
${tr.title} requires a controlled change to ${ctx.system}. This specification defines the functional requirements, acceptance criteria and constraints for ${tr.changeRef}.

## Functional Requirements
1. Implement ${ctx.fix}
2. Raise ServiceNow change record ${tr.changeRef} linked to ${tr.ref}
3. Execute zero-downtime deployment via Jenkins pipeline
4. Validate all affected systems post-deployment
5. Update KEDB and close ${tr.ref} in ServiceNow

## Non-Functional Requirements
1. Zero service interruption to hospital sites during deployment
2. Rollback achievable in under 5 minutes
3. Change risk score documented and within approved threshold
4. All test cases pass before production deployment

## Acceptance Criteria
1. ${ctx.test}
2. No regression failures in existing functionality
3. ${tr.changeRef} deployed successfully to production
4. ${tr.ref} closed in ServiceNow within 24h of go-live
5. Post-deployment monitoring shows no anomalies for 72h

## Out of Scope
- Changes to hospital site network configuration
- Modifications to unrelated enterprise platform components
- User training or documentation beyond runbook

## Assumptions & Dependencies
- Jenkins pipeline has appropriate permissions for target namespace
- ServiceNow change management workflow active
- Test environment available and representative of production`,

      design: `# Solution Design — ${tr.ref}

## Approach Summary
The solution addresses ${tr.ref} by applying ${
        ctx.fix
      }. The approach minimises blast radius, maintains zero downtime and uses the existing Kubernetes rolling update mechanism with automated rollback.

## Impacted Components

| Component | Change | Risk |
| ${ctx.component} | ${ctx.fix} | ${ctx.risk} |
| ServiceNow | ${tr.changeRef} raised and tracked | None |
| Jenkins | Pipeline stage added for deployment | Low |
| Kubernetes | Rolling update with health checks | Low |

## Technical Design
**Primary change**: ${ctx.fix}

The implementation uses a rolling update strategy: \`${ctx.cmd}\`

All existing functionality is preserved. The change is scoped to ${
        ctx.component
      } only.

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| Deployment fails | Low | Medium | Automated rollback on health check failure |
| Performance regression | Very Low | Low | Load test in staging before production |
| Rollback needed | Low | Low | ${ctx.deploy} |

## Rollback Strategy
Automated trigger: if health check fails post-deploy, Jenkins executes rollback within 60 seconds.
Manual: \`kubectl rollout undo deployment/$(echo "${ctx.component
        .toLowerCase()
        .replace(/\s/g, '-')}")\`

## Change Window Estimate
Deployment: ~15 minutes · Validation: ~10 minutes · Total window: 30 minutes`,

      build: `# Build Specification — ${tr.ref}

## Deliverables
1. Code/config change for ${ctx.component}
2. Unit and integration test suite
3. Jenkins pipeline configuration
4. ServiceNow change record ${tr.changeRef}
5. Deployment runbook (generated at Deploy phase)

## Code Changes
\`\`\`
Component: ${ctx.component}
Change:    ${ctx.fix}
\`\`\`

## Configuration Changes
\`\`\`yaml
# Kubernetes deployment patch
spec:
  strategy:
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
\`\`\`

## Test Cases
1. **Functional test** — verify ${ctx.fix} works as expected
2. **Regression test** — confirm no existing functionality broken
3. **Load test** — validate under production-equivalent load
4. **Rollback test** — confirm rollback executes in under 5 min

## ServiceNow Change Record
- Type: Standard Change
- Risk Score: ${ctx.risk.split('·')[0].trim()}
- CAB Required: ${parseInt(ctx.risk) > 25 ? 'Yes' : 'No'}
- Reference: ${tr.changeRef}

## Jenkins Pipeline
\`\`\`groovy
pipeline {
  stages {
    stage('Test')   { steps { sh 'mvn test' } }
    stage('Build')  { steps { sh 'docker build -t ${ctx.component
      .toLowerCase()
      .replace(/\s+/g, '-')}:${tr.changeRef} .' } }
    stage('Deploy') { steps { sh '${ctx.cmd}' } }
    stage('Verify') { steps { sh './health-check.sh' } }
  }
  post { failure { sh 'kubectl rollout undo deployment/${ctx.component
    .toLowerCase()
    .replace(/\s+/g, '-')}' } }
}
\`\`\``,

      test: `# Test Plan — ${tr.ref}

## Test Strategy
Three-phase testing: unit tests in CI, integration tests in staging, validation in production post-deploy. All phases must pass before production deployment proceeds.

## Unit Test Cases

| Test ID | Test Name | Expected Result |
| UT-001 | Core functionality test | Primary change works as specified |
| UT-002 | Edge case handling | No errors on boundary conditions |
| UT-003 | Concurrent load test | Stable under peak production load |

## Integration Test Cases

| Test ID | Test Name | Expected Result |
| IT-001 | End-to-end workflow | Full workflow completes without errors |
| IT-002 | Downstream system check | All dependent systems unaffected |
| IT-003 | Rollback test | Rollback completes in under 5 minutes |

## Regression Scope
Full regression suite covering all ${ctx.system} functionality. Any failure blocks production deployment.

## Performance / Load Criteria
- ${ctx.test}
- No latency degradation beyond 10% of baseline
- Zero error rate increase post-deployment

## Pass/Fail Criteria
**PASS**: All unit tests green · All IT tests pass · ${ctx.test} · Regression clean
**FAIL**: Any test failure · Performance regression > 10% · Any rollback failure

## Sign-Off Checklist
1. [ ] UT-001, UT-002, UT-003 all passed
2. [ ] IT-001, IT-002, IT-003 all passed
3. [ ] Regression suite 100% green
4. [ ] Performance targets met
5. [ ] Rollback tested and confirmed < 5 min
6. [ ] ServiceNow ${tr.changeRef} status updated to "Ready for Production"`,

      deploy: `# Deployment Runbook — ${tr.ref}

## Pre-Deployment Checklist
1. Confirm ${tr.changeRef} status: Approved in ServiceNow
2. Verify all test phases passed and signed off
3. Confirm deployment image/package available
4. Verify rollback image retained
5. Confirm change window: ${ctx.deploy.split('·')[0].trim()}
6. Alert on-call team — deployment starting

## Deployment Steps

**Step 1 — Pre-deployment health check**
\`\`\`bash
kubectl get pods -l app=${ctx.component.toLowerCase().replace(/\s+/g, '-')}
kubectl top pods -l app=${ctx.component.toLowerCase().replace(/\s+/g, '-')}
\`\`\`

**Step 2 — Execute deployment**
\`\`\`bash
${ctx.cmd}
kubectl rollout status deployment/${ctx.component
        .toLowerCase()
        .replace(/\s+/g, '-')} --timeout=300s
\`\`\`

**Step 3 — Post-deployment validation**
\`\`\`bash
./post-deploy-validate.sh --ref=${tr.changeRef}
\`\`\`

## Jenkins Pipeline Configuration
\`\`\`groovy
pipeline {
  stages {
    stage('Pre-checks') { steps { sh './pre-deploy-checks.sh' } }
    stage('Deploy')     { steps { sh '${ctx.cmd}' } }
    stage('Validate')   { steps { sh './health-check.sh --strict' } }
    stage('Notify')     { steps { sh './notify-servicenow.sh ${
      tr.changeRef
    } COMPLETE' } }
  }
  post { failure { sh 'kubectl rollout undo deployment/${ctx.component
    .toLowerCase()
    .replace(/\s+/g, '-')}' } }
}
\`\`\`

## Post-Deployment Validation
- ${ctx.test}
- Zero error rate in first 30 minutes post-deploy
- All health endpoints returning 200

## Rollback Procedure
\`\`\`bash
kubectl rollout undo deployment/${ctx.component
        .toLowerCase()
        .replace(/\s+/g, '-')}
kubectl rollout status deployment/${ctx.component
        .toLowerCase()
        .replace(/\s+/g, '-')}
\`\`\`
Automated trigger: error rate > 0 within 10 minutes of deploy.

## ServiceNow Closure
1. Update ${tr.changeRef} → Implemented
2. Update ${tr.ref} → Resolved/Closed
3. Add work note: "${
        ctx.fix
      } deployed successfully via Jenkins. Post-deploy validation passed. Monitoring active."
4. Set 72h monitoring review date`,
    };
    // For open trigger — build doc-aware fallback from uploaded content
    if (tr.isOpen) {
      const openTitle = hasDoc
        ? docContent.match(/^#\s+(.+)$/m)?.[1] || tr.title
        : tr.title;
      const lines = hasDoc
        ? docContent
            .split('\n')
            .filter((l) => l.trim().length > 10)
            .slice(0, 8)
        : [];
      const openFallback = {
        req: `# Requirements Specification — CUSTOM-REQ\n\n## Executive Summary\nBased on uploaded document: "${openTitle}".\n\n## Functional Requirements\n${
          lines
            .slice(0, 4)
            .map((l, i) => `${i + 1}. ${l.replace(/^#+\s*/, '').trim()}`)
            .join('\n') || '1. Requirements extracted from uploaded document'
        }\n\n## Non-Functional Requirements\n1. Zero service interruption during implementation\n2. Rollback achievable within 5 minutes\n3. Full audit trail in ServiceNow\n\n## Acceptance Criteria\n1. All stated requirements delivered and tested\n2. No regression in existing functionality\n3. Post-deployment monitoring stable for 72h\n\n## Out of Scope\nItems not explicitly stated in the uploaded document.\n\n## Assumptions\nDocument represents current complete requirements.`,
        design: `# Solution Design — CUSTOM-REQ\n\n## Approach Summary\nDesign derived from uploaded requirements: "${openTitle}". Components, risks and rollback plan defined below.\n\n## Impacted Components\n| Component | Change | Risk |\n|---|---|---|\n| Primary system | Per requirements | Medium |\n| Integration layer | Validate connectivity | Low |\n\n## Technical Design\nImplementation approach based on requirements document. Refer to uploaded specification for detailed context.\n\n## Risk Assessment\n| Risk | Likelihood | Impact | Mitigation |\n|---|---|---|---|\n| Integration failure | Low | Medium | Rollback plan defined |\n\n## Rollback Strategy\n1. Identify failure point\n2. Execute rollback procedure\n3. Validate baseline restored\n\n## Change Window\n4h weekend window recommended`,
        build: `# Build Specification — CUSTOM-REQ\n\n## Deliverables\n- Implementation artefacts per requirements\n- Test evidence bundle\n- ServiceNow change record CHG-AUTO\n\n## Code Changes\nCode changes as specified in requirements document.\n\n## Test Cases\n1. Functional tests against each acceptance criterion\n2. Regression suite — full pass required\n3. Integration validation\n\n## Risk Score\n28/100 — CAB review recommended\n\n## Jenkins Pipeline\nStandard CI/CD pipeline · automated rollback if error rate > 0`,
        test: `# Test Specification — CUSTOM-REQ\n\n## Test Strategy\nFunctional, regression and integration tests derived from acceptance criteria in uploaded document.\n\n## Test Cases\n| ID | Description | Expected | Status |\n|---|---|---|---|\n| TC-01 | Functional requirement validation | Pass | Pending |\n| TC-02 | Integration end-to-end | Pass | Pending |\n| TC-03 | Regression — existing functionality | No change | Pending |\n\n## Pass Criteria\nAll TCs pass · no P1/P2 defects · stakeholder sign-off obtained`,
        deploy: `# Deployment Runbook — CUSTOM-REQ\n\n## Pre-Deployment Checklist\n- [ ] All tests passed\n- [ ] Change record CHG-AUTO approved\n- [ ] Rollback plan confirmed\n\n## Deployment Steps\n1. Notify stakeholders of change window\n2. Execute deployment procedure\n3. Validate post-deployment\n4. Monitor for 72h\n\n## Rollback\nExecute rollback procedure if errors detected within 10 minutes.\n\n## ServiceNow Closure\nClose CHG-AUTO with evidence attached. Set 72h review date.`,
      };
      return (
        openFallback[stepId] ||
        `# ${stepId} output\n\nGenerated from: "${openTitle}"`
      );
    }
    return (
      CONTENT[stepId] || `# ${stepId} — ${tr.ref}\n\nOutput for ${tr.title}`
    );
  };

  const start = () => {
    pausedRef.current = false;
    reset(true);
    setTimeout(() => runPhase(0), 100);
  };

  const pause = () => {
    pausedRef.current = true;
    setPaused(true);
    clear();
  };

  const resume = () => {
    pausedRef.current = false;
    setPaused(false);
    runPhase(nextPhase.current);
  };

  const activeAgent = phase >= 0 ? AGENTS[phase] : null;
  const viewAgent = AGENTS[viewPhase];
  const thinkSteps = viewAgent
    ? viewAgent.thinking(trigger || TRIGGERS[0])
    : [];
  const viewOutput =
    phase === viewPhase ? streaming : outputs[viewAgent?.id] || '';
  const viewDone = phase === viewPhase ? streamDone : !!outputs[viewAgent?.id];
  const isRunning = phase >= 0 && !paused;

  return (
    <div style={{ padding: 22, maxWidth: 1300 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 20,
        }}
      >
        <div>
          <Lbl n="6">AI SDLC</Lbl>
          <div style={{ fontSize: 12, color: C.MUTED, marginTop: 2 }}>
            AI-driven software development lifecycle · agents think and write in
            real time
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* OpenAI key input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {showKeyInput ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="password"
                  value={openAiKey}
                  onChange={(e) => setOpenAiKey(e.target.value)}
                  placeholder="sk-..."
                  style={{
                    padding: '5px 10px',
                    borderRadius: 7,
                    border: `1px solid ${C.BORDER}`,
                    fontSize: 11,
                    fontFamily: 'monospace',
                    width: 200,
                    outline: 'none',
                    background: openAiKey
                      ? 'rgba(22,163,74,0.04)'
                      : 'rgba(255,255,255,1)',
                    borderColor: openAiKey ? 'rgba(22,163,74,0.4)' : C.BORDER,
                  }}
                />
                <button
                  onClick={() => setShowKeyInput(false)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: 7,
                    border: 'none',
                    background: openAiKey
                      ? 'rgba(22,163,74,0.1)'
                      : 'rgba(0,0,0,0.05)',
                    color: openAiKey ? '#16A34A' : '#64748B',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  {openAiKey ? '✓ Set' : '✕'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowKeyInput(true)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 7,
                  cursor: 'pointer',
                  fontSize: 11,
                  border: `1px solid ${
                    openAiKey ? 'rgba(22,163,74,0.4)' : C.BORDER
                  }`,
                  background: openAiKey
                    ? 'rgba(22,163,74,0.08)'
                    : 'rgba(0,0,0,0.03)',
                  color: openAiKey ? '#16A34A' : C.MUTED,
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                }}
              >
                {openAiKey ? '🔑 Key set' : '🔑 Add OpenAI key'}
              </button>
            )}
          </div>

          {/* Debug toggle */}
          <button
            onClick={() => setShowDebug((v) => !v)}
            title="Show diagnostic log"
            style={{
              padding: '6px 10px',
              borderRadius: 7,
              border: `1px solid ${C.BORDER}`,
              background: showDebug
                ? 'rgba(37,99,235,0.1)'
                : 'rgba(0,0,0,0.03)',
              color: showDebug ? '#2563EB' : C.MUTED,
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontWeight: showDebug ? 600 : 400,
            }}
          >
            🔍 {debugLog.length} log{debugLog.length !== 1 ? 's' : ''}
          </button>

          {trigger && !isRunning && !paused && (
            <>
              <button
                onClick={() => reset()}
                style={{
                  padding: '7px 14px',
                  borderRadius: 7,
                  border: `1px solid ${C.BORDER}`,
                  background: '#fff',
                  color: C.MUTED,
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ← Change trigger
              </button>
              {(!trigger.isOpen || !!file) && (
                <button
                  onClick={done ? () => reset(true) : start}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 7,
                    border: 'none',
                    cursor: 'pointer',
                    background: done
                      ? 'rgba(0,0,0,0.06)'
                      : 'linear-gradient(135deg,#16A34A,#2563EB)',
                    color: done ? '#64748B' : '#fff',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'inherit',
                  }}
                >
                  {done ? '↺ Reset' : '▶ Run AI Agents'}
                </button>
              )}
              {trigger.isOpen && !file && (
                <div
                  style={{
                    padding: '7px 14px',
                    borderRadius: 7,
                    background: 'rgba(8,145,178,0.08)',
                    border: '1px dashed #0891B2',
                    fontSize: 12,
                    color: '#0891B2',
                    fontWeight: 500,
                  }}
                >
                  📤 Upload a document to run the pipeline
                </div>
              )}
            </>
          )}
          {isRunning && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'rgba(22,163,74,0.08)',
                  border: '1px solid rgba(22,163,74,0.2)',
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: C.GREEN,
                    boxShadow: `0 0 6px ${C.GREEN}`,
                    animation: 'pulse 1.5s infinite',
                  }}
                />
                <span style={{ fontSize: 12, color: C.GREEN, fontWeight: 600 }}>
                  {activeAgent?.label} running…
                </span>
              </div>
              <button
                onClick={pause}
                style={{
                  padding: '7px 14px',
                  borderRadius: 7,
                  border: '1px solid #CBD5E1',
                  background: '#fff',
                  color: '#475569',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ⏸ Pause
              </button>
            </div>
          )}
          {paused && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'rgba(217,119,6,0.08)',
                  border: '1px solid rgba(217,119,6,0.2)',
                  fontSize: 12,
                  color: '#D97706',
                  fontWeight: 600,
                }}
              >
                ⏸ Paused at step {nextPhase.current + 1} / {AGENTS.length}
              </div>
              <button
                onClick={resume}
                style={{
                  padding: '7px 16px',
                  borderRadius: 7,
                  border: 'none',
                  background: 'linear-gradient(135deg,#16A34A,#2563EB)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ▶ Resume
              </button>
              <button
                onClick={() => reset(true)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 7,
                  border: '1px solid #CBD5E1',
                  background: '#fff',
                  color: '#64748B',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ↺ Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── DORA METRICS ── */}
      {METRICS?.sdlc?.dora && (
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 10,
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: '#7C3AED',
                fontFamily: 'monospace',
                letterSpacing: 2,
              }}
            >
              DORA METRICS — AI-ACCELERATED DEVOPS
            </div>
            <div
              style={{
                flex: 1,
                height: 1,
                background: 'rgba(124,58,237,0.15)',
              }}
            />
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#fff',
                background: '#7C3AED',
                borderRadius: 4,
                padding: '2px 10px',
                fontFamily: 'monospace',
              }}
            >
              {METRICS.sdlc.dora.rating} PERFORMER
            </span>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 10,
            }}
          >
            {[
              {
                label: 'Deployment Frequency',
                value: METRICS.sdlc.dora.deploymentFrequency,
                sub: METRICS.sdlc.dora.deploymentFrequencyLabel,
                icon: '🚀',
                color: '#2563EB',
                desc: 'How often code is deployed to production',
              },
              {
                label: 'Lead Time for Changes',
                value: METRICS.sdlc.dora.leadTimeForChanges,
                sub: METRICS.sdlc.dora.leadTimeCategory,
                icon: '⏱',
                color: '#16A34A',
                desc: 'Time from commit to production deployment',
              },
              {
                label: 'Change Failure Rate',
                value: METRICS.sdlc.dora.changeFailureRate,
                sub: METRICS.sdlc.dora.changeFailureCategory,
                icon: '🛡',
                color: '#16A34A',
                desc: '% of deployments causing production failure',
              },
              {
                label: 'Failed Deploy Recovery',
                value: METRICS.sdlc.dora.mttrCode,
                sub: METRICS.sdlc.dora.mttrCategory,
                icon: '⚡',
                color: '#7C3AED',
                desc: 'Time to restore service after a failed deployment',
              },
            ].map((k) => (
              <div
                key={k.label}
                style={{
                  background: '#fff',
                  border: `1px solid ${k.color}22`,
                  borderTop: `3px solid ${k.color}`,
                  borderRadius: 9,
                  padding: '12px 14px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 6,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{k.icon}</span>
                  <div
                    style={{
                      fontSize: 9,
                      color: C.MUTED,
                      fontFamily: 'monospace',
                      letterSpacing: 1,
                    }}
                  >
                    {k.label.toUpperCase()}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: k.color,
                    fontFamily: 'monospace',
                    lineHeight: 1,
                    marginBottom: 3,
                  }}
                >
                  {k.value}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: k.color,
                      background: `${k.color}12`,
                      border: `1px solid ${k.color}25`,
                      borderRadius: 4,
                      padding: '1px 7px',
                    }}
                  >
                    {k.sub}
                  </span>
                </div>
                <div style={{ fontSize: 10, color: C.MUTED, lineHeight: 1.5 }}>
                  {k.desc}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 8,
              padding: '8px 14px',
              background: 'rgba(124,58,237,0.04)',
              border: '1px solid rgba(124,58,237,0.15)',
              borderRadius: 7,
              fontSize: 11,
              color: '#64748B',
              lineHeight: 1.6,
            }}
          >
            💡 ZeroOps AI SDLC compresses lead time from weeks to hours —
            requirements extracted by AI, code generated and tested
            autonomously, handed to Jenkins for deployment. DORA Elite category
            requires lead time &lt; 1 day and change failure rate &lt; 5%.
          </div>
        </div>
      )}

      {/* ── TRIGGER SELECTION ── */}
      {!trigger && (
        <div>
          <div
            style={{
              fontSize: 12,
              color: C.MUTED,
              marginBottom: 14,
              textAlign: 'center',
            }}
          >
            Select a trigger to load the AI agent pipeline
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4,1fr)',
              gap: 14,
              marginBottom: 18,
            }}
          >
            {TRIGGERS.map((tr) => (
              <div
                key={tr.id}
                onClick={() => setTrigger(tr)}
                style={{
                  padding: '20px 22px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: `2px solid ${tr.color}22`,
                  background: '#fff',
                  transition: 'all 0.2s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = `${tr.color}66`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${tr.color}18`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${tr.color}22`;
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
                    background: tr.color,
                    borderRadius: '12px 12px 0 0',
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
                      background: `${tr.color}18`,
                      border: `1px solid ${tr.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                    }}
                  >
                    {tr.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: tr.color,
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        letterSpacing: 1.5,
                        marginBottom: 2,
                      }}
                    >
                      {tr.badge}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#0F172A',
                      }}
                    >
                      {tr.type}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: 'monospace',
                    color: tr.color,
                    fontWeight: 600,
                    marginBottom: 6,
                  }}
                >
                  {tr.ref}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#0F172A',
                    lineHeight: 1.4,
                    marginBottom: 6,
                  }}
                >
                  {tr.title}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#64748B',
                    lineHeight: 1.6,
                    marginBottom: 12,
                  }}
                >
                  {tr.desc}
                </div>
                {tr.isOpen && (
                  <div
                    style={{
                      fontSize: 10,
                      color: tr.color,
                      background: `${tr.color}10`,
                      border: `1px dashed ${tr.color}`,
                      borderRadius: 5,
                      padding: '5px 8px',
                      marginBottom: 4,
                      fontWeight: 500,
                    }}
                  >
                    📤 Upload .md or .docx to activate
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
                      fontSize: 10,
                      color: tr.color,
                      fontWeight: 600,
                      background: `${tr.color}12`,
                      border: `1px solid ${tr.color}28`,
                      borderRadius: 5,
                      padding: '3px 8px',
                    }}
                  >
                    {tr.nature}
                  </span>
                  <span
                    style={{ fontSize: 11, color: tr.color, fontWeight: 700 }}
                  >
                    Select →
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Platform message */}
          <div
            style={{
              padding: '16px 20px',
              background:
                'linear-gradient(135deg,rgba(124,58,237,0.06),rgba(37,99,235,0.04))',
              border: '1px solid rgba(124,58,237,0.15)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div style={{ fontSize: 24 }}>🤖</div>
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0F172A',
                  marginBottom: 3,
                }}
              >
                Real AI agents · live output · your documents
              </div>
              <div style={{ fontSize: 11, color: '#64748B', lineHeight: 1.7 }}>
                Upload a <strong>.md</strong> or <strong>.docx</strong>{' '}
                requirements document and watch five specialist agents read it,
                reason through it, and produce real markdown documents —
                streaming word by word in real time. Control passes to{' '}
                <strong style={{ color: '#D97706' }}>Jenkins</strong> at the
                Deploy phase.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── PIPELINE VIEW ── */}
      {trigger && (
        <>
          {/* Trigger + upload row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                background: `${trigger.color}08`,
                border: `1px solid ${trigger.color}25`,
                borderRadius: 10,
                padding: '14px 18px',
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
                  background: `${trigger.color}18`,
                  border: `1px solid ${trigger.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  flexShrink: 0,
                }}
              >
                {trigger.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 10,
                    color: trigger.color,
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                    marginBottom: 2,
                  }}
                >
                  {trigger.badge} · {ITSM}
                </div>
                <div
                  style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}
                >
                  {trigger.isOpen && file
                    ? file.name.replace(/\.(md|docx|txt)$/i, '')
                    : trigger.title}
                </div>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>
                  {trigger.desc}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: trigger.color,
                    fontFamily: 'monospace',
                  }}
                >
                  {trigger.isOpen && file ? 'CUSTOM' : trigger.ref}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: C.MUTED,
                    fontFamily: 'monospace',
                  }}
                >
                  → {trigger.changeRef}
                </div>
              </div>
            </div>
            <FileUpload file={file} onFile={setFile} />
          </div>

          {/* Three-column layout: pipeline | agent reasoning | live output */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '180px 260px 1fr',
              gap: 14,
            }}
          >
            {/* ── Column 1: Agent pipeline ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                style={{
                  fontSize: 9,
                  color: C.MUTED,
                  fontFamily: 'monospace',
                  letterSpacing: 2,
                  marginBottom: 4,
                }}
              >
                AGENT PIPELINE
              </div>
              {AGENTS.map((ag, i) => {
                const isDone = !!outputs[ag.id];
                const isAct = phase === i;
                const col = isDone ? C.GREEN : isAct ? ag.color : '#94A3B8';
                return (
                  <div
                    key={ag.id}
                    onClick={() => (isDone || isAct) && setViewPhase(i)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 8,
                      cursor: isDone || isAct ? 'pointer' : 'default',
                      border: `1.5px solid ${
                        isAct
                          ? ag.color + '55'
                          : isDone
                          ? C.GREEN + '44'
                          : C.BORDER
                      }`,
                      background: isAct
                        ? `${ag.color}08`
                        : isDone
                        ? 'rgba(22,163,74,0.04)'
                        : '#FAFAFA',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden',
                      outline:
                        viewPhase === i && (isDone || isAct)
                          ? `2px solid ${ag.color}66`
                          : 'none',
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
                          background: isDone ? C.GREEN : ag.color,
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
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          flexShrink: 0,
                          background: isDone
                            ? 'rgba(22,163,74,0.12)'
                            : isAct
                            ? `${ag.color}18`
                            : 'rgba(0,0,0,0.04)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                        }}
                      >
                        {isDone ? '✅' : ag.icon}
                      </div>
                      <div
                        style={{ fontSize: 11, fontWeight: 700, color: col }}
                      >
                        {ag.label}
                      </div>
                    </div>
                    <div
                      style={{ fontSize: 9, color: '#64748B', lineHeight: 1.4 }}
                    >
                      {ag.role}
                    </div>
                    {isDone && (
                      <div style={{ marginTop: 6 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setModal({
                              title: `${ag.label} Output — ${trigger.ref}`,
                              content: outputs[ag.id],
                            });
                          }}
                          style={{
                            fontSize: 9,
                            color: '#2563EB',
                            background: 'rgba(37,99,235,0.08)',
                            border: '1px solid rgba(37,99,235,0.2)',
                            borderRadius: 4,
                            padding: '2px 7px',
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          📄 View doc
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Jenkins box */}
              <div
                style={{
                  marginTop: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <div style={{ width: 1, height: 12, background: C.BORDER }} />
                <div style={{ fontSize: 9, color: C.MUTED }}>handoff</div>
              </div>
              <div
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1.5px solid ${done ? '#D97706' + '55' : C.BORDER}`,
                  background: done ? 'rgba(217,119,6,0.06)' : '#FAFAFA',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    marginBottom: 3,
                  }}
                >
                  <span style={{ fontSize: 14 }}>🔧</span>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: done ? '#D97706' : '#94A3B8',
                    }}
                  >
                    Jenkins
                  </div>
                </div>
                <div style={{ fontSize: 9, color: '#64748B' }}>
                  {done ? 'Build SUCCESS ✓' : 'Awaiting handoff'}
                </div>
              </div>
            </div>

            {/* ── Column 2: Agent reasoning ── */}
            <div
              style={{
                background: '#fff',
                border: `1px solid ${C.BORDER}`,
                borderRadius: 10,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Agent header */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${C.BORDER}`,
                  background: viewAgent ? `${viewAgent.color}08` : '#F8FAFC',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 3,
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 7,
                      background: `${viewAgent?.color || '#94A3B8'}18`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                    }}
                  >
                    {viewAgent?.icon || '🤖'}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#0F172A',
                      }}
                    >
                      {viewAgent?.label || 'Select an agent'}
                    </div>
                    <div
                      style={{
                        fontSize: 9,
                        color: C.MUTED,
                        fontFamily: 'monospace',
                      }}
                    >
                      {phase === viewPhase && isRunning
                        ? '🟢 Active'
                        : outputs[viewAgent?.id]
                        ? '✅ Complete'
                        : '⏳ Pending'}
                    </div>
                  </div>
                  {phase === viewPhase && isRunning && (
                    <div
                      style={{
                        marginLeft: 'auto',
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: viewAgent?.color,
                        boxShadow: `0 0 8px ${viewAgent?.color}`,
                        animation: 'pulse 1s infinite',
                      }}
                    />
                  )}
                </div>
              </div>

              {/* Thinking steps */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
                <div
                  style={{
                    fontSize: 9,
                    color: C.MUTED,
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                    marginBottom: 10,
                  }}
                >
                  AGENT REASONING
                </div>
                {thinkSteps.map((step, i) => (
                  <ThinkEntry
                    key={i}
                    step={step}
                    visible={
                      phase === viewPhase
                        ? thoughts.includes(i)
                        : !!outputs[viewAgent?.id]
                    }
                  />
                ))}
                {!outputs[viewAgent?.id] && phase !== viewPhase && (
                  <div
                    style={{
                      fontSize: 11,
                      color: C.MUTED,
                      fontStyle: 'italic',
                      padding: '8px 0',
                    }}
                  >
                    Click an active or completed agent to inspect reasoning
                  </div>
                )}
              </div>
            </div>

            {/* ── Column 3: Live streaming output ── */}
            <div
              style={{
                background: '#fff',
                border: `1px solid ${C.BORDER}`,
                borderRadius: 10,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: `1px solid ${C.BORDER}`,
                  background: viewAgent ? `${viewAgent.color}06` : '#F8FAFC',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                <div>
                  <div
                    style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}
                  >
                    {viewAgent?.label} Output
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: C.MUTED,
                      fontFamily: 'monospace',
                    }}
                  >
                    {file ? `📄 ${file.name}` : 'Default context'} · streaming
                    via Anthropic API
                  </div>
                </div>
                {viewDone && outputs[viewAgent?.id] && (
                  <button
                    onClick={() =>
                      setModal({
                        title: `${viewAgent?.label} Output — ${trigger.ref}`,
                        content: outputs[viewAgent?.id],
                      })
                    }
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: viewAgent?.color || '#2563EB',
                      color: '#fff',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    📄 View full doc
                  </button>
                )}
              </div>
              <div
                style={{ flex: 1, overflow: 'hidden', padding: '14px 16px' }}
              >
                <StreamingOutput
                  text={viewOutput}
                  done={viewDone}
                  color={viewAgent?.color || '#2563EB'}
                  title={`${viewAgent?.label || ''} — ${trigger.ref}`}
                  onView={() =>
                    outputs[viewAgent?.id] &&
                    setModal({
                      title: `${viewAgent?.label} Output — ${trigger.ref}`,
                      content: outputs[viewAgent?.id],
                    })
                  }
                />
              </div>
            </div>
          </div>

          {/* Done banner */}
          {done && (
            <div
              style={{
                marginTop: 16,
                background:
                  'linear-gradient(135deg,rgba(217,119,6,0.08),rgba(22,163,74,0.06))',
                border: '1px solid rgba(217,119,6,0.25)',
                borderRadius: 10,
                padding: '14px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span style={{ fontSize: 24 }}>🔧</span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#D97706',
                    marginBottom: 3,
                  }}
                >
                  All agents complete · control passed to Jenkins Pipeline
                </div>
                <div style={{ fontSize: 11, color: '#64748B' }}>
                  {trigger.changeRef} is ready for deployment · {trigger.ref}{' '}
                  will close in {ITSM} post-deploy
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {AGENTS.map(
                  (ag) =>
                    outputs[ag.id] && (
                      <button
                        key={ag.id}
                        onClick={() =>
                          setModal({
                            title: `${ag.label} — ${trigger.ref}`,
                            content: outputs[ag.id],
                          })
                        }
                        style={{
                          padding: '5px 10px',
                          borderRadius: 6,
                          border: `1px solid ${ag.color}44`,
                          background: `${ag.color}10`,
                          color: ag.color,
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        {ag.icon} {ag.label.split(' ')[0]}
                      </button>
                    )
                )}
              </div>
            </div>
          )}
        </>
      )}

      {modal && (
        <MarkdownModal
          title={modal.title}
          content={modal.content}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── DIAGNOSTIC LOG ── */}
      {showDebug && (
        <div
          style={{
            marginTop: 16,
            background: '#0F172A',
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid #1E293B',
          }}
        >
          <div
            style={{
              padding: '8px 14px',
              borderBottom: '1px solid #1E293B',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: '#94A3B8',
                fontFamily: 'monospace',
                letterSpacing: 2,
                fontWeight: 600,
              }}
            >
              DIAGNOSTIC LOG
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 10,
                  color: '#94A3B8',
                  fontFamily: 'monospace',
                }}
              >
                {debugLog.length} entries · look for red "error" rows if stuck
              </span>
              <button
                onClick={() => setDebugLog([])}
                style={{
                  fontSize: 9,
                  color: '#64748B',
                  background: 'transparent',
                  border: '1px solid #334155',
                  borderRadius: 4,
                  padding: '2px 8px',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                Clear
              </button>
            </div>
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: '6px 0' }}>
            {debugLog.length === 0 && (
              <div
                style={{
                  padding: '10px 14px',
                  fontSize: 11,
                  color: '#475569',
                  fontStyle: 'italic',
                  fontFamily: 'monospace',
                }}
              >
                Run the pipeline — log entries appear here in real time
              </div>
            )}
            {debugLog.map((entry, i) => {
              const col =
                { error: '#F87171', warn: '#FBD073', success: '#4ADE80' }[
                  entry.level
                ] || '#94A3B8';
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 10,
                    padding: '2px 14px',
                    background:
                      entry.level === 'error'
                        ? 'rgba(248,113,113,0.06)'
                        : 'transparent',
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      color: '#475569',
                      fontFamily: 'monospace',
                      flexShrink: 0,
                      minWidth: 72,
                    }}
                  >
                    {entry.ts}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: col,
                      fontFamily: 'monospace',
                      lineHeight: 1.6,
                    }}
                  >
                    {entry.msg}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            style={{
              padding: '5px 14px',
              borderTop: '1px solid #1E293B',
              fontSize: 9,
              color: '#334155',
              fontFamily: 'monospace',
            }}
          >
            "Failed to fetch" or "ERR_BLOCKED" = corporate firewall blocking
            api.anthropic.com · open trigger bypasses API and uses local
            fallback only
          </div>
        </div>
      )}
      <style>{`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
      `}</style>
    </div>
  );
}
