import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown, Sliders } from "lucide-react";
import { DraggableActivity } from "../dnd/DraggableActivity";
import type { ActivityBrowserProps } from "../../types";

export const ActivityBrowser: React.FC<ActivityBrowserProps> = ({
  activities,
  categories,
  filters,
  searchTerm,
  onFilterChange,
  onSearchChange,
  onActivitySelect,
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

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 py-2 flex-shrink-0">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10"
          />
        </div>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 flex-shrink-0 py-3">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={
              filters.categories.includes(category.id) ? "default" : "outline"
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

      <div className="flex items-center justify-between flex-shrink-0 py-2">
        <h3 className="text-sm font-semibold text-muted-foreground">
          {filteredActivities.length} Activities Found
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="text-xs"
        >
          <Sliders className="w-3 h-3 mr-1" />
          Filters
          <ChevronDown
            className={`w-3 h-3 ml-1 transition-transform ${
              showAdvancedFilters ? "rotate-180" : ""
            }`}
          />
        </Button>
      </div>

      {showAdvancedFilters && (
        <div className="flex-shrink-0 space-y-3 p-3 bg-muted/30 rounded-lg mb-3">
          {/* Mood Filters */}
          <div>
            <h4 className="text-xs font-medium mb-2">Mood</h4>
            <div className="flex flex-wrap gap-1">
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
                    filters.moods.includes(mood as any) ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => handleMoodToggle(mood)}
                  className="text-xs h-7"
                >
                  {mood}
                </Button>
              ))}
            </div>
          </div>

          {/* Energy Level Filters */}
          <div>
            <h4 className="text-xs font-medium mb-2">Energy Level</h4>
            <div className="flex gap-1">
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
                  className="text-xs h-7 capitalize"
                >
                  {level}
                </Button>
              ))}
            </div>
          </div>

          {/* Weather Dependency */}
          <div>
            <h4 className="text-xs font-medium mb-2">Location</h4>
            <div className="flex gap-1">
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
                className="text-xs h-7"
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
                className="text-xs h-7"
              >
                Indoor
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto min-h-0 -mr-4 pr-4">
        <div className="space-y-3 pb-20">
          {filteredActivities.map((activity) => (
            <DraggableActivity
              key={activity.id}
              activity={activity}
              onSelect={onActivitySelect}
              onMobileAdd={onActivitySelect}
              showDetails={true}
              compact={false}
            />
          ))}
        </div>
      </div>

      {filteredActivities.length === 0 && (
        <div className="text-center py-12 flex flex-col items-center justify-center flex-1">
          <div className="text-muted-foreground mb-4">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-semibold">No activities found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
