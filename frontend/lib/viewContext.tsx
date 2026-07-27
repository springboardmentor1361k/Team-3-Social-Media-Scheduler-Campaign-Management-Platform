"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRole, hasAccess } from "@/lib/roleStore";
import { usePathname } from "next/navigation";

interface ViewContextValue {
  activeView: string;
  setView: (view: string) => void;
}

export const ViewContext = createContext<ViewContextValue>({
  activeView: "dashboard",
  setView: () => {},
});

export function useView() {
  return useContext(ViewContext);
}

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [activeView, setActiveView] = useState("dashboard");
  const role = useRole();
  const pathname = usePathname();

  const setView = useCallback((view: string) => {
    const target = hasAccess(role, view) ? view : "dashboard";
    setActiveView(target);
  }, [role]);

  // Sync activeView with the current pathname
  useEffect(() => {
    if (pathname) {
      const view = pathname.split("/").pop(); // Get the last part of pathname
      if (view && hasAccess(role, view)) {
        setActiveView(view);
      } else {
        setActiveView("dashboard");
      }
    }
  }, [pathname, role]);

  return (
    <ViewContext.Provider value={{ activeView, setView }}>
      {children}
    </ViewContext.Provider>
  );
}
