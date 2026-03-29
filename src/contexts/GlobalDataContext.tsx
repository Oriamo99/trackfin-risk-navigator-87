import { createContext, useContext, type ReactNode } from 'react';
import { useGlobalData } from '@/hooks/useGlobalData';

type GlobalDataContextType = ReturnType<typeof useGlobalData>;

const GlobalDataContext = createContext<GlobalDataContextType | null>(null);

export function GlobalDataProvider({ children }: { children: ReactNode }) {
  const globalData = useGlobalData();
  return (
    <GlobalDataContext.Provider value={globalData}>
      {children}
    </GlobalDataContext.Provider>
  );
}

export function useGlobalDataContext(): GlobalDataContextType {
  const ctx = useContext(GlobalDataContext);
  if (!ctx) {
    throw new Error('useGlobalDataContext must be used within a GlobalDataProvider');
  }
  return ctx;
}
