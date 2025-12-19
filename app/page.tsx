"use client";

import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import { Card, CardBody } from "@heroui/card";
import { Switch } from "@heroui/switch";
import { ThemeSwitch } from "@/components/theme-switch";
import { DayNightCycle } from "@/components/DayNightCycle";
import { BrightnessModal } from "@/components/BrightnessModal";
import { LightCard } from "@/components/LightCard";
import { useWeather } from "@/hooks/useWeather";
import { useSunTimes } from "@/hooks/useSunTimes";
import { useCalendar } from "@/hooks/useCalendar";
import { useLights } from "@/hooks/useLights";
import { LIGHTS } from "@/lib/constants";
import { getWeatherIconName } from "@/lib/utils";
import type { LightKey } from "@/types/lights";

export default function Home() {
  const { resolvedTheme } = useTheme();
  const isLightMode = resolvedTheme === "light";

  const [now, setNow] = useState(() => new Date());
  const [brightnessModalOpen, setBrightnessModalOpen] = useState(false);
  const [selectedLightForBrightness, setSelectedLightForBrightness] = useState<LightKey | null>(null);

  const { weather, weatherError } = useWeather();
  const sun = useSunTimes();
  const { calendarEvent, calendarError } = useCalendar();
  const {
    lights,
    brightness,
    rainbowOn,
    allOn,
    anyOn,
    handleLightToggle,
    handleBrightnessChange,
    handleMasterToggle,
    handleRainbowToggle,
  } = useLights();

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!brightnessModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeBrightnessModal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [brightnessModalOpen]);



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

  const weatherIconName = useMemo(
    () => getWeatherIconName(weather.code, isNight),
    [weather.code, isNight]
  );

  const openBrightnessModal = (key: LightKey) => {
    setSelectedLightForBrightness(key);
    setBrightnessModalOpen(true);
  };

  const closeBrightnessModal = () => {
    setBrightnessModalOpen(false);
    setSelectedLightForBrightness(null);
  };

  const handleBrightnessChangeWrapper = (value: number) => {
    if (selectedLightForBrightness) {
      handleBrightnessChange(selectedLightForBrightness, value);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-0 transition-opacity duration-500"
        aria-hidden="true"
        style={{
          backgroundImage: rainbowOn 
            ? 'linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab, #f093fb, #f5576c, #4facfe)' 
            : 'none',
          backgroundSize: '400% 400%',
          animation: rainbowOn ? 'rainbowGradient 15s ease infinite' : 'none',
          opacity: rainbowOn ? 1 : 0,
        }}
      />
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes rainbowGradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `
      }} />
      <section className="relative z-10 w-full max-w-md mx-auto flex flex-col gap-2 py-2 px-2">
      {/* Time & Weather */}
      <div className="grid gap-2 grid-cols-2">
        <Card className="border border-default-100 bg-content1">
          <CardBody className="flex flex-col items-center justify-center gap-1 py-4 px-3 text-center">
            <p className="text-[0.6rem] uppercase tracking-[0.15em] text-default-500">Time</p>
            <p className="text-2xl font-bold leading-tight">{formattedTime}</p>
            <p className="text-default-500 text-[0.65rem]">{formattedDate}</p>
          </CardBody>
        </Card>

        <Card className="border border-default-100 bg-content1">
          <CardBody className="flex items-center gap-2 py-3 px-3">
            <div className="w-11 h-11 text-foreground" aria-hidden>
              <Icon icon={weatherIconName} width={44} height={44} />
            </div>
            <div className="flex flex-col items-center text-center">
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

      {/* Master & Rainbow Controls */}
      <div className="grid gap-2 grid-cols-2">
        <Card className="border border-default-100 bg-content1">
          <CardBody className="flex items-center justify-between gap-2 py-3 px-3">
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

        <Card className="border border-default-100 bg-content1">
          <CardBody className="flex items-center justify-between gap-2 py-3 px-3">
            <div className="flex items-center gap-2">
              <p className="text-[0.6rem] uppercase tracking-[0.15em] text-default-500">Rainbow</p>
              <span className="text-default-500 text-xs">{rainbowOn ? "On" : "Off"}</span>
            </div>
            <Switch
              size="lg"
              className="scale-[1.4]"
              color={rainbowOn ? "success" : "default"}
              isSelected={rainbowOn}
              onValueChange={handleRainbowToggle}
            >
              {rainbowOn ? "On" : "Off"}
            </Switch>
          </CardBody>
        </Card>
      </div>

      {/* Individual Light Controls */}
      <div className="grid gap-2 grid-cols-2">
        {LIGHTS.map((light) => (
          <LightCard
            key={light.key}
            lightKey={light.key}
            label={light.label}
            isOn={lights[light.key]}
            onToggle={(value) => handleLightToggle(light.key, value)}
            onBrightnessClick={() => openBrightnessModal(light.key)}
          />
        ))}
      </div>

      {/* Day/Night Cycle */}
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

      {/* Calendar & Theme */}
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
          <CardBody className="flex items-center justify-between py-3 px-3">
            <p className="text-[0.6rem] uppercase tracking-[0.15em] text-default-500">Theme</p>
            <div className="flex items-center justify-center h-full">
              <ThemeSwitch className="scale-125" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Brightness Modal */}
      <BrightnessModal
        isOpen={brightnessModalOpen}
        lightKey={selectedLightForBrightness}
        brightness={selectedLightForBrightness ? brightness[selectedLightForBrightness] : 128}
        onClose={closeBrightnessModal}
        onChange={handleBrightnessChangeWrapper}
      />
    </section>
    </>
  );
}
