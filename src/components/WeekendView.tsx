import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sidebar } from "@/components/ui/sidebar";
import {
  Calendar,
  Plus,
  Share,
  Settings,
  X,
  ChevronLeft,
  ChevronRight,
  Cloud,
} from "lucide-react";
import { ScheduleGrid } from "@/components/schedule/ScheduleGrid";
import { ScheduleSummary } from "@/components/schedule/ScheduleSummary";
import { ThemeToggle } from "@/components/theme-toggle";
import { DragOverlay as CustomDragOverlay } from "@/components/dnd/DragOverlay";
import { ActivityBrowser } from "@/components/activities/ActivityBrowser";
import { MobileActivityBrowser } from "@/components/activities/MobileActivityBrowser";
import { MobileWeatherBrowser } from "@/components/weather/MobileWeatherBrowser";
import { TimeSlotSelector } from "@/components/ui/TimeSlotSelector";
import { TimePeriodEditor } from "@/components/ui/TimePeriodEditor";
import { WeatherSidebar } from "@/components/WeatherSidebar";
import { useActivityStore } from "@/stores/activityStore";
import { useScheduleStore } from "@/stores/scheduleStore";
import { useUserStore } from "@/stores/userStore";
import type {
  Activity,
  TimeSlot,
  FilterState,
  WeekendDay,
  TimePeriod,
} from "@/types";

export const WeekendView: React.FC = () => {
  const [weekendTitle, setWeekendTitle] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [activeActivity, setActiveActivity] = useState<Activity | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isWeatherSidebarOpen, setIsWeatherSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
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
  const [selectedActivityForMobile, setSelectedActivityForMobile] =
    useState<Activity | null>(null);
  const [showTimeSlotSelector, setShowTimeSlotSelector] = useState(false);
  const [showMobileActivityBrowser, setShowMobileActivityBrowser] =
    useState(false);
  const [showMobileWeatherBrowser, setShowMobileWeatherBrowser] =
    useState(false);
  const [timePeriodEditor, setTimePeriodEditor] = useState<{
    isOpen: boolean;
    period: TimePeriod | null;
    label: string;
    currentStartTime: string;
    currentEndTime: string;
  }>({
    isOpen: false,
    period: null,
    label: "",
    currentStartTime: "",
    currentEndTime: "",
  });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
      setIsWeatherSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const {
    activities,
    categories,
    loading: activitiesLoading,
    error: activitiesError,
    loadActivities,
    loadCategories,
  } = useActivityStore();

  const {
    currentWeekend,
    conflicts,
    loading: scheduleLoading,
    error: scheduleError,
    createNewWeekend,
    addActivity,
    removeActivity,
    updateWeekendTitle,
    reorderActivities,
  } = useScheduleStore();

  const { preferences, updateTimePeriod } = useUserStore();

  useEffect(() => {
    loadActivities();
    loadCategories();
    if (!currentWeekend) {
      createNewWeekend("My Epic Weekend");
    }
  }, [loadActivities, loadCategories, createNewWeekend, currentWeekend]);

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

  const handleMobileActivitySelect = (activity: Activity) => {
    setSelectedActivityForMobile(activity);
    setShowTimeSlotSelector(true);
  };

  const handleTimeSlotSelect = (day: WeekendDay, period: TimePeriod) => {
    if (selectedActivityForMobile) {
      const { preferences } = useUserStore.getState();
      const timePeriodSettings = preferences.timePeriods[period];
      const timeSlot: TimeSlot = {
        id: `${day}-${period}`,
        day,
        startTime: timePeriodSettings.start,
        endTime: timePeriodSettings.end,
        period,
      };
      handleActivityAdd(selectedActivityForMobile, timeSlot);
      setSelectedActivityForMobile(null);
      setShowTimeSlotSelector(false);
    }
  };

  const handleCloseTimeSlotSelector = () => {
    setSelectedActivityForMobile(null);
    setShowTimeSlotSelector(false);
  };

  const handleTitleSave = () => {
    if (weekendTitle.trim() && currentWeekend) {
      updateWeekendTitle(weekendTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleTitleSave();
    else if (e.key === "Escape") {
      setWeekendTitle(currentWeekend?.title || "");
      setIsEditingTitle(false);
    }
  };

  const handleTimeEdit = (period: TimePeriod, label: string) => {
    const currentTimePeriod =
      preferences.timePeriods[period as keyof typeof preferences.timePeriods];
    setTimePeriodEditor({
      isOpen: true,
      period,
      label,
      currentStartTime: currentTimePeriod.start,
      currentEndTime: currentTimePeriod.end,
    });
  };

  const handleTimePeriodSave = (
    period: TimePeriod,
    startTime: string,
    endTime: string
  ) => {
    updateTimePeriod(period, startTime, endTime);
    setTimePeriodEditor({
      isOpen: false,
      period: null,
      label: "",
      currentStartTime: "",
      currentEndTime: "",
    });
  };

  const handleTimePeriodClose = () => {
    setTimePeriodEditor({
      isOpen: false,
      period: null,
      label: "",
      currentStartTime: "",
      currentEndTime: "",
    });
  };

  const getTotalActivities = () =>
    currentWeekend
      ? currentWeekend.saturday.length + currentWeekend.sunday.length
      : 0;

  const getTotalDuration = () => {
    if (!currentWeekend) return 0;
    const totalMinutes = [
      ...currentWeekend.saturday,
      ...currentWeekend.sunday,
    ].reduce((total, sa) => total + sa.activity.duration, 0);
    return totalMinutes;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    return `${mins}m`;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (
      active.data.current?.type === "activity" ||
      active.data.current?.type === "scheduledActivity"
    ) {
      setActiveActivity(active.data.current.activity);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveActivity(null);
    if (!over || !currentWeekend) return;
    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type === "scheduledActivity" && over.id !== active.id) {
      const { scheduledActivity: activeScheduledActivity } = activeData;
      const { scheduledActivity: overScheduledActivity } = overData || {};
      if (
        overScheduledActivity &&
        activeScheduledActivity.timeSlot.id ===
          overScheduledActivity.timeSlot.id
      ) {
        const { day, period } = activeScheduledActivity.timeSlot;
        const dayActivities =
          day === "saturday" ? currentWeekend.saturday : currentWeekend.sunday;
        const periodActivities = dayActivities.filter(
          (sa: any) => sa.timeSlot.period === period
        );
        const activeIndex = periodActivities.findIndex(
          (sa: any) => sa.id === activeScheduledActivity.id
        );
        const overIndex = periodActivities.findIndex(
          (sa: any) => sa.id === overScheduledActivity.id
        );
        if (
          activeIndex !== -1 &&
          overIndex !== -1 &&
          activeIndex !== overIndex
        ) {
          const reorderedActivityIds = arrayMove(
            periodActivities,
            activeIndex,
            overIndex
          ).map((sa: any) => sa.id);
          reorderActivities(day, period, reorderedActivityIds);
        }
        return;
      }
    }

    if (!activeData?.activity) return;
    const activity = activeData.activity as Activity;
    if (overData?.type === "timeSlot") {
      const { day, period } = overData;
      const { preferences } = useUserStore.getState();
      const timePeriodSettings =
        preferences.timePeriods[period as keyof typeof preferences.timePeriods];
      const timeSlot: TimeSlot = {
        id: `${day}-${period}`,
        day,
        startTime: timePeriodSettings.start,
        endTime: timePeriodSettings.end,
        period,
      };
      if (activeData.type === "scheduledActivity") {
        handleActivityRemove(activeData.scheduledActivity.id);
      }
      handleActivityAdd(activity, timeSlot);
    }
  };

  // Loading and Error States
  if (activitiesLoading || scheduleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-blue-950 dark:via-slate-900 dark:to-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Crafting your weekend...</p>
        </div>
      </div>
    );
  }

  if (activitiesError || scheduleError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md bg-card border-destructive">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-semibold text-destructive mb-2">
              Oops! Something went wrong.
            </h3>
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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-blue-950 dark:via-slate-900 dark:to-black">
        <header className="border-b bg-background/80 dark:bg-background/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-primary to-orange-500 rounded-lg">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-lg font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent dark:from-orange-400 dark:to-amber-300">
                    Weekendly
                  </h1>
                  <p className="text-xs text-muted-foreground hidden md:block">
                    Plan your perfect weekend
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isMobile && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMobileActivityBrowser(true)}
                      className="p-2"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMobileWeatherBrowser(true)}
                      className="p-2"
                    >
                      <Cloud className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button variant="outline" size="sm" className="hidden md:flex">
                  <Share className="w-4 h-4 mr-1" />
                  Share
                </Button>
                {!isMobile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setIsWeatherSidebarOpen(!isWeatherSidebarOpen)
                    }
                    className={`p-2 ${
                      isWeatherSidebarOpen
                        ? "bg-accent text-accent-foreground"
                        : ""
                    }`}
                  >
                    <Cloud className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="outline" size="sm" className="p-2">
                  <Settings className="w-4 h-4" />
                </Button>
                <ThemeToggle />
              </div>
            </div>
            <div className="mt-4">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 max-w-md">
                  <Input
                    value={weekendTitle}
                    onChange={(e) => setWeekendTitle(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyPress}
                    className="text-2xl font-bold border-2 focus:border-primary"
                    autoFocus
                  />
                  <Button size="sm" onClick={handleTitleSave}>
                    Save
                  </Button>
                </div>
              ) : (
                <div className="flex items-baseline gap-4">
                  <h2
                    className="text-2xl lg:text-3xl font-bold cursor-pointer hover:text-primary transition-colors"
                    onClick={() => setIsEditingTitle(true)}
                  >
                    {currentWeekend?.title || "My Weekend Plan"}
                  </h2>
                  {currentWeekend && (
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{getTotalActivities()} activities</span>
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                      <span>{formatDuration(getTotalDuration())}</span>
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

        {!isSidebarOpen && !isMobile && (
          <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40">
            <Button
              onClick={() => setIsSidebarOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-full p-2"
              size="sm"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}

        {!isWeatherSidebarOpen && !isMobile && (
          <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40">
            <Button
              onClick={() => setIsWeatherSidebarOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-full p-2"
              size="sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>
        )}

        <div className="flex">
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Activity Palette</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsSidebarOpen(false)}
                  className="hover:!bg-red-500 hover:!text-white rounded-full p-2 h-8 w-8"
                  title="Close Activity Palette"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="flex-1 px-4 pb-8 min-h-0 overflow-hidden">
              <ActivityBrowser
                activities={activities}
                categories={categories}
                filters={filters}
                searchTerm={searchTerm}
                onFilterChange={setFilters}
                onSearchChange={setSearchTerm}
                onActivitySelect={handleMobileActivitySelect}
              />
            </div>
          </Sidebar>

          <main
            className={`flex-1 transition-all duration-300 ${
              isSidebarOpen && !isMobile ? "ml-[420px]" : ""
            } ${isWeatherSidebarOpen && !isMobile ? "mr-[420px]" : ""}`}
          >
            <div
              className={`p-4 md:p-6 ${
                isSidebarOpen && isWeatherSidebarOpen && !isMobile
                  ? "lg:p-4 xl:p-6"
                  : "lg:p-8"
              }`}
            >
              {currentWeekend ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-center">
                    <div className="flex bg-card/80 dark:bg-card/80 backdrop-blur-sm rounded-xl p-1 shadow-lg w-full max-w-sm">
                      <Button
                        onClick={() => setActiveDay("saturday")}
                        className={`flex-1 transition-all text-base ${
                          activeDay === "saturday"
                            ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                            : "bg-transparent hover:bg-accent text-foreground"
                        }`}
                      >
                        Saturday
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-background/50 text-current text-xs"
                        >
                          {currentWeekend.saturday.length}
                        </Badge>
                      </Button>
                      <Button
                        onClick={() => setActiveDay("sunday")}
                        className={`flex-1 transition-all text-base ${
                          activeDay === "sunday"
                            ? "bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
                            : "bg-transparent hover:bg-accent text-foreground"
                        }`}
                      >
                        Sunday
                        <Badge
                          variant="secondary"
                          className="ml-2 bg-background/50 text-current text-xs"
                        >
                          {currentWeekend.sunday.length}
                        </Badge>
                      </Button>
                    </div>
                  </div>
                  <ScheduleGrid
                    weekend={currentWeekend}
                    onActivityRemove={handleActivityRemove}
                    onTimeEdit={handleTimeEdit}
                    readOnly={false}
                    activeDay={activeDay}
                  />
                  <ScheduleSummary
                    weekend={currentWeekend}
                    activeDay={activeDay}
                  />
                </div>
              ) : (
                <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="text-center py-16">
                    <div className="p-4 bg-gradient-to-br from-primary to-orange-500 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-primary-foreground" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      Ready to Plan Your Weekend?
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                      Create your perfect weekend schedule with activities you
                      love.
                    </p>
                    <Button
                      onClick={() => createNewWeekend("My Weekend Plan")}
                      size="lg"
                    >
                      <Plus className="w-5 h-5 mr-2" />
                      Create Weekend Plan
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </main>

          {!isMobile && (
            <WeatherSidebar
              isOpen={isWeatherSidebarOpen}
              onToggle={() => setIsWeatherSidebarOpen(!isWeatherSidebarOpen)}
            />
          )}
        </div>

        <CustomDragOverlay activeActivity={activeActivity} />

        {selectedActivityForMobile && (
          <TimeSlotSelector
            activity={selectedActivityForMobile}
            isOpen={showTimeSlotSelector}
            onClose={handleCloseTimeSlotSelector}
            onSelectTimeSlot={handleTimeSlotSelect}
          />
        )}

        {/* Mobile Browsers */}
        <MobileActivityBrowser
          activities={activities}
          categories={categories}
          filters={filters}
          searchTerm={searchTerm}
          onFilterChange={setFilters}
          onSearchChange={setSearchTerm}
          onActivitySelect={(activity) => {
            setShowMobileActivityBrowser(false);
            handleMobileActivitySelect(activity);
          }}
          onClose={() => setShowMobileActivityBrowser(false)}
          isOpen={showMobileActivityBrowser}
        />

        <MobileWeatherBrowser
          isOpen={showMobileWeatherBrowser}
          onClose={() => setShowMobileWeatherBrowser(false)}
        />

        {/* TimePeriodEditor - Rendered at top level for proper z-index */}
        {timePeriodEditor.period && (
          <TimePeriodEditor
            isOpen={timePeriodEditor.isOpen}
            onClose={handleTimePeriodClose}
            period={timePeriodEditor.period}
            label={timePeriodEditor.label}
            currentStartTime={timePeriodEditor.currentStartTime}
            currentEndTime={timePeriodEditor.currentEndTime}
            onSave={handleTimePeriodSave}
          />
        )}
      </div>
    </DndContext>
  );
};
