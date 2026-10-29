import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all duration-300 transform active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-teal-400 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-teal-400 to-teal-500 text-slate-950 shadow-[0_0_20px_rgba(45,212,191,0.25)] hover:shadow-[0_0_30px_rgba(45,212,191,0.45)]",
        outline:
          "border border-teal-400/25 bg-teal-400/8 text-teal-300 hover:bg-teal-400/15 hover:border-teal-400/40",
        ghost:
          "text-slate-400 hover:text-white hover:bg-white/[0.06]",
        secondary:
          "border border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white",
        destructive:
          "border border-rose-500/25 bg-rose-500/10 text-rose-300 hover:bg-rose-500 hover:text-white",
      },
      size: {
        default: "h-9 px-5 py-2 text-xs",
        sm: "h-8 px-3.5 text-[11px]",
        lg: "h-11 px-6 text-sm",
        icon: "size-8 p-0",
      },
      shape: {
        pill: "rounded-full",
        rounded: "rounded-xl",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "pill",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
