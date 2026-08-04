export interface WeatherReading {
  temperature: number;
  windSpeed: number;
  weatherCode: number;
  time: string;
}

export async function fetchWeather(lat: number, lng: number): Promise<WeatherReading | null> {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lng),
      current: "temperature_2m,wind_speed_10m,weather_code",
      timezone: "Africa/Cairo",
    });
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      current?: { time?: string; temperature_2m?: number; wind_speed_10m?: number; weather_code?: number };
    };
    const cur = data.current;
    if (!cur) return null;
    return {
      temperature: cur.temperature_2m ?? 0,
      windSpeed: cur.wind_speed_10m ?? 0,
      weatherCode: cur.weather_code ?? 0,
      time: cur.time ?? "",
    };
  } catch {
    return null;
  }
}

export function weatherDescription(code: number): string {
  const map: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    80: "Rain showers",
    85: "Snow showers",
    95: "Thunderstorm",
    99: "Strong storm",
  };
  return map[code] ?? "Unknown";
}
