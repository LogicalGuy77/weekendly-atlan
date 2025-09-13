import { describe, it, expect, beforeEach, vi } from "vitest";
import { useActivityStore } from "./activityStore";
import type { Activity, ActivityCategory } from "../types";

// Mock the persistence store
vi.mock("./persistenceStore", () => ({
  usePersistenceStore: {
    getState: () => ({
      loadActivities: vi.fn().mockResolvedValue([]),
      saveActivities: vi.fn().mockResolvedValue(undefined),
      loadCategories: vi.fn().mockResolvedValue([]),
      saveCategories: vi.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Mock the service worker
vi.mock("../lib/serviceWorker", () => ({
  cacheActivitiesOffline: vi.fn().mockResolvedValue(undefined),
}));

// Mock data
const mockActivity: Activity = {
  id: "1",
  title: "Morning Jog",
  description: "A refreshing morning run in the park",
  category: {
    id: "fitness",
    name: "Fitness",
    icon: "🏃",
    color: "#10B981",
    description: "Physical activities",
  },
  duration: 30,
  energyLevel: "medium",
  mood: ["energetic", "happy"],
  weatherDependent: true,
  icon: "🏃‍♂️",
  tags: ["outdoor", "exercise", "morning"],
};

const mockCategory: ActivityCategory = {
  id: "fitness",
  name: "Fitness",
  icon: "🏃",
  color: "#10B981",
  description: "Physical activities",
};

describe("ActivityStore", () => {
  beforeEach(() => {
    // Reset the store before each test
    useActivityStore.setState({
      activities: [],
      categories: [],
      filters: {
        categories: [],
        moods: [],
        energyLevels: [],
        duration: { min: 0, max: 480 },
        weatherDependent: undefined,
        tags: [],
      },
      searchTerm: "",
      selectedActivity: null,
      loading: false,
      error: null,
    });
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const state = useActivityStore.getState();

      expect(state.activities).toEqual([]);
      expect(state.categories).toEqual([]);
      expect(state.searchTerm).toBe("");
      expect(state.selectedActivity).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(state.filters).toEqual({
        categories: [],
        moods: [],
        energyLevels: [],
        duration: { min: 0, max: 480 },
        weatherDependent: undefined,
        tags: [],
      });
    });
  });

  describe("Activity Selection", () => {
    it("should select an activity", () => {
      const { selectActivity } = useActivityStore.getState();

      selectActivity(mockActivity);

      const state = useActivityStore.getState();
      expect(state.selectedActivity).toEqual(mockActivity);
    });

    it("should deselect activity when null is passed", () => {
      const { selectActivity } = useActivityStore.getState();

      // First select an activity
      selectActivity(mockActivity);
      expect(useActivityStore.getState().selectedActivity).toEqual(
        mockActivity
      );

      // Then deselect
      selectActivity(null);
      expect(useActivityStore.getState().selectedActivity).toBeNull();
    });
  });

  describe("Search Functionality", () => {
    it("should set search term", () => {
      const { setSearchTerm } = useActivityStore.getState();

      setSearchTerm("jog");

      const state = useActivityStore.getState();
      expect(state.searchTerm).toBe("jog");
    });

    it("should clear search term", () => {
      const { setSearchTerm } = useActivityStore.getState();

      setSearchTerm("jog");
      setSearchTerm("");

      const state = useActivityStore.getState();
      expect(state.searchTerm).toBe("");
    });
  });

  describe("Filter Functionality", () => {
    it("should set filters", () => {
      const { setFilters } = useActivityStore.getState();

      setFilters({
        categories: ["fitness"],
        moods: ["energetic"],
      });

      const state = useActivityStore.getState();
      expect(state.filters.categories).toEqual(["fitness"]);
      expect(state.filters.moods).toEqual(["energetic"]);
    });

    it("should merge filters with existing state", () => {
      const { setFilters } = useActivityStore.getState();

      // Set initial filters
      setFilters({
        categories: ["fitness"],
        moods: ["energetic"],
      });

      // Update only categories
      setFilters({
        categories: ["outdoor"],
      });

      const state = useActivityStore.getState();
      expect(state.filters.categories).toEqual(["outdoor"]);
      expect(state.filters.moods).toEqual(["energetic"]); // Should remain unchanged
    });

    it("should clear all filters", () => {
      const { setFilters, clearFilters } = useActivityStore.getState();

      // Set some filters
      setFilters({
        categories: ["fitness"],
        moods: ["energetic"],
      });

      // Clear filters
      clearFilters();

      const state = useActivityStore.getState();
      expect(state.filters).toEqual({
        categories: [],
        moods: [],
        energyLevels: [],
        duration: { min: 0, max: 480 },
        weatherDependent: undefined,
        tags: [],
      });
      expect(state.searchTerm).toBe("");
    });
  });

  describe("Filtered Activities", () => {
    beforeEach(() => {
      // Set up test data
      useActivityStore.setState({
        activities: [
          mockActivity,
          {
            ...mockActivity,
            id: "2",
            title: "Evening Yoga",
            description: "Relaxing yoga session",
            mood: ["relaxed", "contemplative"],
            energyLevel: "low",
            tags: ["indoor", "relaxation"],
            weatherDependent: false,
          },
        ],
      });
    });

    it("should filter activities by search term", () => {
      const { setSearchTerm, getFilteredActivities } =
        useActivityStore.getState();

      setSearchTerm("jog");
      const filtered = getFilteredActivities();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Morning Jog");
    });

    it("should filter activities by category", () => {
      const { setFilters, getFilteredActivities } = useActivityStore.getState();

      setFilters({ categories: ["fitness"] });
      const filtered = getFilteredActivities();

      expect(filtered).toHaveLength(2); // Both activities have fitness category
    });

    it("should filter activities by mood", () => {
      const { setFilters, getFilteredActivities } = useActivityStore.getState();

      setFilters({ moods: ["relaxed"] });
      const filtered = getFilteredActivities();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Evening Yoga");
    });

    it("should filter activities by energy level", () => {
      const { setFilters, getFilteredActivities } = useActivityStore.getState();

      setFilters({ energyLevels: ["low"] });
      const filtered = getFilteredActivities();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Evening Yoga");
    });

    it("should filter activities by duration", () => {
      const { setFilters, getFilteredActivities } = useActivityStore.getState();

      setFilters({ duration: { min: 0, max: 25 } });
      const filtered = getFilteredActivities();

      expect(filtered).toHaveLength(0); // Both activities are 30 minutes
    });

    it("should filter activities by weather dependency", () => {
      const { setFilters, getFilteredActivities } = useActivityStore.getState();

      setFilters({ weatherDependent: false });
      const filtered = getFilteredActivities();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Evening Yoga");
    });

    it("should filter activities by tags", () => {
      const { setFilters, getFilteredActivities } = useActivityStore.getState();

      setFilters({ tags: ["indoor"] });
      const filtered = getFilteredActivities();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Evening Yoga");
    });

    it("should combine multiple filters", () => {
      const { setFilters, setSearchTerm, getFilteredActivities } =
        useActivityStore.getState();

      setSearchTerm("yoga");
      setFilters({
        energyLevels: ["low"],
        weatherDependent: false,
      });

      const filtered = getFilteredActivities();

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Evening Yoga");
    });
  });

  describe("Error Handling", () => {
    it("should set error state", () => {
      const { setError } = useActivityStore.getState();

      setError("Test error");

      const state = useActivityStore.getState();
      expect(state.error).toBe("Test error");
    });

    it("should clear error state", () => {
      const { setError } = useActivityStore.getState();

      setError("Test error");
      setError(null);

      const state = useActivityStore.getState();
      expect(state.error).toBeNull();
    });
  });

  describe("Loading State", () => {
    it("should set loading state", () => {
      const { setLoading } = useActivityStore.getState();

      setLoading(true);

      const state = useActivityStore.getState();
      expect(state.loading).toBe(true);
    });

    it("should clear loading state", () => {
      const { setLoading } = useActivityStore.getState();

      setLoading(true);
      setLoading(false);

      const state = useActivityStore.getState();
      expect(state.loading).toBe(false);
    });
  });

  describe("Get Activities By Category", () => {
    beforeEach(() => {
      useActivityStore.setState({
        activities: [
          mockActivity,
          {
            ...mockActivity,
            id: "2",
            category: {
              id: "relaxation",
              name: "Relaxation",
              icon: "🧘",
              color: "#8B5CF6",
              description: "Calming activities",
            },
          },
        ],
      });
    });

    it("should return activities for specific category", () => {
      const { getActivitiesByCategory } = useActivityStore.getState();

      const fitnessActivities = getActivitiesByCategory("fitness");
      const relaxationActivities = getActivitiesByCategory("relaxation");

      expect(fitnessActivities).toHaveLength(1);
      expect(fitnessActivities[0].category.id).toBe("fitness");

      expect(relaxationActivities).toHaveLength(1);
      expect(relaxationActivities[0].category.id).toBe("relaxation");
    });

    it("should return empty array for non-existent category", () => {
      const { getActivitiesByCategory } = useActivityStore.getState();

      const result = getActivitiesByCategory("non-existent");

      expect(result).toEqual([]);
    });
  });
});
