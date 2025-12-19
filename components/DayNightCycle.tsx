export function DayNightCycle({
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

  if (sunriseTs && sunsetTs) {
    const nowTs = now.getTime();
    const fullCycle = 24 * 60 * 60 * 1000;
    const dayDuration = Math.max(1, sunsetTs - sunriseTs);
    const nightDuration = Math.max(1, fullCycle - dayDuration);

    let cycleProgress = 0;

    if (nowTs >= sunriseTs && nowTs <= sunsetTs) {
      const dayProgress = (nowTs - sunriseTs) / dayDuration;
      cycleProgress = dayProgress * 0.5;
    } else if (nowTs > sunsetTs) {
      const nightProgress = (nowTs - sunsetTs) / nightDuration;
      cycleProgress = 0.5 + nightProgress * 0.5;
    } else {
      const prevSunset = sunsetTs - fullCycle;
      const nightProgress = (nowTs - prevSunset) / nightDuration;
      cycleProgress = 0.5 + nightProgress * 0.5;
    }

    sunX = padding + cycleProgress * waveWidth;
    sunY = baseline - amplitude * Math.sin(cycleProgress * 2 * Math.PI);
  }

  const pathPoints: string[] = [];
  for (let i = 0; i <= 100; i++) {
    const progress = i / 100;
    const x = padding + progress * waveWidth;
    const y = baseline - amplitude * Math.sin(progress * 2 * Math.PI);
    pathPoints.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
  }
  const wavePath = pathPoints.join(" ");

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

        <line
          x1={padding}
          y1={baseline}
          x2={w - padding}
          y2={baseline}
          stroke="#4b5563"
          strokeWidth={1}
          strokeDasharray="4 4"
        />

        <path d={wavePath} stroke="url(#waveGradient)" strokeWidth={3} fill="none" strokeLinecap="round" />

        <line x1={padding} y1={baseline - 10} x2={padding} y2={baseline + 10} stroke="#6b7280" strokeWidth={2} />
        <text x={padding} y={h - 8} fontSize={10} fontWeight={600} fill="currentColor" textAnchor="middle">
          {sunriseLabel ?? "--"}
        </text>

        <line x1={w / 2} y1={baseline - 10} x2={w / 2} y2={baseline + 10} stroke="#6b7280" strokeWidth={2} />
        <text x={w / 2} y={h - 8} fontSize={10} fontWeight={600} fill="currentColor" textAnchor="middle">
          {sunsetLabel ?? "--"}
        </text>

        <line x1={w - padding} y1={baseline - 10} x2={w - padding} y2={baseline + 10} stroke="#6b7280" strokeWidth={2} />
        <text x={w - padding} y={h - 8} fontSize={10} fontWeight={600} fill="currentColor" textAnchor="middle">
          {sunriseLabel ?? "--"}
        </text>

        <circle
          cx={sunX}
          cy={sunY}
          r={4}
          fill={isLightMode ? "#0f172a" : "#f8fafc"}
          stroke={isLightMode ? "#0f172a" : "#e5e7eb"}
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}
