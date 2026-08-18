import { useCallback } from "react";
import { Alert } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  submitChildEnrollmentRequest,
} from "@/src/api/teacher.api";
import { inferMimeType } from "@/src/features/enrollment/utils/enrollment-utils";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useAuth } from "@/src/hooks/use-auth";

interface SubmissionData {
  childData: {
    firstName: string; middleName?: string; lastName: string;
    dateOfBirth: string; age: number; gender: "male" | "female";
    homeAddress: string;
    programType: string; daycareCenterId: string; enrollmentDate: string; schoolYear: string;
    weight: number; height: number;
  };
  parentData: {
    parentFirstName: string; parentMiddleName?: string; parentLastName: string;
    parentPhone: string;
    parentRelationship: "Mother" | "Father" | "Guardian" | "Grandparent" | "Other";
  };
  documentData: {
    birthCertificate: { uri: string; name: string; mimeType: string } | null;
    parentId: { uri: string; name: string; mimeType: string } | null;
  };
}

export const useEnrollmentSubmit = (onSuccess?: () => void) => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const submitEnrollmentMutation = useMutation({
    mutationFn: async ({ data }: { data: SubmissionData }) => {
      if (!isAuthenticated) throw new Error("No authentication token.");
      return submitChildEnrollmentRequest(
        { ...data.childData, programType: data.childData.programType as "4Ps Beneficiary" | "Regular Enrollee (Non-beneficiary)", ...data.parentData },
        {
          birthCertificate: data.documentData.birthCertificate
            ? { uri: data.documentData.birthCertificate.uri, name: data.documentData.birthCertificate.name, mimeType: data.documentData.birthCertificate.mimeType || inferMimeType(data.documentData.birthCertificate.name || "") || "application/octet-stream" }
            : null,
          parentId: data.documentData.parentId
            ? { uri: data.documentData.parentId.uri, name: data.documentData.parentId.name, mimeType: data.documentData.parentId.mimeType || inferMimeType(data.documentData.parentId.name || "") || "application/octet-stream" }
            : null,
        },
      );
    },
  });

  const submitEnrollment = useCallback(
    async (data: SubmissionData) => {
      try {
        const submission = await submitEnrollmentMutation.mutateAsync({ data });
        await queryClient.invalidateQueries({ queryKey: mobileQueryKeys.submittedRequests() });

        const credentials = submission.parentCredentials;
        const submittedEmail = credentials?.email || "Unavailable";
        const generatedPassword = credentials?.tempPassword;
        const credentialMessage = generatedPassword
          ? `Login Email: ${submittedEmail}\nTemporary Password: ${generatedPassword}\n\nThe parent must create a new password during first login.`
          : `Login Email: ${submittedEmail}\n\nParent account already exists. Use the current password.`;

        Alert.alert("Submitted", `Enrollment request submitted successfully.\n\n${credentialMessage}`, [
          { text: "View Submitted Requests", onPress: () => { onSuccess?.(); } },
        ]);
      } catch (error: any) {
        Alert.alert("Submission Error", error?.message || "Failed to submit enrollment request.");
      }
    },
    [submitEnrollmentMutation, queryClient, onSuccess],
  );

  return {
    isSubmitting: submitEnrollmentMutation.isPending,
    submitEnrollment,
  };
};
