import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  UserPreferences,
  WeekendTheme,
  WeekendSchedule,
  UserStoreState,
} from "../types";

interface UserStoreActions {
  // Preferences management
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  addFavoriteActivity: (activityId: string) => void;
  removeFavoriteActivity: (activityId: string) => void;

  // Time period management
  updateTimePeriod: (
    period: string,
    startTime: string,
    endTime: string
  ) => void;

  // Theme management
  setCurrentTheme: (theme: WeekendTheme | null) => void;
  loadAvailableThemes: () => Promise<void>;

  // Weekend history
  addToHistory: (weekend: WeekendSchedule) => void;
  removeFromHistory: (weekendId: string) => void;
  clearHistory: () => void;

  // Error handling
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

type UserStore = UserStoreState & UserStoreActions;

const defaultPreferences: UserPreferences = {
  favoriteActivities: [],
  preferredThemes: [],
  defaultWeekendStructure: {
    saturdayStart: "08:00",
    saturdayEnd: "22:00",
    sundayStart: "09:00",
    sundayEnd: "21:00",
  },
  timePeriods: {
    morning: { start: "08:00", end: "12:00" },
    afternoon: { start: "12:00", end: "17:00" },
    evening: { start: "17:00", end: "22:00" },
    night: { start: "22:00", end: "24:00" },
  },
  notifications: {
    reminders: true,
    weatherAlerts: true,
    suggestions: true,
  },
};

export const useUserStore = create<UserStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      preferences: defaultPreferences,
      currentTheme: null,
      weekendHistory: [],
      loading: false,
      error: null,

      // Actions
      updatePreferences: (newPreferences) => {
        const { preferences } = get();
        set({
          preferences: { ...preferences, ...newPreferences },
        });
      },

      addFavoriteActivity: (activityId) => {
        const { preferences } = get();
        if (!preferences.favoriteActivities.includes(activityId)) {
          set({
            preferences: {
              ...preferences,
              favoriteActivities: [
                ...preferences.favoriteActivities,
                activityId,
              ],
            },
          });
        }
      },

      removeFavoriteActivity: (activityId) => {
        const { preferences } = get();
        set({
          preferences: {
            ...preferences,
            favoriteActivities: preferences.favoriteActivities.filter(
              (id) => id !== activityId
            ),
          },
        });
      },

      updateTimePeriod: (period, startTime, endTime) => {
        const { preferences } = get();
        set({
          preferences: {
            ...preferences,
            timePeriods: {
              ...preferences.timePeriods,
              [period]: { start: startTime, end: endTime },
            },
          },
        });
      },

      setCurrentTheme: (theme) => {
        set({ currentTheme: theme });
      },

      loadAvailableThemes: async () => {
        set({ loading: true, error: null });
        try {
          // TODO: Replace with actual API call
          // For now, we'll just set loading state
          set({ loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to load themes",
            loading: false,
          });
        }
      },

      addToHistory: (weekend) => {
        const { weekendHistory } = get();
        // Avoid duplicates and limit history to 50 items
        const filteredHistory = weekendHistory.filter(
          (w) => w.id !== weekend.id
        );
        const newHistory = [weekend, ...filteredHistory].slice(0, 50);
        set({ weekendHistory: newHistory });
      },

      removeFromHistory: (weekendId) => {
        const { weekendHistory } = get();
        set({
          weekendHistory: weekendHistory.filter((w) => w.id !== weekendId),
        });
      },

      clearHistory: () => {
        set({ weekendHistory: [] });
      },

      setError: (error) => {
        set({ error });
      },

      setLoading: (loading) => {
        set({ loading });
      },
    }),
    {
      name: "user-store",
    }
  )
);
