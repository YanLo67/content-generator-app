import React from "react";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea
    ref={ref}
    className={`border rounded px-3 py-2 w-full ${className}`}
    {...props}
  />
));

Textarea.displayName = "Textarea";
