import React from 'react';
import { cn } from "@/lib/utils";

const Input = ({ className, ...props }: React.ComponentProps<"input">) => {
  return (
    <input
        className={cn("text-sm border-1 border-(--dark) py-[0.375rem] px-3 outline-none", className)}
        {...props}
    />
  )
}

export default Input;
