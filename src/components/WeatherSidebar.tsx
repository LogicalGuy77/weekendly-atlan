import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/ui/sidebar";
import { WeatherWidget } from "./WeatherWidget";
import { GooglePlaces } from "./GooglePlaces";
import { X, Cloud, Navigation } from "lucide-react";

interface WeatherSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const WeatherSidebar: React.FC<WeatherSidebarProps> = ({
  isOpen,
  onToggle,
}) => {
  const [activeTab, setActiveTab] = useState<"weather" | "places">("weather");

  return (
    <Sidebar
      isOpen={isOpen}
      onToggle={onToggle}
      className="left-auto right-0 border-l border-r-0"
    >
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeTab === "weather" ? (
              <Cloud className="w-5 h-5 text-primary" />
            ) : (
              <Navigation className="w-5 h-5 text-primary" />
            )}
            <h3 className="text-lg font-semibold">
              {activeTab === "weather" ? "Weather Insights" : "Nearby Places"}
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="hover:!bg-red-500 hover:!text-white rounded-full p-2 h-8 w-8"
            title="Close Sidebar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-muted/50 rounded-lg p-1 mt-3">
          <Button
            size="sm"
            variant={activeTab === "weather" ? "default" : "ghost"}
            onClick={() => setActiveTab("weather")}
            className="flex-1 text-xs"
          >
            <Cloud className="w-3 h-3 mr-1" />
            Weather
          </Button>
          <Button
            size="sm"
            variant={activeTab === "places" ? "default" : "ghost"}
            onClick={() => setActiveTab("places")}
            className="flex-1 text-xs"
          >
            <Navigation className="w-3 h-3 mr-1" />
            Places
          </Button>
        </div>
      </div>

      <div className="flex-1 px-4 pb-8 min-h-0 overflow-y-auto">
        {activeTab === "weather" ? <WeatherWidget /> : <GooglePlaces />}
      </div>
    </Sidebar>
  );
};
