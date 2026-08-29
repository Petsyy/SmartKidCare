import { getProfile } from "@/src/api/authentication.api";
import ProfileScreen from "@/src/features/profile/screens/profile-screen";

export default function TeacherProfileScreen() {
  return (
    <ProfileScreen
      role="teacher"
      roleLabel="Child Development Worker"
      fetchProfile={getProfile}
      showAssignedCenter={true}
    />
  );
}
