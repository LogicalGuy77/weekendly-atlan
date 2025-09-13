import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  Copy,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Palette,
  Square,
  Heart,
  Zap,
  X,
  Coffee,
  Sun,
  Check,
  Share2,
} from "lucide-react";
import confetti from "canvas-confetti";
import { imageGenerationService } from "../services/imageGenerationService";
import type { WeekendSchedule, WeekendDay } from "../types";
import type { ImageGenerationOptions } from "../services/imageGenerationService";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  weekend: WeekendSchedule;
  activeDay: WeekendDay;
}

interface GeneratedImage {
  imageData: string;
  prompt: string;
  style: string;
  timestamp: number;
}

const cardStyles = [
  {
    value: "elegant" as const,
    label: "Elegant",
    description: "Sophisticated and refined",
    icon: <Palette className="w-5 h-5" />,
    color: "from-purple-500 to-pink-500",
    bgColor:
      "bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20",
  },
  {
    value: "vibrant" as const,
    label: "Fun",
    description: "Bright and energetic",
    icon: <Sparkles className="w-5 h-5" />,
    color: "from-orange-500 to-red-500",
    bgColor:
      "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20",
  },
  {
    value: "minimalist" as const,
    label: "Aesthetic",
    description: "Clean and minimal",
    icon: <Square className="w-5 h-5" />,
    color: "from-gray-500 to-slate-500",
    bgColor:
      "bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-950/20 dark:to-slate-950/20",
  },
  {
    value: "modern" as const,
    label: "Energetic",
    description: "Dynamic and bold",
    icon: <Zap className="w-5 h-5" />,
    color: "from-blue-500 to-cyan-500",
    bgColor:
      "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20",
  },
  {
    value: "playful" as const,
    label: "Cozy",
    description: "Warm and comfortable",
    icon: <Coffee className="w-5 h-5" />,
    color: "from-amber-500 to-orange-500",
    bgColor:
      "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20",
  },
];

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  weekend,
  activeDay,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedStyle, setSelectedStyle] =
    useState<ImageGenerationOptions["style"]>("elegant");
  const [selectedFormat, setSelectedFormat] =
    useState<ImageGenerationOptions["format"]>("square");
  const [customMessage, setCustomMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedImageId, setCopiedImageId] = useState<number | null>(null);

  const formats = [
    {
      value: "square" as const,
      label: "Square",
      description: "Instagram posts",
    },
    {
      value: "story" as const,
      label: "Story",
      description: "Instagram stories",
    },
    { value: "post" as const, label: "Post", description: "Social media" },
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
        style: selectedStyle || "elegant",
        timestamp: Date.now(),
      };

      setGeneratedImages((prev) => [newImage, ...prev.slice(0, 2)]); // Keep last 3 images

      // Trigger confetti effect on successful generation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57"],
      });
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

  const handleCopyImage = async (imageData: string, timestamp: number) => {
    try {
      const response = await fetch(`data:image/png;base64,${imageData}`);
      const blob = await response.blob();

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "image/png": blob,
          }),
        ]);

        setCopiedImageId(timestamp);
        setTimeout(() => setCopiedImageId(null), 2000);
      } else {
        // Fallback: download the image if clipboard API is not supported
        await handleDownloadImage(imageData, "copied");
      }
    } catch (err) {
      console.error("Failed to copy image:", err);
      setError("Failed to copy image to clipboard");
      // Fallback to download
      await handleDownloadImage(imageData, "copied");
    }
  };

  const dayActivities = weekend[activeDay];
  const selectedStyleData =
    cardStyles.find((s) => s.value === selectedStyle) || cardStyles[0];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-lg max-h-[80vh] overflow-y-auto"
        >
          <Card className="bg-background border-0 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Share2 className="w-4 h-4" />
                    Share Schedule
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Generate a {activeDay} image
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="hover:bg-destructive/10 hover:text-destructive rounded-full p-1 h-6 w-6"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {dayActivities.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Add some activities to your {activeDay} schedule to generate
                    a shareable image!
                  </p>
                </div>
              ) : (
                <>
                  {/* Style Selection */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Style
                    </label>
                    <div className="grid grid-cols-5 gap-1">
                      {cardStyles.map((style) => (
                        <Button
                          key={style.value}
                          variant="outline"
                          onClick={() => setSelectedStyle(style.value)}
                          className={`h-auto p-2 flex flex-col items-center gap-1 transition-all text-xs ${
                            selectedStyle === style.value
                              ? "ring-2 ring-primary border-primary bg-primary/10"
                              : "hover:bg-accent"
                          }`}
                        >
                          <div
                            className={`p-1 rounded-full bg-gradient-to-br ${style.color} text-white`}
                          >
                            {React.cloneElement(style.icon, {
                              className: "w-3 h-3",
                            })}
                          </div>
                          <span className="font-medium">{style.label}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Format and Generate Section */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Format Selection */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Format
                      </label>
                      <div className="grid grid-cols-3 gap-1">
                        {formats.map((format) => (
                          <Button
                            key={format.value}
                            variant={
                              selectedFormat === format.value
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setSelectedFormat(format.value)}
                            className="text-xs py-1"
                          >
                            {format.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Generate Button */}
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Action
                      </label>
                      <Button
                        onClick={handleGenerateImage}
                        disabled={isGenerating}
                        className="w-full"
                        size="sm"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-3 h-3 mr-1" />
                            Generate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Custom Message */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">
                      Message (Optional)
                    </label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Add a personal touch..."
                      className="w-full p-2 rounded-lg border bg-background text-xs resize-none"
                      rows={2}
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {customMessage.length}/100
                    </p>
                  </div>

                  {/* Error Display */}
                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  {/* Generated Images */}
                  {generatedImages.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium">Generated Images</h4>
                      <div className="space-y-3">
                        {generatedImages.map((image, index) => (
                          <motion.div
                            key={image.timestamp}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                            className="border rounded-lg p-3 bg-muted/30"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Badge variant="secondary" className="text-xs">
                                {image.style}
                              </Badge>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleDownloadImage(
                                      image.imageData,
                                      image.style
                                    )
                                  }
                                  className="h-7 px-2"
                                >
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleCopyImage(
                                      image.imageData,
                                      image.timestamp
                                    )
                                  }
                                  variant={
                                    copiedImageId === image.timestamp
                                      ? "default"
                                      : "outline"
                                  }
                                  className="h-7 px-2"
                                >
                                  {copiedImageId === image.timestamp ? (
                                    <Check className="w-3 h-3" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Image Preview */}
                            <div className="relative rounded-lg overflow-hidden bg-muted">
                              <img
                                src={`data:image/png;base64,${image.imageData}`}
                                alt={`Generated schedule image - ${image.style} style`}
                                className="w-full h-auto max-h-48 object-contain"
                              />
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
