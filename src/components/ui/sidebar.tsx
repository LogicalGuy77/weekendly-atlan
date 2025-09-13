import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  children,
  isOpen,
  onToggle,
  className,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isOpen) {
    return null;
  }

  // Determine if this is a right sidebar based on className
  const isRightSidebar =
    className?.includes("right-0") || className?.includes("left-auto");

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-30 transition-opacity duration-200"
          onClick={onToggle}
        />
      )}

      <div
        className={cn(
          "fixed bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-xl z-40 overflow-hidden transition-all duration-300 ease-out",
          isMobile
            ? // Mobile: Bottom sheet that slides up from bottom
              "bottom-0 left-0 right-0 rounded-t-2xl border-t max-h-[85vh] min-h-[50vh]"
            : // Desktop: Sidebar with dynamic header height
            isRightSidebar
            ? "top-[100px] md:top-[120px] right-0 border-l w-[420px] h-[calc(100vh-100px)] md:h-[calc(100vh-120px)]"
            : "top-[100px] md:top-[120px] left-0 border-r w-[420px] h-[calc(100vh-100px)] md:h-[calc(100vh-120px)]",
          className
        )}
      >
        {/* Mobile drag handle */}
        {isMobile && (
          <div className="flex justify-center py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
          </div>
        )}

        <div className="h-full flex flex-col overflow-hidden">{children}</div>
      </div>
    </>
  );
};
