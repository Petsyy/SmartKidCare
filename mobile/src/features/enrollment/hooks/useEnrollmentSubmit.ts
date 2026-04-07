import { useState, useCallback } from "react";
import { Alert } from "react-native";
import * as Clipboard from "expo-clipboard";
import {
  submitChildEnrollmentRequest,
  getEnrollmentRequestParentCredentials,
  resetEnrollmentRequestParentPassword,
  type TeacherEnrollmentRequest,
} from "@/src/api/teacher.api";
import { inferMimeType } from "@/src/features/enrollment/utils";

interface SubmissionData {
  childData: {
    firstName: string;
    middleName?: string;
    lastName: string;
    dateOfBirth: string;
    age: number;
    gender: "male" | "female";
    programType: string;
    daycareCenterId: string;
    enrollmentDate: string;
    schoolYear: string;
  };
  parentData: {
    parentFirstName: string;
    parentMiddleName?: string;
    parentLastName: string;
    parentEmail: string;
    parentPhone: string;
  };
  documentData: {
    birthCertificate: { uri: string; name: string; mimeType: string } | null;
    parentId: { uri: string; name: string; mimeType: string } | null;
  };
}

export const useEnrollmentSubmit = (token: string | null, onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const copyToClipboard = useCallback(async (value: string, successMessage: string) => {
    try {
      await Clipboard.setStringAsync(value);
      Alert.alert("Copied", successMessage);
    } catch {
      Alert.alert("Copy Error", "Failed to copy to clipboard.");
    }
  }, []);

  const showCredentialsAlert = useCallback(
    (
      title: string,
      credentials: {
        email: string;
        phone: string;
        tempPassword: string | null;
      }
    ) => {
      const hasPassword = Boolean(credentials.tempPassword);
      const message = hasPassword
        ? `Login Email: ${credentials.email}\nLogin Phone: ${credentials.phone || "Not set"}\nGenerated Password: ${credentials.tempPassword}`
        : `Login Email: ${credentials.email}\nLogin Phone: ${credentials.phone || "Not set"}\nGenerated Password: Temporary password unavailable (parent may have already changed it).`;
      const fullCredentialsText = hasPassword
        ? `Login Email: ${credentials.email}\nLogin Phone: ${credentials.phone || "Not set"}\nGenerated Password: ${credentials.tempPassword}`
        : `Login Email: ${credentials.email}\nLogin Phone: ${credentials.phone || "Not set"}`;

      const buttons: { text: string; style?: "cancel"; onPress?: () => void }[] = [
        {
          text: "Copy Details",
          onPress: () => {
            void copyToClipboard(fullCredentialsText, "Credentials copied to clipboard.");
          },
        },
        { text: "Close", style: "cancel" },
      ];

      if (hasPassword && credentials.tempPassword) {
        buttons.unshift({
          text: "Copy Password",
          onPress: () => {
            void copyToClipboard(credentials.tempPassword as string, "Password copied to clipboard.");
          },
        });
      }

      Alert.alert(title, message, buttons);
    },
    [copyToClipboard]
  );

  const submitEnrollment = useCallback(
    async (data: SubmissionData, parentEmail: string, parentPhone: string) => {
      if (!token) {
        Alert.alert("Error", "No authentication token.");
        return;
      }

      setIsSubmitting(true);
      try {
        const submission = await submitChildEnrollmentRequest(token, {
          ...data.childData,
          programType: data.childData.programType as "4Ps Beneficiary" | "Regular Enrollee (Non-beneficiary)",
          parentFirstName: data.parentData.parentFirstName,
          parentLastName: data.parentData.parentLastName,
          parentMiddleName: data.parentData.parentMiddleName,
          parentEmail: data.parentData.parentEmail,
          parentPhone: data.parentData.parentPhone,
        }, {
          birthCertificate: data.documentData.birthCertificate
            ? {
                uri: data.documentData.birthCertificate.uri,
                name: data.documentData.birthCertificate.name,
                mimeType:
                  data.documentData.birthCertificate.mimeType ||
                  inferMimeType(data.documentData.birthCertificate.name || "") ||
                  "application/octet-stream",
              }
            : null,
          parentId: data.documentData.parentId
            ? {
                uri: data.documentData.parentId.uri,
                name: data.documentData.parentId.name,
                mimeType:
                  data.documentData.parentId.mimeType ||
                  inferMimeType(data.documentData.parentId.name || "") ||
                  "application/octet-stream",
              }
            : null,
        });

        const credentials = submission.parentCredentials;
        const submittedEmail = credentials?.email || parentEmail.trim().toLowerCase();
        const submittedPhone = credentials?.phone || parentPhone.trim();
        const generatedPassword = credentials?.tempPassword;
        const credentialMessage = generatedPassword
          ? `Login Email: ${submittedEmail}\nLogin Phone: ${submittedPhone}\nGenerated Password: ${generatedPassword}`
          : `Login Email: ${submittedEmail}\nLogin Phone: ${submittedPhone}\nGenerated Password: Parent account already exists. Use the current password.`;

        Alert.alert(
          "Submitted",
          `Enrollment request submitted successfully.\n\n${credentialMessage}`,
          [
            {
              text: "View Submitted Requests",
              onPress: () => {
                onSuccess?.();
              },
            },
          ]
        );
      } catch (error: any) {
        Alert.alert("Submission Error", error?.message || "Failed to submit enrollment request.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [token, onSuccess]
  );

  const viewParentPassword = useCallback(
    async (request: TeacherEnrollmentRequest) => {
      if (!token) {
        Alert.alert("Error", "No authentication token.");
        return;
      }

      try {
        const response = await getEnrollmentRequestParentCredentials(token, request._id);
        showCredentialsAlert("Parent Credentials", response.credentials);
      } catch (error: any) {
        Alert.alert("View Password Error", error?.message || "Failed to fetch parent credentials.");
      }
    },
    [token, showCredentialsAlert]
  );

  const resetParentPassword = useCallback(
    (request: TeacherEnrollmentRequest, onRefresh: () => void) => {
      if (!token) {
        Alert.alert("Error", "No authentication token.");
        return;
      }

      Alert.alert("Reset Parent Password", `Generate a new temporary password for ${request.parent.firstName} ${request.parent.lastName}?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await resetEnrollmentRequestParentPassword(token, request._id);
              showCredentialsAlert("Parent Credentials Updated", response.credentials);
              onRefresh();
            } catch (error: any) {
              Alert.alert("Reset Error", error?.message || "Failed to reset parent password.");
            }
          },
        },
      ]);
    },
    [token, showCredentialsAlert]
  );

  return {
    isSubmitting,
    submitEnrollment,
    viewParentPassword,
    resetParentPassword,
  };
};
