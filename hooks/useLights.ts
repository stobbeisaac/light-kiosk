"use client";

import { useState, useMemo, useCallback } from "react";
import type { LightKey } from "@/types/lights";
import { LIGHTS } from "@/lib/constants";
import { getDeviceId, getAllDeviceIds, getRainbowDeviceIds } from "@/lib/utils";

export function useLights() {
  const [lights, setLights] = useState<Record<LightKey, boolean>>({
    living: false,
    kitchen: false,
    bed_strip: false,
    porch: false,
  });
  
  const [brightness, setBrightness] = useState<Record<LightKey, number>>({
    living: 128,
    kitchen: 128,
    bed_strip: 128,
    porch: 128,
  });
  
  const [rainbowOn, setRainbowOn] = useState(false);

  const allOn = useMemo(() => Object.values(lights).every(Boolean), [lights]);
  const anyOn = useMemo(() => Object.values(lights).some(Boolean), [lights]);

  const handleLightToggle = useCallback((key: LightKey, value: boolean) => {
    setLights((prev) => ({ ...prev, [key]: value }));
    const device = getDeviceId(key);
    if (device) {
      fetch(`/api/lights/${device}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: value }),
      }).catch(() => {});
    }
  }, []);

  const handleBrightnessChange = useCallback((key: LightKey, value: number) => {
    setBrightness((prev) => ({ ...prev, [key]: value }));
    const device = getDeviceId(key);
    if (device) {
      fetch(`/api/lights/${device}/brightness`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brightness: value }),
      }).catch(() => {});
    }
  }, []);

  const handleMasterToggle = useCallback((value: boolean) => {
    const nextState = LIGHTS.reduce<Record<LightKey, boolean>>(
      (acc, light) => {
        acc[light.key] = value;
        return acc;
      },
      { living: value, kitchen: value, bed_strip: value, porch: value },
    );
    setLights(nextState);
    
    const devices = getAllDeviceIds();
    devices.forEach((dev) => {
      fetch(`/api/lights/${dev}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on: value }),
      }).catch(() => {});
    });
  }, []);

  const handleRainbowToggle = useCallback((value: boolean) => {
    setRainbowOn(value);
    const devices = getRainbowDeviceIds();
    devices.forEach((dev) => {
      fetch(`/api/lights/${dev}/rainbow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: value }),
      }).catch(() => {});
    });
  }, []);

  return {
    lights,
    brightness,
    rainbowOn,
    allOn,
    anyOn,
    handleLightToggle,
    handleBrightnessChange,
    handleMasterToggle,
    handleRainbowToggle,
  };
}
