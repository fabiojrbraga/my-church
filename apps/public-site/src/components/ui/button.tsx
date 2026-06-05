import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'focus-ring inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/92 hover:shadow-xl hover:shadow-primary/25 active:translate-y-px',
        secondary:
          'bg-surface text-foreground shadow-sm shadow-slate-950/5 ring-1 ring-border/60 hover:bg-surface-alt',
        outline:
          'border border-border/70 bg-background/70 text-foreground hover:bg-surface hover:border-border',
        ghost:
          'text-foreground hover:bg-secondary/80 hover:text-foreground',
        destructive:
          'bg-destructive text-destructive-foreground shadow-lg shadow-destructive/20 hover:bg-destructive/92',
        soft:
          'bg-primary/10 text-primary hover:bg-primary/15',
      },
      size: {
        sm: 'h-9 px-3.5 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-5 text-sm sm:text-base',
        icon: 'h-10 w-10 rounded-xl p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  },
)

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    const content = asChild ? (
      children
    ) : (
      <>
        {loading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </>
    )

    return (
      <Comp
        ref={ref}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {content}
      </Comp>
    )
  },
)
Button.displayName = 'Button'
