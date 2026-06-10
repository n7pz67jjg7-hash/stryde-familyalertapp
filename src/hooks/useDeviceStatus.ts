import { useEffect, useState } from "react";

export type GeoStatus = "idle" | "requesting" | "granted" | "denied" | "error";

export interface DeviceStatus {
  battery: { level: number | null; charging: boolean; supported: boolean };
  online: boolean;
  geo: { status: GeoStatus; coords: { lat: number; lng: number; accuracy: number } | null; error?: string };
  motion: { supported: boolean; permission: "granted" | "denied" | "prompt" | "unknown" };
}

interface BatteryManager extends EventTarget {
  level: number;
  charging: boolean;
}

export function useDeviceStatus(): DeviceStatus & { requestMotion: () => Promise<void>; requestGeo: () => void } {
  const [battery, setBattery] = useState<DeviceStatus["battery"]>({ level: null, charging: false, supported: false });
  const [online, setOnline] = useState<boolean>(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [geo, setGeo] = useState<DeviceStatus["geo"]>({ status: "idle", coords: null });
  const [motion, setMotion] = useState<DeviceStatus["motion"]>({
    supported: typeof window !== "undefined" && "DeviceMotionEvent" in window,
    permission: "unknown",
  });

  // Battery
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManager> };
    if (!nav.getBattery) {
      setBattery({ level: null, charging: false, supported: false });
      return;
    }
    let mgr: BatteryManager | null = null;
    const update = () => mgr && setBattery({ level: Math.round(mgr.level * 100), charging: mgr.charging, supported: true });
    nav.getBattery().then((m) => {
      mgr = m;
      update();
      m.addEventListener("levelchange", update);
      m.addEventListener("chargingchange", update);
    }).catch(() => setBattery({ level: null, charging: false, supported: false }));
    return () => {
      if (!mgr) return;
      mgr.removeEventListener("levelchange", update);
      mgr.removeEventListener("chargingchange", update);
    };
  }, []);

  // Network
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Geolocation watch
  const requestGeo = () => {
    if (!("geolocation" in navigator)) {
      setGeo({ status: "error", coords: null, error: "Geolocation unsupported" });
      return;
    }
    setGeo((g) => ({ ...g, status: "requesting" }));
    navigator.geolocation.getCurrentPosition(
      (pos) => setGeo({ status: "granted", coords: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy } }),
      (err) => setGeo({ status: err.code === 1 ? "denied" : "error", coords: null, error: err.message }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 },
    );
  };

  useEffect(() => {
    if (!("geolocation" in navigator)) return;
    let id: number | null = null;
    try {
      id = navigator.geolocation.watchPosition(
        (pos) => setGeo({ status: "granted", coords: { lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy } }),
        (err) => setGeo((g) => g.status === "granted" ? g : { status: err.code === 1 ? "denied" : "error", coords: null, error: err.message }),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 },
      );
    } catch { /* noop */ }
    return () => { if (id !== null) navigator.geolocation.clearWatch(id); };
  }, []);

  // Motion permission (iOS requires user gesture)
  const requestMotion = async () => {
    const DM = (window as unknown as { DeviceMotionEvent?: { requestPermission?: () => Promise<"granted" | "denied"> } }).DeviceMotionEvent;
    if (DM?.requestPermission) {
      try {
        const res = await DM.requestPermission();
        setMotion((m) => ({ ...m, permission: res }));
      } catch {
        setMotion((m) => ({ ...m, permission: "denied" }));
      }
    } else {
      setMotion((m) => ({ ...m, permission: "granted" }));
    }
  };

  return { battery, online, geo, motion, requestMotion, requestGeo };
}
