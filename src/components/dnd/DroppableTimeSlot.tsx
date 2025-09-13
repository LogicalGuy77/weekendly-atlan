import React, { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
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
import { Clock, Plus, X, GripVertical } from "lucide-react";
import { TimePeriodEditor } from "../ui/TimePeriodEditor";
import { useUserStore } from "../../stores/userStore";
import type { WeekendDay, TimePeriod, ScheduledActivity } from "../../types";

interface DroppableTimeSlotProps {
  day: WeekendDay;
  period: TimePeriod;
  label: string;
  time: string;
  icon: string;
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
      className={`group relative p-3 glass-subtle border rounded-lg hover:glass-card transition-all duration-200 ${
        isDragging ? "opacity-50 z-50 shadow-lg scale-105" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                backgroundColor: scheduledActivity.activity.category.color,
              }}
            />
            <h4 className="font-medium truncate">
              {scheduledActivity.activity.title}
            </h4>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(scheduledActivity.activity.duration)}</span>
            </div>
            <Badge
              variant="outline"
              className="text-xs whitespace-nowrap"
              style={{
                backgroundColor: `${scheduledActivity.activity.category.color}20`,
                borderColor: `${scheduledActivity.activity.category.color}50`,
                color: scheduledActivity.activity.category.color,
              }}
            >
              {scheduledActivity.activity.category.name}
            </Badge>
          </div>
        </div>

        {!readOnly && (
          <div className="flex items-center">
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => {
                e.stopPropagation();
                onActivityRemove?.(scheduledActivity.id);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
            <div
              className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground/50 hover:text-muted-foreground"
              {...listeners}
              {...attributes}
            >
              <GripVertical className="w-4 h-4" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  day,
  period,
  label,
  time,
  icon,
  activities,
  onActivityRemove,
  readOnly = false,
}) => {
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const { preferences, updateTimePeriod } = useUserStore();

  const { isOver, setNodeRef } = useDroppable({
    id: `${day}-${period}`,
    data: { type: "timeSlot", day, period },
  });

  const handleTimeEdit = () => {
    if (!readOnly) setIsEditorOpen(true);
  };

  const handleTimePeriodSave = (
    p: TimePeriod,
    startTime: string,
    endTime: string
  ) => {
    updateTimePeriod(p, startTime, endTime);
  };

  const getCurrentTimePeriod = () =>
    preferences.timePeriods[period as keyof typeof preferences.timePeriods];

  return (
    <>
      <Card
        ref={setNodeRef}
        className={`min-h-[200px] flex flex-col transition-all duration-300 group glass-card border-dashed ${
          isOver
            ? "ring-2 ring-primary border-solid bg-primary/10 dark:bg-primary/5"
            : "border-border/50"
        } ${!readOnly ? "hover:border-primary/50 hover:shadow-xl" : ""}`}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <span className="text-xl">{icon}</span>
              {label}
            </CardTitle>
            <button
              onClick={handleTimeEdit}
              className={`text-xs text-muted-foreground transition-colors ${
                !readOnly
                  ? "cursor-pointer hover:text-primary hover:underline"
                  : ""
              }`}
              disabled={readOnly}
            >
              {time}
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-3 p-3">
          {activities.length === 0 ? (
            <div
              className={`flex-1 flex flex-col items-center justify-center text-center text-muted-foreground transition-all duration-200 ${
                isOver ? "scale-105" : ""
              }`}
            >
              <Plus className="w-6 h-6 mb-1 opacity-40" />
              <p className="text-xs">
                {readOnly ? "No activities" : "Drop an activity"}
              </p>
              {isOver && !readOnly && (
                <p className="text-xs text-primary mt-1 animate-pulse">
                  Release to add
                </p>
              )}
            </div>
          ) : (
            <SortableContext
              items={activities.map((sa) => sa.id)}
              strategy={verticalListSortingStrategy}
            >
              <AnimatePresence>
                {activities.map((sa) => (
                  <motion.div
                    key={sa.id}
                    layout
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{
                      scale: 1,
                      opacity: 1,
                      transition: {
                        type: "spring",
                        stiffness: 350,
                        damping: 30,
                      },
                    }}
                    exit={{
                      scale: 0.8,
                      opacity: 0,
                      transition: { duration: 0.15 },
                    }}
                  >
                    <SortableScheduledActivity
                      scheduledActivity={sa}
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
