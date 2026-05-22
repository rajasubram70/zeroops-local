import { useState, useCallback } from 'react';

const SEED_NOTIFICATIONS = [
  {
    id: 1,
    type: 'critical',
    title: 'MES Controller — OOM Kill',
    body: 'fab-mes-prod-01 heap 98.7% · Fab Line 3 halted',
    time: '02:14',
    read: false,
    incId: 'INC0001847',
  },
  {
    id: 2,
    type: 'critical',
    title: 'LIMS System — Availability Alert',
    body: 'qa-lims-prod-02 batch processing failed · 47 QA holds',
    time: '01:48',
    read: false,
    incId: 'INC0001843',
  },
  {
    id: 3,
    type: 'warning',
    title: 'SCADA DB — Replication Lag',
    body: 'fab-scada-db-01 lag 8.2s · stale data risk',
    time: '00:32',
    read: false,
    incId: 'INC0001839',
  },
  {
    id: 4,
    type: 'info',
    title: 'CHG0004429 Approved',
    body: 'Risk score 12/100 LOW — Change Validator auto-approved',
    time: '03:28',
    read: true,
    incId: null,
  },
  {
    id: 5,
    type: 'success',
    title: 'Alert Correlator',
    body: '847 raw alerts → 27 incidents today · 96.8% suppressed',
    time: '03:41',
    read: true,
    incId: null,
  },
];

export function useNotifications() {
  const [notifications, setNotifications] = useState(SEED_NOTIFICATIONS);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [
      {
        ...notif,
        id: Date.now(),
        read: false,
        time: new Date().toLocaleTimeString(),
      },
      ...prev,
    ]);
  }, []);

  return { notifications, unreadCount, markRead, markAllRead, addNotification };
}
