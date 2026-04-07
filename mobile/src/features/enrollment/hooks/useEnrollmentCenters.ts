import { useState, useEffect } from "react";
import { Alert } from "react-native";
import { getEnrollmentCenters, getTeacherProfile, type EnrollmentCenterOption } from "@/src/api/teacher.api";

export const useEnrollmentCenters = (token: string | null) => {
  const [enrollmentCenters, setEnrollmentCenters] = useState<EnrollmentCenterOption[]>([]);
  const [assignedTeacherCenterId, setAssignedTeacherCenterId] = useState("");
  const [assignedTeacherCenter, setAssignedTeacherCenter] = useState<{
    name?: string;
    barangay?: string;
  } | null>(null);
  const [loadingCenters, setLoadingCenters] = useState(false);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const loadCenters = async () => {
      setLoadingCenters(true);
      try {
        const [profileResult, centersResult] = await Promise.allSettled([
          getTeacherProfile(token),
          getEnrollmentCenters(token),
        ]);
        if (!isMounted) return;

        if (profileResult.status === "rejected" && centersResult.status === "rejected") {
          throw new Error(
            profileResult.reason?.message || centersResult.reason?.message || "Failed to load assigned centers."
          );
        }

        const profile = profileResult.status === "fulfilled" ? profileResult.value : null;
        const centers = centersResult.status === "fulfilled" ? centersResult.value : [];

        const activeCenters = centers.filter((center) => center.isActive !== false);
        const profileCenterRaw = profile?.daycareCenter;
        const profileCenterId = typeof profileCenterRaw === "string" ? profileCenterRaw : String(profileCenterRaw?._id || "");
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

        setAssignedTeacherCenter(
          profileCenterRaw && typeof profileCenterRaw === "object"
            ? {
                name: String(profileCenterRaw.name || ""),
                barangay: String(profileCenterRaw.barangay || ""),
              }
            : null
        );

        const mergedCenters = [...activeCenters];
        if (profileCenterOption?._id && !mergedCenters.some((center) => center._id === profileCenterOption._id)) {
          mergedCenters.unshift(profileCenterOption);
        }

        setAssignedTeacherCenterId(profileCenterId);
        setEnrollmentCenters(mergedCenters);
      } catch (error: any) {
        if (!isMounted) return;
        Alert.alert("Load Error", error?.message || "Failed to load assigned centers.");
        setAssignedTeacherCenterId("");
        setAssignedTeacherCenter(null);
        setEnrollmentCenters([]);
      } finally {
        if (isMounted) setLoadingCenters(false);
      }
    };

    void loadCenters();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const getDefaultCenterId = (selectedId: string) => {
    if (selectedId && enrollmentCenters.some((center) => center._id === selectedId)) {
      return selectedId;
    }
    if (assignedTeacherCenterId && enrollmentCenters.some((center) => center._id === assignedTeacherCenterId)) {
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
