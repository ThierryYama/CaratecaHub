import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type SidebarContextType = {
  isCollapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'ui.sidebar.collapsed';

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'true') return true;
      if (raw === 'false') return false;
    } catch {}
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return true;
    return false;
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, String(isCollapsed)); } catch {}
  }, [isCollapsed]);

  const api = useMemo(() => ({
    isCollapsed,
    setCollapsed: setIsCollapsed,
    toggle: () => setIsCollapsed(v => !v),
  }), [isCollapsed]);

  return (
    <SidebarContext.Provider value={api}>{children}</SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
};
