import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/src/api/authentication.api";
import { useAuth } from "@/src/hooks/use-auth";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import type { EnrollmentCenterOption } from "@/src/api/api.types";

export const useEnrollmentCenters = () => {
  const { isAuthenticated } = useAuth();

  const {
    data: profile,
    isLoading: loadingCenters,
    error,
  } = useQuery({
    queryKey: mobileQueryKeys.profile("teacher"),
    queryFn: getProfile,
    enabled: isAuthenticated,
  });

  const profileCenter = profile?.daycareCenter;
  const assignedCenter: EnrollmentCenterOption | null =
    profileCenter && typeof profileCenter === "object"
      ? {
          _id: String(profileCenter._id || ""),
          name: String(profileCenter.name || ""),
          barangay: String(profileCenter.barangay || ""),
          code: String(profileCenter.code || ""),
          isActive: profileCenter.isActive !== false,
        }
      : null;

  const assignedCenterId =
    typeof profileCenter === "string"
      ? profileCenter
      : assignedCenter?._id || String(profile?.daycareCenterId || "");

  return {
    assignedCenter,
    assignedCenterId,
    loadingCenters,
    centerError: error instanceof Error ? error.message : null,
  };
};
