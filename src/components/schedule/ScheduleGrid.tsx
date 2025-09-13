import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DroppableTimeSlot } from "../dnd/DroppableTimeSlot";
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
  activeDay,
}) => {
  const getActivitiesForTimeSlot = (day: WeekendDay, period: TimePeriod) => {
    return weekend[day].filter(
      (scheduledActivity) => scheduledActivity.timeSlot.period === period
    );
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  // If activeDay is specified, show only that day
  const daysToShow = activeDay
    ? [
        {
          day: activeDay,
          label: activeDay === "saturday" ? "Saturday" : "Sunday",
        },
      ]
    : DAYS;

  return (
    <div className="space-y-6">
      {/* Single Day Layout */}
      {activeDay ? (
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2 capitalize">{activeDay}</h2>
            <p className="text-muted-foreground">
              {weekend[activeDay].length} activities planned
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 md:gap-4 md:grid-cols-2">
            {TIME_PERIODS.map(({ period, label: periodLabel, time }) => {
              const activities = getActivitiesForTimeSlot(activeDay, period);

              return (
                <DroppableTimeSlot
                  key={`${activeDay}-${period}`}
                  day={activeDay}
                  period={period}
                  label={periodLabel}
                  time={time}
                  activities={activities}
                  onActivityRemove={onActivityRemove}
                  readOnly={readOnly}
                />
              );
            })}
          </div>

          {/* Day Summary */}
          <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="text-center">
                <h4 className="font-semibold mb-4 capitalize">
                  {activeDay} Summary
                </h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {weekend[activeDay].length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Activities
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {formatDuration(
                        weekend[activeDay].reduce(
                          (total, sa) => total + sa.activity.duration,
                          0
                        )
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Time
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Original two-day layout for backward compatibility
        <>
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

                  return (
                    <DroppableTimeSlot
                      key={`${day}-${period}`}
                      day={day}
                      period={period}
                      label={periodLabel}
                      time={time}
                      activities={activities}
                      onActivityRemove={onActivityRemove}
                      readOnly={readOnly}
                    />
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
        </>
      )}
    </div>
  );
};
