import { useState, useCallback, useRef } from 'react';
//import { AIOPS_STEPS } from '../data/metrics.js';

/**
 * useHealthcheck
 * Manages the AIOps healthcheck simulation:
 *  - plays back log steps with delays
 *  - updates chain/app/infra status to GREEN after completion
 *  - recalculates parent chain status based on remaining app statuses
 *  - auto-resolves the related incident
 */
export function useHealthcheck() {
  const [aiTarget, setAiTarget] = useState(null);
  const [aiRunning, setAiRunning] = useState(false);
  const [aiLogs, setAiLogs] = useState([]);
  const [aiPct, setAiPct] = useState(0);
  const [healed, setHealed] = useState(new Set());
  const timers = useRef([]);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  const runHealthcheck = useCallback(
    (id, setChains, setIncidents) => {
      if (aiRunning) return;
      clearTimers();
      setAiTarget(id);
      setAiRunning(true);
      setAiLogs([]);
      setAiPct(0);

      // Play back log steps
      AIOPS_STEPS.forEach(({ d, msg, t }) => {
        const tid = setTimeout(() => {
          setAiLogs((l) => [
            ...l,
            { msg, t, ts: new Date().toLocaleTimeString() },
          ]);
          setAiPct(Math.round((d / 10400) * 100));
        }, d);
        timers.current.push(tid);
      });

      // Final heal — fires after all logs complete
      const finalTid = setTimeout(() => {
        setAiRunning(false);
        setAiPct(100);
        setHealed((h) => new Set([...h, id]));

        setChains((prev) =>
          prev.map((ch) => {
            const updatedApps = ch.apps.map((app) => {
              if (app.id !== id) return app;
              return {
                ...app,
                status: 'GREEN',
                perf: Math.min(94, app.perf + 26),
                pStatus: 'GREEN',
                pScore: 94,
                forecast: 'Recovered — AI remediation applied',
                infra: app.infra.map((inf) => ({
                  ...inf,
                  h: inf.h === 'RED' ? 'GREEN' : inf.h,
                  m: inf.h === 'RED' ? Math.min(94, inf.m + 29) : inf.m,
                  anom: false,
                  detail: inf.h === 'RED' ? 'Recovered — nominal' : inf.detail,
                })),
              };
            });

            // Recalculate chain status from updated apps
            const chainHasApp = ch.apps.some((a) => a.id === id);
            if (!chainHasApp) return ch;
            const hasRed = updatedApps.some((a) => a.status === 'RED');
            const hasAmber = updatedApps.some((a) => a.status === 'AMBER');
            const newStatus = hasRed ? 'RED' : hasAmber ? 'AMBER' : 'GREEN';

            return {
              ...ch,
              apps: updatedApps,
              status: newStatus,
              pStatus: newStatus,
              uptime: Math.min(98, ch.uptime + 16),
              forecast:
                newStatus === 'GREEN'
                  ? 'Recovered — AI remediation applied'
                  : ch.forecast,
              trend: [...ch.trend.slice(1), Math.min(98, ch.uptime + 16)],
            };
          })
        );

        // Auto-resolve linked incident
        setIncidents((prev) =>
          prev.map((inc) =>
            inc.appId === id ? { ...inc, status: 'Auto-Resolved' } : inc
          )
        );
      }, 10800);

      timers.current.push(finalTid);
    },
    [aiRunning]
  );

  const dismissAiPanel = () => {
    clearTimers();
    setAiTarget(null);
    setAiLogs([]);
    setAiPct(0);
    setAiRunning(false);
  };

  return {
    aiTarget,
    aiRunning,
    aiLogs,
    aiPct,
    healed,
    runHealthcheck,
    dismissAiPanel,
  };
}
