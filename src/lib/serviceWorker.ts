// Service Worker registration and management utilities

interface ServiceWorkerMessage {
  type: string;
  payload?: any;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private isOnline = navigator.onLine;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.setupOnlineOfflineListeners();
  }

  async register(): Promise<boolean> {
    if (!("serviceWorker" in navigator)) {
      console.warn("Service Worker not supported");
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });

      console.log("Service Worker registered successfully");

      // Handle updates
      this.registration.addEventListener("updatefound", () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version available
              this.emit("update-available");
            }
          });
        }
      });

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener("message", (event) => {
        this.handleServiceWorkerMessage(event.data);
      });

      // Check if there's a waiting service worker
      if (this.registration.waiting) {
        this.emit("update-available");
      }

      return true;
    } catch (error) {
      console.error("Service Worker registration failed:", error);
      return false;
    }
  }

  async unregister(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      console.log("Service Worker unregistered");
      return result;
    } catch (error) {
      console.error("Service Worker unregistration failed:", error);
      return false;
    }
  }

  async update(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.update();
      console.log("Service Worker update check completed");
    } catch (error) {
      console.error("Service Worker update failed:", error);
    }
  }

  skipWaiting(): void {
    if (this.registration?.waiting) {
      this.postMessage({ type: "SKIP_WAITING" });
    }
  }

  async cacheActivities(activities: any[]): Promise<void> {
    this.postMessage({
      type: "CACHE_ACTIVITIES",
      payload: activities,
    });
  }

  async clearCache(): Promise<void> {
    this.postMessage({ type: "CLEAR_CACHE" });
  }

  async getCacheStatus(): Promise<any> {
    return new Promise((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.postMessage({ type: "GET_CACHE_STATUS" }, [channel.port2]);
    });
  }

  // Event listener management
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  private postMessage(
    message: ServiceWorkerMessage,
    transfer?: Transferable[]
  ): void {
    if (navigator.serviceWorker.controller) {
      if (transfer) {
        navigator.serviceWorker.controller.postMessage(message, { transfer });
      } else {
        navigator.serviceWorker.controller.postMessage(message);
      }
    }
  }

  private handleServiceWorkerMessage(message: ServiceWorkerMessage): void {
    switch (message.type) {
      case "SYNC_STARTED":
        this.emit("sync-started");
        break;
      case "SYNC_COMPLETED":
        this.emit("sync-completed");
        break;
      default:
        console.log("Unknown service worker message:", message);
    }
  }

  private setupOnlineOfflineListeners(): void {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.emit("online");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.emit("offline");
    });
  }

  get online(): boolean {
    return this.isOnline;
  }

  get isRegistered(): boolean {
    return this.registration !== null;
  }
}

// Singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

// Utility functions for common operations
export const registerServiceWorker = () => serviceWorkerManager.register();
export const unregisterServiceWorker = () => serviceWorkerManager.unregister();
export const updateServiceWorker = () => serviceWorkerManager.update();
export const skipWaitingServiceWorker = () =>
  serviceWorkerManager.skipWaiting();

// Cache management utilities
export const cacheActivitiesOffline = (activities: any[]) =>
  serviceWorkerManager.cacheActivities(activities);

export const clearOfflineCache = () => serviceWorkerManager.clearCache();

export const getOfflineCacheStatus = () =>
  serviceWorkerManager.getCacheStatus();

// Event subscription utilities
export const onServiceWorkerUpdate = (callback: Function) =>
  serviceWorkerManager.on("update-available", callback);

export const onServiceWorkerSync = (callback: Function) =>
  serviceWorkerManager.on("sync-completed", callback);

export const onOnlineStatusChange = (callback: Function) => {
  serviceWorkerManager.on("online", callback);
  serviceWorkerManager.on("offline", callback);
};

// Background sync registration
export const registerBackgroundSync = async (tag: string): Promise<boolean> => {
  if (
    !("serviceWorker" in navigator) ||
    !("sync" in window.ServiceWorkerRegistration.prototype)
  ) {
    console.warn("Background Sync not supported");
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    // Type assertion for background sync API
    const syncManager = (registration as any).sync;
    if (syncManager) {
      await syncManager.register(tag);
      console.log("Background sync registered:", tag);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Background sync registration failed:", error);
    return false;
  }
};

// Push notification utilities (for future use)
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("Notifications not supported");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission === "denied") {
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === "granted";
};

export const subscribeToPushNotifications =
  async (): Promise<PushSubscription | null> => {
    if (!serviceWorkerManager.isRegistered) {
      console.warn("Service Worker not registered");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Add your VAPID public key here when implementing push notifications
        // applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });

      console.log("Push subscription created");
      return subscription;
    } catch (error) {
      console.error("Push subscription failed:", error);
      return null;
    }
  };

// Storage quota management
export const checkStorageQuota = async (): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> => {
  if ("storage" in navigator && "estimate" in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? (usage / quota) * 100 : 0;

      return { usage, quota, percentage };
    } catch (error) {
      console.error("Failed to check storage quota:", error);
    }
  }

  return { usage: 0, quota: 0, percentage: 0 };
};

export const requestPersistentStorage = async (): Promise<boolean> => {
  if ("storage" in navigator && "persist" in navigator.storage) {
    try {
      const persistent = await navigator.storage.persist();
      console.log("Persistent storage:", persistent ? "granted" : "denied");
      return persistent;
    } catch (error) {
      console.error("Failed to request persistent storage:", error);
    }
  }

  return false;
};
