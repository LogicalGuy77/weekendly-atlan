import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronDown, Sliders, X, Plus, ArrowLeft } from "lucide-react";
import { ActivityCard } from "./ActivityCard";
import type { Activity, ActivityCategory, FilterState } from "../../types";

interface MobileActivityBrowserProps {
  activities: Activity[];
  categories: ActivityCategory[];
  filters: FilterState;
  searchTerm: string;
  onFilterChange?: (filters: FilterState) => void;
  onSearchChange?: (term: string) => void;
  onActivitySelect?: (activity: Activity) => void;
  onClose: () => void;
  isOpen: boolean;
}

export const MobileActivityBrowser: React.FC<MobileActivityBrowserProps> = ({
  activities,
  categories,
  filters,
  searchTerm,
  onFilterChange,
  onSearchChange,
  onActivitySelect,
  onClose,
  isOpen,
}) => {
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (
        searchTerm &&
        !activity.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !activity.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) &&
        !activity.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
        return false;

      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(activity.category.id)
      )
        return false;
      if (
        filters.moods.length > 0 &&
        !filters.moods.some((mood) => activity.mood.includes(mood))
      )
        return false;
      if (
        filters.energyLevels.length > 0 &&
        !filters.energyLevels.includes(activity.energyLevel)
      )
        return false;
      if (
        activity.duration < filters.duration.min ||
        activity.duration > filters.duration.max
      )
        return false;
      if (
        filters.weatherDependent !== undefined &&
        activity.weatherDependent !== filters.weatherDependent
      )
        return false;

      return true;
    });
  }, [activities, searchTerm, filters]);

  const handleCategoryToggle = (categoryId: string) => {
    const newCategories = filters.categories.includes(categoryId)
      ? filters.categories.filter((id) => id !== categoryId)
      : [...filters.categories, categoryId];
    onFilterChange?.({ ...filters, categories: newCategories });
  };

  const handleMoodToggle = (mood: string) => {
    const newMoods = filters.moods.includes(mood as any)
      ? filters.moods.filter((m) => m !== mood)
      : [...filters.moods, mood as any];
    onFilterChange?.({ ...filters, moods: newMoods });
  };

  const handleEnergyLevelToggle = (level: string) => {
    const newLevels = filters.energyLevels.includes(level as any)
      ? filters.energyLevels.filter((l) => l !== level)
      : [...filters.energyLevels, level as any];
    onFilterChange?.({ ...filters, energyLevels: newLevels });
  };

  const handleWeatherToggle = (weatherDependent: boolean | undefined) => {
    onFilterChange?.({ ...filters, weatherDependent });
  };

  const clearAllFilters = () => {
    onFilterChange?.({
      categories: [],
      moods: [],
      energyLevels: [],
      duration: { min: 0, max: 480 },
      weatherDependent: undefined,
      tags: [],
    });
    onSearchChange?.("");
  };

  const activeFilterCount =
    filters.categories.length +
    filters.moods.length +
    filters.energyLevels.length +
    (filters.weatherDependent !== undefined ? 1 : 0) +
    (searchTerm ? 1 : 0);

  const handleActivityAdd = (activity: Activity) => {
    onActivitySelect?.(activity);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background z-[9999] flex flex-col">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-lg border-b sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-lg font-semibold">Activities</h2>
              <p className="text-sm text-muted-foreground">
                {filteredActivities.length} activities available
              </p>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          )}
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Category Filters */}
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={
                  filters.categories.includes(category.id)
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => handleCategoryToggle(category.id)}
                className="text-xs"
                style={
                  filters.categories.includes(category.id)
                    ? {
                        backgroundColor: category.color,
                        borderColor: category.color,
                        color: "white",
                      }
                    : {}
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="px-4 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              Advanced Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                showAdvancedFilters ? "rotate-180" : ""
              }`}
            />
          </Button>
        </div>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <div className="px-4 pb-4 space-y-4 bg-muted/30 mx-4 rounded-lg p-4">
            {/* Mood Filters */}
            <div>
              <h4 className="text-sm font-medium mb-2">Mood</h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "happy",
                  "relaxed",
                  "energetic",
                  "social",
                  "contemplative",
                  "adventurous",
                  "creative",
                ].map((mood) => (
                  <Button
                    key={mood}
                    variant={
                      filters.moods.includes(mood as any)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleMoodToggle(mood)}
                    className="text-xs capitalize"
                  >
                    {mood}
                  </Button>
                ))}
              </div>
            </div>

            {/* Energy Level Filters */}
            <div>
              <h4 className="text-sm font-medium mb-2">Energy Level</h4>
              <div className="flex gap-2">
                {["low", "medium", "high"].map((level) => (
                  <Button
                    key={level}
                    variant={
                      filters.energyLevels.includes(level as any)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleEnergyLevelToggle(level)}
                    className="text-xs capitalize flex-1"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Weather Dependency */}
            <div>
              <h4 className="text-sm font-medium mb-2">Location</h4>
              <div className="flex gap-2">
                <Button
                  variant={
                    filters.weatherDependent === true ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    handleWeatherToggle(
                      filters.weatherDependent === true ? undefined : true
                    )
                  }
                  className="text-xs flex-1"
                >
                  Outdoor
                </Button>
                <Button
                  variant={
                    filters.weatherDependent === false ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() =>
                    handleWeatherToggle(
                      filters.weatherDependent === false ? undefined : false
                    )
                  }
                  className="text-xs flex-1"
                >
                  Indoor
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Activities List */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-3 pb-20">
          {filteredActivities.map((activity) => (
            <Card key={activity.id} className="relative group">
              <CardContent className="p-4">
                <ActivityCard
                  activity={activity}
                  showDetails={true}
                  compact={false}
                />
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleActivityAdd(activity)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add to Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredActivities.length === 0 && (
          <div className="text-center py-12 px-4">
            <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold mb-2">No activities found</h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search or filters to find more activities.
            </p>
            {activeFilterCount > 0 && (
              <Button variant="outline" onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
