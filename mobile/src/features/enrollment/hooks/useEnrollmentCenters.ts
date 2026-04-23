import { useQuery } from "@tanstack/react-query";
import {
  getEnrollmentCenters,
  type EnrollmentCenterOption,
} from "@/src/api/teacher.api";
import { getProfile } from "@/src/api/authentication.api";
import { useAuth } from "@/src/hooks/use-auth";

export const useEnrollmentCenters = () => {
  const { isAuthenticated } = useAuth();

  const { data, isLoading: loadingCenters } = useQuery({
    queryKey: ["enrollmentCenters"],
    queryFn: async () => {
      const [profileResult, centersResult] = await Promise.allSettled([
        getProfile(),
        getEnrollmentCenters(),
      ]);

      if (profileResult.status === "rejected" && centersResult.status === "rejected") {
        throw new Error(
          profileResult.reason?.message || centersResult.reason?.message || "Failed to load assigned centers.",
        );
      }

      const profile = profileResult.status === "fulfilled" ? profileResult.value : null;
      const centers = centersResult.status === "fulfilled" ? centersResult.value : [];

      const activeCenters = centers.filter(
        (center: EnrollmentCenterOption) => center.isActive !== false,
      );
      const profileCenterRaw = profile?.daycareCenter;
      const profileCenterId =
        typeof profileCenterRaw === "string" ? profileCenterRaw : String(profileCenterRaw?._id || "");
      const profileCenterOption =
        profileCenterRaw && typeof profileCenterRaw === "object"
          ? {
              _id: String(profileCenterRaw._id || ""),
              name: String(profileCenterRaw.name || ""),
              barangay: String(profileCenterRaw.barangay || ""),
              code: String(profileCenterRaw.code || ""),
              isActive: profileCenterRaw.isActive !== false,
            }
          : null;

      const assignedTeacherCenter =
        profileCenterRaw && typeof profileCenterRaw === "object"
          ? { name: String(profileCenterRaw.name || ""), barangay: String(profileCenterRaw.barangay || "") }
          : null;

      const mergedCenters = [...activeCenters];
      if (profileCenterOption?._id && !mergedCenters.some((center) => center._id === profileCenterOption._id)) {
        mergedCenters.unshift(profileCenterOption);
      }

      return { enrollmentCenters: mergedCenters, assignedTeacherCenterId: profileCenterId, assignedTeacherCenter };
    },
    enabled: isAuthenticated,
  });

  const enrollmentCenters = data?.enrollmentCenters || [];
  const assignedTeacherCenterId = data?.assignedTeacherCenterId || "";
  const assignedTeacherCenter = data?.assignedTeacherCenter || null;

  const getDefaultCenterId = (selectedId: string) => {
    if (selectedId && enrollmentCenters.some((center) => center._id === selectedId)) return selectedId;
    if (assignedTeacherCenterId && enrollmentCenters.some((center) => center._id === assignedTeacherCenterId))
      return assignedTeacherCenterId;
    return enrollmentCenters[0]?._id || "";
  };

  return { enrollmentCenters, assignedTeacherCenterId, assignedTeacherCenter, loadingCenters, getDefaultCenterId };
};
