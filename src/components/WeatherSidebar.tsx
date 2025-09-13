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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Weather Insights</h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
            className="hover:!bg-red-500 hover:!text-white rounded-full p-2 h-8 w-8"
            title="Close Weather Insights"
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
