import { CheckCircle2, Info } from "lucide-react-native";
import { Text, View } from "react-native";
import {ReviewRow,ReviewSection} from "@/src/features/enrollment/components/ui";
import type { ProgramType } from "@/src/features/enrollment/types";
import { displayDate } from "@/src/features/enrollment/utils/enrollment-utils";

export function ReviewSubmitStepSection({
  childFullName,
  dateOfBirth,
  computedChildAge,
  gender,
  homeAddress,
  enrollmentDate,
  assignedCenterReviewValue,
  programType,
  schoolYear,
  parentFullName,
  parentPhone,
  parentRelationship,
  hasBirthCertificate,
  hasParentId,
}: {
  childFullName: string;
  dateOfBirth: string;
  computedChildAge: number;
  gender: "male" | "female";
  homeAddress: string;
  enrollmentDate: string;
  assignedCenterReviewValue: string;
  programType: ProgramType | "";
  schoolYear: string;
  parentFullName: string;
  parentPhone: string;
  parentRelationship: string;
  hasBirthCertificate: boolean;
  hasParentId: boolean;
}) {
  return (
    <View
      className="rounded-3xl border border-gray-200 bg-white p-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View className="mb-2 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
          <CheckCircle2 size={20} color="#059669" />
        </View>
        <Text className="text-2xl font-bold text-gray-900">
          Review & Submit
        </Text>
      </View>
      <Text className="mt-2 text-lg leading-7 text-gray-600">
        Review the details before submitting this enrollment request for admin
        processing.
      </Text>

      <ReviewSection title="Child Information">
        <ReviewRow label="Name" value={childFullName || "Not provided"} />
        <ReviewRow
          label="Date of Birth"
          value={dateOfBirth ? displayDate(dateOfBirth) : "Not provided"}
        />
        <ReviewRow
          label="Age"
          value={
            computedChildAge > 0 ? String(computedChildAge) : "Not provided"
          }
        />
        <ReviewRow label="Gender" value={gender === "male" ? "Boy" : "Girl"} />
        <ReviewRow label="Home Address" value={homeAddress || "Not provided"} />
        <ReviewRow
          label="Enrollment Date"
          value={enrollmentDate ? displayDate(enrollmentDate) : "Not provided"}
        />
        <ReviewRow
          label="Assigned Center"
          value={assignedCenterReviewValue || "Not provided"}
        />
        <ReviewRow label="Program Type" value={programType || "Not provided"} />
        <ReviewRow label="School Year" value={schoolYear || "Not provided"} />
      </ReviewSection>

      <ReviewSection title="Parent Information">
        <ReviewRow
          label="Parent Name"
          value={parentFullName || "Not provided"}
        />
        <ReviewRow label="Login Email" value="Generated after submission" />
        <ReviewRow label="Phone" value={parentPhone || "Not provided"} />
        <ReviewRow label="Relationship" value={parentRelationship || "Not provided"} />
      </ReviewSection>

      <ReviewSection title="Documents">
        <ReviewRow
          label="Birth Certificate"
          value={hasBirthCertificate ? "Uploaded" : "Not uploaded"}
        />
        <ReviewRow
          label="Parent ID"
          value={hasParentId ? "Uploaded" : "Not uploaded"}
        />
      </ReviewSection>

      <View className="flex-row gap-3 rounded-2xl border border-teal-200 bg-teal-50 p-4">
        <Info size={24} color="#0D9488" />
        <Text className="flex-1 text-base leading-6 text-teal-700">
          By submitting, you confirm the information has been verified with the
          family and is ready for enrollment review.
        </Text>
      </View>
    </View>
  );
}
