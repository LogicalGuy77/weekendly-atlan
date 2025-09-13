import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { openDB, type IDBPDatabase } from "idb";
import type {
  PersistenceStoreState,
  WeekendSchedule,
  UserPreferences,
  Activity,
  ActivityCategory,
} from "../types";

interface PersistenceStoreActions {
  // Database initialization
  initializeDB: () => Promise<void>;

  // Weekend persistence
  saveWeekend: (weekend: WeekendSchedule) => Promise<void>;
  loadWeekend: (weekendId: string) => Promise<WeekendSchedule | null>;
  loadAllWeekends: (
    limit?: number,
    offset?: number
  ) => Promise<WeekendSchedule[]>;
  deleteWeekend: (weekendId: string) => Promise<void>;
  bulkSaveWeekends: (weekends: WeekendSchedule[]) => Promise<void>;

  // Activity persistence (for performance with 50+ activities)
  saveActivities: (activities: Activity[]) => Promise<void>;
  loadActivities: (limit?: number, offset?: number) => Promise<Activity[]>;
  saveCategories: (categories: ActivityCategory[]) => Promise<void>;
  loadCategories: () => Promise<ActivityCategory[]>;

  // User preferences persistence
  savePreferences: (preferences: UserPreferences) => Promise<void>;
  loadPreferences: () => Promise<UserPreferences | null>;

  // Cache management for performance
  getCachedData: <T>(key: string) => T | null;
  setCachedData: <T>(key: string, data: T, ttl?: number) => void;
  clearCache: () => void;

  // Sync management
  syncData: () => Promise<void>;
  addPendingChange: (change: any) => void;
  clearPendingChanges: () => void;

  // Online/offline status
  setOnlineStatus: (isOnline: boolean) => void;

  // Data migration and versioning
  migrateData: (fromVersion: number, toVersion: number) => Promise<void>;
  exportData: () => Promise<string>;
  importData: (data: string) => Promise<void>;

  // Performance optimization
  compactDatabase: () => Promise<void>;
  getStorageUsage: () => Promise<{ used: number; quota: number }>;

  // Error handling
  setError: (error: string | null) => void;
  setSyncInProgress: (inProgress: boolean) => void;
}

type PersistenceStore = PersistenceStoreState & PersistenceStoreActions;

const DB_NAME = "weekendly-db";
const DB_VERSION = 2; // Increased version for new features
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default TTL

let dbInstance: IDBPDatabase | null = null;

// In-memory cache for performance
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

const initDB = async (): Promise<IDBPDatabase> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion) {
      // Weekends store
      if (!db.objectStoreNames.contains("weekends")) {
        const weekendStore = db.createObjectStore("weekends", {
          keyPath: "id",
        });
        weekendStore.createIndex("createdAt", "createdAt");
        weekendStore.createIndex("updatedAt", "updatedAt");
        weekendStore.createIndex("title", "title");
      }

      // Activities store (new for performance)
      if (!db.objectStoreNames.contains("activities")) {
        const activityStore = db.createObjectStore("activities", {
          keyPath: "id",
        });
        activityStore.createIndex("category", "category.id");
        activityStore.createIndex("duration", "duration");
        activityStore.createIndex("energyLevel", "energyLevel");
        activityStore.createIndex("weatherDependent", "weatherDependent");
      }

      // Categories store
      if (!db.objectStoreNames.contains("categories")) {
        db.createObjectStore("categories", {
          keyPath: "id",
        });
      }

      // User preferences store
      if (!db.objectStoreNames.contains("preferences")) {
        db.createObjectStore("preferences", {
          keyPath: "id",
        });
      }

      // Sync queue store
      if (!db.objectStoreNames.contains("syncQueue")) {
        const syncStore = db.createObjectStore("syncQueue", {
          keyPath: "id",
          autoIncrement: true,
        });
        syncStore.createIndex("timestamp", "timestamp");
        syncStore.createIndex("type", "type");
      }

      // Metadata store for versioning and app state
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata", {
          keyPath: "key",
        });
      }

      // Migration logic
      if (oldVersion < 2) {
        // Migrate existing data if needed
        console.log(
          "Migrating database from version",
          oldVersion,
          "to",
          newVersion
        );
      }
    },
  });

  // Store current version
  await dbInstance.put("metadata", { key: "version", value: DB_VERSION });
  await dbInstance.put("metadata", {
    key: "lastAccess",
    value: new Date().toISOString(),
  });

  return dbInstance;
};

// Utility functions for cache management
const getCacheKey = (prefix: string, id?: string) =>
  id ? `${prefix}:${id}` : prefix;

const isValidCache = (item: { timestamp: number; ttl: number }) => {
  return Date.now() - item.timestamp < item.ttl;
};

export const usePersistenceStore = create<PersistenceStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      isOnline: navigator.onLine,
      lastSyncTime: null,
      pendingChanges: [],
      syncInProgress: false,

      // Actions
      initializeDB: async () => {
        try {
          await initDB();

          // Set up online/offline listeners
          const handleOnline = () => {
            set({ isOnline: true });
            // Auto-sync when coming back online
            get().syncData();
          };

          const handleOffline = () => {
            set({ isOnline: false });
          };

          window.addEventListener("online", handleOnline);
          window.addEventListener("offline", handleOffline);

          // Initial sync if online
          if (navigator.onLine) {
            get().syncData();
          }
        } catch (error) {
          console.error("Failed to initialize database:", error);
        }
      },

      saveWeekend: async (weekend) => {
        try {
          const db = await initDB();
          await db.put("weekends", weekend);

          // Add to sync queue if offline
          if (!get().isOnline) {
            get().addPendingChange({
              type: "save_weekend",
              data: weekend,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error("Failed to save weekend:", error);
          throw error;
        }
      },

      loadWeekend: async (weekendId) => {
        try {
          const db = await initDB();
          const weekend = await db.get("weekends", weekendId);
          return weekend || null;
        } catch (error) {
          console.error("Failed to load weekend:", error);
          return null;
        }
      },

      loadAllWeekends: async (limit = 50, offset = 0) => {
        try {
          const cacheKey = getCacheKey("weekends", `${limit}-${offset}`);
          const cached = get().getCachedData<WeekendSchedule[]>(cacheKey);
          if (cached) return cached;

          const db = await initDB();
          const tx = db.transaction("weekends", "readonly");
          const index = tx.store.index("updatedAt");

          let weekends: WeekendSchedule[] = [];
          let cursor = await index.openCursor(null, "prev"); // Most recent first
          let count = 0;
          let skipped = 0;

          while (cursor && weekends.length < limit) {
            if (skipped >= offset) {
              weekends.push(cursor.value);
            } else {
              skipped++;
            }
            cursor = await cursor.continue();
            count++;
          }

          // Cache the result
          get().setCachedData(cacheKey, weekends, CACHE_TTL);

          return weekends;
        } catch (error) {
          console.error("Failed to load weekends:", error);
          return [];
        }
      },

      bulkSaveWeekends: async (weekends) => {
        try {
          const db = await initDB();
          const tx = db.transaction("weekends", "readwrite");

          await Promise.all(weekends.map((weekend) => tx.store.put(weekend)));

          await tx.done;

          // Clear cache since data changed
          get().clearCache();

          // Add to sync queue if offline
          if (!get().isOnline) {
            get().addPendingChange({
              type: "bulk_save_weekends",
              data: weekends,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error("Failed to bulk save weekends:", error);
          throw error;
        }
      },

      saveActivities: async (activities) => {
        try {
          const db = await initDB();
          const tx = db.transaction("activities", "readwrite");

          await Promise.all(
            activities.map((activity) => tx.store.put(activity))
          );

          await tx.done;

          // Clear activities cache
          cache.delete("activities");

          // Add to sync queue if offline
          if (!get().isOnline) {
            get().addPendingChange({
              type: "save_activities",
              data: activities,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error("Failed to save activities:", error);
          throw error;
        }
      },

      loadActivities: async (limit = 100, offset = 0) => {
        try {
          const cacheKey = getCacheKey("activities", `${limit}-${offset}`);
          const cached = get().getCachedData<Activity[]>(cacheKey);
          if (cached) return cached;

          const db = await initDB();
          const tx = db.transaction("activities", "readonly");

          let activities: Activity[] = [];
          let cursor = await tx.store.openCursor();
          let count = 0;
          let skipped = 0;

          while (cursor && activities.length < limit) {
            if (skipped >= offset) {
              activities.push(cursor.value);
            } else {
              skipped++;
            }
            cursor = await cursor.continue();
            count++;
          }

          // Cache the result
          get().setCachedData(cacheKey, activities, CACHE_TTL);

          return activities;
        } catch (error) {
          console.error("Failed to load activities:", error);
          return [];
        }
      },

      saveCategories: async (categories) => {
        try {
          const db = await initDB();
          const tx = db.transaction("categories", "readwrite");

          await Promise.all(
            categories.map((category) => tx.store.put(category))
          );

          await tx.done;

          // Clear categories cache
          cache.delete("categories");

          // Add to sync queue if offline
          if (!get().isOnline) {
            get().addPendingChange({
              type: "save_categories",
              data: categories,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error("Failed to save categories:", error);
          throw error;
        }
      },

      loadCategories: async () => {
        try {
          const cached = get().getCachedData<ActivityCategory[]>("categories");
          if (cached) return cached;

          const db = await initDB();
          const categories = await db.getAll("categories");

          // Cache the result
          get().setCachedData("categories", categories, CACHE_TTL);

          return categories;
        } catch (error) {
          console.error("Failed to load categories:", error);
          return [];
        }
      },

      getCachedData: <T>(key: string): T | null => {
        const item = cache.get(key);
        if (!item) return null;

        if (isValidCache(item)) {
          return item.data as T;
        } else {
          cache.delete(key);
          return null;
        }
      },

      setCachedData: <T>(key: string, data: T, ttl = CACHE_TTL) => {
        cache.set(key, {
          data,
          timestamp: Date.now(),
          ttl,
        });
      },

      clearCache: () => {
        cache.clear();
      },

      migrateData: async (fromVersion, toVersion) => {
        try {
          const db = await initDB();

          if (fromVersion < 2 && toVersion >= 2) {
            // Example migration: move activities from localStorage to IndexedDB
            const localStorageActivities = localStorage.getItem(
              "weekendly-activities"
            );
            if (localStorageActivities) {
              const activities = JSON.parse(localStorageActivities);
              await get().saveActivities(activities);
              localStorage.removeItem("weekendly-activities");
            }
          }

          // Update version in metadata
          await db.put("metadata", { key: "version", value: toVersion });
        } catch (error) {
          console.error("Failed to migrate data:", error);
          throw error;
        }
      },

      exportData: async () => {
        try {
          const db = await initDB();

          const [weekends, activities, categories, preferences] =
            await Promise.all([
              db.getAll("weekends"),
              db.getAll("activities"),
              db.getAll("categories"),
              db.get("preferences", "user_preferences"),
            ]);

          const exportData = {
            version: DB_VERSION,
            timestamp: new Date().toISOString(),
            data: {
              weekends,
              activities,
              categories,
              preferences,
            },
          };

          return JSON.stringify(exportData, null, 2);
        } catch (error) {
          console.error("Failed to export data:", error);
          throw error;
        }
      },

      importData: async (data) => {
        try {
          const importData = JSON.parse(data);
          const db = await initDB();

          // Clear existing data
          const tx = db.transaction(
            ["weekends", "activities", "categories", "preferences"],
            "readwrite"
          );
          await Promise.all([
            tx.objectStore("weekends").clear(),
            tx.objectStore("activities").clear(),
            tx.objectStore("categories").clear(),
            tx.objectStore("preferences").clear(),
          ]);

          // Import new data
          const { weekends, activities, categories, preferences } =
            importData.data;

          if (weekends) await get().bulkSaveWeekends(weekends);
          if (activities) await get().saveActivities(activities);
          if (categories) await get().saveCategories(categories);
          if (preferences) await get().savePreferences(preferences);

          // Clear cache
          get().clearCache();
        } catch (error) {
          console.error("Failed to import data:", error);
          throw error;
        }
      },

      compactDatabase: async () => {
        try {
          const db = await initDB();

          // Remove old weekends (keep only last 100)
          const tx = db.transaction("weekends", "readwrite");
          const index = tx.store.index("updatedAt");
          const weekends = await index.getAll();

          if (weekends.length > 100) {
            const toDelete = weekends.slice(100);
            await Promise.all(
              toDelete.map((weekend) => tx.store.delete(weekend.id))
            );
          }

          // Clear old sync queue items (older than 30 days)
          const syncTx = db.transaction("syncQueue", "readwrite");
          const syncIndex = syncTx.store.index("timestamp");
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

          let cursor = await syncIndex.openCursor(
            IDBKeyRange.upperBound(thirtyDaysAgo)
          );
          while (cursor) {
            await cursor.delete();
            cursor = await cursor.continue();
          }

          await Promise.all([tx.done, syncTx.done]);
        } catch (error) {
          console.error("Failed to compact database:", error);
          throw error;
        }
      },

      getStorageUsage: async () => {
        try {
          if ("storage" in navigator && "estimate" in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
              used: estimate.usage || 0,
              quota: estimate.quota || 0,
            };
          }
          return { used: 0, quota: 0 };
        } catch (error) {
          console.error("Failed to get storage usage:", error);
          return { used: 0, quota: 0 };
        }
      },

      deleteWeekend: async (weekendId) => {
        try {
          const db = await initDB();
          await db.delete("weekends", weekendId);

          // Add to sync queue if offline
          if (!get().isOnline) {
            get().addPendingChange({
              type: "delete_weekend",
              data: { id: weekendId },
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error("Failed to delete weekend:", error);
          throw error;
        }
      },

      savePreferences: async (preferences) => {
        try {
          const db = await initDB();
          await db.put("preferences", {
            id: "user_preferences",
            ...preferences,
          });

          // Add to sync queue if offline
          if (!get().isOnline) {
            get().addPendingChange({
              type: "save_preferences",
              data: preferences,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          console.error("Failed to save preferences:", error);
          throw error;
        }
      },

      loadPreferences: async () => {
        try {
          const db = await initDB();
          const result = await db.get("preferences", "user_preferences");
          if (result) {
            const { id, ...preferences } = result;
            return preferences as UserPreferences;
          }
          return null;
        } catch (error) {
          console.error("Failed to load preferences:", error);
          return null;
        }
      },

      syncData: async () => {
        const { isOnline, pendingChanges, syncInProgress } = get();

        if (!isOnline || syncInProgress || pendingChanges.length === 0) {
          return;
        }

        set({ syncInProgress: true });

        try {
          // TODO: Implement actual sync with backend API
          // For now, we'll just simulate sync and clear pending changes

          await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate network delay

          // Clear pending changes after successful sync
          get().clearPendingChanges();

          set({
            lastSyncTime: new Date(),
            syncInProgress: false,
          });
        } catch (error) {
          console.error("Sync failed:", error);
          set({ syncInProgress: false });
        }
      },

      addPendingChange: (change) => {
        const { pendingChanges } = get();
        set({
          pendingChanges: [...pendingChanges, { ...change, id: Date.now() }],
        });
      },

      clearPendingChanges: () => {
        set({ pendingChanges: [] });
      },

      setOnlineStatus: (isOnline) => {
        set({ isOnline });

        // Auto-sync when coming online
        if (isOnline) {
          get().syncData();
        }
      },

      setError: (error) => {
        // Error handling can be implemented here
        console.error("Persistence error:", error);
      },

      setSyncInProgress: (inProgress) => {
        set({ syncInProgress: inProgress });
      },
    }),
    {
      name: "persistence-store",
    }
  )
);

// Initialize the database when the store is created
usePersistenceStore.getState().initializeDB();
