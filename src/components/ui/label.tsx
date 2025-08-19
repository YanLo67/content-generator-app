import React from "react";

export const Label = ({
  className = "",
  children,
  htmlFor,
}: {
  className?: string;
  children: React.ReactNode;
  htmlFor?: string;
}) => (
  <label htmlFor={htmlFor} className={`font-medium block mb-1 ${className}`}>
    {children}
  </label>
);
