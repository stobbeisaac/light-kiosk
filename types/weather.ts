export type WeatherState = {
  temperature: number | null;
  condition: string;
  icon: string;
  code: number | null;
  updated: string | null;
};

export type SunTimes = {
  sunrise: string | null;
  sunset: string | null;
  sunriseTs: number | null;
  sunsetTs: number | null;
};
