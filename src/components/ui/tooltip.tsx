"use client"

import type { ReactNode } from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"

import { cn } from "@/lib/utils"

type SimpleTooltipProps = {
  text: string
  children: ReactNode
  className?: string
  /**
   * Hover open delay. Tap still opens the surface on any pointer.
   * @default 200
   */
  delay?: number
  /**
   * After hover open, how long to wait before closing on mouse leave.
   * @default 0
   */
  closeDelay?: number
}

/**
 * Tooltip-like surface: hovers on desktop (`openOnHover`), tap / click on touch and mouse.
 * Implemented with Popover so press interaction matches mobile expectations.
 */
export function SimpleTooltip({
  text,
  children,
  className,
  delay = 200,
  closeDelay = 0,
}: SimpleTooltipProps) {
  return (
    <PopoverPrimitive.Root modal={false}>
      <PopoverPrimitive.Trigger
        type="button"
        className={cn(
          "inline-flex min-h-9 min-w-9 touch-manipulation items-center justify-center",
          "rounded-full border-0 bg-transparent p-0 outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring/50",
          className
        )}
        openOnHover
        closeDelay={closeDelay}
        delay={delay}
        aria-label={text}
        nativeButton
      >
        {children}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Positioner
          className="isolate z-50 outline-none"
          side="bottom"
          sideOffset={6}
        >
          <PopoverPrimitive.Popup
            className={cn(
              "max-w-[12rem] origin-(--transform-origin) rounded-md bg-popover px-2.5 py-1.5 text-pretty text-left text-popover-foreground text-xs leading-snug",
              "shadow-md ring-1 ring-foreground/10",
              "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
              "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
            )}
            role="tooltip"
          >
            {text}
          </PopoverPrimitive.Popup>
        </PopoverPrimitive.Positioner>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}
