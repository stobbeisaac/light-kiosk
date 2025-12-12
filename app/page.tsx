"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { Divider } from "@heroui/divider";
import { Button } from "@heroui/button";
import { Spacer } from "@heroui/spacer";

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

type WeatherState = {
  temperature: number | null;
  condition: string;
  icon: string;
  updated: string | null;
};

export default function Home() {
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
    updated: null,
  });
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

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
  }, [fetchWeather]);

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
              {weather.icon}
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
    </section>
  );
}
