import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, MapPin, DollarSign } from "lucide-react";
import type { ActivityCardProps } from "../../types";

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  isSelected = false,
  isDragging = false,
  onSelect,
  onDragStart,
  showDetails = true,
  compact = false,
}) => {
  const handleClick = () => {
    onSelect?.(activity);
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("application/json", JSON.stringify(activity));
    onDragStart?.(activity);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  const formatCost = (cost?: number) => {
    if (cost === undefined || cost === 0) return "Free";
    return cost.toString();
  };

  return (
    <Card
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-md
        ${isSelected ? "ring-2 ring-primary" : ""}
        ${isDragging ? "opacity-50 rotate-2" : ""}
        ${compact ? "p-2" : ""}
      `}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
    >
      <CardHeader className={compact ? "pb-2" : ""}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: activity.category.color }}
            />
            <h3
              className={`font-semibold ${compact ? "text-sm" : "text-base"}`}
            >
              {activity.title}
            </h3>
          </div>
          <Badge
            variant="secondary"
            className="text-xs"
            style={{
              backgroundColor: `${activity.category.color}20`,
              color: activity.category.color,
            }}
          >
            {activity.category.name}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className={compact ? "pt-0" : ""}>
        {!compact && (
          <p className="text-sm text-muted-foreground mb-3">
            {activity.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 mb-3">
          {activity.mood.slice(0, compact ? 2 : 3).map((mood) => (
            <Badge key={mood} variant="outline" className="text-xs">
              {mood}
            </Badge>
          ))}
          {activity.mood.length > (compact ? 2 : 3) && (
            <Badge variant="outline" className="text-xs">
              +{activity.mood.length - (compact ? 2 : 3)}
            </Badge>
          )}
        </div>

        {showDetails && (
          <div className="space-y-2">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(activity.duration)}</span>
              </div>

              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                <span>{formatCost(activity.cost)}</span>
              </div>

              {activity.minParticipants && (
                <div className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>
                    {activity.minParticipants}
                    {activity.maxParticipants &&
                    activity.maxParticipants !== activity.minParticipants
                      ? `-${activity.maxParticipants}`
                      : "+"}
                  </span>
                </div>
              )}
            </div>

            {activity.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{activity.location}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${
                    activity.energyLevel === "high"
                      ? "bg-red-500"
                      : activity.energyLevel === "medium"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                />
                <span className="text-xs text-muted-foreground capitalize">
                  {activity.energyLevel} energy
                </span>
              </div>

              {activity.weatherDependent && (
                <Badge variant="outline" className="text-xs">
                  Weather dependent
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
