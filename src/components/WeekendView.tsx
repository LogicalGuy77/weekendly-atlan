import React, { useState, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ResizableSidebar } from "@/components/ui/resizable-sidebar";
import {
  Calendar,
  Plus,
  Save,
  Share,
  Settings,
  X,
  Search,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { ScheduleGrid } from "./schedule/ScheduleGrid";
import { ThemeToggle } from "./theme-toggle";
import { WeatherWidget } from "./WeatherWidget";
import { DragOverlay as CustomDragOverlay } from "./dnd/DragOverlay";
import { ActivityBrowser } from "./activities/ActivityBrowser";
import { useActivityStore } from "../stores/activityStore";
import { useScheduleStore } from "../stores/scheduleStore";
import { useUserStore } from "../stores/userStore";
import type {
  Activity,
  TimeSlot,
  ActivityCategory,
  FilterState,
} from "../types";

export const WeekendView: React.FC = () => {
  const [weekendTitle, setWeekendTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Open by default
  const [sidebarWidth, setSidebarWidth] = useState(320); // Track sidebar width
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    moods: [],
    energyLevels: [],
    duration: { min: 0, max: 480 },
    weatherDependent: undefined,
    tags: [],
  });
  const [activeDay, setActiveDay] = useState<"saturday" | "sunday">("saturday");

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Activity store
  const {
    activities,
    categories,
    loading: activitiesLoading,
    error: activitiesError,
    loadActivities,
    loadCategories,
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

  const handleActivityAdd = (activity: Activity, timeSlot: TimeSlot) => {
    addActivity(activity, timeSlot);
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

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.type === "activity") {
      setActiveActivity(active.data.current.activity);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveActivity(null);

    if (!over || !active.data.current?.activity) return;

    const activity = active.data.current.activity as Activity;
    const overData = over.data.current;

    if (overData?.type === "timeSlot") {
      const { day, period } = overData;

      // Create a time slot for this drop
      const timeSlot: TimeSlot = {
        id: `${day}-${period}`,
        day,
        startTime:
          period === "morning"
            ? "08:00"
            : period === "afternoon"
            ? "12:00"
            : period === "evening"
            ? "17:00"
            : "22:00",
        endTime:
          period === "morning"
            ? "12:00"
            : period === "afternoon"
            ? "17:00"
            : period === "evening"
            ? "22:00"
            : "24:00",
        period,
      };

      handleActivityAdd(activity, timeSlot);
    }
  };

  // Quick add activity function
  const handleQuickAdd = (activity: Activity, day: "saturday" | "sunday") => {
    // Find the first available time slot for the day
    const dayActivities = currentWeekend?.[day] || [];
    const periods = ["morning", "afternoon", "evening", "night"] as const;

    for (const period of periods) {
      const hasActivity = dayActivities.some(
        (sa) => sa.timeSlot.period === period
      );
      if (!hasActivity) {
        const timeSlot: TimeSlot = {
          id: `${day}-${period}`,
          day,
          startTime:
            period === "morning"
              ? "08:00"
              : period === "afternoon"
              ? "12:00"
              : period === "evening"
              ? "17:00"
              : "22:00",
          endTime:
            period === "morning"
              ? "12:00"
              : period === "afternoon"
              ? "17:00"
              : period === "evening"
              ? "22:00"
              : "24:00",
          period,
        };
        handleActivityAdd(activity, timeSlot);
        return;
      }
    }
  };

  if (activitiesLoading || scheduleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        {/* Modern Header */}
        <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Weekendly
                    </span>
                    <p className="text-xs text-muted-foreground">
                      Plan your perfect weekend
                    </p>
                  </div>
                </div>

                {currentTheme && (
                  <Badge
                    variant="secondary"
                    className="hidden sm:flex"
                    style={{
                      backgroundColor: `${currentTheme.color}20`,
                      color: currentTheme.color,
                    }}
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {currentTheme.name}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Action Buttons */}
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button variant="outline" size="sm" className="hidden md:flex">
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
                    className="text-lg font-semibold border-2 focus:border-blue-500"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleTitleSave}>
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <h1
                    className="text-2xl sm:text-3xl font-bold cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {currentWeekend?.title || "My Weekend Plan"}
                  </h1>

                  {currentWeekend && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>{getTotalActivities()} activities</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>{formatDuration(getTotalDuration())} total</span>
                      </div>
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

        {/* Sidebar Toggle Arrow - Right Side */}
        {!isSidebarOpen && (
          <div className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40">
            <Button
              onClick={() => setIsSidebarOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg rounded-full p-2"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Main Content with Sidebar Layout */}
        <div className="flex">
          {/* Activity Sidebar */}
          <ResizableSidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            onWidthChange={setSidebarWidth}
            defaultWidth={420}
            minWidth={320}
            maxWidth={700}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Activities</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="px-4 pb-4 h-full overflow-y-auto">
              <ActivityBrowser
                activities={activities}
                categories={categories}
                filters={filters}
                searchTerm={searchTerm}
                onFilterChange={setFilters}
                onSearchChange={setSearchTerm}
                onActivitySelect={(activity) =>
                  console.log("Selected:", activity)
                }
              />
            </div>
          </ResizableSidebar>

          {/* Main Content */}
          <main
            className="flex-1 container mx-auto px-4 py-6 transition-all duration-300"
            style={{
              marginLeft: isSidebarOpen ? `${sidebarWidth}px` : "0px",
            }}
          >
            {currentWeekend ? (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {currentWeekend.saturday.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Saturday
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {currentWeekend.sunday.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Sunday
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatDuration(getTotalDuration())}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Total Time
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {conflicts.length}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Conflicts
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Day Tabs */}
                <div className="flex items-center justify-center">
                  <div className="flex bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-xl p-1 shadow-lg">
                    <Button
                      variant={activeDay === "saturday" ? "default" : "ghost"}
                      onClick={() => setActiveDay("saturday")}
                      className={`px-6 py-2 rounded-lg transition-all ${
                        activeDay === "saturday"
                          ? "bg-blue-500 text-white shadow-md"
                          : "hover:bg-white/50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      Saturday
                      <Badge
                        variant="secondary"
                        className="ml-2 bg-white/20 text-current"
                      >
                        {currentWeekend.saturday.length}
                      </Badge>
                    </Button>
                    <Button
                      variant={activeDay === "sunday" ? "default" : "ghost"}
                      onClick={() => setActiveDay("sunday")}
                      className={`px-6 py-2 rounded-lg transition-all ${
                        activeDay === "sunday"
                          ? "bg-purple-500 text-white shadow-md"
                          : "hover:bg-white/50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      Sunday
                      <Badge
                        variant="secondary"
                        className="ml-2 bg-white/20 text-current"
                      >
                        {currentWeekend.sunday.length}
                      </Badge>
                    </Button>
                  </div>
                </div>

                {/* Single Day Schedule */}
                <ScheduleGrid
                  weekend={currentWeekend}
                  onActivityAdd={handleActivityAdd}
                  onActivityRemove={handleActivityRemove}
                  readOnly={false}
                  activeDay={activeDay}
                />
              </div>
            ) : (
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-0 shadow-xl">
                <CardContent className="text-center py-16">
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <Calendar className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    Ready to Plan Your Weekend?
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Create your perfect weekend schedule with activities you
                    love
                  </p>
                  <Button
                    onClick={() => createNewWeekend("My Weekend Plan")}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Create Weekend Plan
                  </Button>
                </CardContent>
              </Card>
            )}
          </main>
        </div>

        {/* Drag Overlay */}
        <CustomDragOverlay activeActivity={activeActivity} />
      </div>
    </DndContext>
  );
};
