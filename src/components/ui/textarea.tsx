import React from "react";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea ref={ref} className={`w-full ${className}`} {...props} />
));

Textarea.displayName = "Textarea";
