import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-teal-400/10 text-teal-300 border border-teal-400/20",
        solid:
          "bg-teal-400 text-zinc-950 font-semibold",
        amber:
          "bg-amber-400/10 text-amber-300 border border-amber-400/20",
        secondary:
          "bg-white/[0.04] text-zinc-300 border border-white/[0.06]",
        outline:
          "border border-white/[0.1] text-zinc-400",
        destructive:
          "bg-rose-500/10 text-rose-300 border border-rose-500/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
