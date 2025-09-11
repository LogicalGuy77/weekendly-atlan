import { fetchWeatherApi } from "openmeteo";

export interface WeatherData {
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  current: {
    temperature: number;
    weatherCode: number;
    windSpeed: number;
    humidity: number;
    precipitation: number;
  };
  hourly: {
    time: Date[];
    temperature: number[];
    weatherCode: number[];
    precipitation: number[];
    windSpeed: number[];
  };
  daily: {
    time: Date[];
    temperatureMax: number[];
    temperatureMin: number[];
    weatherCode: number[];
    precipitationSum: number[];
  };
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

// Weather code interpretations based on WMO codes
export const weatherCodeDescriptions: Record<
  number,
  { description: string; icon: string; isGoodForOutdoor: boolean }
> = {
  0: { description: "Clear sky", icon: "☀️", isGoodForOutdoor: true },
  1: { description: "Mainly clear", icon: "🌤️", isGoodForOutdoor: true },
  2: { description: "Partly cloudy", icon: "⛅", isGoodForOutdoor: true },
  3: { description: "Overcast", icon: "☁️", isGoodForOutdoor: false },
  45: { description: "Fog", icon: "🌫️", isGoodForOutdoor: false },
  48: {
    description: "Depositing rime fog",
    icon: "🌫️",
    isGoodForOutdoor: false,
  },
  51: { description: "Light drizzle", icon: "🌦️", isGoodForOutdoor: false },
  53: { description: "Moderate drizzle", icon: "🌦️", isGoodForOutdoor: false },
  55: { description: "Dense drizzle", icon: "🌧️", isGoodForOutdoor: false },
  56: {
    description: "Light freezing drizzle",
    icon: "🌨️",
    isGoodForOutdoor: false,
  },
  57: {
    description: "Dense freezing drizzle",
    icon: "🌨️",
    isGoodForOutdoor: false,
  },
  61: { description: "Slight rain", icon: "🌦️", isGoodForOutdoor: false },
  63: { description: "Moderate rain", icon: "🌧️", isGoodForOutdoor: false },
  65: { description: "Heavy rain", icon: "🌧️", isGoodForOutdoor: false },
  66: {
    description: "Light freezing rain",
    icon: "🌨️",
    isGoodForOutdoor: false,
  },
  67: {
    description: "Heavy freezing rain",
    icon: "🌨️",
    isGoodForOutdoor: false,
  },
  71: { description: "Slight snow fall", icon: "🌨️", isGoodForOutdoor: false },
  73: {
    description: "Moderate snow fall",
    icon: "❄️",
    isGoodForOutdoor: false,
  },
  75: { description: "Heavy snow fall", icon: "❄️", isGoodForOutdoor: false },
  77: { description: "Snow grains", icon: "🌨️", isGoodForOutdoor: false },
  80: {
    description: "Slight rain showers",
    icon: "🌦️",
    isGoodForOutdoor: false,
  },
  81: {
    description: "Moderate rain showers",
    icon: "🌧️",
    isGoodForOutdoor: false,
  },
  82: {
    description: "Violent rain showers",
    icon: "⛈️",
    isGoodForOutdoor: false,
  },
  85: {
    description: "Slight snow showers",
    icon: "🌨️",
    isGoodForOutdoor: false,
  },
  86: {
    description: "Heavy snow showers",
    icon: "❄️",
    isGoodForOutdoor: false,
  },
  95: { description: "Thunderstorm", icon: "⛈️", isGoodForOutdoor: false },
  96: {
    description: "Thunderstorm with slight hail",
    icon: "⛈️",
    isGoodForOutdoor: false,
  },
  99: {
    description: "Thunderstorm with heavy hail",
    icon: "⛈️",
    isGoodForOutdoor: false,
  },
};

export class WeatherService {
  private static instance: WeatherService;
  private cachedWeatherData: WeatherData | null = null;
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

  static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  async getUserLocation(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = "Unable to retrieve location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000, // 10 minutes
        }
      );
    });
  }

  async fetchWeatherData(
    coordinates: LocationCoordinates
  ): Promise<WeatherData> {
    const now = Date.now();

    // Return cached data if it's still fresh
    if (
      this.cachedWeatherData &&
      now - this.lastFetchTime < this.CACHE_DURATION
    ) {
      return this.cachedWeatherData;
    }

    try {
      const params = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        current: [
          "temperature_2m",
          "weather_code",
          "wind_speed_10m",
          "relative_humidity_2m",
          "precipitation",
        ],
        hourly: [
          "temperature_2m",
          "weather_code",
          "precipitation",
          "wind_speed_10m",
        ],
        daily: [
          "temperature_2m_max",
          "temperature_2m_min",
          "weather_code",
          "precipitation_sum",
        ],
        timezone: "auto",
        forecast_days: 7,
      };

      const url = "https://api.open-meteo.com/v1/forecast";
      const responses = await fetchWeatherApi(url, params);
      const response = responses[0];

      // Get current weather
      const current = response.current()!;
      const currentData = {
        temperature: current.variables(0)!.value(),
        weatherCode: current.variables(1)!.value(),
        windSpeed: current.variables(2)!.value(),
        humidity: current.variables(3)!.value(),
        precipitation: current.variables(4)!.value(),
      };

      // Get hourly weather
      const hourly = response.hourly()!;
      const hourlyData = {
        time: [
          ...Array(
            (Number(hourly.timeEnd()) - Number(hourly.time())) /
              hourly.interval()
          ),
        ].map(
          (_, i) =>
            new Date(
              (Number(hourly.time()) +
                i * hourly.interval() +
                response.utcOffsetSeconds()) *
                1000
            )
        ),
        temperature: Array.from(hourly.variables(0)!.valuesArray()!),
        weatherCode: Array.from(hourly.variables(1)!.valuesArray()!),
        precipitation: Array.from(hourly.variables(2)!.valuesArray()!),
        windSpeed: Array.from(hourly.variables(3)!.valuesArray()!),
      };

      // Get daily weather
      const daily = response.daily()!;
      const dailyData = {
        time: [
          ...Array(
            (Number(daily.timeEnd()) - Number(daily.time())) / daily.interval()
          ),
        ].map(
          (_, i) =>
            new Date(
              (Number(daily.time()) +
                i * daily.interval() +
                response.utcOffsetSeconds()) *
                1000
            )
        ),
        temperatureMax: Array.from(daily.variables(0)!.valuesArray()!),
        temperatureMin: Array.from(daily.variables(1)!.valuesArray()!),
        weatherCode: Array.from(daily.variables(2)!.valuesArray()!),
        precipitationSum: Array.from(daily.variables(3)!.valuesArray()!),
      };

      const weatherData: WeatherData = {
        latitude: response.latitude(),
        longitude: response.longitude(),
        elevation: response.elevation(),
        timezone: params.timezone,
        current: currentData,
        hourly: hourlyData,
        daily: dailyData,
      };

      // Cache the data
      this.cachedWeatherData = weatherData;
      this.lastFetchTime = now;

      return weatherData;
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
      throw new Error("Failed to fetch weather data. Please try again later.");
    }
  }

  getWeatherDescription(weatherCode: number): {
    description: string;
    icon: string;
    isGoodForOutdoor: boolean;
  } {
    return (
      weatherCodeDescriptions[weatherCode] || {
        description: "Unknown",
        icon: "❓",
        isGoodForOutdoor: false,
      }
    );
  }

  isGoodWeatherForOutdoorActivities(
    weatherCode: number,
    temperature: number,
    precipitation: number = 0
  ): boolean {
    const weatherInfo = this.getWeatherDescription(weatherCode);

    // Check basic weather conditions
    if (!weatherInfo.isGoodForOutdoor) {
      return false;
    }

    // Check temperature (comfortable range: 10°C to 30°C)
    if (temperature < 10 || temperature > 30) {
      return false;
    }

    // Check precipitation
    if (precipitation > 0.5) {
      // More than 0.5mm precipitation
      return false;
    }

    return true;
  }

  getWeatherBasedActivitySuggestions(weatherData: WeatherData): {
    recommended: string[];
    notRecommended: string[];
    weatherSummary: string;
  } {
    const currentWeather = weatherData.current;
    const weatherInfo = this.getWeatherDescription(currentWeather.weatherCode);
    const isGoodForOutdoor = this.isGoodWeatherForOutdoorActivities(
      currentWeather.weatherCode,
      currentWeather.temperature,
      currentWeather.precipitation
    );

    const recommended: string[] = [];
    const notRecommended: string[] = [];

    if (isGoodForOutdoor) {
      recommended.push(
        "hiking-trail",
        "bike-ride",
        "picnic-park",
        "photography-walk",
        "farmers-market",
        "morning-run"
      );
    } else {
      notRecommended.push(
        "hiking-trail",
        "bike-ride",
        "picnic-park",
        "photography-walk",
        "farmers-market",
        "morning-run"
      );

      recommended.push(
        "movie-theater",
        "board-game-cafe",
        "cooking-class",
        "art-class",
        "museum-visit",
        "spa-day",
        "yoga-class",
        "home-cooking",
        "book-reading"
      );
    }

    const weatherSummary = `${weatherInfo.icon} ${
      weatherInfo.description
    }, ${Math.round(currentWeather.temperature)}°C`;

    return {
      recommended,
      notRecommended,
      weatherSummary,
    };
  }
}

export const weatherService = WeatherService.getInstance();
