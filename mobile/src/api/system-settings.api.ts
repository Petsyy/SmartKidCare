import { apiClient } from "./client";

export type SystemSettings = {
  schoolName: string;
  address: string;
};

export const getSystemSettings = async (): Promise<SystemSettings> => {
  const data = await apiClient<{ data: SystemSettings }>(
    "/settings",
    { method: "GET" }
  );
  return data.data;
};
