"use client";

import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "positive" | "negative" | "neutral" | "info" | "warning";
  size?: "sm" | "md";
  className?: string;
}

const variantStyles = {
  positive: "text-emerald-700 bg-emerald-50 border-emerald-100",
  negative: "text-red-600    bg-red-50    border-red-100",
  neutral:  "text-gray-600   bg-gray-100  border-gray-200",
  info:     "text-blue-700   bg-blue-50   border-blue-100",
  warning:  "text-amber-700  bg-amber-50  border-amber-100",
};

const sizeStyles = {
  sm: "text-[11px] px-1.5 py-0.5",
  md: "text-xs     px-2   py-1",
};

export default function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1 font-semibold rounded-full border",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
