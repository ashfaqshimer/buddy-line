import * as React from "react";
import { cn } from "@/lib/utils";

/** Thin wrapper over the `.field` component class in app/globals.css. */
export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return <input className={cn("field", className)} ref={ref} {...props} />;
  }
);
Input.displayName = "Input";
