import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      aria-invalid={error}
      className={cn(
        'focus-ring flex min-h-[7rem] w-full rounded-[1.25rem] border bg-surface/85 px-4 py-3 text-sm text-foreground shadow-sm shadow-slate-950/5 placeholder:text-muted-foreground',
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
})

Textarea.displayName = 'Textarea'
