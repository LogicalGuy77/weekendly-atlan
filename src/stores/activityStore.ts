import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { usePersistenceStore } from "./persistenceStore";
import { cacheActivitiesOffline } from "../lib/serviceWorker";
import type { Activity, ActivityStoreState, FilterState } from "../types";

interface ActivityStoreActions {
  // Data loading
  loadActivities: () => Promise<void>;
  loadCategories: () => Promise<void>;

  // Activity management
  selectActivity: (activity: Activity | null) => void;

  // Search and filtering
  setSearchTerm: (term: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;

  // Computed getters
  getFilteredActivities: () => Activity[];
  getActivitiesByCategory: (categoryId: string) => Activity[];

  // Error handling
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

type ActivityStore = ActivityStoreState & ActivityStoreActions;

const initialFilters: FilterState = {
  categories: [],
  moods: [],
  energyLevels: [],
  duration: { min: 0, max: 480 }, // 8 hours max
  weatherDependent: undefined,
  tags: [],
};

export const useActivityStore = create<ActivityStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      activities: [],
      categories: [],
      filters: initialFilters,
      searchTerm: "",
      selectedActivity: null,
      loading: false,
      error: null,

      // Actions
      loadActivities: async () => {
        set({ loading: true, error: null });
        try {
          const persistenceStore = usePersistenceStore.getState();

          // Try to load from IndexedDB first
          let activities = await persistenceStore.loadActivities();

          // If no activities in IndexedDB, load from mock data and save
          if (activities.length === 0) {
            const mockActivities = await import("../data/mockActivities");
            activities = mockActivities.activities;

            // Save to IndexedDB for future use
            await persistenceStore.saveActivities(activities);

            // Cache for offline use
            await cacheActivitiesOffline(activities);
          }

          set({
            activities,
            loading: false,
          });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to load activities",
            loading: false,
          });
        }
      },

      loadCategories: async () => {
        try {
          const persistenceStore = usePersistenceStore.getState();

          // Try to load from IndexedDB first
          let categories = await persistenceStore.loadCategories();

          // If no categories in IndexedDB, load from mock data and save
          if (categories.length === 0) {
            const mockCategories = await import("../data/mockCategories");
            categories = mockCategories.categories;

            // Save to IndexedDB for future use
            await persistenceStore.saveCategories(categories);
          }

          set({ categories });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to load categories",
          });
        }
      },

      selectActivity: (activity) => {
        set({ selectedActivity: activity });
      },

      setSearchTerm: (term) => {
        set({ searchTerm: term });
      },

      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        }));
      },

      clearFilters: () => {
        set({ filters: initialFilters, searchTerm: "" });
      },

      getFilteredActivities: () => {
        const { activities, filters, searchTerm } = get();

        return activities.filter((activity) => {
          // Search term filter
          if (
            searchTerm &&
            !activity.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !activity.description
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) &&
            !activity.tags.some((tag) =>
              tag.toLowerCase().includes(searchTerm.toLowerCase())
            )
          ) {
            return false;
          }

          // Category filter
          if (
            filters.categories.length > 0 &&
            !filters.categories.includes(activity.category.id)
          ) {
            return false;
          }

          // Mood filter
          if (
            filters.moods.length > 0 &&
            !filters.moods.some((mood) => activity.mood.includes(mood))
          ) {
            return false;
          }

          // Energy level filter
          if (
            filters.energyLevels.length > 0 &&
            !filters.energyLevels.includes(activity.energyLevel)
          ) {
            return false;
          }

          // Duration filter
          if (
            activity.duration < filters.duration.min ||
            activity.duration > filters.duration.max
          ) {
            return false;
          }

          // Weather dependent filter
          if (
            filters.weatherDependent !== undefined &&
            activity.weatherDependent !== filters.weatherDependent
          ) {
            return false;
          }

          // Tags filter
          if (
            filters.tags.length > 0 &&
            !filters.tags.some((tag) => activity.tags.includes(tag))
          ) {
            return false;
          }

          return true;
        });
      },

      getActivitiesByCategory: (categoryId) => {
        const { activities } = get();
        return activities.filter(
          (activity) => activity.category.id === categoryId
        );
      },

      setError: (error) => {
        set({ error });
      },

      setLoading: (loading) => {
        set({ loading });
      },
    }),
    {
      name: "activity-store",
    }
  )
);
