import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Clock,
  Zap,
  Heart,
  TrendingUp,
  Activity,
  Sparkles,
} from "lucide-react";
import type { WeekendSchedule, WeekendDay } from "../../types";

interface ScheduleSummaryProps {
  weekend: WeekendSchedule;
  activeDay: WeekendDay;
}

export const ScheduleSummary: React.FC<ScheduleSummaryProps> = ({
  weekend,
  activeDay,
}) => {
  const dayActivities = weekend[activeDay];

  if (dayActivities.length === 0) {
    return null;
  }

  // Calculate statistics
  const totalDuration = dayActivities.reduce(
    (total, sa) => total + sa.activity.duration,
    0
  );

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    return `${mins}m`;
  };

  // Calculate energy distribution
  const energyLevels = dayActivities.reduce((acc, sa) => {
    acc[sa.activity.energyLevel] = (acc[sa.activity.energyLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate mood distribution
  const moodCounts = dayActivities.reduce((acc, sa) => {
    sa.activity.mood.forEach((mood) => {
      acc[mood] = (acc[mood] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Calculate vibe score (0-100)
  const calculateVibeScore = () => {
    let score = 50; // Base score

    // Energy balance bonus
    const hasLow = energyLevels.low > 0;
    const hasMedium = energyLevels.medium > 0;
    const hasHigh = energyLevels.high > 0;

    if (hasLow && hasMedium && hasHigh) score += 20; // Perfect balance
    else if ((hasLow && hasMedium) || (hasMedium && hasHigh)) score += 10; // Good balance

    // Mood variety bonus
    const uniqueMoods = Object.keys(moodCounts).length;
    score += Math.min(uniqueMoods * 5, 25); // Up to 25 points for mood variety

    // Activity count bonus
    if (dayActivities.length >= 3) score += 10;
    if (dayActivities.length >= 5) score += 5;

    // Prevent over-scheduling penalty
    if (totalDuration > 600) score -= 10; // More than 10 hours
    if (totalDuration > 720) score -= 10; // More than 12 hours

    return Math.max(0, Math.min(100, score));
  };

  const vibeScore = calculateVibeScore();

  const getVibeEmoji = (score: number) => {
    if (score >= 90) return "🔥";
    if (score >= 80) return "✨";
    if (score >= 70) return "😊";
    if (score >= 60) return "👍";
    if (score >= 50) return "😐";
    if (score >= 40) return "😕";
    return "😴";
  };

  const getVibeDescription = (score: number) => {
    if (score >= 90) return "Epic Weekend Vibes!";
    if (score >= 80) return "Fantastic Energy!";
    if (score >= 70) return "Great Balance!";
    if (score >= 60) return "Good Vibes!";
    if (score >= 50) return "Decent Plan";
    if (score >= 40) return "Could Use More Fun";
    return "Needs More Energy";
  };

  const getVibeColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const topMoods = Object.entries(moodCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="mt-8"
    >
      <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {activeDay.charAt(0).toUpperCase() + activeDay.slice(1)} Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Vibe Score */}
          <div className="text-center">
            <motion.div
              className="inline-flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/10 to-orange-500/10 border border-primary/20"
              whileHover={{ scale: 1.02 }}
            >
              <span className="text-4xl">{getVibeEmoji(vibeScore)}</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold">{vibeScore}</span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
                <p className={`text-sm font-medium ${getVibeColor(vibeScore)}`}>
                  {getVibeDescription(vibeScore)}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Activity className="w-5 h-5 mx-auto mb-1 text-primary" />
              <p className="text-lg font-semibold">{dayActivities.length}</p>
              <p className="text-xs text-muted-foreground">Activities</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-semibold">
                {formatDuration(totalDuration)}
              </p>
              <p className="text-xs text-muted-foreground">Total Time</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-lg font-semibold">
                {Object.keys(energyLevels).length}
              </p>
              <p className="text-xs text-muted-foreground">Energy Types</p>
            </div>
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <Heart className="w-5 h-5 mx-auto mb-1 text-pink-500" />
              <p className="text-lg font-semibold">
                {Object.keys(moodCounts).length}
              </p>
              <p className="text-xs text-muted-foreground">Mood Types</p>
            </div>
          </div>

          {/* Energy Distribution */}
          {Object.keys(energyLevels).length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Energy Distribution
              </h4>
              <div className="space-y-2">
                {Object.entries(energyLevels).map(([level, count]) => (
                  <div key={level} className="flex items-center gap-3">
                    <span className="text-sm capitalize min-w-[60px]">
                      {level}:
                    </span>
                    <div className="flex-1">
                      <Progress
                        value={(count / dayActivities.length) * 100}
                        className="h-2"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Moods */}
          {topMoods.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Dominant Vibes
              </h4>
              <div className="flex flex-wrap gap-2">
                {topMoods.map(([mood, count]) => (
                  <Badge key={mood} variant="secondary" className="capitalize">
                    {mood} ({count})
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Schedule Health */}
          <div>
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Schedule Health
            </h4>
            <div className="space-y-2 text-sm">
              {totalDuration < 240 && (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <span>⚠️</span>
                  <span>Light schedule - consider adding more activities</span>
                </div>
              )}
              {totalDuration > 600 && (
                <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                  <span>⚠️</span>
                  <span>Packed schedule - make sure to include breaks</span>
                </div>
              )}
              {Object.keys(energyLevels).length === 1 && (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <span>💡</span>
                  <span>
                    Try mixing different energy levels for better balance
                  </span>
                </div>
              )}
              {Object.keys(moodCounts).length >= 4 && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <span>✨</span>
                  <span>Great mood variety - you'll have a dynamic day!</span>
                </div>
              )}
              {vibeScore >= 80 && (
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <span>🎉</span>
                  <span>This looks like an amazing {activeDay}!</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
