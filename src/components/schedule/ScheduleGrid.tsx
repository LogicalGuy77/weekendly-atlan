import React from "react";
import { DroppableTimeSlot } from "../dnd/DroppableTimeSlot";
import { getTimePeriodInfo } from "../../lib/timeUtils";
import { useUserStore } from "../../stores/userStore";
import type { ScheduleGridProps, WeekendDay, TimePeriod } from "../../types";

export const ScheduleGrid: React.FC<ScheduleGridProps> = ({
  weekend,
  onActivityRemove,
  readOnly = false,
  activeDay,
}) => {
  const { preferences } = useUserStore();

  const TIME_PERIODS: {
    period: TimePeriod;
    label: string;
    time: string;
    icon: string;
  }[] = [
    {
      period: "morning",
      ...getTimePeriodInfo("morning", preferences.timePeriods),
    },
    {
      period: "afternoon",
      ...getTimePeriodInfo("afternoon", preferences.timePeriods),
    },
    {
      period: "evening",
      ...getTimePeriodInfo("evening", preferences.timePeriods),
    },
    { period: "night", ...getTimePeriodInfo("night", preferences.timePeriods) },
  ];

  const getActivitiesForTimeSlot = (day: WeekendDay, period: TimePeriod) => {
    return weekend[day].filter(
      (scheduledActivity) => scheduledActivity.timeSlot.period === period
    );
  };

  return (
    <div className="space-y-6">
      {activeDay && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TIME_PERIODS.map(({ period, label: periodLabel, time, icon }) => {
              const activities = getActivitiesForTimeSlot(activeDay, period);
              return (
                <DroppableTimeSlot
                  key={`${activeDay}-${period}`}
                  day={activeDay}
                  period={period}
                  label={periodLabel}
                  time={time}
                  icon={icon}
                  activities={activities}
                  onActivityRemove={onActivityRemove}
                  readOnly={readOnly}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
