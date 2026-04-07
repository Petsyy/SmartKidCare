import { getParentProfile } from "@/src/api/parent.api";
import ProfileScreen from "@/src/features/profile/screens/profile.screen";

export default function ParentProfileScreen() {
  return (
    <ProfileScreen
      role="parent"
      roleLabel="Parent"
      fetchProfile={getParentProfile}
      showAssignedCenter={false}
    />
  );
}
