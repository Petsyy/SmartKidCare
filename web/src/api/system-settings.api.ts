import { apiRequestOrThrow } from "./api-client";

export type SystemSettings = {
  schoolName: string;
  address: string;
};

export const getSystemSettings = async (): Promise<SystemSettings> => {
  const data = await apiRequestOrThrow<{ data: SystemSettings }>(
    "/settings",
    "Failed to fetch system settings",
  );
  return data.data;
};

export const updateSystemSettings = async (
  payload: Partial<SystemSettings>,
): Promise<SystemSettings> => {
  const data = await apiRequestOrThrow<{ data: SystemSettings }>(
    "/settings",
    "Failed to update system settings",
    {
      method: "PUT",
      body: payload,
    },
  );
  return data.data;
};
