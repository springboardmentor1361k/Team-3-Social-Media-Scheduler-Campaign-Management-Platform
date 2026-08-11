"use client";

import React from "react";

interface AvatarProps {
  name: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  color?: string;
  src?: string;
  className?: string;
  onClick?: () => void;
}

const sizes = {
  xs:  { container: "w-6 h-6",   font: "text-[10px]" },
  sm:  { container: "w-8 h-8",   font: "text-xs"     },
  md:  { container: "w-10 h-10", font: "text-sm"      },
  lg:  { container: "w-12 h-12", font: "text-base"    },
  xl:  { container: "w-16 h-16", font: "text-xl"      },
  "2xl": { container: "w-24 h-24", font: "text-3xl"   },
};

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function Avatar({ name, size = "md", color = "#7c3aed", src, className = "", onClick }: AvatarProps) {
  const { container, font } = sizes[size];
  const initials = getInitials(name);

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} onClick={onClick}
        className={[container, "rounded-full object-cover ring-2 ring-white shadow-sm", onClick ? "cursor-pointer" : "", className].join(" ")}
      />
    );
  }

  return (
    <div onClick={onClick} role={onClick ? "button" : undefined}
      className={[container, "rounded-full flex items-center justify-center font-bold text-white ring-2 ring-white shadow-sm shrink-0 select-none", font, onClick ? "cursor-pointer hover:opacity-90 transition-opacity" : "", className].join(" ")}
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
}
