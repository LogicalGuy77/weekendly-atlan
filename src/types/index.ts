// Core type definitions for Weekendly

export interface Activity {
  id: string;
  title: string;
  description: string;
  category: ActivityCategory;
  duration: number; // in minutes
  energyLevel: EnergyLevel;
  mood: Mood[];
  weatherDependent: boolean;
  icon: string;
  tags: string[];
  location?: string;
  cost?: number;
  minParticipants?: number;
  maxParticipants?: number;
}

export interface ActivityCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface TimeSlot {
  id: string;
  day: WeekendDay;
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  period: TimePeriod;
}

export interface ScheduledActivity {
  id: string;
  activity: Activity;
  timeSlot: TimeSlot;
  customNotes?: string;
  completed?: boolean;
}

export interface WeekendSchedule {
  id: string;
  title: string;
  theme?: WeekendTheme;
  saturday: ScheduledActivity[];
  sunday: ScheduledActivity[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WeekendTheme {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  suggestedActivities: string[]; // Activity IDs
  moodProfile: Mood[];
}

export interface Conflict {
  id: string;
  type: ConflictType;
  activities: ScheduledActivity[];
  message: string;
  severity: "low" | "medium" | "high";
}

export interface FilterState {
  categories: string[];
  moods: Mood[];
  energyLevels: EnergyLevel[];
  duration: {
    min: number;
    max: number;
  };
  weatherDependent?: boolean;
  tags: string[];
}

export interface UserPreferences {
  favoriteActivities: string[];
  preferredThemes: string[];
  defaultWeekendStructure: {
    saturdayStart: string;
    saturdayEnd: string;
    sundayStart: string;
    sundayEnd: string;
  };
  notifications: {
    reminders: boolean;
    weatherAlerts: boolean;
    suggestions: boolean;
  };
}

// Enums and Union Types
export type WeekendDay = "saturday" | "sunday";

export type TimePeriod = "morning" | "afternoon" | "evening" | "night";

export type EnergyLevel = "low" | "medium" | "high";

export type Mood =
  | "happy"
  | "relaxed"
  | "energetic"
  | "social"
  | "contemplative"
  | "adventurous"
  | "creative"
  | "romantic";

export type ConflictType =
  | "time_overlap"
  | "energy_mismatch"
  | "weather_conflict"
  | "location_conflict";

// Store State Types
export interface ActivityStoreState {
  activities: Activity[];
  categories: ActivityCategory[];
  filters: FilterState;
  searchTerm: string;
  selectedActivity: Activity | null;
  loading: boolean;
  error: string | null;
}

export interface ScheduleStoreState {
  currentWeekend: WeekendSchedule | null;
  selectedTimeSlot: TimeSlot | null;
  conflicts: Conflict[];
  availableTimeSlots: TimeSlot[];
  loading: boolean;
  error: string | null;
}

export interface UserStoreState {
  preferences: UserPreferences;
  currentTheme: WeekendTheme | null;
  weekendHistory: WeekendSchedule[];
  loading: boolean;
  error: string | null;
}

export interface PersistenceStoreState {
  isOnline: boolean;
  lastSyncTime: Date | null;
  pendingChanges: any[];
  syncInProgress: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

// Component Props Types
export interface ActivityCardProps {
  activity: Activity;
  isSelected?: boolean;
  isDragging?: boolean;
  onSelect?: (activity: Activity) => void;
  onDragStart?: (activity: Activity) => void;
  showDetails?: boolean;
  compact?: boolean;
}

export interface ScheduleGridProps {
  weekend: WeekendSchedule;
  onActivityAdd?: (activity: Activity, timeSlot: TimeSlot) => void;
  onActivityRemove?: (activityId: string) => void;
  onActivityMove?: (activityId: string, newTimeSlot: TimeSlot) => void;
  onActivityReorder?: (
    day: WeekendDay,
    period: TimePeriod,
    activityIds: string[]
  ) => void;
  readOnly?: boolean;
  activeDay?: WeekendDay;
}

export interface ActivityBrowserProps {
  activities: Activity[];
  categories: ActivityCategory[];
  filters: FilterState;
  searchTerm: string;
  onFilterChange?: (filters: FilterState) => void;
  onSearchChange?: (term: string) => void;
  onActivitySelect?: (activity: Activity) => void;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> &
  Partial<Pick<T, K>>;
