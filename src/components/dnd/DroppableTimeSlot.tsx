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
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative glass-activity rounded-2xl transition-all duration-300 glass-float glass-glow
        ${isDragging ? "opacity-70 z-50 shadow-2xl scale-105 rotate-2" : ""}
        ${readOnly ? "cursor-default" : "cursor-grab active:cursor-grabbing"}`}
    >
      {/* Gradient border effect */}
      <div
        className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r opacity-60"
        style={{
          background: `linear-gradient(135deg, ${scheduledActivity.activity.category.color}40, transparent, ${scheduledActivity.activity.category.color}20)`,
        }}
      >
        <div className="w-full h-full rounded-2xl bg-black/5 dark:bg-white/5" />
      </div>

      <div className="relative p-4 rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <motion.div
                className="w-3 h-3 rounded-full flex-shrink-0 shadow-lg"
                style={{
                  backgroundColor: scheduledActivity.activity.category.color,
                  boxShadow: `0 0 12px ${scheduledActivity.activity.category.color}40`,
                }}
                animate={{
                  boxShadow: [
                    `0 0 12px ${scheduledActivity.activity.category.color}40`,
                    `0 0 16px ${scheduledActivity.activity.category.color}60`,
                    `0 0 12px ${scheduledActivity.activity.category.color}40`,
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <h4 className="font-semibold truncate text-white drop-shadow-sm text-sm">
                {scheduledActivity.activity.title}
              </h4>
            </div>

            <div className="flex items-center gap-3 text-xs text-white/90">
              <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-2 py-1 backdrop-blur-sm">
                <Clock className="w-3 h-3" />
                <span className="font-medium">
                  {formatDuration(scheduledActivity.activity.duration)}
                </span>
              </div>
              <Badge
                variant="outline"
                className="text-xs whitespace-nowrap border-0 font-medium backdrop-blur-sm"
                style={{
                  backgroundColor: `${scheduledActivity.activity.category.color}25`,
                  color: scheduledActivity.activity.category.color,
                  textShadow: `0 0 8px ${scheduledActivity.activity.category.color}40`,
                }}
              >
                {scheduledActivity.activity.category.name}
              </Badge>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-white/60 hover:text-red-400 hover:bg-red-500/20 
                         opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-full
                         backdrop-blur-sm border border-white/10 hover:border-red-400/30"
                onClick={(e) => {
                  e.stopPropagation();
                  onActivityRemove?.(scheduledActivity.id);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
              <div
                className="cursor-grab active:cursor-grabbing p-2 text-white/50 hover:text-white/80 
                         transition-colors rounded-full hover:bg-white/10 backdrop-blur-sm"
                {...listeners}
                {...attributes}
              >
                <GripVertical className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
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

  const getGlassClass = () => {
    switch (period) {
      case "morning":
        return "glass-morning";
      case "afternoon":
        return "glass-afternoon";
      case "evening":
        return "glass-evening";
      case "night":
        return "glass-night";
      default:
        return "glass";
    }
  };

  return (
    <>
      <motion.div
        ref={setNodeRef}
        layout
        whileHover={{ scale: 1.02, y: -4 }}
        className={`min-h-[280px] flex flex-col transition-all duration-500 group relative
        ${getGlassClass()} rounded-3xl p-0 glass-float glass-glow overflow-hidden
        ${isOver ? "ring-2 ring-white/40 shadow-2xl scale-[1.03]" : ""}
        ${!readOnly ? "hover:shadow-2xl" : ""}`}
      >
        {/* Enhanced header with better glass effect */}
        <div className="relative z-20 p-6 pb-4">
          <div className="flex items-center justify-between">
            <motion.div
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <motion.span
                className="text-2xl filter drop-shadow-lg"
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                {icon}
              </motion.span>
              <h3 className="text-lg font-bold text-white drop-shadow-lg tracking-wide">
                {label}
              </h3>
            </motion.div>

            <motion.button
              onClick={handleTimeEdit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`text-sm font-medium text-white/90 transition-all duration-200 
                px-3 py-1.5 rounded-full backdrop-blur-sm bg-white/10 border border-white/20
                hover:bg-white/20 hover:border-white/30 hover:text-white drop-shadow-md
                ${!readOnly ? "cursor-pointer" : "cursor-default"}`}
              disabled={readOnly}
            >
              {time}
            </motion.button>
          </div>
        </div>

        {/* Content area with enhanced styling */}
        <div className="flex-1 flex flex-col px-6 pb-6 relative z-10">
          {activities.length === 0 ? (
            <motion.div
              className={`flex-1 flex flex-col items-center justify-center text-center transition-all duration-300 ${
                isOver ? "scale-110" : ""
              }`}
              animate={
                isOver
                  ? {
                      scale: [1, 1.05, 1],
                      opacity: [0.7, 1, 0.7],
                    }
                  : {}
              }
              transition={{ duration: 1.5, repeat: isOver ? Infinity : 0 }}
            >
              <motion.div
                className="p-4 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4"
                animate={{
                  y: [0, -8, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Plus className="w-8 h-8 text-white/60" />
              </motion.div>
              <p className="text-sm font-medium text-white/80 mb-1">
                {readOnly ? "No activities scheduled" : "Drop an activity here"}
              </p>
              {isOver && !readOnly && (
                <motion.p
                  className="text-sm text-white font-semibold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  Release to add activity
                </motion.p>
              )}
            </motion.div>
          ) : (
            <div className="flex-1 space-y-3">
              <SortableContext
                items={activities.map((sa) => sa.id)}
                strategy={verticalListSortingStrategy}
              >
                <AnimatePresence mode="popLayout">
                  {activities.map((sa, index) => (
                    <motion.div
                      key={sa.id}
                      layout
                      initial={{ scale: 0.8, opacity: 0, y: 20 }}
                      animate={{
                        scale: 1,
                        opacity: 1,
                        y: 0,
                        transition: {
                          type: "spring",
                          stiffness: 400,
                          damping: 25,
                          delay: index * 0.1,
                        },
                      }}
                      exit={{
                        scale: 0.8,
                        opacity: 0,
                        y: -20,
                        transition: { duration: 0.2 },
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
            </div>
          )}
        </div>

        {/* Subtle gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-white/5 pointer-events-none rounded-3xl" />
      </motion.div>

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
