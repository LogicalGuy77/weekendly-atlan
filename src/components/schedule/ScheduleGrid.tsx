import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, X, Edit3 } from "lucide-react";
import type { ScheduleGridProps, WeekendDay, TimePeriod } from "../../types";

const TIME_PERIODS: { period: TimePeriod; label: string; time: string }[] = [
  { period: "morning", label: "Morning", time: "8:00 - 12:00" },
  { period: "afternoon", label: "Afternoon", time: "12:00 - 17:00" },
  { period: "evening", label: "Evening", time: "17:00 - 22:00" },
  { period: "night", label: "Night", time: "22:00 - 24:00" },
];

const DAYS: { day: WeekendDay; label: string }[] = [
  { day: "saturday", label: "Saturday" },
  { day: "sunday", label: "Sunday" },
];

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  weekend,
  onActivityAdd,
  onActivityRemove,
  onActivityMove,
  readOnly = false,
}) => {
  const getActivitiesForTimeSlot = (day: WeekendDay, period: TimePeriod) => {
    return weekend[day].filter(
      (scheduledActivity) => scheduledActivity.timeSlot.period === period
    );
  };

  const handleDrop = (
    e: React.DragEvent,
    day: WeekendDay,
    period: TimePeriod
  ) => {
    e.preventDefault();

    if (readOnly) return;

    try {
      const activityData = e.dataTransfer.getData("application/json");
      const activity = JSON.parse(activityData);

      // Create a time slot for this drop
      const timeSlot = {
        id: `${day}-${period}`,
        day,
        startTime:
          TIME_PERIODS.find((p) => p.period === period)?.time.split(" - ")[0] ||
          "08:00",
        endTime:
          TIME_PERIODS.find((p) => p.period === period)?.time.split(" - ")[1] ||
          "12:00",
        period,
      };

      onActivityAdd?.(activity, timeSlot);
    } catch (error) {
      console.error("Failed to parse dropped activity:", error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const getTotalDurationForSlot = (day: WeekendDay, period: TimePeriod) => {
    const activities = getActivitiesForTimeSlot(day, period);
    return activities.reduce((total, sa) => total + sa.activity.duration, 0);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">{weekend.title}</h2>
        <p className="text-muted-foreground">
          {new Date(weekend.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DAYS.map(({ day, label }) => (
          <div key={day} className="space-y-4">
            <h3 className="text-xl font-semibold text-center">{label}</h3>

            {TIME_PERIODS.map(({ period, label: periodLabel, time }) => {
              const activities = getActivitiesForTimeSlot(day, period);
              const totalDuration = getTotalDurationForSlot(day, period);

              return (
                <Card
                  key={`${day}-${period}`}
                  className={`min-h-[120px] transition-colors ${
                    !readOnly ? "hover:bg-muted/50" : ""
                  }`}
                  onDrop={(e) => handleDrop(e, day, period)}
                  onDragOver={handleDragOver}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{periodLabel}</CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{time}</span>
                      </div>
                    </div>
                    {totalDuration > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Total: {formatDuration(totalDuration)}
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {activities.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          {readOnly
                            ? "No activities planned"
                            : "Drop activities here"}
                        </p>
                      </div>
                    ) : (
                      activities.map((scheduledActivity) => (
                        <div
                          key={scheduledActivity.id}
                          className="group relative p-3 bg-background border rounded-lg shadow-sm hover:shadow-md transition-shadow"
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
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
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
                                    {formatDuration(
                                      scheduledActivity.activity.duration
                                    )}
                                  </span>
                                </div>

                                <Badge
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    backgroundColor: `${scheduledActivity.activity.category.color}20`,
                                    color:
                                      scheduledActivity.activity.category.color,
                                  }}
                                >
                                  {scheduledActivity.activity.category.name}
                                </Badge>
                              </div>

                              {scheduledActivity.customNotes && (
                                <div className="mt-2 p-2 bg-muted rounded text-sm">
                                  <strong>Notes:</strong>{" "}
                                  {scheduledActivity.customNotes}
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
                                    console.log(
                                      "Edit activity:",
                                      scheduledActivity.id
                                    );
                                  }}
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() =>
                                    onActivityRemove?.(scheduledActivity.id)
                                  }
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
            })}
          </div>
        ))}
      </div>

      {/* Weekend Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Weekend Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Saturday</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Activities:</span>
                  <span>{weekend.saturday.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total time:</span>
                  <span>
                    {formatDuration(
                      weekend.saturday.reduce(
                        (total, sa) => total + sa.activity.duration,
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Sunday</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Activities:</span>
                  <span>{weekend.sunday.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total time:</span>
                  <span>
                    {formatDuration(
                      weekend.sunday.reduce(
                        (total, sa) => total + sa.activity.duration,
                        0
                      )
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
