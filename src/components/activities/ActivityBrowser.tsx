import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Filter,
  X,
  ChevronDown,
  Clock,
  DollarSign,
  Users,
  Zap,
  Cloud,
  Sun,
} from "lucide-react";
import { DraggableActivity } from "../dnd/DraggableActivity";
import type { ActivityBrowserProps, FilterState } from "../../types";

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
      // Search term filter
      if (
        searchTerm &&
        !activity.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !activity.description
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) &&
        !activity.tags.some((tag) =>
          tag.toLowerCase().includes(searchTerm.toLowerCase())
        )
      ) {
        return false;
      }

      // Category filter
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(activity.category.id)
      ) {
        return false;
      }

      // Mood filter
      if (
        filters.moods.length > 0 &&
        !filters.moods.some((mood) => activity.mood.includes(mood))
      ) {
        return false;
      }

      // Energy level filter
      if (
        filters.energyLevels.length > 0 &&
        !filters.energyLevels.includes(activity.energyLevel)
      ) {
        return false;
      }

      // Duration filter
      if (
        activity.duration < filters.duration.min ||
        activity.duration > filters.duration.max
      ) {
        return false;
      }

      // Weather dependent filter
      if (
        filters.weatherDependent !== undefined &&
        activity.weatherDependent !== filters.weatherDependent
      ) {
        return false;
      }

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

  const handleDurationChange = (type: "min" | "max", value: number) => {
    onFilterChange?.({
      ...filters,
      duration: {
        ...filters.duration,
        [type]: value,
      },
    });
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

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Header */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          <ChevronDown
            className={`w-3 h-3 ml-1 transition-transform ${
              showAdvancedFilters ? "rotate-180" : ""
            }`}
          />
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Quick Category Filters */}
      <div className="flex flex-wrap gap-2">
        {categories.slice(0, 4).map((category) => (
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
                  }
                : {}
            }
          >
            {category.name}
          </Button>
        ))}
        {categories.length > 4 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAdvancedFilters(true)}
            className="text-xs"
          >
            +{categories.length - 4} more
          </Button>
        )}
      </div>

      {/* Advanced Filter Panel */}
      {showAdvancedFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              Advanced Filters
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* All Categories */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Categories
              </h4>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category.id}
                    variant={
                      filters.categories.includes(category.id)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer"
                    onClick={() => handleCategoryToggle(category.id)}
                    style={
                      filters.categories.includes(category.id)
                        ? {
                            backgroundColor: category.color,
                            borderColor: category.color,
                          }
                        : {}
                    }
                  >
                    {category.name}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Moods */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Moods
              </h4>
              <div className="flex flex-wrap gap-2">
                {[
                  "happy",
                  "relaxed",
                  "energetic",
                  "social",
                  "contemplative",
                  "adventurous",
                  "creative",
                  "romantic",
                ].map((mood) => (
                  <Badge
                    key={mood}
                    variant={
                      filters.moods.includes(mood as any)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer capitalize"
                    onClick={() => handleMoodToggle(mood)}
                  >
                    {mood}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Energy Levels */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                Energy Level
              </h4>
              <div className="flex gap-2">
                {["low", "medium", "high"].map((level) => (
                  <Badge
                    key={level}
                    variant={
                      filters.energyLevels.includes(level as any)
                        ? "default"
                        : "outline"
                    }
                    className="cursor-pointer capitalize"
                    onClick={() => handleEnergyLevelToggle(level)}
                  >
                    {level}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-500" />
                Duration
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">
                      Min:
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="480"
                      step="15"
                      value={filters.duration.min}
                      onChange={(e) =>
                        handleDurationChange(
                          "min",
                          parseInt(e.target.value) || 0
                        )
                      }
                      className="w-20 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-muted-foreground">
                      Max:
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="480"
                      step="15"
                      value={filters.duration.max}
                      onChange={(e) =>
                        handleDurationChange(
                          "max",
                          parseInt(e.target.value) || 480
                        )
                      }
                      className="w-20 text-sm"
                    />
                    <span className="text-xs text-muted-foreground">min</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Current range: {formatDuration(filters.duration.min)} -{" "}
                  {formatDuration(filters.duration.max)}
                </div>
              </div>
            </div>

            {/* Weather Dependent */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Sun className="w-4 h-4 text-orange-500" />
                Weather
              </h4>
              <div className="flex gap-2">
                <Badge
                  variant={
                    filters.weatherDependent === false ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() =>
                    onFilterChange?.({
                      ...filters,
                      weatherDependent:
                        filters.weatherDependent === false ? undefined : false,
                    })
                  }
                >
                  <Cloud className="w-3 h-3 mr-1" />
                  Indoor
                </Badge>
                <Badge
                  variant={
                    filters.weatherDependent === true ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() =>
                    onFilterChange?.({
                      ...filters,
                      weatherDependent:
                        filters.weatherDependent === true ? undefined : true,
                    })
                  }
                >
                  <Sun className="w-3 h-3 mr-1" />
                  Outdoor
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {filteredActivities.length} Activities
          {searchTerm && ` for "${searchTerm}"`}
        </h3>
        {filteredActivities.length > 0 && (
          <div className="text-sm text-muted-foreground">
            Drag activities to schedule them
          </div>
        )}
      </div>

      {/* Activities Grid */}
      <div className="space-y-4">
        {filteredActivities.map((activity) => (
          <DraggableActivity
            key={activity.id}
            activity={activity}
            onSelect={onActivitySelect}
            showDetails={true}
            compact={false}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">No activities found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
          {activeFilterCount > 0 && (
            <Button variant="outline" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
