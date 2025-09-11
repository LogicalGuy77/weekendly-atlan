import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  RefreshCw,
  AlertCircle,
  Thermometer,
  Wind,
  Droplets,
  Eye,
} from "lucide-react";
import { useWeatherStore } from "../stores/weatherStore";

export const WeatherWidget: React.FC = () => {
  const {
    weatherData,
    userLocation,
    loading,
    error,
    locationPermissionStatus,
    weatherSummary,
    recommendedActivities,
    notRecommendedActivities,
    requestLocationPermission,
    refreshWeatherData,
    clearError,
  } = useWeatherStore();

  // Request location permission on component mount
  useEffect(() => {
    if (locationPermissionStatus === "unknown") {
      requestLocationPermission();
    }
  }, [locationPermissionStatus, requestLocationPermission]);

  const handleLocationRequest = () => {
    clearError();
    requestLocationPermission();
  };

  const handleRefresh = () => {
    clearError();
    refreshWeatherData();
  };

  // Loading state
  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Loading Weather...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Getting your location and weather data...
          </p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            Weather Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{error}</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleLocationRequest}>
              <MapPin className="w-3 h-3 mr-1" />
              Allow Location
            </Button>
            <Button size="sm" variant="outline" onClick={handleRefresh}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No weather data state
  if (!weatherData || !userLocation) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Weather Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enable location access to get weather-based activity
            recommendations.
          </p>
          <Button size="sm" onClick={handleLocationRequest}>
            <MapPin className="w-3 h-3 mr-1" />
            Enable Location
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Weather data available
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Current Weather
          </CardTitle>
          <Button size="sm" variant="ghost" onClick={handleRefresh}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Weather Summary */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{weatherSummary}</p>
            <p className="text-xs text-muted-foreground">
              {userLocation.latitude.toFixed(2)}°N,{" "}
              {userLocation.longitude.toFixed(2)}°E
            </p>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Thermometer className="w-3 h-3 text-orange-500" />
            <span>{Math.round(weatherData.current.temperature)}°C</span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-3 h-3 text-blue-500" />
            <span>{Math.round(weatherData.current.windSpeed)} km/h</span>
          </div>
          <div className="flex items-center gap-2">
            <Droplets className="w-3 h-3 text-blue-600" />
            <span>{weatherData.current.humidity}%</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-3 h-3 text-gray-500" />
            <span>{weatherData.current.precipitation}mm</span>
          </div>
        </div>

        {/* Activity Recommendations */}
        {(recommendedActivities.length > 0 ||
          notRecommendedActivities.length > 0) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Weather Recommendations</h4>

            {recommendedActivities.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Recommended for current weather:
                </p>
                <div className="flex flex-wrap gap-1">
                  {recommendedActivities.slice(0, 3).map((activityId) => (
                    <Badge
                      key={activityId}
                      variant="default"
                      className="text-xs"
                    >
                      {getActivityDisplayName(activityId)}
                    </Badge>
                  ))}
                  {recommendedActivities.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{recommendedActivities.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {notRecommendedActivities.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  Not recommended:
                </p>
                <div className="flex flex-wrap gap-1">
                  {notRecommendedActivities.slice(0, 3).map((activityId) => (
                    <Badge
                      key={activityId}
                      variant="outline"
                      className="text-xs opacity-60"
                    >
                      {getActivityDisplayName(activityId)}
                    </Badge>
                  ))}
                  {notRecommendedActivities.length > 3 && (
                    <Badge variant="outline" className="text-xs opacity-60">
                      +{notRecommendedActivities.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Location Info */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Elevation: {Math.round(weatherData.elevation)}m • Updated:{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to convert activity IDs to display names
function getActivityDisplayName(activityId: string): string {
  const displayNames: Record<string, string> = {
    "hiking-trail": "Hiking",
    "bike-ride": "Cycling",
    "picnic-park": "Picnic",
    "photography-walk": "Photography",
    "farmers-market": "Market Visit",
    "morning-run": "Running",
    "movie-theater": "Movies",
    "board-game-cafe": "Board Games",
    "cooking-class": "Cooking",
    "art-class": "Art Workshop",
    "museum-visit": "Museum",
    "spa-day": "Spa",
    "yoga-class": "Yoga",
    "home-cooking": "Home Cooking",
    "book-reading": "Reading",
  };

  return displayNames[activityId] || activityId.replace(/-/g, " ");
}
