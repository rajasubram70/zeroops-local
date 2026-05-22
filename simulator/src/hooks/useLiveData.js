import { useState, useEffect } from 'react';

const BRIDGE_URL = 'http://localhost:5002';
const POLL_MS    = 30000;

export function useLiveData(endpoint, fallback = null) {
  const [data,     setData]     = useState(fallback);
  const [isLive,   setIsLive]   = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const fetch_data = async () => {
      try {
        const res  = await fetch(`${BRIDGE_URL}${endpoint}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const live = await res.json();
        const hasData = Array.isArray(live) ? live.length > 0 : Object.keys(live).length > 0;
        if (hasData) {
          setData(live);
          setIsLive(true);
          setLastSync(new Date());
        }
      } catch {
        setIsLive(false);
      }
    };

    fetch_data();
    const interval = setInterval(fetch_data, POLL_MS);
    return () => clearInterval(interval);
  }, [endpoint]);

  return { data, isLive, lastSync };
}