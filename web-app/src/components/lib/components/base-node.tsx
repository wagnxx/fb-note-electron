import React from 'react'
import { cn } from '@/lib/utils'

export const BaseNode = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { selected?: boolean }>(
  ({ className, selected, draggable, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-md border bg-card p-2 text-card-foreground',
        className,
        selected && draggable ? 'border-muted-foreground shadow-lg' : '',
        draggable ? 'hover:ring-1' : 'cursor-not-allowed nodrap',
      )}
      tabIndex={0}
      {...props}
    ></div>
  ),
)
BaseNode.displayName = 'BaseNode'
