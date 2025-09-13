import React, { useState, useEffect } from "react";
import { Wifi, WifiOff, Cloud, CloudOff, RotateCw } from "lucide-react";
import { Badge } from "./badge";
import { usePersistenceStore } from "../../stores/persistenceStore";
import {
  onOnlineStatusChange,
  onServiceWorkerSync,
} from "../../lib/serviceWorker";

interface OfflineIndicatorProps {
  className?: string;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const { pendingChanges, lastSyncTime } = usePersistenceStore();

  useEffect(() => {
    const handleStatusChange = () => {
      setIsOnline(navigator.onLine);
    };

    const handleSyncStart = () => {
      setIsSyncing(true);
    };

    const handleSyncComplete = () => {
      setIsSyncing(false);
    };

    // Set up listeners
    onOnlineStatusChange(handleStatusChange);
    onServiceWorkerSync(handleSyncComplete);

    // Listen for sync events from persistence store
    const unsubscribe = usePersistenceStore.subscribe((state) => {
      setIsSyncing(state.syncInProgress);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getStatusInfo = () => {
    if (isSyncing) {
      return {
        icon: RotateCw,
        text: "Syncing...",
        variant: "secondary" as const,
        className: "animate-spin",
      };
    }

    if (!isOnline) {
      return {
        icon: WifiOff,
        text:
          pendingChanges.length > 0
            ? `Offline (${pendingChanges.length} pending)`
            : "Offline",
        variant: "destructive" as const,
        className: "",
      };
    }

    if (pendingChanges.length > 0) {
      return {
        icon: CloudOff,
        text: `${pendingChanges.length} pending sync`,
        variant: "secondary" as const,
        className: "",
      };
    }

    return {
      icon: Cloud,
      text: lastSyncTime ? `Synced ${formatLastSync(lastSyncTime)}` : "Online",
      variant: "outline" as const,
      className: "",
    };
  };

  const formatLastSync = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <Badge
      variant={statusInfo.variant}
      className={`flex items-center gap-1 text-xs ${className}`}
    >
      <Icon size={12} className={statusInfo.className} />
      <span>{statusInfo.text}</span>
    </Badge>
  );
};

export default OfflineIndicator;
