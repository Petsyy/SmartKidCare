import { useEffect, useState } from "react";
import {
  getSystemSettings,
  type SystemSettings,
} from "@/features/settings";
import { SystemSettingsContext } from "./system-settings.context";

export const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const data = await getSystemSettings();
      setSettings(data);
    } catch (error) {
      console.error("Failed to load system settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SystemSettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
};
