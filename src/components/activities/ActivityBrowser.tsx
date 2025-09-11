import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, X } from "lucide-react";
import { ActivityCard } from "./ActivityCard";
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
  const [showFilters, setShowFilters] = useState(false);

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
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
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

      {/* Filter Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Categories */}
            <div>
              <h4 className="font-medium mb-2">Categories</h4>
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
              <h4 className="font-medium mb-2">Moods</h4>
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
              <h4 className="font-medium mb-2">Energy Level</h4>
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

            {/* Weather Dependent */}
            <div>
              <h4 className="font-medium mb-2">Weather</h4>
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
      </div>

      {/* Activities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredActivities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onSelect={onActivitySelect}
            showDetails={true}
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
