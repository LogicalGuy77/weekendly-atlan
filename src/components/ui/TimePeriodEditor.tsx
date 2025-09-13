import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Clock, Save } from "lucide-react";
import { formatTo12Hour, formatTo24Hour } from "../../lib/timeUtils";
import type { TimePeriod } from "../../types";

interface TimePeriodEditorProps {
  isOpen: boolean;
  onClose: () => void;
  period: TimePeriod;
  label: string;
  currentStartTime: string;
  currentEndTime: string;
  onSave: (period: TimePeriod, startTime: string, endTime: string) => void;
}

export const TimePeriodEditor: React.FC<TimePeriodEditorProps> = ({
  isOpen,
  onClose,
  period,
  label,
  currentStartTime,
  currentEndTime,
  onSave,
}) => {
  const [startTime, setStartTime] = useState(currentStartTime);
  const [endTime, setEndTime] = useState(currentEndTime);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateTimes = (start: string, end: string): boolean => {
    // Convert to minutes for comparison
    const [startHours, startMinutes] = start.split(":").map(Number);
    const [endHours, endMinutes] = end.split(":").map(Number);

    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    // Handle the special case where end time is "24:00" (end of day)
    const adjustedEndMinutes = endHours === 24 ? 24 * 60 : endTotalMinutes;

    return startTotalMinutes < adjustedEndMinutes;
  };

  const handleSave = () => {
    setError(null);

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-4]):([0-5][0-9])$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      setError("Please enter valid time in HH:MM format");
      return;
    }

    // Validate that start time is before end time
    if (!validateTimes(startTime, endTime)) {
      setError("Start time must be before end time");
      return;
    }

    onSave(period, startTime, endTime);
    onClose();
  };

  const handleReset = () => {
    setStartTime(currentStartTime);
    setEndTime(currentEndTime);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Edit {label} Time
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-sm text-muted-foreground">
            Customize the time range for the {label.toLowerCase()} period.
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="flex-1"
                />
                <div className="text-sm text-muted-foreground min-w-[80px]">
                  {formatTo12Hour(startTime)}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="endTime"
                  type="time"
                  value={endTime === "24:00" ? "23:59" : endTime}
                  onChange={(e) => {
                    const value = e.target.value;
                    // If user selects 23:59, we'll treat it as 24:00 for end of day
                    setEndTime(value === "23:59" ? "24:00" : value);
                  }}
                  className="flex-1"
                />
                <div className="text-sm text-muted-foreground min-w-[80px]">
                  {formatTo12Hour(endTime)}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <strong>Preview:</strong> {label} will be from{" "}
            <span className="font-medium">{formatTo12Hour(startTime)}</span> to{" "}
            <span className="font-medium">{formatTo12Hour(endTime)}</span>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset} className="flex-1">
              Reset
            </Button>
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
