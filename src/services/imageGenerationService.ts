import { GoogleGenAI } from "@google/genai";
import type { WeekendSchedule, WeekendDay } from "../types";

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

    const energyLevels = dayActivities.reduce((acc, sa) => {
      acc[sa.activity.energyLevel] = (acc[sa.activity.energyLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const moodCounts = dayActivities.reduce((acc, sa) => {
      sa.activity.mood.forEach((mood) => {
        acc[mood] = (acc[mood] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

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

    const dominantMoods = Object.entries(moodCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([mood]) => mood);

    const scheduleHealth: string[] = [];
    if (totalDuration < 240)
      scheduleHealth.push("A light and relaxed schedule.");
    if (totalDuration > 600)
      scheduleHealth.push("A packed and exciting schedule!");
    if (Object.keys(energyLevels).length === 1)
      scheduleHealth.push("Consistent energy all day.");
    if (Object.keys(moodCounts).length >= 4)
      scheduleHealth.push("A great variety of moods.");
    if (vibeScore >= 80) scheduleHealth.push("An amazing day is planned!");

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
   * Generate a more imaginative and less structured system prompt.
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
      dominantMoods,
      energyDistribution,
      scheduleHealth,
    } = data;
    const dayActivities = weekend[activeDay];

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
      if (score >= 50) return "A Solid Plan";
      if (score >= 40) return "A Chill Day";
      return "Relaxation Mode";
    };

    const activityHighlights = dayActivities
      .slice(0, 5) // Showcase up to 5 key activities
      .map((sa) => `• ${sa.activity.title} (${sa.timeSlot.period})`)
      .join("\n");

    const styleInstructions = {
      elegant:
        "Incorporate sophisticated gradients (think deep purples, golds), elegant serif fonts, and a refined layout with plenty of clean space. The feel should be premium and classy.",
      vibrant:
        "Use bright, energetic colors like electric orange, magenta, and turquoise. Employ bold, dynamic typography and geometric patterns to create a sense of excitement and motion.",
      minimalist:
        "Focus on a clean, uncluttered design. Use a muted color palette with one strong accent color. Typography should be simple and legible. White space is your best friend.",
      modern:
        "Think sleek and tech-inspired. Use cool gradients (blues, cyans), clean sans-serif fonts, and a structured, grid-based layout. Subtle UI elements or icons can add a modern touch.",
      playful:
        "Embrace warmth and fun. Use rounded shapes, friendly fonts, and a warm color palette (ambers, oranges, soft yellows). Illustrations or cute icons can enhance the playful feel.",
    };

    const prompt = `
      **Your Role:** You are a world-class graphic designer and brand strategist, specializing in creating stunning, shareable social media content. Your task is to design a beautiful and imaginative visual card that captures the essence of a planned weekend. Don't just list data; tell a story.

      **The Creative Brief:**
      Design a visually striking social media card for a planned ${activeDay}. The plan is titled "${
      weekend.title
    }". The overall goal is to create something that feels exciting, personal, and highly shareable.

      **The Weekend's Story & Vibe:**
      - **The Vibe Score is ${vibeScore}/100.** This is the main feeling of the day. The card's design should reflect this score: ${getVibeDescription(
      vibeScore
    )} ${getVibeEmoji(vibeScore)}
      - The dominant moods are **${dominantMoods.join(
        ", "
      )}**. Weave these feelings into the visual theme.
      - It's a day with **${totalActivities} activities** planned, lasting for a total of **${totalDuration}**.
      - The energy flows from ${Object.keys(energyDistribution).join(" to ")}.
      - A key insight about the plan: "${
        scheduleHealth[0] || "A well-balanced day."
      }"

      **Key Ingredients for Your Design (Incorporate these creatively):**
      - **The Vibe:** The score (${vibeScore}/100) and its description should be the focal point. Make it big and bold.
      - **Activity Highlights:**
        ${activityHighlights}
        ${
          dayActivities.length > 5
            ? `...and ${dayActivities.length - 5} more!`
            : ""
        }
      - **Personal Touch:** ${
        options.customMessage
          ? `Include this message: "${options.customMessage}"`
          : ""
      }

      **Creative Direction:**
      - **Art Style:** ${options.style || "modern"}. ${
      styleInstructions[options.style || "modern"]
    }
      - **Format:** Optimized for a social media ${
        options.format || "post"
      } (e.g., square or story format).
      - **Color & Typography:** Let the "Vibe Score" and dominant moods inspire your color palette and font choices. High energy might mean bright colors and bold fonts; a relaxed vibe might mean softer tones and elegant scripts.
      - **Layout:** You have complete creative freedom. You could try a timeline, a collage, an abstract representation, or a card-based layout. Surprise us! The goal is visual delight, not a boring list.
      - **Branding:** Please include a small, subtle "Weekendly" logo or wordmark in a corner.

      **Final Goal:** Create an image that someone would be genuinely excited to share with their friends. It should be aspirational, beautiful, and capture the unique personality of this weekend plan. Go beyond a simple data summary and create a piece of art.
    `;

    return prompt.trim().replace(/\s+/g, " ");
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
        contents: [{ parts: [{ text: prompt }] }],
      });

      const part = response?.candidates?.[0]?.content?.parts?.find(
        (p) => p.inlineData
      );

      if (part && part.inlineData?.data) {
        return {
          imageData: part.inlineData.data,
          prompt,
        };
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
