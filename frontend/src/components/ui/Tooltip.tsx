import * as React from 'react'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/cn'

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger
export const TooltipPortal = TooltipPrimitive.Portal
export const TooltipArrow = TooltipPrimitive.Arrow

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, collisionPadding = 8, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    collisionPadding={collisionPadding}
    className={cn(
      'z-50 rounded-md border border-border bg-elevated px-2 py-1 text-xs text-fg shadow-elevated',
      className,
    )}
    {...props}
  />
))
TooltipContent.displayName = 'TooltipContent'
