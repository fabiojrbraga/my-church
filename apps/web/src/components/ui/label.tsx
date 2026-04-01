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
        className={cn('block text-sm font-medium text-foreground leading-none', className)}
        {...props}
      >
        {children}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
    )
  },
)
Label.displayName = 'Label'
