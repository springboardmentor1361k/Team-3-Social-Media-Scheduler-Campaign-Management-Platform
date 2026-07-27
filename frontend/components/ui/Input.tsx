"use client";

import React, { forwardRef, useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  dark?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, dark = false, type, className = "", id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (showPassword ? "text" : "password") : type;
    const baseClass = dark ? "sp-input sp-input-dark" : "sp-input";
    const errorClass = error ? "error" : "";
    const iconColor = dark ? "text-white/35" : "text-gray-400";

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className={`text-[13px] font-semibold tracking-wide ${dark ? "text-white/70" : "text-gray-600"}`}>
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span aria-hidden="true" className={`absolute left-0 top-[50%] -translate-y-1/2 w-[52px] h-11 flex items-center justify-center pointer-events-none ${iconColor}`}>
              {leftIcon}
            </span>
          )}
          <input
            ref={ref} id={id} type={inputType}
            className={[baseClass, errorClass, className].filter(Boolean).join(" ")}
            style={{ paddingLeft: leftIcon ? "52px" : undefined, paddingRight: isPassword ? "44px" : undefined }}
            {...props}
          />
          {isPassword && (
            <button type="button" onClick={() => setShowPassword((v) => !v)}
              className={`absolute right-0 top-[50%] -translate-y-1/2 w-11 h-11 flex items-center justify-center transition-colors ${dark ? "text-white/35 hover:text-white/70" : "text-gray-400 hover:text-gray-600"}`}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        {error && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-red-500 mt-0.5">
            <AlertCircle size={12} />{error}
          </p>
        )}
        {hint && !error && (
          <p className={`text-[11px] leading-relaxed ${dark ? "text-white/35" : "text-gray-400"}`}>{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
