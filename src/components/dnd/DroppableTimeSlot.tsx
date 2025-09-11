import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, X, Edit3 } from "lucide-react";
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

export const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = ({
  day,
  period,
  label,
  time,
  activities,
  onActivityRemove,
  readOnly = false,
}) => {
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

  return (
    <Card
      ref={setNodeRef}
      className={`min-h-[120px] transition-all duration-200 ${
        isOver ? "ring-2 ring-primary bg-primary/5" : ""
      } ${!readOnly ? "hover:bg-muted/50" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{label}</CardTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{time}</span>
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
          activities.map((scheduledActivity) => (
            <div
              key={scheduledActivity.id}
              className="group relative p-3 bg-background border rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          scheduledActivity.activity.category.color,
                      }}
                    />
                    <h4 className="font-medium">
                      {scheduledActivity.activity.title}
                    </h4>
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
                      <span>
                        {formatDuration(scheduledActivity.activity.duration)}
                      </span>
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

                {!readOnly && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => {
                        // TODO: Implement edit functionality
                        console.log("Edit activity:", scheduledActivity.id);
                      }}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      onClick={() => onActivityRemove?.(scheduledActivity.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
