import { GoogleGenAI } from "@google/genai";
import type { WeekendSchedule, WeekendDay, ScheduledActivity } from "../types";

interface ImageGenerationOptions {
  style?: "modern" | "minimalist" | "vibrant" | "elegant" | "playful";
  format?: "square" | "story" | "post";
  includeQR?: boolean;
  customMessage?: string;
}

interface ScheduleImageData {
  weekend: WeekendSchedule;
  activeDay: WeekendDay;
  vibeScore: number;
  totalActivities: number;
  totalDuration: string;
  energyTypes: number;
  moodTypes: number;
  dominantMoods: string[];
  energyDistribution: Record<string, number>;
  scheduleHealth: string[];
}

class ImageGenerationService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_NANO_BANANA_API_KEY;
    if (!apiKey) {
      throw new Error(
        "Google Nano Banana API key not found in environment variables"
      );
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Extract key data from schedule for image generation
   */
  private extractScheduleData(
    weekend: WeekendSchedule,
    activeDay: WeekendDay
  ): ScheduleImageData {
    const dayActivities = weekend[activeDay];

    // Calculate statistics (similar to ScheduleSummary component)
    const totalDuration = dayActivities.reduce(
      (total, sa) => total + sa.activity.duration,
      0
    );

    const formatDuration = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (hours > 0) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
      return `${mins}m`;
    };

    // Energy distribution
    const energyLevels = dayActivities.reduce((acc, sa) => {
      acc[sa.activity.energyLevel] = (acc[sa.activity.energyLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Mood distribution
    const moodCounts = dayActivities.reduce((acc, sa) => {
      sa.activity.mood.forEach((mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Calculate vibe score
    const calculateVibeScore = () => {
      let score = 50;
      const hasLow = energyLevels.low > 0;
      const hasMedium = energyLevels.medium > 0;
      const hasHigh = energyLevels.high > 0;

      if (hasLow && hasMedium && hasHigh) score += 20;
      else if ((hasLow && hasMedium) || (hasMedium && hasHigh)) score += 10;

      const uniqueMoods = Object.keys(moodCounts).length;
      score += Math.min(uniqueMoods * 5, 25);

      if (dayActivities.length >= 3) score += 10;
      if (dayActivities.length >= 5) score += 5;

      if (totalDuration > 600) score -= 10;
      if (totalDuration > 720) score -= 10;

      return Math.max(0, Math.min(100, score));
    };

    const vibeScore = calculateVibeScore();

    // Top moods
    const dominantMoods = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([mood]) => mood);

    // Schedule health insights
    const scheduleHealth: string[] = [];
    if (totalDuration < 240) scheduleHealth.push("Light schedule");
    if (totalDuration > 600) scheduleHealth.push("Packed schedule");
    if (Object.keys(energyLevels).length === 1)
      scheduleHealth.push("Single energy level");
    if (Object.keys(moodCounts).length >= 4)
      scheduleHealth.push("Great mood variety");
    if (vibeScore >= 80) scheduleHealth.push("Amazing day planned");

    return {
      weekend,
      activeDay,
      vibeScore,
      totalActivities: dayActivities.length,
      totalDuration: formatDuration(totalDuration),
      energyTypes: Object.keys(energyLevels).length,
      moodTypes: Object.keys(moodCounts).length,
      dominantMoods,
      energyDistribution: energyLevels,
      scheduleHealth,
    };
  }

  /**
   * Generate comprehensive system prompt for image generation
   */
  private generateSystemPrompt(
    data: ScheduleImageData,
    options: ImageGenerationOptions
  ): string {
    const {
      weekend,
      activeDay,
      vibeScore,
      totalActivities,
      totalDuration,
      energyTypes,
      moodTypes,
      dominantMoods,
      energyDistribution,
      scheduleHealth,
    } = data;
    const dayActivities = weekend[activeDay];

    // Get vibe emoji and description (matching ScheduleSummary.tsx)
    const getVibeEmoji = (score: number) => {
      if (score >= 90) return "🔥";
      if (score >= 80) return "✨";
      if (score >= 70) return "😊";
      if (score >= 60) return "👍";
      if (score >= 50) return "😐";
      if (score >= 40) return "😕";
      return "😴";
    };

    const getVibeDescription = (score: number) => {
      if (score >= 90) return "Epic Weekend Vibes!";
      if (score >= 80) return "Fantastic Energy!";
      if (score >= 70) return "Great Balance!";
      if (score >= 60) return "Good Vibes!";
      if (score >= 50) return "Decent Plan";
      if (score >= 40) return "Could Use More Fun";
      return "Needs More Energy";
    };

    // Detailed activity breakdown with time slots
    const activityBreakdown = dayActivities
      .map((sa) => {
        const timeSlot = `${sa.timeSlot.period} (${sa.timeSlot.startTime}-${sa.timeSlot.endTime})`;
        return `• ${sa.activity.title} - ${timeSlot} - ${
          sa.activity.duration
        }min - ${sa.activity.category.name} - ${
          sa.activity.energyLevel
        } energy - Moods: ${sa.activity.mood.join(", ")}`;
      })
      .join("\n");

    // Category distribution with colors
    const categoryCount = dayActivities.reduce((acc, sa) => {
      const catName = sa.activity.category.name;
      acc[catName] = (acc[catName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const categoryBreakdown = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, count]) => `${cat}: ${count} activities`)
      .join(", ");

    // Time period analysis
    const timePeriods = dayActivities.reduce((acc, sa) => {
      acc[sa.timeSlot.period] = (acc[sa.timeSlot.period] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const timeAnalysis = Object.entries(timePeriods)
      .map(
        ([period, count]) =>
          `${period.charAt(0).toUpperCase() + period.slice(1)}: ${count}`
      )
      .join(" | ");

    // Energy level breakdown
    const energyBreakdown = Object.entries(energyDistribution)
      .map(
        ([level, count]) =>
          `${level.charAt(0).toUpperCase() + level.slice(1)}: ${count}`
      )
      .join(" | ");

    // Style-specific design instructions
    const styleInstructions = {
      elegant:
        "Use sophisticated purple and pink gradients, elegant serif fonts, refined layouts with plenty of white space, subtle shadows, and premium feel",
      vibrant:
        "Use bright, energetic colors like orange, red, and yellow, bold sans-serif fonts, dynamic layouts with geometric shapes and patterns",
      minimalist:
        "Use clean lines, minimal color palette (grays, whites, one accent color), simple typography, lots of white space, geometric shapes",
      modern:
        "Use contemporary blue and cyan gradients, modern sans-serif fonts, sleek layouts with subtle animations feel, tech-inspired elements",
      playful:
        "Use warm amber and orange colors, friendly rounded fonts, cozy layouts with soft edges, coffee/home-inspired elements, comfortable feel",
    };

    const prompt = `Create a stunning, professional social media card for a weekend schedule that's perfect for sharing. Make it visually striking and Instagram-ready!

**WEEKEND SCHEDULE OVERVIEW:**
📅 Day: ${activeDay.charAt(0).toUpperCase() + activeDay.slice(1)}
🎯 Plan: "${weekend.title}"
${getVibeEmoji(vibeScore)} Vibe Score: ${vibeScore}/100 - ${getVibeDescription(
      vibeScore
    )}

**KEY STATISTICS (Display prominently):**
📊 ${totalActivities} Activities Planned
⏰ ${totalDuration} Total Duration
⚡ ${energyTypes} Energy Types: ${energyBreakdown}
💫 ${moodTypes} Different Moods: ${dominantMoods.slice(0, 3).join(", ")}
🏷️ Categories: ${categoryBreakdown}
🕐 Time Spread: ${timeAnalysis}

**DETAILED ACTIVITY SCHEDULE:**
${activityBreakdown}

**SCHEDULE INSIGHTS:**
${
  scheduleHealth.length > 0
    ? scheduleHealth.join(" • ")
    : "Well-balanced schedule!"
}

**VISUAL DESIGN REQUIREMENTS:**
🎨 Style: ${options.style || "modern"} - ${
      styleInstructions[options.style || "modern"]
    }
📱 Format: ${options.format || "square"} - Optimized for social media sharing
🌈 Color Psychology: Match colors to the vibe score and energy levels
📝 Typography: Use font hierarchy - large vibe score, medium stats, smaller details
🎯 Layout: Card-based design with clear sections and visual separation
✨ Visual Elements: Include relevant icons, progress bars for energy distribution, badges for moods
🔥 Branding: Subtle "Weekendly" branding in corner
📐 Composition: Use rule of thirds, balanced layout, good contrast ratios

**SPECIFIC VISUAL ELEMENTS TO INCLUDE:**
1. HERO SECTION: Large vibe score ${getVibeEmoji(
      vibeScore
    )} ${vibeScore}/100 with "${getVibeDescription(vibeScore)}"
2. STATS GRID: 2x2 or 1x4 grid showing activities, duration, energy types, moods
3. ACTIVITY TIMELINE: Visual representation of the day's schedule by time periods
4. ENERGY BARS: Progress bars or visual indicators for low/medium/high energy distribution
5. MOOD BADGES: Colorful tags or badges for dominant moods
6. CATEGORY ICONS: Visual icons representing different activity categories
7. TIME INDICATORS: Morning/afternoon/evening/night sections with activities
8. BACKGROUND: Subtle gradient or pattern that doesn't interfere with readability

**MOOD & ATMOSPHERE:**
- Energy Level: ${Object.keys(energyDistribution).join(" + ")} energy activities
- Emotional Tone: ${dominantMoods.join(", ")} vibes
- Overall Feel: ${
      vibeScore >= 80
        ? "Exciting and energetic"
        : vibeScore >= 60
        ? "Balanced and positive"
        : vibeScore >= 40
        ? "Calm and steady"
        : "Relaxed and peaceful"
    }

${
  options.customMessage
    ? `**PERSONAL MESSAGE:** "${options.customMessage}"`
    : ""
}

**FINAL REQUIREMENTS:**
- Make it share-worthy and Instagram-ready
- Ensure all text is readable on mobile devices
- Use high contrast for accessibility
- Include visual hierarchy to guide the eye
- Make the vibe score the focal point
- Ensure the design reflects the energy and mood of the planned activities
- Create something people would be proud to share with friends!

Generate a beautiful, professional image that captures the excitement and planning that went into this ${activeDay} schedule!`;

    return prompt;
  }

  /**
   * Generate image using Google Gemini
   */
  async generateScheduleImage(
    weekend: WeekendSchedule,
    activeDay: WeekendDay,
    options: ImageGenerationOptions = {}
  ): Promise<{ imageData: string; prompt: string }> {
    try {
      const scheduleData = this.extractScheduleData(weekend, activeDay);
      const prompt = this.generateSystemPrompt(scheduleData, options);

      console.log("Generating image with prompt:", prompt);

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash-image-preview",
        contents: prompt,
      });

      if (
        !response.candidates ||
        !response.candidates[0] ||
        !response.candidates[0].content
      ) {
        throw new Error("Invalid response from Gemini API");
      }

      const parts = response.candidates[0].content.parts;
      if (!parts) {
        throw new Error("No content parts in response");
      }

      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return {
            imageData: part.inlineData.data,
            prompt,
          };
        }
      }

      throw new Error("No image data received from Gemini API");
    } catch (error) {
      console.error("Error generating image:", error);
      throw new Error(
        `Failed to generate image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Save generated image to file
   */
  async saveImage(imageData: string, filename?: string): Promise<string> {
    try {
      const finalFilename = filename || `weekendly-schedule-${Date.now()}.png`;

      // In browser environment, create download link
      if (typeof window !== "undefined") {
        // Convert base64 to blob directly in browser
        const byteCharacters = atob(imageData);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "image/png" });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = finalFilename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        return finalFilename;
      }

      // Node.js environment (for testing)
      const fs = await import("fs");
      const buffer = Buffer.from(imageData, "base64");
      fs.writeFileSync(finalFilename, buffer);
      console.log(`Image saved as ${finalFilename}`);
      return finalFilename;
    } catch (error) {
      console.error("Error saving image:", error);
      throw new Error(
        `Failed to save image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Generate multiple style variations
   */
  async generateVariations(
    weekend: WeekendSchedule,
    activeDay: WeekendDay
  ): Promise<Array<{ style: string; imageData: string; prompt: string }>> {
    const styles: Array<ImageGenerationOptions["style"]> = [
      "modern",
      "minimalist",
      "vibrant",
      "elegant",
    ];
    const variations = [];

    for (const style of styles) {
      try {
        const result = await this.generateScheduleImage(weekend, activeDay, {
          style,
        });
        variations.push({
          style: style!,
          ...result,
        });
      } catch (error) {
        console.error(`Failed to generate ${style} variation:`, error);
      }
    }

    return variations;
  }
}

export const imageGenerationService = new ImageGenerationService();
export type { ImageGenerationOptions, ScheduleImageData };
