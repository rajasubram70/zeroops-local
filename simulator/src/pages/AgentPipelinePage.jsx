import { useState, useEffect, useRef } from "react";
import { C } from "../config/theme.js";

const BRIDGE = "http://localhost:5002";

// ── Node definitions — evenly spaced, no overlap ──────────────
const NODES = [
  { id:"correlator",  label:"Alert Correlator", icon:"🔍", model:"no LLM",      x:30,  y:90, w:130, h:90 },
  { id:"rca",         label:"RCA Engine",        icon:"🧠", model:"gpt-oss:20b", x:210, y:90, w:130, h:90 },
  { id:"remediation", label:"Remediation",       icon:"⚡", model:"llama3.2:3b", x:390, y:90, w:130, h:90 },
  { id:"validation",  label:"Validate",          icon:"✅", model:"llama3.2:3b", x:570, y:60, w:130, h:56 },
  { id:"closer",      label:"Close + KB",        icon:"📚", model:"gpt-oss:20b", x:570, y:124, w:130, h:56 },
];

const EDGES = [
  { from:"correlator",  to:"rca",         label:"proceed" },
  { from:"rca",         to:"remediation",  label:"route"   },
  { from:"remediation", to:"validation",   label:"execute" },
  { from:"validation",  to:"closer",       label:"close"   },
  { from:"validation",  to:"rca",          label:"retry",  dashed:true, color:"#D97706" },
];

function nodeColor(status) {
  switch(status) {
    case "running":    return { bg:"#1D4ED8", border:"#3B82F6", text:"#fff",    pulse:true  };
    case "complete":   return { bg:"#15803D", border:"#22C55E", text:"#fff",    pulse:false };
    case "suppressed": return { bg:"#4B5563", border:"#9CA3AF", text:"#fff",    pulse:false };
    case "skipped":    return { bg:"#F8FAFC", border:"#E2E8F0", text:"#CBD5E1", pulse:false };
    case "error":      return { bg:"#991B1B", border:"#EF4444", text:"#fff",    pulse:false };
    default:           return { bg:"#F8FAFC", border:"#E2E8F0", text:"#CBD5E1", pulse:false };
  }
}

function statusBadge(status) {
  switch(status) {
    case "running":    return { label:"RUNNING",    color:"#93C5FD" };
    case "complete":   return { label:"COMPLETE",   color:"#86EFAC" };
    case "suppressed": return { label:"SUPPRESSED", color:"#D1D5DB" };
    case "skipped":    return { label:"SKIPPED",    color:"#E2E8F0" };
    case "error":      return { label:"ERROR",      color:"#FCA5A5" };
    default:           return { label:"PENDING",    color:"#E2E8F0" };
  }
}

// ── StateGraph SVG ────────────────────────────────────────────
function StateGraph({ nodeStates, currentNode, suppressed }) {
  const W = 760, H = 240;

  function centerX(n) { return n.x + n.w / 2; }
  function centerY(n) { return n.y + n.h / 2; }

  function edgePath(fromId, toId) {
    const f = NODES.find(n=>n.id===fromId);
    const t = NODES.find(n=>n.id===toId);
    if (!f||!t) return "";
    // retry — arc above
    if (fromId==="validation"&&toId==="rca") {
      const fx=centerX(f), fy=f.y;
      const tx=centerX(t), ty=t.y;
      return `M${fx} ${fy} C${fx} ${fy-55} ${tx} ${ty-55} ${tx} ${ty}`;
    }
    const fx=f.x+f.w, fy=centerY(f);
    const tx=t.x,     ty=centerY(t);
    const cx=(fx+tx)/2;
    return `M${fx} ${fy} C${cx} ${fy} ${cx} ${ty} ${tx} ${ty}`;
  }

  function edgeStroke(fromId, toId, override) {
    if (override) return override;
    const fs = nodeStates?.[fromId];
    const ts = nodeStates?.[toId];
    if (fs==="complete"&&(ts==="complete"||ts==="running")) return "#22C55E";
    if (fs==="running") return "#3B82F6";
    return "#E2E8F0";
  }

  function markerId(col) {
    if (col==="#22C55E") return "arr-green";
    if (col==="#3B82F6") return "arr-blue";
    if (col==="#D97706") return "arr-amber";
    return "arr-grey";
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:"100%",height:"auto"}}>
      <defs>
        {[["green","#22C55E"],["blue","#3B82F6"],["grey","#CBD5E1"],["amber","#D97706"]].map(([id,col])=>(
          <marker key={id} id={`arr-${id}`} viewBox="0 0 10 10" refX="9" refY="5"
            markerWidth="6" markerHeight="6" orient="auto">
            <path d="M1 1L9 5L1 9" fill="none" stroke={col} strokeWidth="2" strokeLinecap="round"/>
          </marker>
        ))}
        <filter id="pulse-glow">
          <feGaussianBlur stdDeviation="4" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08"/>
        </filter>
      </defs>

      {/* Background */}
      <rect width={W} height={H} fill="#F8FAFC" rx="12" stroke="#E8ECEF"/>

      {/* Subtle grid */}
      {Array.from({length:20}).map((_,i)=>
        Array.from({length:8}).map((_,j)=>(
          <circle key={`${i}-${j}`} cx={i*40+20} cy={j*32+16} r="1.2" fill="#E8ECEF"/>
        ))
      )}

      {/* START pill */}
      <rect x="2" y={centerY(NODES[0])-11} width="26" height="22" rx="6"
        fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1"/>
      <text x="15" y={centerY(NODES[0])+4} textAnchor="middle"
        fill="#94A3B8" fontSize="8" fontFamily="monospace" fontWeight="600">ST</text>
      <line x1="28" y1={centerY(NODES[0])} x2="30" y2={centerY(NODES[0])}
        stroke="#CBD5E1" strokeWidth="1.2" markerEnd="url(#arr-grey)"/>

      {/* Edges */}
      {EDGES.map(e=>{
        const col   = edgeStroke(e.from, e.to, e.color);
        const skip  = nodeStates?.[e.from]==="skipped"||nodeStates?.[e.from]==="pending";
        return (
          <path key={`${e.from}-${e.to}`}
            d={edgePath(e.from, e.to)}
            fill="none"
            stroke={skip?"#E2E8F0":col}
            strokeWidth={col==="#22C55E"?"2":"1.2"}
            strokeDasharray={e.dashed?"6,3":"none"}
            markerEnd={`url(#${markerId(skip?"#E2E8F0":col)})`}
            opacity={skip?0.4:1}
          />
        );
      })}

      {/* Suppress drop line */}
      {suppressed&&(
        <line x1={centerX(NODES[0])} y1={NODES[0].y+NODES[0].h}
              x2={centerX(NODES[0])} y2={H-8}
          stroke="#9CA3AF" strokeWidth="1.2" strokeDasharray="5,3"
          markerEnd="url(#arr-grey)"/>
      )}

      {/* Nodes */}
      {NODES.map(node=>{
        const status  = nodeStates?.[node.id]||"pending";
        const col     = nodeColor(status);
        const active  = currentNode===node.id && status==="running";
        const badge   = statusBadge(status);
        const cx      = centerX(node);

        return (
          <g key={node.id}>
            {/* Pulse ring for active */}
            {active&&(
              <rect x={node.x-6} y={node.y-6} width={node.w+12} height={node.h+12}
                rx="14" fill="none" stroke="#3B82F6" strokeWidth="2.5" opacity="0.35"/>
            )}
            {/* Node body */}
            <rect x={node.x} y={node.y} width={node.w} height={node.h}
              rx="10" fill={col.bg} stroke={col.border} strokeWidth={active?"2":"1.5"}
              filter={active?"url(#pulse-glow)":"url(#shadow)"}/>

            {/* Icon */}
            <text x={cx} y={node.y+22} textAnchor="middle" fontSize="16">{node.icon}</text>
            {/* Label */}
            <text x={cx} y={node.y+40} textAnchor="middle" fontSize="10" fontWeight="700"
              fill={col.text} fontFamily="system-ui,sans-serif">{node.label}</text>
            {/* Model */}
            <text x={cx} y={node.y+54} textAnchor="middle" fontSize="8"
              fill={col.text} opacity="0.75" fontFamily="monospace">{node.model}</text>
            {/* Status badge */}
            <rect x={cx-26} y={node.y+node.h-18} width="52" height="14" rx="4"
              fill="rgba(0,0,0,0.15)"/>
            <text x={cx} y={node.y+node.h-8} textAnchor="middle" fontSize="7"
              fontWeight="700" fill={badge.color} fontFamily="monospace" letterSpacing="0.8">
              {badge.label}
            </text>
          </g>
        );
      })}

      {/* END pill */}
      <rect x={W-28} y={centerY(NODES[2])-11} width="26" height="22" rx="6"
        fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1"/>
      <text x={W-15} y={centerY(NODES[2])+4} textAnchor="middle"
        fill="#94A3B8" fontSize="8" fontFamily="monospace" fontWeight="600">EN</text>
    </svg>
  );
}

// ── Reasoning feed ────────────────────────────────────────────
function ReasoningFeed({ steps, tools }) {
  const ref = useRef(null);
  useEffect(()=>{ if(ref.current) ref.current.scrollTop=ref.current.scrollHeight; },[steps]);

  return (
    <div style={{display:"flex", flexDirection:"column", gap:0,
      background:"#fff", borderRadius:10, border:`1px solid ${C.BORDER}`, overflow:"hidden"}}>
      <div style={{padding:"10px 14px", borderBottom:`1px solid ${C.BORDER}`,
        fontSize:10, color:C.MUTED, fontFamily:"monospace", letterSpacing:1.5}}>
        REASONING FEED
      </div>
      <div ref={ref} style={{height:200, overflowY:"auto", padding:"10px 14px",
        display:"flex", flexDirection:"column", gap:6}}>
        {(!steps||steps.length===0)&&(
          <div style={{color:C.MUTED, fontSize:11, fontFamily:"monospace",
            textAlign:"center", marginTop:70}}>
            Waiting for next incident...
          </div>
        )}
        {steps?.map((step,i)=>(
          <div key={i} style={{display:"flex", gap:8, alignItems:"flex-start"}}>
            <span style={{color:C.GREEN, fontFamily:"monospace", fontSize:10,
              flexShrink:0, marginTop:1, fontWeight:700}}>
              {String(i+1).padStart(2,"0")}
            </span>
            <span style={{fontSize:11, color:"#475569", lineHeight:1.6,
              fontFamily:"monospace"}}>{step}</span>
          </div>
        ))}
      </div>
      {tools?.length>0&&(
        <div style={{padding:"8px 14px", borderTop:`1px solid ${C.BORDER}`,
          background:"#F8FAFC"}}>
          <div style={{fontSize:9, color:C.MUTED, fontFamily:"monospace",
            letterSpacing:1, marginBottom:6}}>TOOLS CALLED</div>
          <div style={{display:"flex", flexWrap:"wrap", gap:4}}>
            {tools.map((t,i)=>(
              <span key={i} style={{fontSize:9, fontFamily:"monospace", padding:"2px 8px",
                background:"rgba(37,99,235,0.08)", border:"1px solid rgba(37,99,235,0.2)",
                borderRadius:4, color:"#2563EB"}}>{t}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── History list ──────────────────────────────────────────────
function HistoryList({ history, selectedIdx, onSelect }) {
  const filtered = (history||[]).filter(h=>h.alert_name!=="DatasourceNoData");
  const reversed = [...filtered].reverse();

  function statusDot(run) {
    if (run.suppressed)                    return "#9CA3AF";
    if (run.status==="complete")           return C.GREEN;
    if (run.status==="awaiting_approval")  return C.AMBER;
    if (run.status==="error")              return "#EF4444";
    return "#3B82F6";
  }

  function statusTag(run) {
    if (run.suppressed)                    return { label:"SUPPRESSED",       color:"#9CA3AF" };
    if (run.status==="complete")           return { label:"COMPLETE",         color:C.GREEN   };
    if (run.status==="awaiting_approval")  return { label:"AWAITING APPROVAL",color:C.AMBER   };
    if (run.status==="error")              return { label:"ERROR",            color:"#EF4444" };
    return { label:"RUNNING", color:"#3B82F6" };
  }

  return (
    <div style={{background:"#fff", borderRadius:10,
      border:`1px solid ${C.BORDER}`, overflow:"hidden"}}>
      <div style={{padding:"10px 14px", borderBottom:`1px solid ${C.BORDER}`,
        display:"flex", justifyContent:"space-between", alignItems:"center"}}>
        <span style={{fontSize:10, color:C.MUTED, fontFamily:"monospace",
          letterSpacing:1.5}}>PIPELINE HISTORY</span>
        <span style={{fontSize:10, color:C.MUTED}}>{filtered.length} runs</span>
      </div>
      <div style={{maxHeight:232, overflowY:"auto"}}>
        {filtered.length===0&&(
          <div style={{padding:"24px 14px", color:C.MUTED, fontSize:11,
            textAlign:"center"}}>
            No runs yet — inject a scenario
          </div>
        )}
        {reversed.map((run,i)=>{
          const realIdx = filtered.length-1-i;
          const sel     = selectedIdx===realIdx;
          const tag     = statusTag(run);
          return (
            <div key={i} onClick={()=>onSelect(realIdx)}
              style={{padding:"10px 14px", borderBottom:`1px solid ${C.BORDER}`,
                cursor:"pointer", transition:"background 0.12s",
                background:sel?"rgba(37,99,235,0.06)":"transparent"}}>
              <div style={{display:"flex", justifyContent:"space-between",
                alignItems:"center", marginBottom:3}}>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <div style={{width:8, height:8, borderRadius:"50%",
                    background:statusDot(run), flexShrink:0}}/>
                  <div style={{display:"flex", flexDirection:"column"}}>
                    <span style={{fontSize:12, fontWeight:700, color:"#1E293B",
                      fontFamily:"monospace"}}>{run.alert_name}</span>
                    {run.started_at&&(
                      <span style={{fontSize:9, color:C.MUTED, fontFamily:"monospace"}}>
                        {new Date(run.started_at*1000).toLocaleTimeString('en-GB',{hour12:false})}
                      </span>
                    )}
                  </div>
                </div>
                <span style={{fontSize:9, fontWeight:700, fontFamily:"monospace",
                  color:tag.color, background:`${tag.color}18`,
                  padding:"2px 7px", borderRadius:4}}>{tag.label}</span>
              </div>
              <div style={{display:"flex", gap:14, marginLeft:16}}>
                {run.pillar&&!run.suppressed&&(
                  <span style={{fontSize:10, color:C.MUTED}}>
                    {run.pillar}
                  </span>
                )}
                {run.risk_score>0&&(
                  <span style={{fontSize:10, color:C.MUTED, fontFamily:"monospace"}}>
                    risk {run.risk_score}
                  </span>
                )}
                {run.mttr>0&&(
                  <span style={{fontSize:10, color:C.GREEN, fontFamily:"monospace",
                    fontWeight:700}}>MTTR {run.mttr}s</span>
                )}
                {run.action_taken&&!run.suppressed&&(
                  <span style={{fontSize:10, color:"#2563EB", fontFamily:"monospace"}}>
                    {run.action_taken}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── KPI strip ─────────────────────────────────────────────────
function KPIStrip({ run }) {
  if (!run||Object.keys(run).length===0) return null;
  const suppressed   = run.suppressed;
  const status       = run.status;
  const statusColor  = status==="complete"?C.GREEN:status==="running"?"#2563EB":
                       status==="suppressed"?C.MUTED:status==="awaiting_approval"?C.AMBER:C.MUTED;

  const items = [
    { label:"ALERT",      value:run.alert_name||"—",          color:"#1E293B"     },
    { label:"STATUS",     value:status?.toUpperCase()||"—",   color:statusColor   },
    run.risk_score>0 && { label:"RISK",   value:`${run.risk_score}/100`,
      color:run.risk_score<25?C.GREEN:run.risk_score<75?C.AMBER:"#DC2626" },
    !suppressed&&run.pillar && { label:"MODE",
      value:run.pillar, color:run.pillar==="Autonomous"?C.GREEN:C.AMBER },
    run.mttr>0 && { label:"MTTR",  value:`${run.mttr}s`,      color:C.GREEN       },
    !suppressed&&run.action_taken && { label:"ACTION",
      value:run.action_taken==="hitl_pending"?"Awaiting HiTL":run.action_taken, 
      color:"#2563EB" },
  ].filter(Boolean);

  return (
    <div style={{background:"#fff", borderRadius:10, padding:"12px 18px",
      marginBottom:14, border:`1px solid ${C.BORDER}`,
      borderLeft:`4px solid ${statusColor}`,
      display:"flex", gap:0, alignItems:"stretch", flexWrap:"wrap"}}>
      {items.map((item,i)=>(
        <div key={i} style={{display:"flex", alignItems:"stretch"}}>
          {i>0&&<div style={{width:1, background:C.BORDER, margin:"0 16px"}}/>}
          <div>
            <div style={{fontSize:9, color:C.MUTED, fontFamily:"monospace",
              letterSpacing:1.5, marginBottom:3}}>{item.label}</div>
            <div style={{fontSize:13, fontWeight:700, color:item.color,
              fontFamily:"monospace"}}>{item.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function AgentPipelinePage() {
  const [pipeline, setPipeline] = useState({active:{}, history:[]});
  const [selected, setSelected] = useState(null);
  const [autoFollow, setAutoFollow] = useState(true);

  
  useEffect(()=>{
    // Initial load
    const load = async ()=>{
      try {
        const resp = await window.fetch(`${BRIDGE}/pipeline`);
        const data = await resp.json();
        setPipeline(data);
        if (autoFollow) {
          const filtered = (data.history||[]).filter(h=>h.alert_name!=="DatasourceNoData");
          if (filtered.length>0) setSelected(filtered.length-1);
        }
      } catch(e){}
    };
    load();

    // ── Transition queue — animate one node at a time ──
    const transitionQueue = { current: [] };
    const isAnimating     = { current: false };

    function processQueue() {
      if (isAnimating.current || transitionQueue.current.length === 0) return;
      isAnimating.current = true;
      const next = transitionQueue.current.shift();
      setPipeline(p => ({
        ...p,
        active: {
          ...p.active,
          nodes:        next.nodes,
          current_node: next.node,
          alert_name:   next.alert_name,
          risk_score:   next.risk_score,
          pillar:       next.pillar,
          status:       'running',
          suppressed:   false,
        }
      }));
      if (autoFollow) setSelected(null);
      setTimeout(() => {
        isAnimating.current = false;
        processQueue();
      }, 2000);
    }

    // SSE for real-time node updates
    let es;
    try {
      es = new EventSource(`${BRIDGE}/events`);
      es.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'heartbeat') return;

          if (msg.type === 'connected' && msg.pipeline) {
            setPipeline(p => ({...p, active: msg.pipeline}));
            return;
          }

          if (msg.type === 'node_update') {
            // Queue the transition instead of applying immediately
            transitionQueue.current.push(msg);
            processQueue();
            return;
          }

          if (msg.type === 'pipeline_start') {
            transitionQueue.current = []; // Clear queue on new pipeline
            setPipeline(p => ({...p, active: msg.pipeline}));
            if (autoFollow) setSelected(null);
            return;
          }

          if (msg.type === 'pipeline_complete') {
            // Wait for queue to drain then reload
            setTimeout(()=>load(), 3000);
            return;
          }
        } catch(err){}
      };

      es.onerror = () => {
        // Fallback to polling if SSE fails
        const t = setInterval(load, 2000);
        return ()=>clearInterval(t);
      };
    } catch(err) {
      const t = setInterval(load, 2000);
      return ()=>clearInterval(t);
    }

    // Keep polling for history updates
    const t = setInterval(load, 5000);
    return ()=>{
      clearInterval(t);
      if(es) es.close();
    };
  },[autoFollow]);

  // When user clicks history — use that run
  const filtered    = (pipeline.history||[]).filter(h=>h.alert_name!=="DatasourceNoData");
  const displayRun  = selected!==null
    ? filtered[selected]
    : (pipeline.active && Object.keys(pipeline.active).length > 0
        ? pipeline.active
        : filtered[filtered.length-1]||{});

  const nodeStates  = displayRun?.nodes||{};
  const currentNode = displayRun?.current_node;
  const suppressed  = displayRun?.suppressed;
  const steps       = displayRun?.reasoning_steps||[];
  const tools       = displayRun?.tools_called||[];

  return (
    <div style={{padding:22, maxWidth:1200}}>

      {/* Header */}
      <div style={{display:"flex", justifyContent:"space-between",
        alignItems:"center", marginBottom:14}}>
        <div>
          <div style={{fontSize:22, fontWeight:800, color:"#0F172A", marginBottom:3}}>
            Agent Pipeline
          </div>
          <div style={{fontSize:12, color:C.MUTED, fontFamily:"monospace"}}>
            LangGraph StateGraph · zeroops-core · real-time execution trace
          </div>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          {/* Auto-follow toggle */}
          <div onClick={()=>setAutoFollow(f=>!f)}
            style={{cursor:"pointer", fontSize:11, color:autoFollow?C.GREEN:C.MUTED,
              background:autoFollow?"rgba(22,163,74,0.08)":"rgba(0,0,0,0.04)",
              border:`1px solid ${autoFollow?"rgba(22,163,74,0.3)":C.BORDER}`,
              borderRadius:6, padding:"4px 10px", fontFamily:"monospace",
              display:"flex", alignItems:"center", gap:6}}>
            <div style={{width:6, height:6, borderRadius:"50%",
              background:autoFollow?C.GREEN:C.MUTED}}/>
            {autoFollow?"AUTO-FOLLOW":"MANUAL"}
          </div>
          <div style={{display:"flex", alignItems:"center", gap:5}}>
            <div style={{width:7, height:7, borderRadius:"50%", background:C.GREEN,
              boxShadow:`0 0 8px ${C.GREEN}`}}/>
            <span style={{fontSize:11, color:C.GREEN, fontFamily:"monospace",
              fontWeight:600}}>LIVE · 2s</span>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <KPIStrip run={displayRun}/>

      {/* StateGraph */}
      <div style={{background:"#fff", borderRadius:10, padding:"16px 20px",
        marginBottom:14, border:`1px solid ${C.BORDER}`}}>
        <div style={{fontSize:10, color:C.MUTED, fontFamily:"monospace",
          letterSpacing:1.5, marginBottom:12}}>STATEGRAPH — LIVE EXECUTION</div>
        <StateGraph
          nodeStates={nodeStates}
          currentNode={currentNode}
          suppressed={suppressed}
        />
      </div>

      {/* Reasoning + History */}
      <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
        <ReasoningFeed steps={steps} tools={tools}/>
        <HistoryList
          history={pipeline.history}
          selectedIdx={selected}
          onSelect={idx=>{
            setSelected(idx);
            setAutoFollow(false);
          }}
        />
      </div>

    </div>
  );
}