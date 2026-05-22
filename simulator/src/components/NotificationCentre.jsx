import { C } from '../config/theme.js';

const typeColor = (t) =>
  ({
    critical: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    success: '#22c55e',
  }[t] || '#6b7280');
const typeIcon = (t) =>
  ({ critical: '🔴', warning: '🟡', info: '🔵', success: '🟢' }[t] || '⚪');

export default function NotificationCentre({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClose,
  onNavigateIncident,
}) {
  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 52,
        right: 18,
        width: 360,
        background: 'rgba(9,12,22,0.98)',
        border: `1px solid ${C.BORDER}`,
        borderRadius: 10,
        zIndex: 300,
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          borderBottom: `1px solid ${C.BORDER}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
            Notifications
          </span>
          {unread > 0 && (
            <span
              style={{
                fontSize: 9,
                padding: '1px 7px',
                background: 'rgba(239,68,68,0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 20,
                fontFamily: 'monospace',
                fontWeight: 700,
              }}
            >
              {unread} new
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {unread > 0 && (
            <span
              onClick={onMarkAllRead}
              style={{
                fontSize: 10,
                color: C.MUTED,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Mark all read
            </span>
          )}
          <div
            onClick={onClose}
            style={{ cursor: 'pointer', color: C.MUTED, fontSize: 17 }}
          >
            ✕
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {notifications.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '32px 0',
              color: C.DIM,
              fontSize: 12,
            }}
          >
            No notifications
          </div>
        )}
        {notifications.map((n) => (
          <div
            key={n.id}
            onClick={() => {
              onMarkRead(n.id);
              if (n.incId) onNavigateIncident?.(n.incId);
            }}
            style={{
              display: 'flex',
              gap: 10,
              padding: '12px 16px',
              borderBottom: `1px solid rgba(255,255,255,0.03)`,
              cursor: 'pointer',
              background: n.read ? 'transparent' : `${typeColor(n.type)}06`,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = n.read
                ? 'transparent'
                : `${typeColor(n.type)}06`)
            }
          >
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
              {typeIcon(n.type)}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: n.read ? 400 : 600,
                    color: n.read ? '#94a3b8' : '#e2e8f0',
                    lineHeight: 1.4,
                  }}
                >
                  {n.title}
                </div>
                <span
                  style={{
                    fontSize: 9,
                    color: C.DIM,
                    fontFamily: 'monospace',
                    flexShrink: 0,
                  }}
                >
                  {n.time}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.MUTED,
                  marginTop: 2,
                  lineHeight: 1.5,
                }}
              >
                {n.body}
              </div>
              {n.incId && (
                <div
                  style={{
                    fontSize: 9,
                    color: typeColor(n.type),
                    marginTop: 4,
                    fontFamily: 'monospace',
                  }}
                >
                  → View {n.incId}
                </div>
              )}
            </div>
            {!n.read && (
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: typeColor(n.type),
                  flexShrink: 0,
                  marginTop: 5,
                }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
