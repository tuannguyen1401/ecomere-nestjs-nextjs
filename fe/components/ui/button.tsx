import * as React from "react";
import { cn } from "@/utils/cn";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background cursor-pointer select-none",
          {
            "bg-violet-600 text-white hover:bg-violet-700 shadow-sm active:scale-[0.98] transition-transform": variant === "default",
            "bg-red-600 text-white hover:bg-red-750 shadow-sm active:scale-[0.98] transition-transform": variant === "destructive",
            "border border-zinc-200 dark:border-zinc-800 bg-transparent hover:bg-zinc-155 dark:hover:bg-zinc-900 text-zinc-900 dark:text-zinc-50 active:scale-[0.98] transition-all":
              variant === "outline",
            "bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-850":
              variant === "secondary",
            "hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100": variant === "ghost",
            "underline-offset-4 hover:underline text-violet-600 dark:text-violet-400": variant === "link",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-10 w-10": size === "icon",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
