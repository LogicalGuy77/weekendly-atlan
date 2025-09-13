import React from "react";
import { motion } from "framer-motion";
import { DroppableTimeSlot } from "../dnd/DroppableTimeSlot";
import { getTimePeriodInfo } from "../../lib/timeUtils";
import { useUserStore } from "../../stores/userStore";
import type { ScheduleGridProps, WeekendDay, TimePeriod } from "../../types";
import { TimeAwareBackground } from "../ui/TimeAwareBackground";

const getTimeOfDay = (
  period: TimePeriod
): "morning" | "afternoon" | "evening" | "night" => {
  switch (period) {
    case "morning":
      return "morning";
    case "afternoon":
      return "afternoon";
    case "evening":
      return "evening";
    case "night":
      return "night";
    default:
      return "morning";
  }
};

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
    <div className="space-y-8 p-2">
      {activeDay && (
        <div className="space-y-6">
          {/* Enhanced grid with better spacing and responsive design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8">
            {TIME_PERIODS.map(
              ({ period, label: periodLabel, time, icon }, index) => {
                const activities = getActivitiesForTimeSlot(activeDay, period);
                const timeOfDay = getTimeOfDay(period);
                return (
                  <motion.div
                    key={`${activeDay}-${period}`}
                    className="relative"
                    initial={{ opacity: 0, y: 40, scale: 0.9 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        delay: index * 0.1,
                      },
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.6, delay: index * 0.1 },
                    }}
                    viewport={{ once: true, margin: "-50px" }}
                  >
                    {/* Enhanced background with better positioning */}
                    <div className="absolute inset-0 -m-2">
                      <TimeAwareBackground timeOfDay={timeOfDay} />
                    </div>

                    {/* Time slot with relative positioning for proper layering */}
                    <div className="relative z-10">
                      <DroppableTimeSlot
                        day={activeDay}
                        period={period}
                        label={periodLabel}
                        time={time}
                        icon={icon}
                        activities={activities}
                        onActivityRemove={onActivityRemove}
                        readOnly={readOnly}
                      />
                    </div>
                  </motion.div>
                );
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
};
