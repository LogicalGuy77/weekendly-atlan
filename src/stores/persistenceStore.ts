import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { openDB, type IDBPDatabase } from "idb";
import type {
  PersistenceStoreState,
  WeekendSchedule,
  UserPreferences,
} from "../types";

interface PersistenceStoreActions {
  // Database initialization
  initializeDB: () => Promise<void>;

  // Weekend persistence
  saveWeekend: (weekend: WeekendSchedule) => Promise<void>;
  loadWeekend: (weekendId: string) => Promise<WeekendSchedule | null>;
  loadAllWeekends: () => Promise<WeekendSchedule[]>;
  deleteWeekend: (weekendId: string) => Promise<void>;

  // User preferences persistence
  savePreferences: (preferences: UserPreferences) => Promise<void>;
  loadPreferences: () => Promise<UserPreferences | null>;

  // Sync management
  syncData: () => Promise<void>;
  addPendingChange: (change: any) => void;
  clearPendingChanges: () => void;

  // Online/offline status
  setOnlineStatus: (isOnline: boolean) => void;

  // Error handling
  setError: (error: string | null) => void;
  setSyncInProgress: (inProgress: boolean) => void;
}

type PersistenceStore = PersistenceStoreState & PersistenceStoreActions;

const DB_NAME = "weekendly-db";
const DB_VERSION = 1;

let dbInstance: IDBPDatabase | null = null;

const initDB = async (): Promise<IDBPDatabase> => {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Weekends store
      if (!db.objectStoreNames.contains("weekends")) {
        const weekendStore = db.createObjectStore("weekends", {
          keyPath: "id",
        });
        weekendStore.createIndex("createdAt", "createdAt");
        weekendStore.createIndex("updatedAt", "updatedAt");
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
      }
    },
  });

  return dbInstance;
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

      loadAllWeekends: async () => {
        try {
          const db = await initDB();
          const weekends = await db.getAll("weekends");
          return weekends.sort(
            (a, b) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        } catch (error) {
          console.error("Failed to load weekends:", error);
          return [];
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
