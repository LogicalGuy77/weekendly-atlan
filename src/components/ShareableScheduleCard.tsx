import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Share2,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Palette,
  Square,
  Smartphone,
  Monitor,
} from "lucide-react";
import { imageGenerationService } from "../services/imageGenerationService";
import type { WeekendSchedule, WeekendDay } from "../types";
import type { ImageGenerationOptions } from "../services/imageGenerationService";

interface ShareableScheduleCardProps {
  weekend: WeekendSchedule;
  activeDay: WeekendDay;
  className?: string;
}

interface GeneratedImage {
  imageData: string;
  prompt: string;
  style: string;
  timestamp: number;
}

export const ShareableScheduleCard: React.FC<ShareableScheduleCardProps> = ({
  weekend,
  activeDay,
  className = "",
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedStyle, setSelectedStyle] =
    useState<ImageGenerationOptions["style"]>("modern");
  const [selectedFormat, setSelectedFormat] =
    useState<ImageGenerationOptions["format"]>("square");
  const [customMessage, setCustomMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const styles: Array<{
    value: ImageGenerationOptions["style"];
    label: string;
    icon: React.ReactNode;
  }> = [
    { value: "modern", label: "Modern", icon: <Monitor className="w-4 h-4" /> },
    {
      value: "minimalist",
      label: "Minimalist",
      icon: <Square className="w-4 h-4" />,
    },
    {
      value: "vibrant",
      label: "Vibrant",
      icon: <Sparkles className="w-4 h-4" />,
    },
    {
      value: "elegant",
      label: "Elegant",
      icon: <Palette className="w-4 h-4" />,
    },
  ];

  const formats: Array<{
    value: ImageGenerationOptions["format"];
    label: string;
    description: string;
  }> = [
    {
      value: "square",
      label: "Square",
      description: "Perfect for Instagram posts",
    },
    {
      value: "story",
      label: "Story",
      description: "Instagram/Facebook stories",
    },
    { value: "post", label: "Post", description: "General social media" },
  ];

  const handleGenerateImage = async () => {
    if (!weekend || weekend[activeDay].length === 0) {
      setError("No activities scheduled for this day");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const options: ImageGenerationOptions = {
        style: selectedStyle,
        format: selectedFormat,
        customMessage: customMessage.trim() || undefined,
      };

      const result = await imageGenerationService.generateScheduleImage(
        weekend,
        activeDay,
        options
      );

      const newImage: GeneratedImage = {
        imageData: result.imageData,
        prompt: result.prompt,
        style: selectedStyle || "modern",
        timestamp: Date.now(),
      };

      setGeneratedImages((prev) => [newImage, ...prev.slice(0, 4)]); // Keep last 5 images
    } catch (err) {
      console.error("Failed to generate image:", err);
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async (imageData: string, style: string) => {
    try {
      const filename = `weekendly-${activeDay}-${style}-${Date.now()}.png`;
      await imageGenerationService.saveImage(imageData, filename);
    } catch (err) {
      console.error("Failed to download image:", err);
      setError("Failed to download image");
    }
  };

  const handleShareImage = async (imageData: string) => {
    try {
      if (navigator.share && navigator.canShare) {
        // Convert base64 to blob
        const response = await fetch(`data:image/png;base64,${imageData}`);
        const blob = await response.blob();
        const file = new File([blob], `weekendly-schedule-${Date.now()}.png`, {
          type: "image/png",
        });

        const shareData = {
          title: `My ${
            activeDay.charAt(0).toUpperCase() + activeDay.slice(1)
          } Schedule`,
          text: `Check out my awesome weekend plans! 🎉`,
          files: [file],
        };

        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          // Fallback if files aren't supported
          await handleDownloadImage(imageData, "shared");
        }
      } else {
        // Fallback: copy to clipboard or download
        await handleDownloadImage(imageData, "shared");
      }
    } catch (err) {
      console.error("Failed to share image:", err);
      setError("Failed to share image");
    }
  };

  const dayActivities = weekend[activeDay];

  if (dayActivities.length === 0) {
    return (
      <Card
        className={`bg-card/60 backdrop-blur-sm border-0 shadow-xl ${className}`}
      >
        <CardContent className="p-6 text-center">
          <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">
            Add some activities to your {activeDay} schedule to generate a
            shareable image!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={className}
    >
      <Card className="bg-card/60 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Your Schedule
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Generate a beautiful image of your {activeDay} schedule to share
            with friends!
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Style Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Style</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {styles.map((style) => (
                <Button
                  key={style.value}
                  variant={
                    selectedStyle === style.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedStyle(style.value)}
                  className="flex items-center gap-2"
                >
                  {style.icon}
                  {style.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Format</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {formats.map((format) => (
                <Button
                  key={format.value}
                  variant={
                    selectedFormat === format.value ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedFormat(format.value)}
                  className="flex flex-col items-center gap-1 h-auto py-3"
                >
                  <span className="font-medium">{format.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {format.description}
                  </span>
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Message */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Custom Message (Optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Add a personal message to your schedule card..."
              className="w-full p-3 rounded-lg border bg-background text-sm resize-none"
              rows={2}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {customMessage.length}/100 characters
            </p>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateImage}
            disabled={isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Image...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4 mr-2" />
                Generate Shareable Image
              </>
            )}
          </Button>

          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Generated Images</h4>
              <div className="space-y-4">
                {generatedImages.map((image, index) => (
                  <motion.div
                    key={image.timestamp}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="border rounded-lg p-4 bg-muted/30"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{image.style}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(image.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleDownloadImage(image.imageData, image.style)
                          }
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShareImage(image.imageData)}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Image Preview */}
                    <div className="relative rounded-lg overflow-hidden bg-muted">
                      <img
                        src={`data:image/png;base64,${image.imageData}`}
                        alt={`Generated schedule image - ${image.style} style`}
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    </div>

                    {/* Prompt Preview (Collapsible) */}
                    <details className="mt-3">
                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                        View generation prompt
                      </summary>
                      <pre className="text-xs text-muted-foreground mt-2 whitespace-pre-wrap bg-muted/50 p-2 rounded max-h-32 overflow-y-auto">
                        {image.prompt}
                      </pre>
                    </details>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Stats Preview */}
          <div className="p-4 rounded-lg bg-muted/30 border-l-4 border-primary">
            <h4 className="text-sm font-medium mb-2">Preview Data</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Activities:</span>
                <span className="ml-2 font-medium">{dayActivities.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2 font-medium">
                  {Math.floor(
                    dayActivities.reduce(
                      (total, sa) => total + sa.activity.duration,
                      0
                    ) / 60
                  )}
                  h
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Categories:</span>
                <span className="ml-2 font-medium">
                  {
                    new Set(
                      dayActivities.map((sa) => sa.activity.category.name)
                    ).size
                  }
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Moods:</span>
                <span className="ml-2 font-medium">
                  {
                    new Set(dayActivities.flatMap((sa) => sa.activity.mood))
                      .size
                  }
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
