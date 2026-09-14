import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import { NewEnrollmentForm } from "@/src/features/enrollment/components/sections/new-enrollment-form";
import { useNavigation, useRouter } from "expo-router";
import { ScreenShell, ScreenHeader } from "@/src/components/ui";

export default function EnrollChildScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const contentMaxWidth = isWide ? 860 : undefined;
  const contentPadding = isWide ? 28 : 16;

  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    (navigation as any).setParams({ hideTabBar: hasStarted });
  }, [hasStarted, navigation]);

  function handleSubmitSuccess() {
    setHasStarted(false);
    router.replace("/(teacher)/children");
  }

  return (
    <ScreenShell edges={hasStarted ? ["bottom"] : []}>
      <ScreenHeader
        backgroundVariant="teacherGradient"
        title="Child Enrollment"
        subtitle="Directly enroll a new child"
      />

      <NewEnrollmentForm
        hasStarted={hasStarted}
        setHasStarted={setHasStarted}
        onSubmissionSuccess={handleSubmitSuccess}
        contentPadding={contentPadding}
        contentMaxWidth={contentMaxWidth}
        isWide={isWide}
      />
    </ScreenShell>
  );
}
