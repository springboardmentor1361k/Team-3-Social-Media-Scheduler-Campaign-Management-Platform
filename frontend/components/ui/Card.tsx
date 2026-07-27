"use client";

import React from "react";

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  positive?: boolean | null;
  icon: React.ReactNode;
  className?: string;
  delay?: number;
}

export function StatCard({
  label,
  value,
  trend,
  positive,
  icon,
  className = "",
  delay = 0,
}: StatCardProps) {
  const isPositive = positive === true;
  const isNegative = positive === false;

  // Icon bg gradient
  const iconBg = isPositive
    ? "bg-gradient-to-br from-violet-400 to-indigo-500 text-white shadow-lg shadow-violet-500/10"
    : isNegative
    ? "bg-gradient-to-br from-red-500  to-rose-600   text-white shadow-lg shadow-red-500/10"
    : "bg-gradient-to-br from-gray-600 to-gray-700   text-white shadow-lg shadow-white/5";

  // Trend chip
  const trendBg   = isPositive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
                  : isNegative ? "bg-rose-500/10    text-rose-400    border-rose-500/10"
                  :              "bg-white/5         text-white/40    border-white/5";
  const trendIcon = isPositive ? "↑" : isNegative ? "↓" : "–";

  return (
    <div
      className={[
        "stat-card dash-card p-5 animate-fade-in-up group h-full flex flex-col justify-between select-none",
        className,
      ].join(" ")}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
            {icon}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${trendBg} flex items-center gap-0.5`}>
            <span>{trendIcon}</span>
            <span>{trend}</span>
          </span>
        </div>
        <p className="text-2xl font-black text-white leading-none mb-1.5 tracking-tight">{value}</p>
        <p className="text-[13px] text-white/65 font-semibold tracking-wide">{label}</p>
      </div>
      {/* Subtle bottom accent bar */}
      <div className={`mt-4 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
        isPositive ? "bg-gradient-to-r from-violet-400 to-indigo-400"
        : isNegative ? "bg-gradient-to-r from-red-400 to-rose-400"
        : "bg-gradient-to-r from-white/10 to-white/20"
      }`} />
    </div>
  );
}


interface ContentCardProps {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}

export function ContentCard({
  title,
  action,
  children,
  className = "",
  noPad = false,
}: ContentCardProps) {
  return (
    <div
      className={[
        "dash-card overflow-hidden h-full flex flex-col",
        noPad ? "" : "p-6",
        className,
      ].join(" ")}
    >
      {(title || action) && (
        <div className={`flex items-center justify-between shrink-0 ${noPad ? "px-6 pt-6 mb-4" : "mb-5"}`}>
          {title && (
            <h2 className="text-xs font-bold text-white/65 uppercase tracking-wider">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
