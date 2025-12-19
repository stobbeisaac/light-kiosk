import type { LightConfig } from "@/types/lights";

export const LIGHTS: LightConfig[] = [
  { key: "living", label: "Dresser Lamp" },
  { key: "kitchen", label: "Guitar Lamp" },
  { key: "bed_strip", label: "Bed Lights" },
  { key: "porch", label: "Guitar Lights" },
];

export const WEATHER_TEXT: Record<number, string> = {
  0: "Clear",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Cloudy",
  45: "Fog",
  48: "Fog",
  51: "Drizzle",
  53: "Drizzle",
  55: "Drizzle",
  61: "Rain",
  63: "Rain",
  65: "Rain",
  71: "Snow",
  80: "Showers",
  95: "Storm",
};

export const WEATHER_ICON: Record<number, string> = {
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
