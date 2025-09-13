import React, { useState, useEffect } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, X, GripVertical, Edit } from "lucide-react";
import { TimePeriodEditor } from "../ui/TimePeriodEditor";
import { useUserStore } from "../../stores/userStore";
import type { WeekendDay, TimePeriod, ScheduledActivity } from "../../types";

interface DroppableTimeSlotProps {
  day: WeekendDay;
  period: TimePeriod;
  label: string;
  time: string;
  activities: ScheduledActivity[];
  onActivityRemove?: (activityId: string) => void;
  readOnly?: boolean;
}

interface DraggableScheduledActivityProps {
  scheduledActivity: ScheduledActivity;
  onActivityRemove?: (activityId: string) => void;
  readOnly?: boolean;
}

const SortableScheduledActivity: React.FC<DraggableScheduledActivityProps> = ({
  scheduledActivity,
  onActivityRemove,
  readOnly = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: scheduledActivity.id,
    data: {
      type: "scheduledActivity",
      scheduledActivity,
      activity: scheduledActivity.activity,
    },
    disabled: readOnly,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative p-3 bg-background border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ${
        isDragging ? "opacity-50 z-50" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: scheduledActivity.activity.category.color,
              }}
            />
            <h4 className="font-medium">{scheduledActivity.activity.title}</h4>
            {scheduledActivity.completed && (
              <Badge variant="secondary" className="text-xs">
                Completed
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground mb-2">
            {scheduledActivity.activity.description}
          </p>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(scheduledActivity.activity.duration)}</span>
            </div>

            <Badge
              variant="outline"
              className="text-xs"
              style={{
                backgroundColor: `${scheduledActivity.activity.category.color}20`,
                color: scheduledActivity.activity.category.color,
              }}
            >
              {scheduledActivity.activity.category.name}
            </Badge>
          </div>

          {scheduledActivity.customNotes && (
            <div className="mt-2 p-2 bg-muted rounded text-sm">
              <strong>Notes:</strong> {scheduledActivity.customNotes}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {!readOnly && (
            <>
              <div
                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                {...listeners}
                {...attributes}
              >
                <GripVertical className="w-4 h-4 text-muted-foreground" />
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onActivityRemove?.(scheduledActivity.id);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  day,
  period,
  label,
  time,
  activities,
  onActivityRemove,
  readOnly = false,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { preferences, updateTimePeriod } = useUserStore();

  const { isOver, setNodeRef } = useDroppable({
    id: `${day}-${period}`,
    data: {
      type: "timeSlot",
      day,
      period,
    },
  });

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getTotalDuration = () => {
    return activities.reduce((total, sa) => total + sa.activity.duration, 0);
  };

  const handleTimeEdit = () => {
    if (!readOnly) {
      setIsEditorOpen(true);
    }
  };

  const handleTimePeriodSave = (
    period: TimePeriod,
    startTime: string,
    endTime: string
  ) => {
    updateTimePeriod(period, startTime, endTime);
  };

  const getCurrentTimePeriod = () => {
    return preferences.timePeriods[
      period as keyof typeof preferences.timePeriods
    ];
  };

  return (
    <>
      <Card
        ref={setNodeRef}
        className={`min-h-[120px] transition-all duration-200 group ${
          isOver ? "ring-2 ring-primary bg-primary/5" : ""
        } ${!readOnly ? "hover:bg-muted/50" : ""}`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{label}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <button
                onClick={handleTimeEdit}
                className={`hover:text-primary transition-colors ${
                  !readOnly ? "cursor-pointer hover:underline" : ""
                }`}
                disabled={readOnly}
                title={readOnly ? "" : "Click to edit time period"}
              >
                {time}
              </button>
              {!readOnly && (
                <Edit className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              )}
            </div>
          </div>
          {getTotalDuration() > 0 && (
            <div className="text-sm text-muted-foreground">
              Total: {formatDuration(getTotalDuration())}
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {activities.length === 0 ? (
            <div
              className={`text-center py-8 text-muted-foreground transition-all duration-200 ${
                isOver ? "scale-105" : ""
              }`}
            >
              <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {readOnly ? "No activities planned" : "Drop activities here"}
              </p>
              {isOver && !readOnly && (
                <p className="text-xs text-primary mt-1 animate-pulse">
                  Release to add activity
                </p>
              )}
            </div>
          ) : (
            <SortableContext
              items={activities.map((sa) => sa.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence mode="popLayout">
                {activities.map((scheduledActivity, index) => (
                  <motion.div
                    key={scheduledActivity.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0, y: -20 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      y: 0,
                      transition: {
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        mass: 1,
                        delay: index * 0.1, // Stagger animation
                      },
                    }}
                    exit={{
                      scale: 0.8,
                      opacity: 0,
                      y: -20,
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 25,
                      },
                    }}
                  >
                    <SortableScheduledActivity
                      scheduledActivity={scheduledActivity}
                      onActivityRemove={onActivityRemove}
                      readOnly={readOnly}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </SortableContext>
          )}
        </CardContent>
      </Card>

      {/* Time Period Editor */}
      <TimePeriodEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        period={period}
        label={label}
        currentStartTime={getCurrentTimePeriod().start}
        currentEndTime={getCurrentTimePeriod().end}
        onSave={handleTimePeriodSave}
      />
    </>
  );
};
