// ─── ATOMS — Reusable primitive components ────────────────────────────
import { C, sc, sb } from '../config/theme.js';

export const Tag = ({ children, color = C.BLUE, style: s = {} }) => (
  <span
    style={{
      fontSize: 9,
      padding: '2px 7px',
      background: `${color}18`,
      color,
      border: `1px solid ${color}28`,
      borderRadius: 4,
      fontFamily: 'monospace',
      ...s,
    }}
  >
    {children}
  </span>
);

export const Rag = ({ status, lg }) => (
  <span
    style={{
      background: sb(status),
      color: sc(status),
      border: `1px solid ${sc(status)}40`,
      borderRadius: 4,
      fontWeight: 700,
      letterSpacing: 1,
      fontFamily: 'monospace',
      fontSize: lg ? 12 : 10,
      padding: lg ? '3px 10px' : '2px 7px',
    }}
  >
    {status}
  </span>
);

export const Bar = ({ value, status, h = 5 }) => (
  <div
    style={{
      background: 'rgba(0,0,0,0.05)',
      borderRadius: h,
      height: h,
      overflow: 'hidden',
    }}
  >
    <div
      style={{
        width: `${value}%`,
        height: '100%',
        background: sc(status),
        borderRadius: h,
        transition: 'width 0.6s',
      }}
    />
  </div>
);

export const Lbl = ({ n, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div
      style={{
        fontSize: 8,
        color: C.MUTED,
        letterSpacing: 4,
        fontFamily: 'monospace',
        marginBottom: 3,
      }}
    >
      LAYER {n} —
    </div>
    <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', margin: 0 }}>
      {children}
    </h1>
  </div>
);

export const Sparkline = ({ data, color, ext, extColor }) => {
  const all = [...data, ...(ext || [])];
  const min = Math.min(...all),
    max = Math.max(...all),
    range = max - min || 1;
  const pts = (arr, offset = 0) =>
    arr
      .map((v, i) => {
        const x = 2 + ((offset + i) / (all.length - 1)) * 76;
        const y = 26 - 2 - ((v - min) / range) * 22;
        return `${x},${y}`;
      })
      .join(' ');
  return (
    <svg width={80} height={28} style={{ display: 'block' }}>
      <polyline
        points={pts(data)}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {ext && (
        <polyline
          points={pts(ext, data.length - 1)}
          fill="none"
          stroke={extColor || color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="3,2"
          opacity="0.6"
        />
      )}
    </svg>
  );
};

export const Gauge = ({ value, size = 72 }) => {
  const r = size / 2 - 7,
    cx = size / 2,
    cy = size / 2;
  const circ = 2 * Math.PI * r,
    dash = circ * (value / 100);
  const color = value >= 80 ? C.GREEN : value >= 60 ? C.AMBER : C.RED;
  return (
    <svg width={size} height={size}>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgba(0,0,0,0.05)"
        strokeWidth={7}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ transition: 'stroke-dasharray 0.8s' }}
      />
      <text
        x={cx}
        y={cy + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={size * 0.18}
        fontWeight={700}
        fontFamily="monospace"
      >
        {value}%
      </text>
    </svg>
  );
};

// SVG area chart — no recharts dependency
export const AreaChartSVG = ({ data, keys, colors, h = 140 }) => {
  const w = 460,
    pad = { t: 10, r: 10, b: 24, l: 32 };
  const iw = w - pad.l - pad.r,
    ih = h - pad.t - pad.b;
  const allVals = data.flatMap((d) => keys.map((k) => d[k]));
  const mn = Math.min(...allVals),
    mx = Math.max(...allVals),
    range = mx - mn || 1;
  const x = (i) => pad.l + (i / (data.length - 1)) * iw;
  const y = (v) => pad.t + ih - ((v - mn) / range) * ih;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display: 'block' }}>
      <defs>
        {colors.map((col, ki) => (
          <linearGradient key={ki} id={`ag${ki}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={col} stopOpacity="0.18" />
            <stop offset="100%" stopColor={col} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {[0, 25, 50, 75].map((pct) => (
        <line
          key={pct}
          x1={pad.l}
          y1={pad.t + ih * (1 - pct / 100)}
          x2={pad.l + iw}
          y2={pad.t + ih * (1 - pct / 100)}
          stroke="rgba(0,0,0,0.05)"
          strokeWidth={1}
        />
      ))}
      {data.map((d, i) => (
        <text
          key={i}
          x={x(i)}
          y={h - 6}
          textAnchor="middle"
          fill="#64748B"
          fontSize={9}
        >
          {d.label || d.month || d.day}
        </text>
      ))}
      {[mn, Math.round((mn + mx) / 2), mx].map((v, i) => (
        <text
          key={i}
          x={pad.l - 4}
          y={y(v) + 3}
          textAnchor="end"
          fill="#64748B"
          fontSize={9}
        >
          {Math.round(v)}
        </text>
      ))}
      {keys.map((k, ki) => {
        const linePts = data.map((d, i) => `${x(i)},${y(d[k])}`).join(' ');
        const firstX = x(0),
          lastX = x(data.length - 1),
          baseY = pad.t + ih;
        const areaD = `M${firstX},${baseY} L${data
          .map((d, i) => `${x(i)},${y(d[k])}`)
          .join(' L')} L${lastX},${baseY} Z`;
        return (
          <g key={ki}>
            <path d={areaD} fill={`url(#ag${ki})`} />
            <polyline
              points={linePts}
              fill="none"
              stroke={colors[ki]}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </g>
        );
      })}
    </svg>
  );
};
