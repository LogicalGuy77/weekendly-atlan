import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock } from "lucide-react";
import type { Activity, WeekendDay, TimePeriod } from "../../types";

interface TimeSlotSelectorProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onSelectTimeSlot: (day: WeekendDay, period: TimePeriod) => void;
}

const TIME_PERIODS: {
  period: TimePeriod;
  label: string;
  time: string;
  icon: string;
}[] = [
  { period: "morning", label: "Morning", time: "8:00 - 12:00", icon: "🌅" },
  {
    period: "afternoon",
    label: "Afternoon",
    time: "12:00 - 17:00",
    icon: "☀️",
  },
  { period: "evening", label: "Evening", time: "17:00 - 22:00", icon: "🌆" },
  { period: "night", label: "Night", time: "22:00 - 24:00", icon: "🌙" },
];

const DAYS: { day: WeekendDay; label: string; color: string }[] = [
  { day: "saturday", label: "Saturday", color: "bg-blue-500" },
  { day: "sunday", label: "Sunday", color: "bg-purple-500" },
];

export const TimeSlotSelector: React.FC<TimeSlotSelectorProps> = ({
  activity,
  isOpen,
  onClose,
  onSelectTimeSlot,
}) => {
  if (!isOpen) return null;

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Schedule Activity</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Activity Preview */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mt-3">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: activity.category.color }}
              />
              <h4 className="font-medium text-sm">{activity.title}</h4>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(activity.duration)}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {activity.category.name}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 max-h-[50vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground">
            Choose when you'd like to schedule this activity:
          </p>

          {DAYS.map(({ day, label, color }) => (
            <div key={day} className="space-y-2">
              <h5 className="font-medium text-sm flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                {label}
              </h5>
              <div className="grid grid-cols-1 gap-2 ml-5">
                {TIME_PERIODS.map(
                  ({ period, label: periodLabel, time, icon }) => (
                    <Button
                      key={`${day}-${period}`}
                      variant="outline"
                      className="justify-start h-auto p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      onClick={() => {
                        onSelectTimeSlot(day, period);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <span className="text-lg">{icon}</span>
                        <div className="text-left">
                          <div className="font-medium text-sm">
                            {periodLabel}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {time}
                          </div>
                        </div>
                      </div>
                    </Button>
                  )
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
