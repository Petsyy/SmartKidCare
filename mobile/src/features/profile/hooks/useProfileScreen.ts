import { useMemo } from "react";
import { Alert } from "react-native";
import { useRouter, useFocusEffect, usePathname } from "expo-router";
import { useAuthContext } from "@/src/context/auth-context";
import { useAuth } from "@/src/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useProfileUiStore } from "@/src/features/profile/stores/profile-ui.store";
import { useTeacherUiStore } from "@/src/features/teacher/stores/teacher-ui.store";
import { useChangePassword } from "./useChangePassword";

export type ProfileRole = "parent" | "teacher";

export type UserProfile = {
  id: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email: string;
  role: string;
  phone?: string;
  employeeId?: string;
  isActive?: boolean;
  daycareCenter?:
    | { _id?: string; name?: string; barangay?: string; code?: string; isActive?: boolean }
    | string
    | null;
  assignedCenter?: string;
};

type Params = {
  fetchProfile: () => Promise<UserProfile>;
};

export function useProfileScreen({ fetchProfile }: Params) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuthContext();
  const { isAuthenticated } = useAuth();
  
  const profileRole: ProfileRole = pathname.includes("(teacher)") ? "teacher" : "parent";

  const {
    data: profile = null,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: mobileQueryKeys.profile(profileRole),
    enabled: isAuthenticated,
    queryFn: () => fetchProfile(),
  });

  const { showPasswordModal, showHelpModal, setShowPasswordModal, setShowHelpModal } = useProfileUiStore();
  const resetTeacherUi = useTeacherUiStore((state) => state.resetTeacherUi);
  const passwordManager = useChangePassword(() => setShowPasswordModal(false));

  useFocusEffect(
    useMemo(
      () => () => { void refetch(); },
      [refetch],
    ),
  );

  const handleLogout = () => {
    Alert.alert("Confirm Logout", "Are you sure you want to logout?", [
      { text: "Cancel", onPress: () => {}, style: "cancel" },
      {
        text: "Logout",
        onPress: async () => {
          resetTeacherUi();
          logout();
          router.push("/(auth)/login");
        },
        style: "destructive",
      },
    ]);
  };

  return {
    profile, loading, showPasswordModal, setShowPasswordModal,
    showHelpModal, setShowHelpModal, handleLogout, ...passwordManager,
  };
}
