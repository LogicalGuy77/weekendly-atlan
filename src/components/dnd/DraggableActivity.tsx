import React, { useState, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { ActivityCard } from "../activities/ActivityCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Activity } from "../../types";

interface DraggableActivityProps {
  activity: Activity;
  isSelected?: boolean;
  onSelect?: (activity: Activity) => void;
  onMobileAdd?: (activity: Activity) => void;
  showDetails?: boolean;
  compact?: boolean;
}

export const DraggableActivity: React.FC<DraggableActivityProps> = ({
  activity,
  isSelected = false,
  onSelect,
  onMobileAdd,
  showDetails = true,
  compact = false,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `activity-${activity.id}`,
      data: {
        type: "activity",
        activity,
      },
      disabled: isMobile, // Disable drag on mobile to allow scrolling
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  // Only apply drag listeners on desktop
  const dragProps = isMobile ? {} : { ...listeners, ...attributes };

  const handleMobileAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMobileAdd?.(activity);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...dragProps}
      className={`transition-transform duration-200 ${
        isDragging ? "opacity-50" : ""
      } ${isMobile ? "touch-pan-y" : ""} relative group`}
    >
      <ActivityCard
        activity={activity}
        isSelected={isSelected}
        isDragging={isDragging}
        onSelect={onSelect}
        showDetails={showDetails}
        compact={compact}
      />

      {/* Mobile Add Button */}
      {isMobile && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            onClick={handleMobileAdd}
            className="h-8 w-8 p-0 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Desktop drag hint */}
      {!isMobile && (
        <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center">
          <span className="text-xs text-blue-600 font-medium bg-white/90 px-2 py-1 rounded">
            Drag to schedule
          </span>
        </div>
      )}
    </div>
  );
};
