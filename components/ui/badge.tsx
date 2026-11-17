import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Thin wrapper over the `.tag` component classes in app/globals.css. */
export const badgeVariants = cva("tag", {
  variants: {
    variant: {
      default: "tag-play",
      social: "tag-social",
      amber: "tag-admin",
      secondary: "tag-muted",
      destructive: "bg-rose-500/10 text-rose-300",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
