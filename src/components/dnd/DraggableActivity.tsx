import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { ActivityCard } from "../activities/ActivityCard";
import type { Activity } from "../../types";

interface DraggableActivityProps {
  activity: Activity;
  isSelected?: boolean;
  onSelect?: (activity: Activity) => void;
  showDetails?: boolean;
  compact?: boolean;
}

export const DraggableActivity: React.FC<DraggableActivityProps> = ({
  activity,
  isSelected = false,
  onSelect,
  showDetails = true,
  compact = false,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `activity-${activity.id}`,
      data: {
        type: "activity",
        activity,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`transition-transform duration-200 ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <ActivityCard
        activity={activity}
        isSelected={isSelected}
        isDragging={isDragging}
        onSelect={onSelect}
        showDetails={showDetails}
        compact={compact}
      />
    </div>
  );
};
