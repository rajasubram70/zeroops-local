import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useMetricsTicker
 * Simulates real-time metric drift.
 * NEW: predictive alerts when metrics trend toward thresholds
 * NEW: demo degradation mode — one chain slowly degrades for live demo
 */
export function useMetricsTicker(chains, healed) {
  const [liveMetrics, setLiveMetrics] = useState({});
  const [predictAlerts, setPredictAlerts] = useState([]); // [{appId, component, current, eta, trend}]
  const [demoDegrade, setDemoDegrade] = useState(false);
  const [degradeChainId, setDegradeChainId] = useState('engineering-platform');
  const historyRef = useRef({}); // rolling 5-point history per key for trend calc

  // Initialise from chains
  useEffect(() => {
    const init = {};
    (chains || []).forEach((ch) =>
      (ch.apps || []).forEach((app) =>
        (app.infra || []).forEach((inf) => {
          init[`${app.id}:${inf.c}`] = inf.m;
        })
      )
    );
    setLiveMetrics(init);
    historyRef.current = { ...init };
  }, []); // eslint-disable-line

  useEffect(() => {
    const tick = setInterval(() => {
      setLiveMetrics((prev) => {
        const next = { ...prev };
        const newAlerts = [];

        (chains || []).forEach((ch) =>
          (ch.apps || []).forEach((app) =>
            (app.infra || []).forEach((inf) => {
              const key = `${app.id}:${inf.c}`;
              const cur = next[key] ?? inf.m;
              const isHealed = healed.has(app.id);

              // Demo degradation — slowly degrade first GREEN app in target chain
              const isDemoTarget =
                demoDegrade &&
                ch.id === degradeChainId &&
                (app.status === 'GREEN' || app.status === 'AMBER') &&
                (inf.h === 'GREEN' || inf.h === 'AMBER');

              let nextVal = cur;

              if (isHealed) {
                const target = 90;
                nextVal = Math.min(target, cur + Math.random() * 2);
              } else if (isDemoTarget) {
                // Controlled slow degradation — 0.4-0.8% per tick (every 4s)
                // Goes from ~90% down toward 95% over ~3 minutes
                nextVal = Math.min(99, cur + 0.4 + Math.random() * 0.4);
              } else if (app.status === 'RED' || inf.h === 'RED') {
                const drift = Math.random() * 2 - 0.5;
                nextVal = Math.max(40, Math.min(72, cur + drift - 0.3));
              } else if (app.status === 'AMBER' || inf.h === 'AMBER') {
                const noise = Math.random() * 4 - 2;
                nextVal = Math.max(60, Math.min(92, cur + noise));
              } else {
                const noise = Math.random() * 2 - 1;
                nextVal = Math.max(88, Math.min(100, cur + noise));
              }

              nextVal = Math.round(nextVal * 10) / 10;
              next[key] = nextVal;

              // ── PREDICTIVE ALERT ─────────────────────────────
              // Track rolling history (last 5 ticks)
              if (!historyRef.current[key]) historyRef.current[key] = [];
              const hist = historyRef.current[key];
              if (!Array.isArray(hist)) {
                historyRef.current[key] = [nextVal];
              } else {
                hist.push(nextVal);
                if (hist.length > 5) hist.shift();
              }

              // Only predict for GREEN/AMBER components not yet in alarm
              if (inf.h === 'GREEN' || isDemoTarget) {
                const h = historyRef.current[key];
                if (Array.isArray(h) && h.length >= 3) {
                  // Linear trend over last N points
                  const n = h.length;
                  const slope = (h[n - 1] - h[0]) / n; // per tick
                  const TICK_SECS = 4;
                  const WARNING_THRESHOLD = 80;
                  const CRITICAL_THRESHOLD = 95;

                  // Predict when metric will hit warning threshold
                  if (
                    slope > 0.1 &&
                    nextVal < CRITICAL_THRESHOLD &&
                    nextVal > WARNING_THRESHOLD - 5
                  ) {
                    const ticksToWarning =
                      slope > 0 ? (WARNING_THRESHOLD - nextVal) / slope : null;
                    const ticksToCritical =
                      slope > 0 ? (CRITICAL_THRESHOLD - nextVal) / slope : null;
                    const secsToCritical = ticksToCritical
                      ? ticksToCritical * TICK_SECS
                      : null;

                    if (
                      secsToCritical &&
                      secsToCritical > 0 &&
                      secsToCritical < 10800
                    ) {
                      const hours = Math.floor(secsToCritical / 3600);
                      const minutes = Math.floor((secsToCritical % 3600) / 60);
                      const etaStr =
                        hours > 0 ? `~${hours}h ${minutes}m` : `~${minutes}m`;

                      newAlerts.push({
                        appId: app.id,
                        appName: app.name,
                        chainId: ch.id,
                        chainName: ch.name,
                        component: inf.c,
                        current: Math.round(nextVal),
                        eta: etaStr,
                        slope: Math.round(slope * 100) / 100,
                        severity: nextVal > 85 ? 'HIGH' : 'MEDIUM',
                        key,
                      });
                    }
                  }
                }
              }
            })
          )
        );

        // Update predictive alerts (replace old ones for same key)
        if (newAlerts.length > 0) {
          setPredictAlerts((prev) => {
            const existing = prev.filter(
              (a) => !newAlerts.find((n) => n.key === a.key)
            );
            return [...existing, ...newAlerts].slice(0, 8);
          });
        } else if (!demoDegrade) {
          // Clear stale alerts after a few ticks when not degrading
          setPredictAlerts((prev) =>
            prev.filter((a) =>
              (chains || []).some((ch) =>
                (ch.apps || []).some(
                  (ap) =>
                    ap.id === a.appId &&
                    (ap.status === 'GREEN' || ap.status === 'AMBER')
                )
              )
            )
          );
        }

        return next;
      });
    }, 4000);

    return () => clearInterval(tick);
  }, [chains, healed, demoDegrade, degradeChainId]);

  const getMetric = useCallback(
    (appId, component, fallback) => {
      return liveMetrics[`${appId}:${component}`] ?? fallback;
    },
    [liveMetrics]
  );

  const startDegradation = useCallback((chainId = 'engineering-platform') => {
    setDegradeChainId(chainId);
    setDemoDegrade(true);
  }, []);

  const stopDegradation = useCallback(() => {
    setDemoDegrade(false);
    setPredictAlerts([]);
  }, []);

  return {
    liveMetrics,
    getMetric,
    predictAlerts,
    demoDegrade,
    startDegradation,
    stopDegradation,
  };
}
