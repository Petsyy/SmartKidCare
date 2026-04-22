import { useQuery } from "@tanstack/react-query";
import {
  getEnrollmentCenters,
  getTeacherProfile,
  type EnrollmentCenterOption,
} from "@/src/api/teacher.api";

export const useEnrollmentCenters = (token: string | null) => {
  const { data, isLoading: loadingCenters } = useQuery({
    queryKey: ["enrollmentCenters"],
    queryFn: async () => {
      if (!token) return null;

      const [profileResult, centersResult] = await Promise.allSettled([
        getTeacherProfile(token),
        getEnrollmentCenters(token),
      ]);

      if (
        profileResult.status === "rejected" &&
        centersResult.status === "rejected"
      ) {
        throw new Error(
          profileResult.reason?.message ||
            centersResult.reason?.message ||
            "Failed to load assigned centers.",
        );
      }

      const profile =
        profileResult.status === "fulfilled" ? profileResult.value : null;
      const centers =
        centersResult.status === "fulfilled" ? centersResult.value : [];

      const activeCenters = centers.filter(
        (center: EnrollmentCenterOption) => center.isActive !== false,
      );
      const profileCenterRaw = profile?.daycareCenter;
      const profileCenterId =
        typeof profileCenterRaw === "string"
          ? profileCenterRaw
          : String(profileCenterRaw?._id || "");
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
          ? {
              name: String(profileCenterRaw.name || ""),
              barangay: String(profileCenterRaw.barangay || ""),
            }
          : null;

      const mergedCenters = [...activeCenters];
      if (
        profileCenterOption?._id &&
        !mergedCenters.some((center) => center._id === profileCenterOption._id)
      ) {
        mergedCenters.unshift(profileCenterOption);
      }

      return {
        enrollmentCenters: mergedCenters,
        assignedTeacherCenterId: profileCenterId,
        assignedTeacherCenter,
      };
    },
    enabled: !!token,
  });

  const enrollmentCenters = data?.enrollmentCenters || [];
  const assignedTeacherCenterId = data?.assignedTeacherCenterId || "";
  const assignedTeacherCenter = data?.assignedTeacherCenter || null;

  const getDefaultCenterId = (selectedId: string) => {
    if (
      selectedId &&
      enrollmentCenters.some((center) => center._id === selectedId)
    ) {
      return selectedId;
    }
    if (
      assignedTeacherCenterId &&
      enrollmentCenters.some((center) => center._id === assignedTeacherCenterId)
    ) {
      return assignedTeacherCenterId;
    }
    return enrollmentCenters[0]?._id || "";
  };

  return {
    enrollmentCenters,
    assignedTeacherCenterId,
    assignedTeacherCenter,
    loadingCenters,
    getDefaultCenterId,
  };
};
