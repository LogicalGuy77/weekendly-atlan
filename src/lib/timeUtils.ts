/**
 * Utility functions for time formatting and manipulation
 */

/**
 * Converts 24-hour time format to 12-hour AM/PM format
 * @param time24 - Time in 24-hour format (e.g., "14:30", "09:00")
 * @returns Time in 12-hour AM/PM format (e.g., "2:30 PM", "9:00 AM")
 */
export function formatTo12Hour(time24: string): string {
  // Handle special case for "24:00" which represents end of day
  if (time24 === "24:00") {
    return "12:00 AM";
  }

  const [hours, minutes] = time24.split(":").map(Number);

  // Handle invalid input
  if (
    isNaN(hours) ||
    isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return time24; // Return original if invalid
  }

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;

  // Format minutes with leading zero if needed
  const displayMinutes = minutes.toString().padStart(2, "0");

  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Formats a time range from 24-hour to 12-hour AM/PM format
 * @param startTime - Start time in 24-hour format
 * @param endTime - End time in 24-hour format
 * @returns Formatted time range (e.g., "8:00 AM - 12:00 PM")
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  const start = formatTo12Hour(startTime);
  const end = formatTo12Hour(endTime);
  return `${start} - ${end}`;
}

/**
 * Converts 12-hour AM/PM format to 24-hour format
 * @param time12 - Time in 12-hour AM/PM format (e.g., "2:30 PM", "9:00 AM")
 * @returns Time in 24-hour format (e.g., "14:30", "09:00")
 */
export function formatTo24Hour(time12: string): string {
  const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);

  if (!match) {
    return time12; // Return original if invalid format
  }

  let [, hoursStr, minutesStr, period] = match;
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (period.toUpperCase() === "AM") {
    if (hours === 12) {
      hours = 0;
    }
  } else {
    // PM
    if (hours !== 12) {
      hours += 12;
    }
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Gets the display label for a time period with AM/PM formatting
 * @param period - The time period
 * @returns Object with label and formatted time range
 */
export function getTimePeriodInfo(period: string): {
  label: string;
  time: string;
  icon: string;
} {
  switch (period) {
    case "morning":
      return {
        label: "Morning",
        time: formatTimeRange("08:00", "12:00"),
        icon: "🌅",
      };
    case "afternoon":
      return {
        label: "Afternoon",
        time: formatTimeRange("12:00", "17:00"),
        icon: "☀️",
      };
    case "evening":
      return {
        label: "Evening",
        time: formatTimeRange("17:00", "22:00"),
        icon: "🌆",
      };
    case "night":
      return {
        label: "Night",
        time: formatTimeRange("22:00", "24:00"),
        icon: "🌙",
      };
    default:
      return {
        label: period,
        time: "",
        icon: "⏰",
      };
  }
}
