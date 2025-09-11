import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  Plus,
  Save,
  Share,
  Settings,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { ActivityBrowser } from "./activities/ActivityBrowser";
import { ScheduleGrid } from "./schedule/ScheduleGrid";
import { ThemeToggle } from "./theme-toggle";
import { WeatherWidget } from "./WeatherWidget";
import { useActivityStore } from "../stores/activityStore";
import { useScheduleStore } from "../stores/scheduleStore";
import { useUserStore } from "../stores/userStore";
import { useWeatherStore } from "../stores/weatherStore";
import type { Activity, TimeSlot } from "../types";

type ViewMode = "browse" | "schedule";

export const WeekendView: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>("browse");
  const [weekendTitle, setWeekendTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  // Activity store
  const {
    activities,
    categories,
    filters,
    searchTerm,
    selectedActivity,
    loading: activitiesLoading,
    error: activitiesError,
    loadActivities,
    loadCategories,
    setSearchTerm,
    setFilters,
    selectActivity,
  } = useActivityStore();

  // Schedule store
  const {
    currentWeekend,
    conflicts,
    loading: scheduleLoading,
    error: scheduleError,
    createNewWeekend,
    addActivity,
    removeActivity,
    updateWeekendTitle,
  } = useScheduleStore();

  // User store
  const { currentTheme } = useUserStore();

  // Initialize data on mount
  useEffect(() => {
    loadActivities();
    loadCategories();

    // Create a new weekend if none exists
    if (!currentWeekend) {
      createNewWeekend("My Weekend Plan");
    }
  }, [loadActivities, loadCategories, createNewWeekend, currentWeekend]);

  // Update local title when weekend changes
  useEffect(() => {
    if (currentWeekend && weekendTitle !== currentWeekend.title) {
      setWeekendTitle(currentWeekend.title);
    }
  }, [currentWeekend, weekendTitle]);

  const handleActivitySelect = (activity: Activity) => {
    selectActivity(activity);
    // Auto-switch to schedule view when an activity is selected
    setViewMode("schedule");
  };

  const handleActivityAdd = (activity: Activity, timeSlot: TimeSlot) => {
    addActivity(activity, timeSlot);
    selectActivity(null); // Clear selection after adding
  };

  const handleActivityRemove = (activityId: string) => {
    removeActivity(activityId);
  };

  const handleTitleSave = () => {
    if (weekendTitle.trim() && currentWeekend) {
      updateWeekendTitle(weekendTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleTitleSave();
    } else if (e.key === "Escape") {
      setWeekendTitle(currentWeekend?.title || "");
      setIsEditingTitle(false);
    }
  };

  const getTotalActivities = () => {
    if (!currentWeekend) return 0;
    return currentWeekend.saturday.length + currentWeekend.sunday.length;
  };

  const getTotalDuration = () => {
    if (!currentWeekend) return 0;
    const saturdayDuration = currentWeekend.saturday.reduce(
      (total, sa) => total + sa.activity.duration,
      0
    );
    const sundayDuration = currentWeekend.sunday.reduce(
      (total, sa) => total + sa.activity.duration,
      0
    );
    return saturdayDuration + sundayDuration;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  if (activitiesLoading || scheduleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">
            Loading your weekend planner...
          </p>
        </div>
      </div>
    );
  }

  if (activitiesError || scheduleError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              {activitiesError || scheduleError}
            </p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                <span className="text-xl font-bold">Weekendly</span>
              </div>

              {currentTheme && (
                <Badge
                  variant="secondary"
                  style={{
                    backgroundColor: `${currentTheme.color}20`,
                    color: currentTheme.color,
                  }}
                >
                  {currentTheme.name}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex bg-muted rounded-lg p-2 gap-x-2">
                <Button
                  variant={viewMode === "browse" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("browse")}
                  className="text-xs"
                >
                  Browse Activities
                </Button>
                <Button
                  variant={viewMode === "schedule" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("schedule")}
                  className="text-xs"
                >
                  My Schedule
                </Button>
              </div>

              {/* Action Buttons */}
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
              <Button variant="outline" size="sm">
                <Share className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              <ThemeToggle />
            </div>
          </div>

          {/* Weekend Title */}
          <div className="mt-4">
            {isEditingTitle ? (
              <div className="flex items-center gap-2 max-w-md">
                <Input
                  value={weekendTitle}
                  onChange={(e) => setWeekendTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyPress}
                  className="text-lg font-semibold"
                  autoFocus
                />
                <Button size="sm" onClick={handleTitleSave}>
                  Save
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <h1
                  className="text-2xl font-bold cursor-pointer hover:text-primary transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {currentWeekend?.title || "My Weekend Plan"}
                </h1>

                {currentWeekend && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{getTotalActivities()} activities</span>
                    <span>{formatDuration(getTotalDuration())} total</span>
                    {conflicts.length > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {conflicts.length} conflict
                        {conflicts.length > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {viewMode === "browse" ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Browse Activities</h2>
              <p className="text-muted-foreground">
                Drag activities to your schedule or click to select
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Weather Widget Sidebar */}
              <div className="lg:col-span-1">
                <WeatherWidget />
              </div>

              {/* Activity Browser Main Content */}
              <div className="lg:col-span-3">
                <ActivityBrowser
                  activities={activities}
                  categories={categories}
                  filters={filters}
                  searchTerm={searchTerm}
                  onFilterChange={setFilters}
                  onSearchChange={setSearchTerm}
                  onActivitySelect={handleActivitySelect}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Weekend Schedule</h2>
              <Button variant="outline" onClick={() => setViewMode("browse")}>
                <Plus className="w-4 h-4 mr-2" />
                Add Activities
              </Button>
            </div>

            {currentWeekend ? (
              <ScheduleGrid
                weekend={currentWeekend}
                onActivityAdd={handleActivityAdd}
                onActivityRemove={handleActivityRemove}
                readOnly={false}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    No Weekend Plan
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create a new weekend plan to get started
                  </p>
                  <Button onClick={() => createNewWeekend("My Weekend Plan")}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Weekend Plan
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
