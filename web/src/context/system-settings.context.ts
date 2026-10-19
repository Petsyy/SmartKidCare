import { createContext, useContext } from "react";
import type { SystemSettings } from "../api/system-settings.api";

export type SystemSettingsContextType = {
  settings: SystemSettings | null;
  loading: boolean;
  refreshSettings: () => Promise<void>;
};

export const SystemSettingsContext = createContext<
  SystemSettingsContextType | undefined
>(undefined);

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext);
  if (context === undefined) {
    throw new Error(
      "useSystemSettings must be used within a SystemSettingsProvider",
    );
  }
  return context;
};
