import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  RefreshCw,
  AlertCircle,
  Star,
  Clock,
  ExternalLink,
  Navigation,
} from "lucide-react";
import { useWeatherStore } from "../stores/weatherStore";

interface Place {
  id: string;
  displayName: {
    text: string;
  };
  formattedAddress: string;
  rating?: number;
  userRatingCount?: number;
  currentOpeningHours?: {
    openNow: boolean;
  };
  types: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  priceLevel?: string;
  photos?: Array<{
    name: string;
  }>;
}

interface GooglePlacesResponse {
  places: Place[];
}

export const GooglePlaces: React.FC = () => {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<string>("tourist_attraction");

  const { userLocation, weatherData } = useWeatherStore();

  const categories = [
    { id: "tourist_attraction", label: "Attractions", icon: "🏛️" },
    { id: "restaurant", label: "Restaurants", icon: "🍽️" },
    { id: "park", label: "Parks", icon: "🌳" },
    { id: "museum", label: "Museums", icon: "🏛️" },
    { id: "shopping_mall", label: "Shopping", icon: "🛍️" },
    { id: "amusement_park", label: "Entertainment", icon: "🎢" },
  ];

  const getWeatherBasedCategories = () => {
    if (!weatherData) return categories;

    const temp = weatherData.current.temperature;
    const precipitation = weatherData.current.precipitation;
    const isRaining = precipitation > 0.5;
    const isCold = temp < 15;
    const isHot = temp > 30;

    if (isRaining) {
      return categories.filter((cat) =>
        ["museum", "shopping_mall", "restaurant"].includes(cat.id)
      );
    }

    if (isCold) {
      return categories.filter((cat) =>
        ["museum", "shopping_mall", "restaurant"].includes(cat.id)
      );
    }

    if (isHot) {
      return categories.filter((cat) =>
        ["museum", "shopping_mall", "park"].includes(cat.id)
      );
    }

    return categories;
  };

  const fetchNearbyPlaces = async (category: string) => {
    if (!userLocation) {
      setError("Location is required to find nearby places");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const apiKey =
        import.meta.env.VITE_GOOGLE_PLACES_API_KEY ||
        "AIzaSyBqptSrclxntLGuuIroUIVXA_Saf8057yo";
      if (!apiKey) {
        throw new Error("Google Places API key not found");
      }

      // Create search query based on category and location
      const categoryMap: Record<string, string> = {
        tourist_attraction: "tourist attractions",
        restaurant: "restaurants",
        park: "parks",
        museum: "museums",
        shopping_mall: "shopping malls",
        amusement_park: "entertainment venues",
      };

      const searchQuery = `${categoryMap[category] || category} near ${
        userLocation.latitude
      },${userLocation.longitude}`;

      // Use Google Places API (Web Service) - the correct endpoint for nearby search
      const radius = 5000; // 5km radius
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${userLocation.latitude},${userLocation.longitude}&radius=${radius}&type=${category}&key=${apiKey}`;

      // Try direct API call first, then fallback to CORS proxy if needed
      let response;
      try {
        response = await fetch(url);
      } catch (corsError) {
        // If CORS fails, try with a CORS proxy
        console.log("Direct API call failed, trying with CORS proxy...");
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
          url
        )}`;

        const proxyResponse = await fetch(proxyUrl);
        const proxyData = await proxyResponse.json();

        if (proxyData.status.http_code === 200) {
          const data = JSON.parse(proxyData.contents);
          console.log("API Response via proxy:", data);

          if (data.status === "OK") {
            // Convert old API format to new format
            const convertedPlaces: Place[] = data.results
              .slice(0, 10)
              .map((place: any) => ({
                id: place.place_id,
                displayName: { text: place.name },
                formattedAddress:
                  place.vicinity || place.formatted_address || "",
                rating: place.rating,
                userRatingCount: place.user_ratings_total,
                currentOpeningHours: place.opening_hours
                  ? { openNow: place.opening_hours.open_now }
                  : undefined,
                types: place.types || [],
                location: {
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                },
                priceLevel: place.price_level?.toString(),
              }));

            setPlaces(convertedPlaces);
            return;
          } else {
            throw new Error(`API returned status: ${data.status}`);
          }
        } else {
          throw new Error(
            `Proxy request failed: ${proxyData.status.http_code}`
          );
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);

        let errorMessage = `API request failed: ${response.status}`;
        if (response.status === 403) {
          errorMessage +=
            " - Check API key permissions, billing, and enabled APIs. Make sure Places API is enabled.";
        } else if (response.status === 400) {
          errorMessage += " - Invalid request format";
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("API Response:", data); // Debug log

      if (data.status === "OK") {
        // Convert old API format to new format
        const convertedPlaces: Place[] = data.results
          .slice(0, 10)
          .map((place: any) => ({
            id: place.place_id,
            displayName: { text: place.name },
            formattedAddress: place.vicinity || place.formatted_address || "",
            rating: place.rating,
            userRatingCount: place.user_ratings_total,
            currentOpeningHours: place.opening_hours
              ? { openNow: place.opening_hours.open_now }
              : undefined,
            types: place.types || [],
            location: {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            },
            priceLevel: place.price_level?.toString(),
          }));

        setPlaces(convertedPlaces);
      } else {
        throw new Error(`API returned status: ${data.status}`);
      }
    } catch (err) {
      console.error("Error fetching places:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch nearby places"
      );
      setPlaces([]); // Clear places on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLocation) {
      fetchNearbyPlaces(selectedCategory);
    }
  }, [userLocation, selectedCategory]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handleRefresh = () => {
    fetchNearbyPlaces(selectedCategory);
  };

  const getDirectionsUrl = (place: Place) => {
    return `https://www.google.com/maps/dir/?api=1&destination=${place.location.latitude},${place.location.longitude}&destination_place_id=${place.id}`;
  };

  const formatPlaceTypes = (types: string[]) => {
    return types
      .filter(
        (type) =>
          !type.includes("establishment") && !type.includes("point_of_interest")
      )
      .slice(0, 2)
      .map((type) => type.replace(/_/g, " "))
      .join(", ");
  };

  if (!userLocation) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Nearby Places
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enable location access to discover nearby places based on your
            location and weather.
          </p>
        </CardContent>
      </Card>
    );
  }

  const weatherBasedCategories = getWeatherBasedCategories();

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Nearby Places
            </CardTitle>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw
                className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Categories</p>
            <div className="flex flex-wrap gap-2">
              {weatherBasedCategories.map((category) => (
                <Button
                  key={category.id}
                  size="sm"
                  variant={
                    selectedCategory === category.id ? "default" : "outline"
                  }
                  onClick={() => handleCategoryChange(category.id)}
                  className="text-xs"
                >
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Weather-based suggestion */}
          {weatherData && (
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded">
              {weatherData.current.precipitation > 0.5
                ? "☔ Rainy weather - showing indoor activities"
                : weatherData.current.temperature < 15
                ? "🧥 Cool weather - showing indoor and sheltered places"
                : weatherData.current.temperature > 30
                ? "☀️ Hot weather - showing cool places and indoor activities"
                : "🌤️ Great weather for exploring!"}
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">
                Finding nearby places...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Places List */}
          {!loading && !error && places.length > 0 && (
            <div className="space-y-3">
              {places.map((place) => (
                <div
                  key={place.id}
                  className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">
                        {place.displayName.text}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {place.formattedAddress}
                      </p>

                      {place.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium">
                            {place.rating}
                          </span>
                          {place.userRatingCount && (
                            <span className="text-xs text-muted-foreground">
                              ({place.userRatingCount})
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        {place.currentOpeningHours?.openNow !== undefined && (
                          <Badge
                            variant={
                              place.currentOpeningHours.openNow
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            <Clock className="w-2 h-2 mr-1" />
                            {place.currentOpeningHours.openNow
                              ? "Open"
                              : "Closed"}
                          </Badge>
                        )}

                        {formatPlaceTypes(place.types) && (
                          <Badge variant="outline" className="text-xs">
                            {formatPlaceTypes(place.types)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-2 p-1 h-8 w-8"
                      onClick={() =>
                        window.open(getDirectionsUrl(place), "_blank")
                      }
                      title="Get directions"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!loading && !error && places.length === 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No places found in this category nearby.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
