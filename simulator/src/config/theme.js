// ─── LIGHT THEME & PALETTE ───────────────────────────────────────────
export const C = {
  RED: '#DC2626',
  AMBER: '#D97706',
  GREEN: '#16A34A',
  BLUE: '#2563EB',
  PURPLE: '#7C3AED',
  BG: '#F0F4F8',
  PANEL: '#FFFFFF',
  PANEL2: '#F8FAFC',
  BORDER: 'rgba(0,0,0,0.1)',
  TEXT: '#1E293B',
  MUTED: '#64748B',
  DIM: '#94A3B8',
};

export const sc = (s) =>
  ({ RED: C.RED, AMBER: C.AMBER, GREEN: C.GREEN }[s] || '#6B7280');
export const sb = (s) =>
  ({
    RED: 'rgba(220,38,38,0.08)',
    AMBER: 'rgba(217,119,6,0.08)',
    GREEN: 'rgba(22,163,74,0.08)',
  }[s] || 'rgba(100,116,139,0.08)');
export const pc = (p) =>
  ({ P1: C.RED, P2: C.AMBER, P3: C.BLUE, P4: C.MUTED }[p] || C.MUTED);
export const lc = (t) =>
  ({ success: C.GREEN, warn: C.AMBER, info: C.BLUE }[t] || C.MUTED);
export const oc = (o) =>
  o === 'SUCCESS'
    ? C.GREEN
    : o === 'PENDING' || o === 'PENDING APPROVAL'
    ? C.AMBER
    : o === 'APPROVED'
    ? C.BLUE
    : C.MUTED;
