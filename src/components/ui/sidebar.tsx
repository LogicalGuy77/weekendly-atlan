import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isOpen) return null;

  const isRightSidebar = className?.includes("right-0");

  return (
    <>
      {isMobile && (
        <div
          className="fixed inset-0 bg-black/60 z-30 transition-opacity"
          onClick={onToggle}
        />
      )}
      <div
        className={cn(
          "fixed bg-background/95 backdrop-blur-lg shadow-2xl overflow-hidden transition-all duration-300 ease-in-out",
          isMobile
            ? "bottom-0 left-0 right-0 rounded-t-2xl border-t max-h-[85vh] min-h-[50vh] z-50"
            : `top-[120px] h-[calc(100vh-120px)] border-r w-[420px] z-30`,
          isRightSidebar ? "right-0 border-r-0 border-l" : "left-0",
          className
        )}
      >
        <div className="h-full flex flex-col">{children}</div>
      </div>
    </>
  );
};
