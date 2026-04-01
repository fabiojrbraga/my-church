import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'success' | 'destructive' | 'warning' | 'outline'
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        {
          'bg-primary/10 text-primary': variant === 'default',
          'bg-secondary text-secondary-foreground': variant === 'secondary',
          'bg-green-100 text-green-700': variant === 'success',
          'bg-destructive/10 text-destructive': variant === 'destructive',
          'bg-amber-100 text-amber-700': variant === 'warning',
          'border border-border text-muted-foreground': variant === 'outline',
        },
        className,
      )}
      {...props}
    />
  )
}
