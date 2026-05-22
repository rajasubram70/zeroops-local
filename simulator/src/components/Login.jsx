import { useState } from 'react';
import { ROLES } from '../config/roles.config.js';
import { CREDENTIALS, CUSTOMER } from '../data/customer/loader.js';
import { C } from '../config/theme.js';

const INDUSTRY = CUSTOMER;

// ── Demo credentials — email resolves to a role ───────────────
export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const attempt = (e) => {
    e?.preventDefault();
    setError('');
    const match = CREDENTIALS.find(
      (c) =>
        (c.email || c.username || '').toLowerCase() ===
          email.trim().toLowerCase() && c.password === password
    );
    if (!match) {
      setError('Incorrect email or password. Please try again.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const role = ROLES.find((r) => r.id === (match.roleId || match.role));
      onLogin({ ...role, industry: INDUSTRY });
    }, 900);
  };

  const quickFill = (cred) => {
    setEmail(cred.email || cred.username);
    setPassword(cred.password);
    setError('');
  };

  const inp = (hasVal, hasErr) => ({
    width: '100%',
    fontSize: 14,
    color: '#0F172A',
    background: hasErr ? '#FFF5F5' : '#F8FAFC',
    border: `1.5px solid ${
      hasErr ? '#FCA5A5' : hasVal ? '#93C5FD' : '#E2E8F0'
    }`,
    borderRadius: 8,
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, background 0.15s',
    fontFamily: 'inherit',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F1F5F9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
      }}
    >
      {/* Grid background */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(${C.BORDER} 1px,transparent 1px),linear-gradient(90deg,${C.BORDER} 1px,transparent 1px)`,
          backgroundSize: '48px 48px',
          opacity: 0.55,
        }}
      />

      <div style={{ position: 'relative', width: '100%', maxWidth: 520 }}>
        {/* Logo + branding */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div
            style={{
              width: 54,
              height: 54,
              background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              fontWeight: 900,
              color: '#fff',
              margin: '0 auto 14px',
              boxShadow: '0 8px 24px rgba(124,58,237,0.28)',
            }}
          >
            Z
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: '#0F172A',
              letterSpacing: '-0.3px',
              marginBottom: 4,
            }}
          >
            ZeroOps
          </div>
          <div style={{ fontSize: 12, color: C.MUTED, marginBottom: 16 }}>
            AI-driven autonomous operations
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'transparent',
              border: 'none',
              padding: '4px 0',
            }}
          >
            {INDUSTRY.logoUrl ? (
              <img
                src={INDUSTRY.logoUrl}
                alt={INDUSTRY.name}
                style={{ height: 28, maxWidth: 120, objectFit: 'contain' }}
              />
            ) : (
              <>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 900,
                    color: INDUSTRY.accentColor || '#1d4ed8',
                    letterSpacing: '0.5px',
                  }}
                >
                  {INDUSTRY.logoText || INDUSTRY.name?.toUpperCase()}
                </span>
                {INDUSTRY.logoSubtext && (
                  <>
                    <div
                      style={{
                        width: 1,
                        height: 13,
                        background: `${INDUSTRY.accentColor || '#1d4ed8'}30`,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        color: INDUSTRY.accentColor || '#1d4ed8',
                        fontFamily: 'monospace',
                        letterSpacing: 1,
                      }}
                    >
                      {INDUSTRY.logoSubtext}
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Card */}
        <div
          style={{
            background: '#fff',
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            overflow: 'hidden',
          }}
        >
          {/* Card header */}
          <div
            style={{
              background: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              padding: '16px 28px',
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>
              Sign in
            </div>
            <div style={{ fontSize: 12, color: C.MUTED, marginTop: 2 }}>
              {`Use your ${
                INDUSTRY.shortName || INDUSTRY.name || 'IT'
              } credentials`}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={attempt} style={{ padding: '24px 28px 20px' }}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#374151',
                  marginBottom: 6,
                }}
              >
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder={`you@${(INDUSTRY.name || 'company')
                  .toLowerCase()
                  .replace(/\s+/g, '')}.com`}
                autoComplete="username"
                style={{ ...inp(!!email, !!error), padding: '10px 13px' }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3B82F6';
                  e.target.style.background = '#fff';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = error
                    ? '#FCA5A5'
                    : email
                    ? '#93C5FD'
                    : '#E2E8F0';
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: 6,
                }}
              >
                <label
                  style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}
                >
                  Password
                </label>
                <span
                  style={{ fontSize: 12, color: '#3B82F6', cursor: 'pointer' }}
                >
                  Forgot password?
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="••••••••••"
                  autoComplete="current-password"
                  style={{
                    ...inp(!!password, !!error),
                    padding: '10px 40px 10px 13px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3B82F6';
                    e.target.style.background = '#fff';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error
                      ? '#FCA5A5'
                      : password
                      ? '#93C5FD'
                      : '#E2E8F0';
                  }}
                />
                <span
                  onClick={() => setShowPwd((s) => !s)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 14,
                    cursor: 'pointer',
                    color: '#94A3B8',
                    userSelect: 'none',
                  }}
                >
                  {showPwd ? '🙈' : '👁'}
                </span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  marginBottom: 14,
                  padding: '9px 13px',
                  background: 'rgba(220,38,38,0.06)',
                  border: '1px solid rgba(220,38,38,0.2)',
                  borderRadius: 7,
                  fontSize: 12,
                  color: '#B91C1C',
                  display: 'flex',
                  gap: 6,
                }}
              >
                <span>⚠</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              style={{
                width: '100%',
                padding: '11px',
                borderRadius: 8,
                border: 'none',
                background:
                  loading || !email || !password
                    ? '#CBD5E1'
                    : 'linear-gradient(135deg,#1d4ed8,#7c3aed)',
                color: loading || !email || !password ? '#94A3B8' : '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor:
                  loading || !email || !password ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontFamily: 'inherit',
                transition: 'opacity 0.2s',
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.35)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'zo-spin 0.75s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                  Signing in…
                </>
              ) : (
                'Sign in →'
              )}
            </button>

            <style>{`@keyframes zo-spin { to { transform:rotate(360deg); } }`}</style>
          </form>

          {/* Persona cards */}
          <div style={{ padding: '0 20px 24px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
              <span
                style={{
                  fontSize: 10,
                  color: '#94A3B8',
                  fontFamily: 'monospace',
                  letterSpacing: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                DEMO — SELECT YOUR PERSONA
              </span>
              <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {CREDENTIALS.map((cred) => {
                const role = ROLES.find(
                  (r) => r.id === (cred.roleId || cred.role)
                );
                if (!role) return null;
                return (
                  <div
                    key={cred.role}
                    onClick={() => {
                      setLoading(true);
                      setTimeout(
                        () => onLogin({ ...role, industry: INDUSTRY }),
                        600
                      );
                    }}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 9,
                      cursor: 'pointer',
                      background: '#F8FAFC',
                      border: `1.5px solid #E2E8F0`,
                      transition: 'all 0.18s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `${role.color}0d`;
                      e.currentTarget.style.borderColor = `${role.color}55`;
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = `0 4px 12px ${role.color}18`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#F8FAFC';
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    {/* Colour accent top bar */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 3,
                        background: role.color,
                        borderRadius: '9px 9px 0 0',
                      }}
                    />
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        marginTop: 2,
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 7,
                          background: `${role.color}18`,
                          border: `1px solid ${role.color}30`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 14,
                          flexShrink: 0,
                        }}
                      >
                        {role.icon}
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#0F172A',
                            lineHeight: 1.2,
                          }}
                        >
                          {role.label}
                        </div>
                        <div
                          style={{
                            fontSize: 9,
                            color: role.color,
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            letterSpacing: 0.5,
                          }}
                        >
                          {cred.title || cred.name}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#64748B',
                        lineHeight: 1.5,
                        marginBottom: 8,
                      }}
                    >
                      {role.desc}
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 9,
                          color: '#94A3B8',
                          fontFamily: 'monospace',
                        }}
                      >
                        {cred.username}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: role.color,
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          background: `${role.color}12`,
                          border: `1px solid ${role.color}28`,
                          borderRadius: 4,
                          padding: '2px 7px',
                        }}
                      >
                        Sign in →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>
            {INDUSTRY.tagline}
          </div>
          <div
            style={{
              fontSize: 10,
              color: '#CBD5E1',
              fontFamily: 'monospace',
              marginTop: 4,
            }}
          >
            ZeroOps v1.0 · {INDUSTRY.name} Edition
          </div>
        </div>
      </div>
    </div>
  );
}
