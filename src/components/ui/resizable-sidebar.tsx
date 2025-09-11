import React, { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ResizableSidebarProps {
  children: React.ReactNode;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  isOpen: boolean;
  onToggle: () => void;
  onWidthChange?: (width: number) => void;
  className?: string;
}

export const ResizableSidebar: React.FC<ResizableSidebarProps> = ({
  children,
  defaultWidth = 320,
  minWidth = 280,
  maxWidth = 600,
  isOpen,
  onToggle,
  onWidthChange,
  className,
}) => {
  const [width, setWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      // Add cursor style to body during resize
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [width]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const deltaX = e.clientX - startXRef.current;
      const newWidth = Math.min(
        Math.max(startWidthRef.current + deltaX, minWidth),
        maxWidth
      );

      setWidth(newWidth);
      onWidthChange?.(newWidth);
    },
    [isResizing, minWidth, maxWidth, onWidthChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Call onWidthChange on initial mount and when width changes
  useEffect(() => {
    onWidthChange?.(width);
  }, [width, onWidthChange]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={sidebarRef}
      className={cn(
        "fixed left-0 top-[120px] h-[calc(100vh-120px)] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-r shadow-xl z-40 overflow-hidden transition-all duration-200",
        className
      )}
      style={{ width: `${width}px` }}
    >
      {children}

      {/* Resize Handle */}
      <div
        className={cn(
          "absolute top-0 right-0 w-2 h-full cursor-col-resize bg-transparent hover:bg-blue-500/20 transition-all duration-200 group",
          isResizing && "bg-blue-500/30 w-3"
        )}
        onMouseDown={handleMouseDown}
      >
        {/* Visual indicator */}
        <div
          className={cn(
            "absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1/2 w-4 h-12 bg-gray-300/80 dark:bg-gray-600/80 rounded-full transition-all duration-200 flex items-center justify-center backdrop-blur-sm",
            "opacity-0 group-hover:opacity-100",
            isResizing && "opacity-100 bg-blue-500/80 scale-110"
          )}
        >
          <div className="flex gap-0.5">
            <div className="w-0.5 h-6 bg-white dark:bg-gray-200 rounded-full"></div>
            <div className="w-0.5 h-6 bg-white dark:bg-gray-200 rounded-full"></div>
          </div>
        </div>

        {/* Resize line indicator */}
        <div
          className={cn(
            "absolute top-0 right-0 w-0.5 h-full bg-blue-500 transition-opacity duration-200",
            isResizing ? "opacity-100" : "opacity-0"
          )}
        />
      </div>
    </div>
  );
};
