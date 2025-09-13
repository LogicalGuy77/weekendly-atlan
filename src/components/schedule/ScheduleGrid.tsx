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

export const ScheduleGrid: React.FC<
  ScheduleGridProps & {
    onTimeEdit?: (period: TimePeriod, label: string) => void;
  }
> = ({
  weekend,
  onActivityRemove,
  onTimeEdit,
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
    <div className="w-full max-w-full">
      {activeDay && (
        <div className="space-y-6">
          {/* Clean responsive grid with proper spacing */}
          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4 md:gap-6 w-full">
            {TIME_PERIODS.map(
              ({ period, label: periodLabel, time, icon }, index) => {
                const activities = getActivitiesForTimeSlot(activeDay, period);
                const timeOfDay = getTimeOfDay(period);
                return (
                  <motion.div
                    key={`${activeDay}-${period}`}
                    className="relative w-full min-w-0"
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
                    {/* Clean background contained within card bounds */}
                    <div className="absolute inset-0 rounded-3xl overflow-hidden">
                      <TimeAwareBackground timeOfDay={timeOfDay} />
                    </div>

                    {/* Time slot with proper layering */}
                    <div className="relative z-10 w-full">
                      <DroppableTimeSlot
                        day={activeDay}
                        period={period}
                        label={periodLabel}
                        time={time}
                        icon={icon}
                        activities={activities}
                        onActivityRemove={onActivityRemove}
                        onTimeEdit={onTimeEdit}
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
