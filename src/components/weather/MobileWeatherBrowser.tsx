import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
} from "lucide-react";
import { WeatherWidget } from "../WeatherWidget";

interface MobileWeatherBrowserProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileWeatherBrowser: React.FC<MobileWeatherBrowserProps> = ({
  isOpen,
  onClose,
}) => {
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
              <h2 className="text-lg font-semibold">Weather</h2>
              <p className="text-sm text-muted-foreground">
                Weekend weather forecast
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Current Weather */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-yellow-500" />
                Current Weather
              </CardTitle>
            </CardHeader>
            <CardContent>
              <WeatherWidget />
            </CardContent>
          </Card>

          {/* Weekend Forecast */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-500" />
                Weekend Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Saturday */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <Sun className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h4 className="font-medium">Saturday</h4>
                    <p className="text-sm text-muted-foreground">Sunny</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">24°C</p>
                  <p className="text-sm text-muted-foreground">18°C</p>
                </div>
              </div>

              {/* Sunday */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <CloudRain className="w-6 h-6 text-blue-500" />
                  <div>
                    <h4 className="font-medium">Sunday</h4>
                    <p className="text-sm text-muted-foreground">Light Rain</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">20°C</p>
                  <p className="text-sm text-muted-foreground">15°C</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weather Details */}
          <Card>
            <CardHeader>
              <CardTitle>Weather Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Wind className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Wind</p>
                    <p className="font-medium">12 km/h</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Humidity</p>
                    <p className="font-medium">65%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Thermometer className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Feels like</p>
                    <p className="font-medium">26°C</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <Sun className="w-5 h-5 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">UV Index</p>
                    <p className="font-medium">6 (High)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Weather-Based Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-1">
                    Perfect for Saturday
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Great weather for outdoor activities like hiking, picnics,
                    or sports
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                    Sunday Indoor Options
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Light rain expected - consider museums, cafes, or indoor
                    entertainment
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
