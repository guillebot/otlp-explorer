import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium ring-offset-bg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-accent-fg hover:bg-accent/90 shadow-[0_1px_0_0_hsl(0_0%_100%_/_0.12)_inset,_0_1px_2px_hsl(220_70%_5%_/_0.4)]',
        secondary: 'bg-elevated text-fg border border-border hover:border-muted/40 hover:bg-elevated/70',
        ghost: 'text-fg hover:bg-elevated/70',
        outline: 'border border-border bg-transparent hover:bg-elevated/60',
        danger: 'bg-danger/90 text-white hover:bg-danger shadow-[0_0_0_1px_hsl(var(--danger)/_0.4)_inset]',
        subtle: 'text-muted hover:text-fg hover:bg-elevated/60',
      },
      size: {
        default: 'h-9 px-3.5',
        sm: 'h-7 px-2.5 text-xs',
        lg: 'h-11 px-5',
        icon: 'h-9 w-9',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = 'Button'

export { buttonVariants }
