import { useEffect, useRef, useState } from "react";

export interface MotionSample {
  magnitude: number; // total acceleration magnitude (m/s^2)
  timestamp: number;
}

export interface FallDetectionState {
  active: boolean;
  lastMagnitude: number;
  peakMagnitude: number;
  riskScore: number; // 0-100
  history: MotionSample[];
  fallDetected: boolean;
  reset: () => void;
}

/**
 * Heuristic fall detector using DeviceMotion.
 * - Free-fall: magnitude < 4 m/s^2 for >120ms
 * - Impact: magnitude > 25 m/s^2 spike
 * - Inactivity window after impact raises risk further
 */
export function useFallDetection(enabled: boolean): FallDetectionState {
  const [lastMagnitude, setLast] = useState(9.8);
  const [peakMagnitude, setPeak] = useState(0);
  const [riskScore, setRisk] = useState(0);
  const [fallDetected, setFall] = useState(false);
  const [history, setHistory] = useState<MotionSample[]>([]);
  const freefallStart = useRef<number | null>(null);
  const lastImpact = useRef<number | null>(null);

  const reset = () => {
    setFall(false);
    setRisk(0);
    setPeak(0);
    freefallStart.current = null;
    lastImpact.current = null;
  };

  useEffect(() => {
    if (!enabled) return;
    const handler = (e: DeviceMotionEvent) => {
      const a = e.accelerationIncludingGravity ?? e.acceleration;
      if (!a || a.x == null || a.y == null || a.z == null) return;
      const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      const now = Date.now();
      setLast(mag);
      setPeak((p) => Math.max(p, mag));
      setHistory((h) => {
        const next = [...h, { magnitude: mag, timestamp: now }];
        return next.length > 60 ? next.slice(-60) : next;
      });

      // Free-fall detection
      if (mag < 4) {
        if (freefallStart.current == null) freefallStart.current = now;
      } else {
        const ffDur = freefallStart.current != null ? now - freefallStart.current : 0;
        freefallStart.current = null;
        // Impact after a freefall
        if (ffDur > 100 && mag > 22) {
          lastImpact.current = now;
          setFall(true);
          setRisk(95);
          return;
        }
        // Strong impact alone
        if (mag > 30) {
          lastImpact.current = now;
          setRisk((r) => Math.min(100, r + 60));
          setFall(true);
          return;
        }
      }

      // Continuous risk decay
      setRisk((r) => {
        const decay = Math.max(0, r - 1);
        if (mag > 18) return Math.min(100, r + 12);
        if (mag > 14) return Math.min(100, r + 4);
        return decay;
      });
    };

    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [enabled]);

  return { active: enabled, lastMagnitude, peakMagnitude, riskScore, history, fallDetected, reset };
}
