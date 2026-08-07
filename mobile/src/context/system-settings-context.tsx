import { createContext, useContext } from "react";
import { getSystemSettings } from "../api/system-settings.api";
import type { SystemSettings } from "../api/system-settings.api";
import { useQuery } from "@tanstack/react-query";

type SystemSettingsContextType = {
  settings: SystemSettings | undefined;
  loading: boolean;
};

const SystemSettingsContext = createContext<SystemSettingsContextType | undefined>(undefined);

export const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: settings, isLoading: loading } = useQuery({
    queryKey: ["system-settings"],
    queryFn: getSystemSettings,
  });

  return (
    <SystemSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error("useSystemSettings must be used within a SystemSettingsProvider");
  }
  return context;
};
