import React from "react";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/ui/sidebar";
import { WeatherWidget } from "./WeatherWidget";
import { X, Cloud } from "lucide-react";

interface WeatherSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export const WeatherSidebar: React.FC<WeatherSidebarProps> = ({
  isOpen,
  onToggle,
}) => {
  return (
    <Sidebar
      isOpen={isOpen}
      onToggle={onToggle}
      className="left-auto right-0 border-l border-r-0"
    >
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-500" />
            <h3 className="text-lg font-semibold">Weather</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            style={{ zIndex: 9999 }}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 px-4 pb-8 min-h-0 overflow-y-auto">
        <WeatherWidget />
      </div>
    </Sidebar>
  );
};
