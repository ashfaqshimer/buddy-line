import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const inputVariants = cva(
  "w-full border border-white/[0.08] bg-background text-sm text-white placeholder-zinc-500 transition-all focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      shape: {
        pill: "rounded-lg px-4 py-2.5",
        rounded: "rounded-xl px-3.5 py-2.5",
      },
    },
    defaultVariants: {
      shape: "pill",
    },
  }
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, shape, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ shape }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";
