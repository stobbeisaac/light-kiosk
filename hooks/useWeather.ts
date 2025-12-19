"use client";

import { useCallback, useEffect, useState } from "react";
import type { WeatherState } from "@/types/weather";
import { WEATHER_TEXT, WEATHER_ICON } from "@/lib/constants";

export function useWeather() {
  const [weather, setWeather] = useState<WeatherState>({
    temperature: null,
    condition: "Loading…",
    icon: "⏳",
    code: null,
    updated: null,
  });
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  const fetchWeather = useCallback(async () => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const latitude = Number(process.env.NEXT_PUBLIC_LATITUDE ?? "0");
      const longitude = Number(process.env.NEXT_PUBLIC_LONGITUDE ?? "0");
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

  return { weather, weatherError, loadingWeather };
}
