"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Spacer } from "@heroui/spacer";
import { ThemeSwitch } from "@/components/theme-switch";

type LightKey = "living" | "kitchen" | "bedroom" | "porch";

const LIGHTS: { key: LightKey; label: string }[] = [
  { key: "living", label: "Living" },
  { key: "kitchen", label: "Kitchen" },
  { key: "bedroom", label: "Bedroom" },
  { key: "porch", label: "Porch" },
];

const WEATHER_TEXT: Record<number, string> = {
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

const WEATHER_ICON: Record<number, string> = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "❄️",
  80: "🌦️",
  95: "⛈️",
};

const WEATHER_ICON_NIGHT: Record<number, string> = {
  0: "🌙",
  1: "🌙",
  2: "☁️",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌧️",
  53: "🌧️",
  55: "🌧️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "❄️",
  80: "🌦️",
  95: "⛈️",
};

type WeatherState = {
  temperature: number | null;
  condition: string;
  icon: string;
  code: number | null;
  updated: string | null;
};

type SunTimes = {
  sunrise: string | null;
  sunset: string | null;
  sunriseTs: number | null;
  sunsetTs: number | null;
};

type NextEvent = {
  title: string;
  when: string; // formatted local
  location?: string;
} | null;

export default function Home() {
  const { resolvedTheme } = useTheme();
  const isLightMode = resolvedTheme === "light";

  const [lights, setLights] = useState<Record<LightKey, boolean>>({
    living: false,
    kitchen: false,
    bedroom: false,
    porch: false,
  });

  const [now, setNow] = useState(() => new Date());
  const [weather, setWeather] = useState<WeatherState>({
    temperature: null,
    condition: "Loading…",
    icon: "⏳",
    code: null,
    updated: null,
  });
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [sun, setSun] = useState<SunTimes>({ sunrise: null, sunset: null, sunriseTs: null, sunsetTs: null });
  const [calendarEvent, setCalendarEvent] = useState<NextEvent>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const allOn = useMemo(() => Object.values(lights).every(Boolean), [lights]);
  const anyOn = useMemo(() => Object.values(lights).some(Boolean), [lights]);

  const handleLightToggle = (key: LightKey, value: boolean) => {
    setLights((prev) => ({ ...prev, [key]: value }));
  };

  const handleMasterToggle = (value: boolean) => {
    const nextState = LIGHTS.reduce<Record<LightKey, boolean>>(
      (acc, light) => {
        acc[light.key] = value;
        return acc;
      },
      { living: value, kitchen: value, bedroom: value, porch: value },
    );
    setLights(nextState);
  };

  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(now),
    [now],
  );

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(now),
    [now],
  );

  const isNight = useMemo(() => {
    if (!sun.sunriseTs || !sun.sunsetTs) return false;
    const nowTs = now.getTime();
    return nowTs < sun.sunriseTs || nowTs > sun.sunsetTs;
  }, [now, sun.sunriseTs, sun.sunsetTs]);

  const displayWeatherIcon = useMemo(() => {
    if (isNight && weather.code !== null) {
      return WEATHER_ICON_NIGHT[weather.code] ?? "🌙";
    }
    return weather.icon;
  }, [isNight, weather.code, weather.icon]);

  const fetchWeather = useCallback(async () => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const latitude = 45.06989883329087; // TODO: set to your location
      const longitude = -93.13558816922529;
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Weather unavailable");
      }

      const data = await response.json();
      const code = Number(data?.current?.weather_code ?? 3);
      const temperature = Number(data?.current?.temperature_2m ?? 0);
      const condition = WEATHER_TEXT[code] ?? "Cloudy";
      const icon = WEATHER_ICON[code] ?? "☁️";

      setWeather({
        temperature,
        condition,
        icon,
        code,
        updated: new Date().toLocaleTimeString(),
      });
    } catch (error) {
      setWeatherError((error as Error).message);
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();
    const id = setInterval(() => {
      fetchWeather();
    }, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(id);
  }, [fetchWeather]);

  const fetchSunriseSunset = useCallback(async () => {
    try {
      const latitude = 45.06989883329087;
      const longitude = -93.13558816922529;
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

  // Minimal ICS parser for next event from server-side proxy
  const fetchCalendar = useCallback(async () => {
    try {
      setCalendarError(null);
      const r = await fetch("/api/calendar");
      if (!r.ok) throw new Error("Calendar unavailable");
      const text = await r.text();
      const events = text.split(/BEGIN:VEVENT/).slice(1).map((chunk) => "BEGIN:VEVENT" + chunk);
      const parseLine = (key: string, s: string) => {
        const re = new RegExp(`^${key}[^:]*:(.+)$`, "m");
        const m = s.match(re);
        return m ? m[1].trim() : undefined;
      };
      const parseDate = (raw?: string) => {
        if (!raw) return null;
        // Remove any trailing carriage returns or whitespace
        raw = raw.trim();
        // Handles YYYYMMDDTHHMMSSZ (UTC)
        if (/^\d{8}T\d{6}Z$/.test(raw)) {
          return new Date(raw.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, "$1-$2-$3T$4:$5:$6Z"));
        }
        // Handles YYYYMMDDTHHMMSS (local time, no Z)
        if (/^\d{8}T\d{6}$/.test(raw)) {
          return new Date(raw.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6"));
        }
        // Handles YYYYMMDD (all-day)
        if (/^\d{8}$/.test(raw)) {
          return new Date(raw.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3T00:00:00"));
        }
        // Try ISO fallback
        return new Date(raw);
      };
      const nowTs = Date.now();
      const parsed = events
        .map((e) => {
          const dt = parseDate(parseLine("DTSTART", e));
          const title = parseLine("SUMMARY", e) || "Event";
          const loc = parseLine("LOCATION", e);
          return dt ? { dt, title, loc } : null;
        })
        .filter(Boolean) as { dt: Date; title: string; loc?: string }[];
      parsed.sort((a, b) => a.dt.getTime() - b.dt.getTime());
      const next = parsed.find((p) => p.dt.getTime() >= nowTs);
      if (next) {
        const when = new Intl.DateTimeFormat("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }).format(next.dt);
        setCalendarEvent({ title: next.title, when, location: next.loc });
      }
    } catch (e) {
      setCalendarError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    fetchSunriseSunset();
    fetchCalendar();
    
    // Refresh sunrise/sunset every hour
    const sunId = setInterval(() => {
      fetchSunriseSunset();
    }, 60 * 60 * 1000);
    
    // Refresh calendar every 5 minutes
    const calId = setInterval(() => {
      fetchCalendar();
    }, 5 * 60 * 1000);
    
    return () => {
      clearInterval(sunId);
      clearInterval(calId);
    };
  }, [fetchSunriseSunset, fetchCalendar]);

  return (
    <section className="w-full max-w-md mx-auto flex flex-col gap-2 py-2 px-2">
      <div className="grid gap-2 grid-cols-2">
        <Card className="border border-default-100 bg-content1">
          <CardBody className="flex flex-col gap-1 py-2 px-3">
            <p className="text-[0.6rem] uppercase tracking-[0.15em] text-default-500">Time</p>
            <p className="text-2xl font-bold leading-tight">{formattedTime}</p>
            <p className="text-default-500 text-[0.65rem]">{formattedDate}</p>
          </CardBody>
        </Card>

        <Card className="border border-default-100 bg-content1">
          <CardBody className="flex items-center gap-2 py-2 px-3">
            <div className="text-3xl" aria-hidden>
              {displayWeatherIcon}
            </div>
            <div className="flex flex-col">
              <p className="text-[0.6rem] uppercase tracking-[0.15em] text-default-500">Weather</p>
              <p className="text-2xl font-bold">
                {weather.temperature !== null ? `${weather.temperature.toFixed(0)}°F` : "--"}
              </p>
              <p className="text-default-500 text-xs">{weather.condition}</p>
              {weatherError ? (
                <p className="text-danger text-xs">{weatherError}</p>
              ) : null}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card className="border border-default-100 bg-content1">
        <CardBody className="flex items-center justify-between gap-2 py-2 px-3">
          <div className="flex items-center gap-2">
            <p className="text-[0.6rem] uppercase tracking-[0.15em] text-default-500">Master</p>
            <span className="text-default-500 text-xs">{allOn ? "All On" : anyOn ? "Mixed" : "All Off"}</span>
          </div>
          <Switch
            size="lg"
            className="scale-[1.4]"
            color={allOn ? "success" : "default"}
            isSelected={allOn}
            onValueChange={handleMasterToggle}
          >
            {allOn ? "Off" : "On"}
          </Switch>
        </CardBody>
      </Card>

      <div className="grid gap-2 grid-cols-2">
        {LIGHTS.map((light) => {
          const isOn = lights[light.key];
          return (
            <Card key={light.key} className="border border-default-100 bg-content1">
              <CardBody className="flex items-center justify-between gap-2 py-2 px-3">
                <div className="flex items-center gap-2">
                  <p className="text-[0.6rem] uppercase tracking-[0.15em] text-default-500">{light.label}</p>
                  <span className="text-default-500 text-xs">{isOn ? "On" : "Off"}</span>
                </div>
                <Switch
                  size="lg"
                  className="scale-[1.4]"
                  color={isOn ? "success" : "default"}
                  isSelected={isOn}
                  onValueChange={(value) => handleLightToggle(light.key, value)}
                >
                  {isOn ? "On" : "Off"}
                </Switch>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Day/Night Cycle - Full Width */}
      <Card className="border border-default-100 bg-content1">
        <CardBody className="py-2 px-2">
          <DayNightCycle
            now={now}
            sunriseTs={sun.sunriseTs}
            sunsetTs={sun.sunsetTs}
            sunriseLabel={sun.sunrise}
            sunsetLabel={sun.sunset}
            isLightMode={isLightMode}
          />
        </CardBody>
      </Card>

      {/* Utility row: Calendar and Theme toggle */}
      <div className="grid gap-2 grid-cols-2">
        <Card className="border border-default-100 bg-content1">
          <CardBody className="flex flex-col gap-1 py-2 px-3">
            <p className="text-[0.6rem] uppercase tracking-[0.15em] text-default-500">Next Event</p>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">
                {calendarEvent ? calendarEvent.title : calendarError || "No upcoming events"}
              </p>
              {calendarEvent && (
                <p className="text-xs text-default-500">{calendarEvent.when}</p>
              )}
            </div>
          </CardBody>
        </Card>
        <Card className="border border-default-100 bg-content1">
          <CardBody className="flex items-center justify-between py-2 px-3">
            <p className="text-[0.6rem] uppercase tracking-[0.15em] text-default-500">Theme</p>
            <ThemeSwitch className="scale-125" />
          </CardBody>
        </Card>
      </div>
    </section>
  );
}

function DayNightCycle({
  now,
  sunriseTs,
  sunsetTs,
  sunriseLabel,
  sunsetLabel,
  isLightMode,
}: {
  now: Date;
  sunriseTs: number | null;
  sunsetTs: number | null;
  sunriseLabel: string | null;
  sunsetLabel: string | null;
  isLightMode: boolean;
}) {
  const w = 280;
  const h = 120;
  const amplitude = 32;
  const baseline = h / 2 + 8;
  const padding = 20;
  const waveWidth = w - 2 * padding;

  let sunX = padding;
  let sunY = baseline;
  let isDay = false;

  if (sunriseTs && sunsetTs) {
    const nowTs = now.getTime();
    const dayLength = sunsetTs - sunriseTs;
    const fullCycle = 24 * 60 * 60 * 1000;

    // Determine position in 24h cycle
    let cycleProgress = 0;
    
    if (nowTs >= sunriseTs && nowTs <= sunsetTs) {
      // During day: 0 to 0.5
      isDay = true;
      cycleProgress = (nowTs - sunriseTs) / (2 * fullCycle);
    } else if (nowTs > sunsetTs) {
      // After sunset: 0.5 to 1.0
      cycleProgress = 0.5 + (nowTs - sunsetTs) / (2 * fullCycle);
    } else {
      // Before sunrise: continuing from previous night
      const nightStart = sunsetTs - fullCycle;
      cycleProgress = 0.5 + (nowTs - nightStart) / (2 * fullCycle);
    }

    // Position along wave
    sunX = padding + cycleProgress * waveWidth;
    sunY = baseline - amplitude * Math.sin(cycleProgress * 2 * Math.PI);
  }

  // Generate sine wave path
  const pathPoints: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const progress = i / 100;
    const x = padding + progress * waveWidth;
    const y = baseline - amplitude * Math.sin(progress * 2 * Math.PI);
    pathPoints.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  const wavePath = pathPoints.join(" ");

  // Calculate gradient stops for day (top) and night (bottom)
  const gradientStops = [];
  for (let i = 0; i <= 20; i++) {
    const progress = i / 20;
    const y = baseline - amplitude * Math.sin(progress * 2 * Math.PI);
    const isDayPart = y < baseline;
    gradientStops.push({
      offset: progress * 100,
      color: isDayPart ? "#f59e0b" : "#3b82f6",
    });
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 px-2">
        <p className="text-sm font-semibold">Sunrise & Sunset</p>
      </div>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="mx-auto block" aria-hidden>
        <defs>
          <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            {gradientStops.map((stop, i) => (
              <stop key={i} offset={`${stop.offset}%`} stopColor={stop.color} />
            ))}
          </linearGradient>
        </defs>

        {/* Horizon line */}
        <line
          x1={padding}
          y1={baseline}
          x2={w - padding}
          y2={baseline}
          stroke="#4b5563"
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        {/* Wave */}
        <path d={wavePath} stroke="url(#waveGradient)" strokeWidth={3} fill="none" strokeLinecap="round" />

        {/* Sunrise marker */}
        <line x1={padding} y1={baseline - 10} x2={padding} y2={baseline + 10} stroke="#6b7280" strokeWidth={2} />
        <text x={padding} y={h - 8} fontSize={10} fontWeight={600} fill="currentColor" textAnchor="middle">
          {sunriseLabel ?? "--"}
        </text>

        {/* Sunset marker */}
        <line x1={w / 2} y1={baseline - 10} x2={w / 2} y2={baseline + 10} stroke="#6b7280" strokeWidth={2} />
        <text x={w / 2} y={h - 8} fontSize={10} fontWeight={600} fill="currentColor" textAnchor="middle">
          {sunsetLabel ?? "--"}
        </text>

        {/* Next sunrise marker */}
        <line x1={w - padding} y1={baseline - 10} x2={w - padding} y2={baseline + 10} stroke="#6b7280" strokeWidth={2} />
        <text x={w - padding} y={h - 8} fontSize={10} fontWeight={600} fill="currentColor" textAnchor="middle">
          {sunriseLabel ?? "--"}
        </text>

        {/* Sun/Moon icon */}
        {isDay ? (
          <circle cx={sunX} cy={sunY} r={9} fill="#FDB813" stroke="#fff" strokeWidth={2.5} />
        ) : (
          <g>
            <circle
              cx={sunX}
              cy={sunY}
              r={9}
              fill={isLightMode ? "#cfd8e3" : "#E5E7EB"}
              stroke={isLightMode ? "#94a3b8" : "#fff"}
              strokeWidth={2.5}
            />
            <circle cx={sunX + 3.5} cy={sunY - 2} r={8} fill={isLightMode ? "#475569" : "#1f2937"} />
          </g>
        )}
      </svg>
    </div>
  );
}
