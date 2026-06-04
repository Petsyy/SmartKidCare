import { getProfile } from "@/src/api/authentication.api";
import ProfileScreen from "@/src/features/profile/screens/profile.screen";

export default function ParentProfileScreen() {
  return (
    <ProfileScreen
      role="parent"
      roleLabel="Parent"
      fetchProfile={getProfile}
      showAssignedCenter={false}
    />
  );
}
