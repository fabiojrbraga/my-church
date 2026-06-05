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
        aria-invalid={error}
        className={cn(
          'focus-ring flex h-11 w-full rounded-2xl border bg-surface/85 px-4 py-2.5 text-sm text-foreground shadow-sm shadow-slate-950/5 placeholder:text-muted-foreground',
          'transition-all duration-200',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error
            ? 'border-destructive/60 focus-visible:ring-destructive/25'
            : 'border-input/80 hover:border-ring/25 focus:border-primary/50',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'
