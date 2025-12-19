import type { LightKey } from "@/types/lights";

export function getDeviceId(lightKey: LightKey): string | undefined {
  const deviceEnvMap: Record<LightKey, string | undefined> = {
    living: process.env.NEXT_PUBLIC_HUE_BULB_1,
    kitchen: process.env.NEXT_PUBLIC_HUE_BULB_2,
    bed_strip: process.env.NEXT_PUBLIC_HUE_BULB_3,
    porch: process.env.NEXT_PUBLIC_HUE_BULB_4,
  };
  return deviceEnvMap[lightKey];
}

export function getAllDeviceIds(): string[] {
  return [
    process.env.NEXT_PUBLIC_HUE_BULB_1,
    process.env.NEXT_PUBLIC_HUE_BULB_2,
    process.env.NEXT_PUBLIC_HUE_BULB_3,
    process.env.NEXT_PUBLIC_HUE_BULB_4,
  ].filter(Boolean) as string[];
}

export function getRainbowDeviceIds(): string[] {
  return [
    process.env.NEXT_PUBLIC_HUE_BULB_1,
    process.env.NEXT_PUBLIC_HUE_BULB_2,
    process.env.NEXT_PUBLIC_HUE_BULB_3,
  ].filter(Boolean) as string[];
}

export function getWeatherIconName(weatherCode: number | null, isNight: boolean): string {
  const ICON_MAP: Record<number, string> = {
    0: "clear",
    1: "mostly-clear",
    2: "partly",
    3: "cloudy",
    45: "fog",
    48: "fog",
    51: "rain-light",
    53: "rain",
    55: "rain",
    61: "rain",
    63: "rain",
    65: "rain",
    71: "snow",
    80: "rain",
    95: "storm",
  };

  const kind = weatherCode !== null ? ICON_MAP[weatherCode] ?? "cloudy" : "cloudy";
  
  if (kind === "clear" || kind === "mostly-clear") {
    return isNight ? "meteocons:clear-night-fill" : "meteocons:clear-day-fill";
  }
  if (kind === "partly") {
    return isNight ? "meteocons:partly-cloudy-night-fill" : "meteocons:partly-cloudy-day-fill";
  }
  if (kind === "cloudy") return "meteocons:cloudy-fill";
  if (kind === "fog") return "meteocons:fog-fill";
  if (kind === "rain-light") return "meteocons:drizzle-fill";
  if (kind === "rain") return "meteocons:rain-fill";
  if (kind === "snow") return "meteocons:snow-fill";
  if (kind === "storm") return "meteocons:storm-fill";
  
  return isNight ? "meteocons:partly-cloudy-night-fill" : "meteocons:partly-cloudy-day-fill";
}
