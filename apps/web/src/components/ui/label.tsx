import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn('block text-[13px] font-semibold tracking-tight text-foreground leading-none', className)}
        {...props}
      >
        {children}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </label>
    )
  },
)
Label.displayName = 'Label'
