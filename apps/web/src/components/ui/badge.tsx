import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors',
  {
    variants: {
      variant: {
        default: 'border-primary/15 bg-primary/10 text-primary',
        secondary: 'border-border/60 bg-secondary/75 text-secondary-foreground',
        success: 'border-success/15 bg-success/10 text-success',
        destructive: 'border-destructive/15 bg-destructive/10 text-destructive',
        warning: 'border-warning/15 bg-warning/10 text-warning-foreground',
        info: 'border-info/15 bg-info/10 text-info',
        outline: 'border-border/70 bg-transparent text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
