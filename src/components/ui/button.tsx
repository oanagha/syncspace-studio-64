import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative overflow-hidden inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold cursor-pointer transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
        hero: "gradient-brand text-primary-foreground shadow-glow hover:-translate-y-0.5 hover:brightness-110",
        glass: "glass text-foreground hover:-translate-y-0.5 hover:shadow-soft",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-border bg-card shadow-sm hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary",
        secondary: "bg-primary-soft text-primary hover:bg-primary-soft/70",
        ghost: "hover:bg-muted hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-12 rounded-2xl px-7 text-[0.95rem]",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onPointerDown, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
      const target = e.currentTarget as HTMLElement;
      if (target?.getBoundingClientRect) {
        const rect = target.getBoundingClientRect();
        const ripple = document.createElement("span");
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `position:absolute;left:${e.clientX - rect.left - size / 2}px;top:${
          e.clientY - rect.top - size / 2
        }px;width:${size}px;height:${size}px;border-radius:9999px;background:currentColor;opacity:.22;pointer-events:none;transform:scale(0);animation:ripple-out .6s ease-out forwards;`;
        target.appendChild(ripple);
        setTimeout(() => ripple.remove(), 620);
      }
      onPointerDown?.(e);
    };
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        onPointerDown={handlePointerDown}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
