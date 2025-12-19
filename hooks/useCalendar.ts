"use client";

import { useCallback, useEffect, useState } from "react";
import type { NextEvent } from "@/types/calendar";

export function useCalendar() {
  const [calendarEvent, setCalendarEvent] = useState<NextEvent>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);

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
        raw = raw.trim();
        
        if (/^\d{8}T\d{6}Z$/.test(raw)) {
          return new Date(raw.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, "$1-$2-$3T$4:$5:$6Z"));
        }
        if (/^\d{8}T\d{6}$/.test(raw)) {
          return new Date(raw.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, "$1-$2-$3T$4:$5:$6"));
        }
        if (/^\d{8}$/.test(raw)) {
          return new Date(raw.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3T00:00:00"));
        }
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
    fetchCalendar();
    // Refresh calendar every 5 minutes
    const calId = setInterval(() => {
      fetchCalendar();
    }, 5 * 60 * 1000);
    return () => clearInterval(calId);
  }, [fetchCalendar]);

  return { calendarEvent, calendarError };
}
