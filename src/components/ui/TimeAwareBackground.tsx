import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Cloud, Star, Sunrise, Sunset } from "lucide-react";

type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

const backgroundVariants = {
  morning: "from-gradient-to-br from-sky-200/60 via-cyan-200/50 to-teal-200/60",
  afternoon:
    "from-gradient-to-br from-blue-300/60 via-sky-300/50 to-indigo-300/60",
  evening:
    "from-gradient-to-br from-orange-300/60 via-pink-400/50 to-purple-500/60",
  night:
    "from-gradient-to-br from-slate-700/70 via-gray-800/60 to-slate-900/80",
};

const enhancedBackgroundVariants = {
  morning: {
    primary: "from-sky-200/40 via-cyan-100/30 to-teal-200/40",
    secondary: "from-yellow-100/20 via-orange-100/15 to-pink-100/20",
    accent: "from-white/10 via-cyan-50/5 to-sky-50/10",
  },
  afternoon: {
    primary: "from-blue-200/40 via-sky-200/30 to-indigo-200/40",
    secondary: "from-cyan-100/20 via-blue-100/15 to-purple-100/20",
    accent: "from-white/10 via-blue-50/5 to-indigo-50/10",
  },
  evening: {
    primary: "from-orange-200/40 via-pink-300/30 to-purple-400/40",
    secondary: "from-yellow-200/20 via-red-200/15 to-violet-200/20",
    accent: "from-white/10 via-orange-50/5 to-pink-50/10",
  },
  night: {
    primary: "from-slate-600/40 via-gray-700/30 to-slate-800/40",
    secondary: "from-blue-900/20 via-indigo-900/15 to-purple-900/20",
    accent: "from-white/5 via-slate-100/3 to-gray-100/5",
  },
};

const iconVariants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { staggerChildren: 0.2 } },
  exit: { y: -20, opacity: 0 },
};

const FloatingIcon: React.FC<{
  children: React.ReactNode;
  className: string;
}> = ({ children, className }) => (
  <motion.div
    variants={iconVariants}
    className={`absolute text-white/20 ${className}`}
    animate={{
      y: [0, -10, 0, 10, 0],
      x: [0, 5, 0, -5, 0],
      rotate: [0, 5, -5, 0, 0],
    }}
    transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

export const TimeAwareBackground: React.FC<{ timeOfDay: TimeOfDay }> = ({
  timeOfDay,
}) => {
  const currentVariant = enhancedBackgroundVariants[timeOfDay];

  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl">
      {/* Single clean gradient background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${currentVariant.primary} opacity-60`}
      />

      {/* Subtle overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
    </div>
  );
};
