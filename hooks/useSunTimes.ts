"use client";

import { useCallback, useEffect, useState } from "react";
import type { SunTimes } from "@/types/weather";

export function useSunTimes() {
  const [sun, setSun] = useState<SunTimes>({
    sunrise: null,
    sunset: null,
    sunriseTs: null,
    sunsetTs: null,
  });

  const fetchSunriseSunset = useCallback(async () => {
    try {
      const latitude = Number(process.env.NEXT_PUBLIC_LATITUDE ?? "0");
      const longitude = Number(process.env.NEXT_PUBLIC_LONGITUDE ?? "0");
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=sunrise,sunset&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Sun times unavailable");
      const data = await res.json();
      const sr = data?.daily?.sunrise?.[0];
      const ss = data?.daily?.sunset?.[0];
      const fmt = (d?: Date) =>
        d
          ? new Intl.DateTimeFormat("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            }).format(d)
          : null;
      const srDate = sr ? new Date(sr) : null;
      const ssDate = ss ? new Date(ss) : null;
      setSun({
        sunrise: fmt(srDate || undefined),
        sunset: fmt(ssDate || undefined),
        sunriseTs: srDate ? srDate.getTime() : null,
        sunsetTs: ssDate ? ssDate.getTime() : null,
      });
    } catch (e) {
      // keep silent; optional widget
    }
  }, []);

  useEffect(() => {
    fetchSunriseSunset();
    // Refresh sunrise/sunset every hour
    const sunId = setInterval(() => {
      fetchSunriseSunset();
    }, 60 * 60 * 1000);
    return () => clearInterval(sunId);
  }, [fetchSunriseSunset]);

  return sun;
}
