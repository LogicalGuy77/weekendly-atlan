import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  weatherService,
  type WeatherData,
  type LocationCoordinates,
} from "../services/weatherService";

interface WeatherStoreState {
  weatherData: WeatherData | null;
  userLocation: LocationCoordinates | null;
  loading: boolean;
  error: string | null;
  locationPermissionStatus: "unknown" | "granted" | "denied" | "prompt";
  weatherSummary: string | null;
  recommendedActivities: string[];
  notRecommendedActivities: string[];
}

interface WeatherStoreActions {
  // Location management
  requestLocationPermission: () => Promise<void>;
  setUserLocation: (location: LocationCoordinates) => void;

  // Weather data management
  fetchWeatherData: (coordinates?: LocationCoordinates) => Promise<void>;
  refreshWeatherData: () => Promise<void>;

  // Activity recommendations
  updateActivityRecommendations: () => void;

  // Error handling
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  clearError: () => void;
}

type WeatherStore = WeatherStoreState & WeatherStoreActions;

export const useWeatherStore = create<WeatherStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      weatherData: null,
      userLocation: null,
      loading: false,
      error: null,
      locationPermissionStatus: "unknown",
      weatherSummary: null,
      recommendedActivities: [],
      notRecommendedActivities: [],

      // Actions
      requestLocationPermission: async () => {
        set({ loading: true, error: null });

        try {
          const location = await weatherService.getUserLocation();
          set({
            userLocation: location,
            locationPermissionStatus: "granted",
            loading: false,
          });

          // Automatically fetch weather data after getting location
          await get().fetchWeatherData(location);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Failed to get location";
          set({
            error: errorMessage,
            locationPermissionStatus: errorMessage.includes("denied")
              ? "denied"
              : "unknown",
            loading: false,
          });
        }
      },

      setUserLocation: (location) => {
        set({ userLocation: location });
      },

      fetchWeatherData: async (coordinates) => {
        const { userLocation } = get();
        const targetLocation = coordinates || userLocation;

        if (!targetLocation) {
          set({ error: "Location is required to fetch weather data" });
          return;
        }

        set({ loading: true, error: null });

        try {
          const weatherData = await weatherService.fetchWeatherData(
            targetLocation
          );
          set({
            weatherData,
            loading: false,
          });

          // Update activity recommendations based on weather
          get().updateActivityRecommendations();
        } catch (error) {
          const errorMessage =
            error instanceof Error
              ? error.message
              : "Failed to fetch weather data";
          set({
            error: errorMessage,
            loading: false,
          });
        }
      },

      refreshWeatherData: async () => {
        const { userLocation } = get();
        if (userLocation) {
          await get().fetchWeatherData(userLocation);
        } else {
          await get().requestLocationPermission();
        }
      },

      updateActivityRecommendations: () => {
        const { weatherData } = get();

        if (!weatherData) {
          set({
            weatherSummary: null,
            recommendedActivities: [],
            notRecommendedActivities: [],
          });
          return;
        }

        const suggestions =
          weatherService.getWeatherBasedActivitySuggestions(weatherData);

        set({
          weatherSummary: suggestions.weatherSummary,
          recommendedActivities: suggestions.recommended,
          notRecommendedActivities: suggestions.notRecommended,
        });
      },

      setError: (error) => {
        set({ error });
      },

      setLoading: (loading) => {
        set({ loading });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: "weather-store",
    }
  )
);
