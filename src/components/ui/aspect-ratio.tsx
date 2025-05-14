
import * as React from "react"
import * as AspectRatioPrimitive from "@radix-ui/react-aspect-ratio"
import { cn } from "@/lib/utils"

interface AspectRatioProps extends React.ComponentPropsWithoutRef<typeof AspectRatioPrimitive.Root> {
  className?: string;
  children?: React.ReactNode;
}

const AspectRatio = React.forwardRef<
  React.ElementRef<typeof AspectRatioPrimitive.Root>,
  AspectRatioProps
>(({ className, children, ...props }, ref) => (
  <AspectRatioPrimitive.Root
    ref={ref}
    className={cn(className)}
    {...props}
  >
    {children}
  </AspectRatioPrimitive.Root>
))
AspectRatio.displayName = "AspectRatio"

export { AspectRatio }
