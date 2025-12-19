# Project Structure

## Overview
The Light Kiosk dashboard has been refactored into a professional, modular structure with clear separation of concerns.

## Directory Structure

```
light-kiosk/
├── app/
│   ├── page.tsx                    # Main page (now streamlined ~200 lines)
│   ├── layout.tsx
│   ├── providers.tsx
│   └── api/
│       ├── calendar/
│       │   └── route.ts
│       └── lights/
│           └── [id]/
│               ├── brightness/route.ts
│               ├── rainbow/route.ts
│               └── state/route.ts
├── components/
│   ├── BrightnessModal.tsx         # Modal for adjusting light brightness
│   ├── DayNightCycle.tsx           # Sunrise/sunset visualization
│   ├── LightCard.tsx               # Individual light control card
│   ├── icons.tsx
│   └── theme-switch.tsx
├── hooks/
│   ├── useCalendar.ts              # Calendar event fetching logic
│   ├── useLights.ts                # Light control state & API calls
│   ├── useSunTimes.ts              # Sunrise/sunset fetching logic
│   └── useWeather.ts               # Weather fetching logic
├── lib/
│   ├── constants.ts                # App-wide constants (lights config, weather mappings)
│   └── utils.ts                    # Utility functions (device mapping, icon names)
├── types/
│   ├── calendar.ts                 # Calendar event types
│   ├── lights.ts                   # Light-related types
│   └── weather.ts                  # Weather & sun time types
└── config/
    ├── fonts.ts
    └── site.ts
```

## Key Improvements

### 1. **Separation of Concerns**
- **Types** (`types/`): All TypeScript interfaces and types
- **Hooks** (`hooks/`): Custom React hooks for data fetching and state management
- **Components** (`components/`): Reusable UI components
- **Utils** (`lib/`): Helper functions and constants

### 2. **Custom Hooks**
Each hook manages its own state and side effects:
- `useWeather()`: Fetches and refreshes weather data every 5 minutes
- `useSunTimes()`: Fetches sunrise/sunset times, refreshes hourly
- `useCalendar()`: Parses ICS feed and finds next event, refreshes every 5 minutes
- `useLights()`: Manages all light state and control actions

### 3. **Reusable Components**
- `LightCard`: Individual light control with toggle and brightness button
- `BrightnessModal`: Modal dialog for adjusting brightness
- `DayNightCycle`: SVG visualization of day/night cycle

### 4. **Type Safety**
All types are properly defined and exported from dedicated type files:
- `LightKey`, `LightConfig`
- `WeatherState`, `SunTimes`
- `NextEvent`

### 5. **Constants Management**
Centralized configuration in `lib/constants.ts`:
- Light configurations
- Weather code mappings
- Icon mappings

## Benefits

1. **Maintainability**: Easy to find and modify specific features
2. **Testability**: Hooks and utilities can be tested in isolation
3. **Reusability**: Components can be used in other pages
4. **Scalability**: Easy to add new features without cluttering files
5. **Type Safety**: Clear interfaces for all data structures
6. **Code Organization**: Logical grouping by feature/responsibility

## File Size Reduction

- `page.tsx`: Reduced from ~870 lines → ~200 lines (77% reduction)
- Logic distributed across focused modules
- Each file has a single, clear responsibility
