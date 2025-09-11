import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  Activity,
  TimeSlot,
  ScheduledActivity,
  WeekendSchedule,
  Conflict,
  ScheduleStoreState,
  WeekendDay,
  TimePeriod,
} from "../types";

interface ScheduleStoreActions {
  // Weekend management
  createNewWeekend: (title?: string) => void;
  loadWeekend: (weekendId: string) => Promise<void>;
  updateWeekendTitle: (title: string) => void;

  // Activity scheduling
  addActivity: (activity: Activity, timeSlot: TimeSlot) => void;
  removeActivity: (activityId: string) => void;
  moveActivity: (activityId: string, newTimeSlot: TimeSlot) => void;
  updateActivityNotes: (activityId: string, notes: string) => void;
  toggleActivityCompletion: (activityId: string) => void;

  // Time slot management
  selectTimeSlot: (timeSlot: TimeSlot | null) => void;
  generateTimeSlots: () => void;
  getAvailableTimeSlots: (day: WeekendDay) => TimeSlot[];

  // Conflict detection
  detectConflicts: () => void;
  resolveConflict: (conflictId: string) => void;

  // Utility functions
  getScheduledActivitiesForDay: (day: WeekendDay) => ScheduledActivity[];
  getTotalDuration: (day: WeekendDay) => number;

  // Error handling
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

type ScheduleStore = ScheduleStoreState & ScheduleStoreActions;

const generateId = () => Math.random().toString(36).substr(2, 9);

const createTimeSlot = (
  day: WeekendDay,
  startTime: string,
  endTime: string,
  period: TimePeriod
): TimeSlot => ({
  id: `${day}-${startTime}-${endTime}`,
  day,
  startTime,
  endTime,
  period,
});

const generateDefaultTimeSlots = (): TimeSlot[] => {
  const slots: TimeSlot[] = [];

  // Saturday slots
  slots.push(
    createTimeSlot("saturday", "08:00", "12:00", "morning"),
    createTimeSlot("saturday", "12:00", "17:00", "afternoon"),
    createTimeSlot("saturday", "17:00", "22:00", "evening"),
    createTimeSlot("saturday", "22:00", "24:00", "night")
  );

  // Sunday slots
  slots.push(
    createTimeSlot("sunday", "08:00", "12:00", "morning"),
    createTimeSlot("sunday", "12:00", "17:00", "afternoon"),
    createTimeSlot("sunday", "17:00", "22:00", "evening"),
    createTimeSlot("sunday", "22:00", "24:00", "night")
  );

  return slots;
};

const createEmptyWeekend = (title: string = "My Weekend"): WeekendSchedule => ({
  id: generateId(),
  title,
  saturday: [],
  sunday: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const useScheduleStore = create<ScheduleStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentWeekend: null,
      selectedTimeSlot: null,
      conflicts: [],
      availableTimeSlots: generateDefaultTimeSlots(),
      loading: false,
      error: null,

      // Actions
      createNewWeekend: (title) => {
        const newWeekend = createEmptyWeekend(title);
        set({
          currentWeekend: newWeekend,
          conflicts: [],
          selectedTimeSlot: null,
        });
      },

      loadWeekend: async (weekendId) => {
        set({ loading: true, error: null });
        try {
          // TODO: Replace with actual API call
          // For now, create a mock weekend
          const mockWeekend = createEmptyWeekend("Loaded Weekend");
          mockWeekend.id = weekendId;

          set({
            currentWeekend: mockWeekend,
            loading: false,
          });

          // Detect conflicts after loading
          get().detectConflicts();
        } catch (error) {
          set({
            error:
              error instanceof Error ? error.message : "Failed to load weekend",
            loading: false,
          });
        }
      },

      updateWeekendTitle: (title) => {
        const { currentWeekend } = get();
        if (currentWeekend) {
          set({
            currentWeekend: {
              ...currentWeekend,
              title,
              updatedAt: new Date(),
            },
          });
        }
      },

      addActivity: (activity, timeSlot) => {
        const { currentWeekend } = get();
        if (!currentWeekend) return;

        const scheduledActivity: ScheduledActivity = {
          id: generateId(),
          activity,
          timeSlot,
          completed: false,
        };

        const updatedWeekend = {
          ...currentWeekend,
          [timeSlot.day]: [...currentWeekend[timeSlot.day], scheduledActivity],
          updatedAt: new Date(),
        };

        set({ currentWeekend: updatedWeekend });

        // Detect conflicts after adding
        get().detectConflicts();
      },

      removeActivity: (activityId) => {
        const { currentWeekend } = get();
        if (!currentWeekend) return;

        const updatedWeekend = {
          ...currentWeekend,
          saturday: currentWeekend.saturday.filter(
            (sa) => sa.id !== activityId
          ),
          sunday: currentWeekend.sunday.filter((sa) => sa.id !== activityId),
          updatedAt: new Date(),
        };

        set({ currentWeekend: updatedWeekend });

        // Detect conflicts after removing
        get().detectConflicts();
      },

      moveActivity: (activityId, newTimeSlot) => {
        const { currentWeekend } = get();
        if (!currentWeekend) return;

        // Find the activity in either day
        let activityToMove: ScheduledActivity | undefined;
        const saturdayActivities = currentWeekend.saturday.filter((sa) => {
          if (sa.id === activityId) {
            activityToMove = sa;
            return false;
          }
          return true;
        });

        const sundayActivities = currentWeekend.sunday.filter((sa) => {
          if (sa.id === activityId) {
            activityToMove = sa;
            return false;
          }
          return true;
        });

        if (!activityToMove) return;

        // Update the activity with new time slot
        const updatedActivity = {
          ...activityToMove,
          timeSlot: newTimeSlot,
        };

        // Add to the new day
        const updatedWeekend = {
          ...currentWeekend,
          saturday:
            newTimeSlot.day === "saturday"
              ? [...saturdayActivities, updatedActivity]
              : saturdayActivities,
          sunday:
            newTimeSlot.day === "sunday"
              ? [...sundayActivities, updatedActivity]
              : sundayActivities,
          updatedAt: new Date(),
        };

        set({ currentWeekend: updatedWeekend });

        // Detect conflicts after moving
        get().detectConflicts();
      },

      updateActivityNotes: (activityId, notes) => {
        const { currentWeekend } = get();
        if (!currentWeekend) return;

        const updateActivityInArray = (activities: ScheduledActivity[]) =>
          activities.map((sa) =>
            sa.id === activityId ? { ...sa, customNotes: notes } : sa
          );

        const updatedWeekend = {
          ...currentWeekend,
          saturday: updateActivityInArray(currentWeekend.saturday),
          sunday: updateActivityInArray(currentWeekend.sunday),
          updatedAt: new Date(),
        };

        set({ currentWeekend: updatedWeekend });
      },

      toggleActivityCompletion: (activityId) => {
        const { currentWeekend } = get();
        if (!currentWeekend) return;

        const updateActivityInArray = (activities: ScheduledActivity[]) =>
          activities.map((sa) =>
            sa.id === activityId ? { ...sa, completed: !sa.completed } : sa
          );

        const updatedWeekend = {
          ...currentWeekend,
          saturday: updateActivityInArray(currentWeekend.saturday),
          sunday: updateActivityInArray(currentWeekend.sunday),
          updatedAt: new Date(),
        };

        set({ currentWeekend: updatedWeekend });
      },

      selectTimeSlot: (timeSlot) => {
        set({ selectedTimeSlot: timeSlot });
      },

      generateTimeSlots: () => {
        const timeSlots = generateDefaultTimeSlots();
        set({ availableTimeSlots: timeSlots });
      },

      getAvailableTimeSlots: (day) => {
        const { availableTimeSlots } = get();
        return availableTimeSlots.filter((slot) => slot.day === day);
      },

      detectConflicts: () => {
        const { currentWeekend } = get();
        if (!currentWeekend) {
          set({ conflicts: [] });
          return;
        }

        const conflicts: Conflict[] = [];
        const allActivities = [
          ...currentWeekend.saturday,
          ...currentWeekend.sunday,
        ];

        // Check for time overlaps within the same day
        const checkDayConflicts = (
          activities: ScheduledActivity[],
          day: WeekendDay
        ) => {
          for (let i = 0; i < activities.length; i++) {
            for (let j = i + 1; j < activities.length; j++) {
              const activity1 = activities[i];
              const activity2 = activities[j];

              // Simple overlap check based on time slots
              if (activity1.timeSlot.id === activity2.timeSlot.id) {
                conflicts.push({
                  id: generateId(),
                  type: "time_overlap",
                  activities: [activity1, activity2],
                  message: `Time conflict: ${activity1.activity.title} and ${activity2.activity.title} are scheduled for the same time slot`,
                  severity: "high",
                });
              }
            }
          }
        };

        checkDayConflicts(currentWeekend.saturday, "saturday");
        checkDayConflicts(currentWeekend.sunday, "sunday");

        set({ conflicts });
      },

      resolveConflict: (conflictId) => {
        const { conflicts } = get();
        const updatedConflicts = conflicts.filter((c) => c.id !== conflictId);
        set({ conflicts: updatedConflicts });
      },

      getScheduledActivitiesForDay: (day) => {
        const { currentWeekend } = get();
        if (!currentWeekend) return [];
        return currentWeekend[day];
      },

      getTotalDuration: (day) => {
        const activities = get().getScheduledActivitiesForDay(day);
        return activities.reduce(
          (total, sa) => total + sa.activity.duration,
          0
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
      name: "schedule-store",
    }
  )
);
