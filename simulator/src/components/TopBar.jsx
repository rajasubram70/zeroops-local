// ── CUSTOMER LOGO COMPONENT ──────────────────────────────────────────
// Reads from CUSTOMER (loader.js) — supports logoUrl image, logoText + logoSubtext text,
// or falls back to the legacy CUSTOMER_LOGO_CONFIG for older industry.config entries.
function CustomerLogo({ industry }) {
  // ── Priority 1: real image from customer JSON (logoUrl field) ────────
  const logoUrl = CUSTOMER.logoUrl || industry.logoUrl;
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={CUSTOMER.name || industry.name}
        style={{
          height: 24,
          maxWidth: 110,
          objectFit: 'contain',
          flexShrink: 0,
        }}
      />
    );
  }

  // ── Priority 2: dynamic from loader CUSTOMER JSON ────────────────────
  if (CUSTOMER.logoText) {
    const accent = CUSTOMER.accentColor || '#1d4ed8';
    return (
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
      >
        {CUSTOMER.logo && (
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 5,
              flexShrink: 0,
              background: `${accent}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
            }}
          >
            {CUSTOMER.logo}
          </div>
        )}
        <div
          style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: accent,
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '-0.5px',
            }}
          >
            {CUSTOMER.logoText}
          </span>
          {CUSTOMER.logoSubtext && (
            <span
              style={{
                fontSize: 8,
                color: '#94A3B8',
                fontFamily: 'monospace',
                letterSpacing: 1,
              }}
            >
              {CUSTOMER.logoSubtext}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── Priority 3: legacy CUSTOMER_LOGO_CONFIG fallback ─────────────────
  const cfg = CUSTOMER_LOGO_CONFIG[industry.customerId] || {};
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
    >
      {cfg.icon && (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 5,
            flexShrink: 0,
            background: cfg.iconBg || '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
          }}
        >
          {cfg.icon}
        </div>
      )}
      <div
        style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}
      >
        <span
          style={{
            fontSize: cfg.fontSize || 15,
            fontWeight: cfg.fontWeight || 800,
            color: cfg.color || '#1E293B',
            fontFamily: cfg.fontFamily || "'DM Sans', sans-serif",
            letterSpacing: cfg.letterSpacing || '-0.5px',
          }}
        >
          {cfg.wordmark || industry.shortName || CUSTOMER.shortName}
        </span>
        {cfg.subtitle && (
          <span
            style={{
              fontSize: 8,
              color: '#94A3B8',
              fontFamily: 'monospace',
              letterSpacing: 1,
            }}
          >
            {cfg.subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

// ── CUSTOMER LOGO CONFIG ──────────────────────────────────────────────
// Add an entry here for each customer industry.
// For a real image, set logoUrl in the industry config in industry.config.js
// e.g.  logoUrl: "https://your-cdn.com/agfa-logo.svg"
const CUSTOMER_LOGO_CONFIG = {
  'agfa-healthcare-it': {
    wordmark: 'agfa',
    subtitle: 'HealthCare IT',
    color: '#E4002B', // AGFA brand red
    fontSize: 17,
    fontWeight: 900,
    fontFamily: "'DM Sans', 'Arial Black', sans-serif",
    letterSpacing: '-0.5px',
    icon: '🏥',
    iconBg: 'rgba(228,0,43,0.08)',
  },
  // Add more customers here:
  // "customer-id": { wordmark:"...", color:"...", ... }
};

import { useState } from 'react';
import { C, sc } from '../config/theme.js';
import { ALL_INDUSTRIES } from '../config/industry.config.js';
import { CUSTOMER } from '../data/customer/loader.js';
import NotificationCentre from './NotificationCentre.jsx';

export default function TopBar({
  user,
  chains,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onNavigateIncident,
  onLogout,
  onSwitchIndustry,
  demoMode,
  onToggleDemo,
}) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showIndustry, setShowIndustry] = useState(false);

  const safeChains = chains || [];
  const redN = safeChains.reduce(
    (a, c) => a + (c.apps || []).filter((x) => x.status === 'RED').length,
    0
  );
  const ambN = safeChains.reduce(
    (a, c) => a + (c.apps || []).filter((x) => x.status === 'AMBER').length,
    0
  );
  const grnN = safeChains.reduce(
    (a, c) => a + (c.apps || []).filter((x) => x.status === 'GREEN').length,
    0
  );
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div
      style={{
        height: 50,
        background: 'rgba(255,255,255,0.98)',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        flexShrink: 0,
        zIndex: 100,
        position: 'relative',
      }}
    >
      {/* LEFT — logo + role + industry */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* ── ZeroOps brand ── */}
        <div
          style={{
            width: 26,
            height: 26,
            background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 800,
            color: '#fff',
            flexShrink: 0,
          }}
        >
          Z
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            color: '#0F172A',
            flexShrink: 0,
          }}
        >
          ZeroOps
        </span>
        <span
          style={{
            fontSize: 9,
            color: C.MUTED,
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 4,
            padding: '1px 6px',
            fontFamily: 'monospace',
            flexShrink: 0,
          }}
        >
          v1.0
        </span>

        {/* ── Customer logo — shown when a customer industry is active ── */}
        {(user.industry?.customerId ||
          CUSTOMER?.logoText ||
          CUSTOMER?.logo) && (
          <>
            <div
              style={{
                width: 1,
                height: 22,
                background: 'rgba(0,0,0,0.12)',
                margin: '0 4px',
                flexShrink: 0,
              }}
            />
            <CustomerLogo industry={user.industry} />
            <div
              style={{
                width: 1,
                height: 22,
                background: 'rgba(0,0,0,0.12)',
                margin: '0 4px',
                flexShrink: 0,
              }}
            />
          </>
        )}

        {/* ── Role badge ── */}
        <div
          style={{
            width: 1,
            height: 15,
            background: C.BORDER,
            margin: '0 3px',
            flexShrink: 0,
          }}
        />
        <div
          style={{
            fontSize: 10,
            background: `${user.color}18`,
            color: user.color,
            border: `1px solid ${user.color}28`,
            borderRadius: 4,
            padding: '2px 7px',
            fontFamily: 'monospace',
            flexShrink: 0,
          }}
        >
          {user.icon} {user.label}
        </div>
        {/* Industry switcher */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setShowIndustry((s) => !s)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 10px',
              background: 'rgba(0,0,0,0.05)',
              border: `1px solid ${C.BORDER}`,
              borderRadius: 5,
              cursor: 'pointer',
              fontSize: 11,
              color: C.MUTED,
            }}
          >
            <span>{user.industry?.logo || '⬡'}</span>
            <span>{user.industry?.shortName || 'Semiconductor'}</span>
            <span style={{ fontSize: 9 }}>▾</span>
          </div>
          {showIndustry && (
            <div
              style={{
                position: 'absolute',
                top: 30,
                left: 0,
                background: 'rgba(9,13,22,0.99)',
                border: `1px solid ${C.BORDER}`,
                borderRadius: 8,
                minWidth: 200,
                zIndex: 200,
                overflow: 'hidden',
              }}
            >
              {ALL_INDUSTRIES.map((ind) => (
                <div
                  key={ind.id}
                  onClick={() => {
                    onSwitchIndustry(ind);
                    setShowIndustry(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '10px 14px',
                    cursor: 'pointer',
                    borderBottom: `1px solid rgba(255,255,255,0.04)`,
                    background:
                      user.industry?.id === ind.id
                        ? 'rgba(0,0,0,0.05)'
                        : 'transparent',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = 'rgba(0,0,0,0.05)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background =
                      user.industry?.id === ind.id
                        ? 'rgba(0,0,0,0.05)'
                        : 'transparent')
                  }
                >
                  <span style={{ fontSize: 18 }}>{ind.logo}</span>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#1E293B',
                        fontWeight: 500,
                      }}
                    >
                      {ind.shortName}
                    </div>
                    <div style={{ fontSize: 10, color: C.MUTED }}>
                      {ind.tagline}
                    </div>
                  </div>
                  {user.industry?.id === ind.id && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        color: C.GREEN,
                        fontSize: 12,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT — health summary + notifs + avatar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {[
          [redN, C.RED, 'RED'],
          [ambN, C.AMBER, 'AMB'],
          [grnN, C.GREEN, 'GRN'],
        ].map(([n, col, lbl]) => (
          <div
            key={lbl}
            style={{ display: 'flex', alignItems: 'center', gap: 4 }}
          >
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: col,
                boxShadow: `0 0 4px ${col}`,
              }}
            />
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: col,
                fontWeight: 600,
              }}
            >
              {n}
            </span>
          </div>
        ))}
        {/* Demo Mode toggle */}
        <div
          onClick={onToggleDemo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            background: demoMode ? 'rgba(139,92,246,0.2)' : 'rgba(0,0,0,0.05)',
            border: `1px solid ${
              demoMode ? 'rgba(139,92,246,0.5)' : 'rgba(0,0,0,0.08)'
            }`,
            transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 12 }}>🎯</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: demoMode ? 700 : 400,
              color: demoMode ? '#7C3AED' : '#64748B',
            }}
          >
            {demoMode ? 'Demo ON' : 'Demo Mode'}
          </span>
        </div>
        {/* Bell */}
        <div
          style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => setShowNotifs((s) => !s)}
        >
          <span style={{ fontSize: 15 }}>🔔</span>
          {unread > 0 && (
            <div
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 14,
                height: 14,
                background: C.RED,
                borderRadius: '50%',
                fontSize: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: '#fff',
              }}
            >
              {unread}
            </div>
          )}
        </div>
        {/* Avatar / logout */}
        <div
          onClick={onLogout}
          style={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            background: `linear-gradient(135deg,${user.color}60,${user.color}30)`,
            border: `1px solid ${user.color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            cursor: 'pointer',
          }}
          title="Click to sign out"
        >
          {user.icon}
        </div>
      </div>

      {/* Notification panel */}
      {showNotifs && (
        <NotificationCentre
          notifications={notifications}
          onMarkRead={onMarkRead}
          onMarkAllRead={onMarkAllRead}
          onClose={() => setShowNotifs(false)}
          onNavigateIncident={(incId) => {
            setShowNotifs(false);
            onNavigateIncident?.(incId);
          }}
        />
      )}
      {/* Click-away overlay */}
      {(showNotifs || showIndustry) && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 99 }}
          onClick={() => {
            setShowNotifs(false);
            setShowIndustry(false);
          }}
        />
      )}
    </div>
  );
}
