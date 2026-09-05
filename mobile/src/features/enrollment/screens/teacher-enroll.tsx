import { useEffect, useState } from "react";
import { useWindowDimensions } from "react-native";
import {
  SubmittedRequestsPanel,
  NewEnrollmentForm,
} from "@/src/features/enrollment/components/sections";
import { EnrollmentTabSwitcher } from "@/src/features/enrollment/components/ui";
import { useNavigation } from "expo-router";
import { ScreenShell, ScreenHeader } from "@/src/components/ui";

export default function EnrollChildScreen() {
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const contentMaxWidth = isWide ? 860 : undefined;
  const contentPadding = isWide ? 28 : 16;

  const [activeTab, setActiveTab] = useState<"new" | "submitted">("new");
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    (navigation as any).setParams({ hideTabBar: hasStarted });
  }, [hasStarted, navigation]);

  function handleSubmitSuccess() {
    setHasStarted(false);
    setActiveTab("submitted");
  }

  return (
    <ScreenShell edges={hasStarted ? ["bottom"] : []}>
      <ScreenHeader
        backgroundVariant="teacherGradient"
        title="Child Enrollment"
        subtitle="Submit and track enrollment requests"
        onBack={
          hasStarted
            ? undefined
            : undefined
        }
      />

      {!hasStarted ? (
        <EnrollmentTabSwitcher activeTab={activeTab} onChange={setActiveTab} />
      ) : null}

      {activeTab === "new" ? (
        <NewEnrollmentForm
          hasStarted={hasStarted}
          setHasStarted={setHasStarted}
          onSubmissionSuccess={handleSubmitSuccess}
          contentPadding={contentPadding}
          contentMaxWidth={contentMaxWidth}
          isWide={isWide}
        />
      ) : (
        <SubmittedRequestsPanel
          contentPadding={contentPadding}
          contentMaxWidth={contentMaxWidth}
        />
      )}
    </ScreenShell>
  );
}
