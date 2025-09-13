import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import {
  registerServiceWorker,
  requestPersistentStorage,
} from "./lib/serviceWorker";

// Initialize service worker and persistence
const initializeApp = async () => {
  // Register service worker for offline functionality
  const swRegistered = await registerServiceWorker();
  if (swRegistered) {
    console.log("✅ Service Worker registered - App is offline-ready");
  }

  // Request persistent storage to prevent data eviction
  const persistentStorage = await requestPersistentStorage();
  if (persistentStorage) {
    console.log("✅ Persistent storage granted - Data will be preserved");
  }
};

// Initialize app features
initializeApp().catch(console.error);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
