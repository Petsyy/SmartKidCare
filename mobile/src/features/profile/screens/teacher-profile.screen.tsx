import { getTeacherProfile } from "@/src/api/teacher.api";
import ProfileScreen from "@/src/features/profile/screens/profile.screen";

export default function TeacherProfileScreen() {
  return (
    <ProfileScreen
      role="teacher"
      roleLabel="Child Development Worker"
      fetchProfile={getTeacherProfile}
      showAssignedCenter={true}
    />
  );
}
