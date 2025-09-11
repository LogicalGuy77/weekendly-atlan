import React from "react";
import { DragOverlay as DndKitDragOverlay } from "@dnd-kit/core";
import { ActivityCard } from "../activities/ActivityCard";
import type { Activity } from "../../types";

interface DragOverlayProps {
  activeActivity: Activity | null;
}

export const DragOverlay: React.FC<DragOverlayProps> = ({ activeActivity }) => {
  return (
    <DndKitDragOverlay>
      {activeActivity ? (
        <div className="rotate-3 scale-105 opacity-90">
          <ActivityCard
            activity={activeActivity}
            isDragging={true}
            showDetails={false}
            compact={true}
          />
        </div>
      ) : null}
    </DndKitDragOverlay>
  );
};
