import React from 'react';
import { cn } from "@/lib/utils";

const Button = ({ className, children, type = "button", ...props }: React.ComponentProps<"button">) => {
  return (
    <button
      type={type}
      className={cn("bg-(--dark) text-(--white) cursor-pointer border-0 rounded-sm py-[0.375rem] px-3 text-base font-semibold tracking-[0.015em] hover:bg-[#2e4067] transition-colors duration-150 ease-out disabled:opacity-60 disabled:cursor-not-allowed", className)}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button;
