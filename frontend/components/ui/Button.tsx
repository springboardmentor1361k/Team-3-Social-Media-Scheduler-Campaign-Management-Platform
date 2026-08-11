"use client";

import React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, string> = {
  primary:   "bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-400 hover:to-indigo-400 shadow-[0_4px_16px_rgba(168,85,247,0.22)] border border-transparent",
  secondary: "bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10 shadow-sm",
  ghost:     "bg-transparent text-white/45 hover:bg-white/5 hover:text-white border border-transparent",
  danger:    "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:from-red-400 hover:to-rose-400 shadow-[0_4px_12px_rgba(239,68,68,0.2)] border border-transparent",
  outline:   "bg-transparent text-violet-400 hover:bg-violet-500/10 border border-violet-500/30 hover:border-violet-500/40",
};

const sizeStyles: Record<Size, string> = {
  sm: "text-xs  px-3   py-1.5 rounded-lg  gap-1.5 h-8",
  md: "text-sm  px-4   py-2   rounded-xl  gap-2   h-10",
  lg: "text-[15px] font-bold px-5 rounded-xl gap-2 h-12 tracking-wide",
};

export default function Button({ variant = "primary", size = "md", loading = false, leftIcon, rightIcon, fullWidth = false, disabled, className = "", children, ...props }: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      disabled={isDisabled}
      className={["inline-flex items-center justify-center font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 cursor-pointer select-none", variantStyles[variant], sizeStyles[size], fullWidth ? "w-full" : "", isDisabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "", className].join(" ")}
      {...props}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin-slow shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}
