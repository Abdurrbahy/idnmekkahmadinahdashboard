import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default:
          "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm active:scale-[0.99]",
        destructive:
          "bg-red-500 text-white hover:bg-red-600 shadow-sm",
        outline:
          "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50 hover:border-neutral-300 shadow-xs",
        secondary:
          "bg-neutral-100 text-neutral-800 hover:bg-neutral-200",
        ghost:
          "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900",
        link:
          "text-neutral-900 underline-offset-4 hover:underline p-0 h-auto",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base font-semibold",
        icon: "h-9 w-9 p-0",
        xsIcon: "h-7 w-7 p-0 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
