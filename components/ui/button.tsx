import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Thin wrapper over the `.btn` component classes in app/globals.css. */
export const buttonVariants = cva("btn", {
  variants: {
    variant: {
      default: "btn-primary",
      brand: "btn-brand",
      social: "btn-social",
      secondary: "btn-secondary",
      ghost: "btn-ghost",
      destructive: "btn-danger",
    },
    size: {
      default: "",
      sm: "btn-sm",
      lg: "btn-lg",
      icon: "!size-9 !p-0",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
