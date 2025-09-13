import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Users,
  DollarSign,
  Sun,
  Cloud,
  Coffee,
  ChefHat,
  ShoppingBasket,
  Mountain,
  Bike,
  TreePine,
  Film,
  Dice6,
  Music,
  Heart,
  Sparkles,
  Zap,
  Gamepad2,
  HeartHandshake,
  Palette,
  Camera,
  Hammer,
  Building2,
  BookOpen,
  Languages,
  Flower,
  Home,
  Wine,
  Truck,
  Waves,
  Smile,
  Key,
  Mic,
  Brain,
  Activity,
  Trees,
  Utensils,
  Book,
  Wrench,
  GraduationCap,
  TestTube,
  PenTool,
  Leaf,
  Laptop,
  Star,
} from "lucide-react";
import type { ActivityCardProps } from "../../types";

// Icon mapping for activity icons
const iconMap: Record<string, React.ComponentType<any>> = {
  coffee: Coffee,
  "chef-hat": ChefHat,
  "shopping-basket": ShoppingBasket,
  mountain: Mountain,
  bike: Bike,
  "tree-pine": TreePine,
  film: Film,
  "dice-6": Dice6,
  music: Music,
  heart: Heart,
  sparkles: Sparkles,
  zap: Zap,
  users: Users,
  "gamepad-2": Gamepad2,
  "heart-handshake": HeartHandshake,
  palette: Palette,
  camera: Camera,
  hammer: Hammer,
  "building-2": Building2,
  "book-open": BookOpen,
  languages: Languages,
  flower: Flower,
  home: Home,
  wine: Wine,
  truck: Truck,
  waves: Waves,
  sun: Sun,
  smile: Smile,
  key: Key,
  mic: Mic,
  brain: Brain,
  activity: Activity,
  trees: Trees,
  utensils: Utensils,
  book: Book,
  "graduation-cap": GraduationCap,
  wrench: Wrench,
  flask: TestTube,
  "pen-tool": PenTool,
  leaf: Leaf,
  laptop: Laptop,
  star: Star,
};

// Category icon mapping
const categoryIconMap: Record<string, React.ComponentType<any>> = {
  utensils: Utensils,
  mountain: Mountain,
  film: Film,
  heart: Heart,
  users: Users,
  palette: Palette,
  book: Book,
  home: Home,
};

export const ActivityCard: React.FC<ActivityCardProps> = ({
  activity,
  isSelected = false,
  isDragging = false,
  compact = false,
}) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    return `${mins}m`;
  };

  const formatCost = (cost?: number) => {
    if (cost === undefined || cost === 0) return "Free";
    return `${cost}`;
  };

  return (
    <Card
      className={`
        cursor-grab active:cursor-grabbing transition-all duration-200 
        hover:shadow-lg hover:scale-[1.02] hover:border-primary/50
        ${isSelected ? "ring-2 ring-primary border-primary" : ""}
        ${isDragging ? "opacity-90 scale-105 rotate-3 shadow-2xl" : ""}
        ${compact ? "p-2" : ""}
      `}
    >
      <CardHeader className={`p-4 ${compact ? "pb-2" : ""}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${activity.category.color}20` }}
            >
              {(() => {
                const CategoryIcon = categoryIconMap[activity.category.icon];
                const ActivityIcon = iconMap[activity.icon];
                const IconComponent = ActivityIcon || CategoryIcon;

                if (IconComponent) {
                  return (
                    <IconComponent
                      className="w-5 h-5"
                      style={{ color: activity.category.color }}
                    />
                  );
                }

                // Fallback to text if no icon found
                return (
                  <span
                    className="text-xl"
                    role="img"
                    aria-label={activity.category.name}
                  >
                    {activity.category.icon}
                  </span>
                );
              })()}
            </div>
            <div>
              <h3
                className={`font-semibold ${
                  compact ? "text-sm" : "text-base"
                } leading-tight break-words`}
              >
                {activity.title}
              </h3>
              <p className="text-xs text-muted-foreground">
                {activity.category.name}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDuration(activity.duration)}
          </Badge>
        </div>
      </CardHeader>

      {!compact && (
        <CardContent className="p-4 pt-0">
          <p className="text-sm text-muted-foreground mb-3">
            {activity.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {activity.mood.map((mood) => (
              <Badge
                key={mood}
                variant="secondary"
                className="text-xs capitalize"
              >
                {mood}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2 mt-2">
            <div
              className="flex items-center gap-1"
              title={`${activity.energyLevel} energy`}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  activity.energyLevel === "high"
                    ? "bg-red-500"
                    : activity.energyLevel === "medium"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
              />
              <span className="capitalize">{activity.energyLevel}</span>
            </div>
            <div className="flex items-center gap-1" title="Cost">
              <DollarSign className="w-3 h-3" />
              <span>{formatCost(activity.cost)}</span>
            </div>
            {activity.weatherDependent && (
              <div
                className="flex items-center gap-1"
                title="Weather Dependent"
              >
                <Sun className="w-3 h-3 text-yellow-500" />
                <span>Outdoor</span>
              </div>
            )}
            {!activity.weatherDependent && (
              <div className="flex items-center gap-1" title="Indoors">
                <Cloud className="w-3 h-3 text-gray-400" />
                <span>Indoor</span>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
