import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-10 w-full rounded-lg border bg-card px-3.5 py-2 text-sm text-foreground placeholder:text-muted-foreground',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-destructive focus:ring-destructive/30 focus:border-destructive'
            : 'border-input hover:border-ring/50',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'
