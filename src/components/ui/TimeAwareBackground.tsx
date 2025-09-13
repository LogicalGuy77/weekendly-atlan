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

  const renderIcons = () => {
    switch (timeOfDay) {
      case "morning":
        return (
          <>
            <FloatingIcon className="top-1/4 left-1/4 w-12 h-12 text-yellow-300/30">
              <Sunrise />
            </FloatingIcon>
            <FloatingIcon className="top-1/3 right-1/3 w-16 h-16 text-orange-200/25">
              <Sun />
            </FloatingIcon>
            <FloatingIcon className="bottom-1/4 right-1/4 w-14 h-14 text-cyan-200/20">
              <Cloud />
            </FloatingIcon>
          </>
        );
      case "afternoon":
        return (
          <>
            <FloatingIcon className="top-1/5 left-1/3 w-20 h-20 text-yellow-200/30">
              <Sun />
            </FloatingIcon>
            <FloatingIcon className="bottom-1/3 right-1/3 w-12 h-12 text-blue-200/25">
              <Cloud />
            </FloatingIcon>
            <FloatingIcon className="top-2/3 left-1/4 w-10 h-10 text-sky-200/20">
              <Cloud />
            </FloatingIcon>
          </>
        );
      case "evening":
        return (
          <>
            <FloatingIcon className="top-1/4 right-1/4 w-14 h-14 text-orange-300/30">
              <Sunset />
            </FloatingIcon>
            <FloatingIcon className="bottom-1/4 left-1/4 w-12 h-12 text-purple-200/25">
              <Moon />
            </FloatingIcon>
            <FloatingIcon className="top-1/2 left-1/3 w-8 h-8 text-pink-200/20">
              <Star />
            </FloatingIcon>
            <FloatingIcon className="bottom-1/3 right-1/5 w-6 h-6 text-violet-200/20">
              <Star />
            </FloatingIcon>
          </>
        );
      case "night":
        return (
          <>
            <FloatingIcon className="top-1/3 left-1/4 w-16 h-16 text-slate-200/25">
              <Moon />
            </FloatingIcon>
            <FloatingIcon className="bottom-1/3 right-1/3 w-8 h-8 text-slate-300/20">
              <Star />
            </FloatingIcon>
            <FloatingIcon className="top-3/4 right-1/4 w-6 h-6 text-slate-300/15">
              <Star />
            </FloatingIcon>
            <FloatingIcon className="top-1/5 right-1/5 w-4 h-4 text-slate-300/15">
              <Star />
            </FloatingIcon>
            <FloatingIcon className="bottom-1/5 left-1/3 w-5 h-5 text-slate-300/15">
              <Star />
            </FloatingIcon>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 overflow-hidden rounded-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${timeOfDay}-primary`}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 1.2, ease: "easeOut" },
          }}
          exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.8 } }}
          className={`absolute inset-0 bg-gradient-to-br ${currentVariant.primary}`}
        />
        <motion.div
          key={`${timeOfDay}-secondary`}
          initial={{ opacity: 0, rotate: -5 }}
          animate={{
            opacity: 1,
            rotate: 0,
            transition: { duration: 1.5, delay: 0.3, ease: "easeOut" },
          }}
          exit={{ opacity: 0, rotate: 5, transition: { duration: 0.6 } }}
          className={`absolute inset-0 bg-gradient-to-tl ${currentVariant.secondary} mix-blend-overlay`}
        />
        <motion.div
          key={`${timeOfDay}-accent`}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: 1,
            scale: 1,
            transition: { duration: 2, delay: 0.6, ease: "easeOut" },
          }}
          exit={{ opacity: 0, scale: 1.2, transition: { duration: 0.4 } }}
          className={`absolute inset-0 bg-gradient-to-r ${currentVariant.accent} mix-blend-soft-light`}
        />
      </AnimatePresence>

      {/* Subtle animated overlay for depth */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-black/5"
        animate={{
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Floating icons with enhanced animations */}
      <motion.div
        variants={iconVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="relative z-10"
      >
        {renderIcons()}
      </motion.div>

      {/* Subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
};
