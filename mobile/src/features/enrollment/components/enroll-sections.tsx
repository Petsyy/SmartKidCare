import {
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Info,
  Key,
  Mail,
  Phone,
  Plus,
  Search,
  User,
  Users,
  XCircle,
} from "lucide-react-native";
import { Pressable, Text, TextInput, View } from "react-native";
import type * as DocumentPicker from "expo-document-picker";
import type { TeacherEnrollmentRequest } from "@/src/api/teacher.api";
import {
  DateField,
  DocumentUploadField,
  Input,
} from "@/src/features/enrollment/components/form-fields";
import {
  ReviewRow,
  ReviewSection,
} from "@/src/features/enrollment/components/review";
import { PROGRAM_TYPES } from "@/src/features/enrollment/constants";
import { enrollFieldStyles } from "@/src/features/enrollment/styles";
import type { ProgramType } from "@/src/features/enrollment/types";
import {
  buildRequestChildName,
  displayDate,
  formatRequestDate,
  getStatusColors,
} from "@/src/features/enrollment/utils";
import { EnrollmentRequestBlockchainStatus } from "@/src/features/enrollment/components/enrollment-request-blockchain-status";

export function EnrollmentTabSwitcher({
  activeTab,
  onChange,
}: {
  activeTab: "new" | "submitted";
  onChange: (tab: "new" | "submitted") => void;
}) {
  return (
    <View className="bg-gray-50 px-5 pb-2 pt-4">
      <View
        className="flex-row gap-2 rounded-2xl bg-white p-1.5"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <Pressable
          onPress={() => onChange("new")}
          className="flex-1 rounded-xl px-3 py-3"
          style={{
            backgroundColor: activeTab === "new" ? "#0D9488" : "transparent",
          }}
        >
          <Text
            className="text-center text-base font-semibold"
            style={{ color: activeTab === "new" ? "#FFFFFF" : "#374151" }}
          >
            New Request
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange("submitted")}
          className="flex-1 rounded-xl px-3 py-3"
          style={{
            backgroundColor:
              activeTab === "submitted" ? "#0D9488" : "transparent",
          }}
        >
          <Text
            className="text-center text-base font-semibold"
            style={{
              color: activeTab === "submitted" ? "#FFFFFF" : "#374151",
            }}
          >
            Submitted
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function EnrollmentStartState({
  onStart,
}: {
  onStart: () => void;
}) {
  return (
    <>
      <View
        className="mb-4 rounded-3xl border border-dashed border-teal-200 bg-teal-50 p-6"
        style={{
          shadowColor: "#0D9488",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
        }}
      >
        <View className="items-center">
          <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-teal-100">
            <Plus size={32} color="#0F766E" />
          </View>
          <Text className="text-2xl font-bold text-gray-900">
            Start a New Enrollment
          </Text>
          <Text className="mt-3 text-center text-lg leading-7 text-gray-600">
            Create a child enrollment request for review and help families
            complete their registration.
          </Text>
          <Pressable
            onPress={onStart}
            className="mt-6 w-full rounded-2xl bg-teal-600 px-5 py-3.5 active:scale-95"
            style={{
              shadowColor: "#0D9488",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-center text-lg font-bold text-white">
              Start Enrollment
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="rounded-2xl border border-gray-200 bg-white p-5">
        <Text className="text-2xl font-bold text-gray-900">What You&apos;ll Need</Text>
        <Text className="mt-3 text-lg leading-7 text-gray-600">
          • Child&apos;s birth certificate (photo or scan)
        </Text>
        <Text className="text-lg leading-7 text-gray-600">
          • Parent or guardian valid ID / supporting residency document
        </Text>
        <Text className="text-lg leading-7 text-gray-600">
          • Parent contact details for account setup and follow-ups
        </Text>
        <Text className="mt-4 text-base leading-6 text-gray-500">
          Use this form when assisting a family with a new center enrollment
          request.
        </Text>
      </View>
    </>
  );
}

export function ChildInfoStepSection({
  firstName,
  setFirstName,
  middleName,
  setMiddleName,
  lastName,
  setLastName,
  dateOfBirth,
  onPickDateOfBirth,
  computedChildAge,
  gender,
  setGender,
  enrollmentDate,
  onPickEnrollmentDate,
  assignedCenterPrimary,
  assignedCenterSecondary,
  programType,
  setProgramType,
  schoolYear,
}: {
  firstName: string;
  setFirstName: (value: string) => void;
  middleName: string;
  setMiddleName: (value: string) => void;
  lastName: string;
  setLastName: (value: string) => void;
  dateOfBirth: string;
  onPickDateOfBirth: () => void;
  computedChildAge: number;
  gender: "male" | "female";
  setGender: (value: "male" | "female") => void;
  enrollmentDate: string;
  onPickEnrollmentDate: () => void;
  assignedCenterPrimary: string;
  assignedCenterSecondary: string;
  programType: ProgramType | "";
  setProgramType: (value: ProgramType) => void;
  schoolYear: string;
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
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-teal-50">
          <User size={20} color="#0D9488" />
        </View>
        <Text className="text-2xl font-bold text-gray-900">Child Information</Text>
      </View>
      <Text className="mt-2 text-lg leading-7 text-gray-600">
        Enter the child&apos;s basic information exactly as shown on the birth
        certificate.
      </Text>

      <View className="mt-4 flex-row gap-3">
        <Input
          containerStyle={enrollFieldStyles.inputHalf}
          label="First Name *"
          placeholder="e.g. Juan"
          value={firstName}
          onChangeText={setFirstName}
        />
        <Input
          containerStyle={enrollFieldStyles.inputHalf}
          label="Last Name *"
          placeholder="e.g. Dela Cruz"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <Input
        label="Middle Name *"
        placeholder="e.g. Santos"
        value={middleName}
        onChangeText={setMiddleName}
      />

      <DateField
        label="Date of Birth *"
        value={dateOfBirth}
        onPress={onPickDateOfBirth}
      />

      <Input
        label="Age *"
        value={computedChildAge > 0 ? String(computedChildAge) : ""}
        onChangeText={() => undefined}
        placeholder="Set date of birth first"
        editable={false}
        computed
        labelHint="Updates when date of birth is set"
      />

      {/* Gender */}
      <View className="mb-4">
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: "#374151",
            marginBottom: 10,
          }}
        >
          Gender <Text style={{ color: "#EF4444" }}>*</Text>
        </Text>
        <View className="flex-row gap-3">
          {(["male", "female"] as const).map((g) => {
            const isSelected = gender === g;
            return (
              <Pressable
                key={g}
                onPress={() => setGender(g)}
                className="flex-1 flex-row items-center rounded-2xl border-2 px-4 py-3"
                style={{
                  borderColor: isSelected ? "#0D9488" : "#E5E7EB",
                  backgroundColor: isSelected ? "#F0FDFA" : "#FFFFFF",
                }}
              >
                <View
                  className="h-5 w-5 items-center justify-center rounded-full border-2"
                  style={{ borderColor: isSelected ? "#0D9488" : "#D1D5DB" }}
                >
                  {isSelected ? (
                    <View className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                  ) : null}
                </View>
                <Text
                  className="ml-2.5 flex-1 font-semibold capitalize"
                  style={{ color: isSelected ? "#0F766E" : "#374151", fontSize: 15 }}
                >
                  {g}
                </Text>
                {isSelected ? (
                  <CheckCircle2 size={18} color="#0D9488" />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <DateField
        label="Enrollment Date *"
        value={enrollmentDate}
        onPress={onPickEnrollmentDate}
      />

      <View style={enrollFieldStyles.inputContainer}>
        <View className="mb-2.5 flex-row flex-wrap items-start justify-between gap-2">
          <View className="flex-1">
            <Text className="text-base font-semibold tracking-wide text-gray-800">
              Assigned Center <Text style={{ color: "#EF4444" }}>*</Text>
            </Text>
          </View>
          <View className="rounded-full bg-teal-100 px-2 py-0.5">
            <Text className="text-[10px] font-bold uppercase tracking-wide text-teal-800">
              Auto
            </Text>
          </View>
        </View>
        <View
          style={[
            enrollFieldStyles.textInput,
            enrollFieldStyles.textInputReadOnly,
            { justifyContent: "center" },
          ]}
        >
          <Text className="text-base font-semibold text-teal-900">
            {assignedCenterPrimary}
          </Text>
          {assignedCenterSecondary ? (
            <Text className="mt-0.5 text-sm text-teal-800">
              {assignedCenterSecondary}
            </Text>
          ) : null}
        </View>
      </View>
      <Text className="-mt-2 mb-5 text-sm leading-5 text-gray-500">
        This is based on your account center assignment.
      </Text>

      {/* Program Type */}
      <View className="mb-4">
        <Text
          style={{
            fontSize: 13,
            fontWeight: "700",
            letterSpacing: 0.6,
            textTransform: "uppercase",
            color: "#374151",
            marginBottom: 10,
          }}
        >
          Program Type <Text style={{ color: "#EF4444" }}>*</Text>
        </Text>
        <View className="gap-2">
          {PROGRAM_TYPES.map((option) => {
            const isSelected = programType === option;
            return (
              <Pressable
                key={option}
                onPress={() => setProgramType(option)}
                className="rounded-2xl border-2 px-4 py-3"
                style={{
                  borderColor: isSelected ? "#0D9488" : "#E5E7EB",
                  backgroundColor: isSelected ? "#F0FDFA" : "#FFFFFF",
                }}
              >
                <View className="flex-row items-center">
                  <View
                    className="h-5 w-5 items-center justify-center rounded-full border-2"
                    style={{ borderColor: isSelected ? "#0D9488" : "#D1D5DB" }}
                  >
                    {isSelected ? (
                      <View className="h-2.5 w-2.5 rounded-full bg-teal-600" />
                    ) : null}
                  </View>
                  <Text
                    className="ml-3 flex-1"
                    style={{
                      fontSize: 15,
                      fontWeight: isSelected ? "700" : "500",
                      color: isSelected ? "#0F766E" : "#374151",
                    }}
                  >
                    {option}
                  </Text>
                  {isSelected ? (
                    <CheckCircle2 size={18} color="#0D9488" />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Input
        label="School Year *"
        value={schoolYear}
        onChangeText={() => undefined}
        placeholder="2026-2027"
        editable={false}
        computed
        labelHint="Derived from enrollment date"
      />
    </View>
  );
}

export function ParentInfoStepSection({
  parentFirstName,
  setParentFirstName,
  parentMiddleName,
  setParentMiddleName,
  parentLastName,
  setParentLastName,
  parentEmail,
  setParentEmail,
  parentPhone,
  setParentPhone,
}: {
  parentFirstName: string;
  setParentFirstName: (value: string) => void;
  parentMiddleName: string;
  setParentMiddleName: (value: string) => void;
  parentLastName: string;
  setParentLastName: (value: string) => void;
  parentEmail: string;
  setParentEmail: (value: string) => void;
  parentPhone: string;
  setParentPhone: (value: string) => void;
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
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-sky-50">
          <Users size={20} color="#0284C7" />
        </View>
        <Text className="text-2xl font-bold text-gray-900">Parent Information</Text>
      </View>
      <Text className="mt-2 text-lg leading-7 text-gray-600">
        Provide the parent or guardian details needed for account creation and
        follow-up updates.
      </Text>

      <View className="mt-4 flex-row gap-3">
        <Input
          containerStyle={enrollFieldStyles.inputHalf}
          label="First Name *"
          placeholder="e.g. Maria"
          value={parentFirstName}
          onChangeText={setParentFirstName}
        />
        <Input
          containerStyle={enrollFieldStyles.inputHalf}
          label="Last Name *"
          placeholder="e.g. Dela Cruz"
          value={parentLastName}
          onChangeText={setParentLastName}
        />
      </View>

      <Input
        label="Middle Name *"
        placeholder="e.g. Reyes"
        value={parentMiddleName}
        onChangeText={setParentMiddleName}
      />
      <Input
        label="Email Address *"
        placeholder="e.g. parent@email.com"
        value={parentEmail}
        onChangeText={setParentEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Input
        label="Phone Number *"
        placeholder="e.g. 09171234567"
        value={parentPhone}
        onChangeText={setParentPhone}
        keyboardType="phone-pad"
      />
    </View>
  );
}

export function DocumentsStepSection({
  isWide,
  birthCertificateFile,
  parentIdFile,
  onPickBirthCertificate,
  onPickParentId,
  onClearBirthCertificate,
  onClearParentId,
}: {
  isWide: boolean;
  birthCertificateFile: DocumentPicker.DocumentPickerAsset | null;
  parentIdFile: DocumentPicker.DocumentPickerAsset | null;
  onPickBirthCertificate: () => void;
  onPickParentId: () => void;
  onClearBirthCertificate: () => void;
  onClearParentId: () => void;
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
        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-amber-50">
          <FileText size={20} color="#D97706" />
        </View>
        <Text className="text-2xl font-bold text-gray-900">Required Documents</Text>
      </View>
      <Text className="mt-2 text-lg leading-7 text-gray-600">
        Upload clear photos or scans of the supporting enrollment documents.
      </Text>

      <View
        className="mt-4"
        style={{
          flexDirection: isWide ? "row" : "column",
          gap: 12,
        }}
      >
        <DocumentUploadField
          label="Birth Certificate *"
          fileName={birthCertificateFile?.name || null}
          showPhotoOption={false}
          onUploadFile={onPickBirthCertificate}
          onClear={onClearBirthCertificate}
          containerStyle={isWide ? { flex: 1 } : undefined}
          labelStyle={{
            fontSize: 15,
            lineHeight: 22,
            fontWeight: "700",
          }}
        />

        <DocumentUploadField
          label="Parent ID *"
          fileName={parentIdFile?.name || null}
          showPhotoOption={false}
          onUploadFile={onPickParentId}
          onClear={onClearParentId}
          containerStyle={isWide ? { flex: 1 } : undefined}
          labelStyle={{
            fontSize: 15,
            lineHeight: 22,
            fontWeight: "700",
          }}
        />
      </View>

      <View className="rounded-2xl bg-gray-100 p-4">
        <Text className="text-xl font-bold text-gray-900">Tips for uploading:</Text>
        <Text className="mt-2 text-base leading-6 text-gray-600">
          - Make sure all text is clearly readable
        </Text>
        <Text className="text-base leading-6 text-gray-600">
          - Photos should be well-lit without glare
        </Text>
        <Text className="text-base leading-6 text-gray-600">
          - Include all edges of the document
        </Text>
      </View>
    </View>
  );
}

export function ReviewSubmitStepSection({
  childFullName,
  dateOfBirth,
  computedChildAge,
  gender,
  enrollmentDate,
  assignedCenterReviewValue,
  programType,
  schoolYear,
  parentFullName,
  parentEmail,
  parentPhone,
  hasBirthCertificate,
  hasParentId,
}: {
  childFullName: string;
  dateOfBirth: string;
  computedChildAge: number;
  gender: "male" | "female";
  enrollmentDate: string;
  assignedCenterReviewValue: string;
  programType: ProgramType | "";
  schoolYear: string;
  parentFullName: string;
  parentEmail: string;
  parentPhone: string;
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
        <Text className="text-2xl font-bold text-gray-900">Review & Submit</Text>
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
          value={computedChildAge > 0 ? String(computedChildAge) : "Not provided"}
        />
        <ReviewRow label="Gender" value={gender === "male" ? "Boy" : "Girl"} />
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
        <ReviewRow label="Parent Name" value={parentFullName || "Not provided"} />
        <ReviewRow label="Email" value={parentEmail || "Not provided"} />
        <ReviewRow label="Phone" value={parentPhone || "Not provided"} />
      </ReviewSection>

      <ReviewSection title="Documents">
        <ReviewRow
          label="Birth Certificate"
          value={hasBirthCertificate ? "Uploaded" : "Not uploaded"}
        />
        <ReviewRow label="Parent ID" value={hasParentId ? "Uploaded" : "Not uploaded"} />
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

export function SubmittedRequestsPanel({
  submittedSummary,
  submittedStatusFilter,
  setSubmittedStatusFilter,
  submittedSearchQuery,
  setSubmittedSearchQuery,
  loadingSubmitted,
  submittedRequests,
  filteredSubmittedRequests,
  onViewParentPassword,
  onResetParentPassword,
}: {
  submittedSummary: { all: number; pending: number; rejected: number };
  submittedStatusFilter: "all" | "pending" | "rejected";
  setSubmittedStatusFilter: (value: "all" | "pending" | "rejected") => void;
  submittedSearchQuery: string;
  setSubmittedSearchQuery: (value: string) => void;
  loadingSubmitted: boolean;
  submittedRequests: TeacherEnrollmentRequest[];
  filteredSubmittedRequests: TeacherEnrollmentRequest[];
  onViewParentPassword: (request: TeacherEnrollmentRequest) => void;
  onResetParentPassword: (request: TeacherEnrollmentRequest) => void;
}) {
  return (
    <>
      <View
        className="mb-5 rounded-3xl overflow-hidden bg-white"
        style={{
          shadowColor: "#0D9488",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 14,
          elevation: 6,
        }}
      >
        {/* Teal header banner */}
        <View style={{ backgroundColor: "#0F766E", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 18 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <View style={{ height: 48, width: 48, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" }}>
              <FileText size={24} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: "900", color: "#FFFFFF", letterSpacing: -0.5 }}>
                Enrollment Requests
              </Text>
              <Text style={{ fontSize: 12, fontWeight: "700", color: "#99F6E4", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>
                Track and manage submissions
              </Text>
            </View>
          </View>
        </View>

        {/* Filter chips */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 }}>
          {[
            { key: "all", label: "All", count: submittedSummary.all, activeColor: "#0D9488", activeBg: "#0D9488", inactiveBg: "#F0FDFA", inactiveBorder: "#99F6E4", inactiveText: "#0D9488" },
            { key: "pending", label: "Pending", count: submittedSummary.pending, activeColor: "#FFFFFF", activeBg: "#D97706", inactiveBg: "#FFFBEB", inactiveBorder: "#FDE68A", inactiveText: "#B45309" },
            { key: "rejected", label: "Rejected", count: submittedSummary.rejected, activeColor: "#FFFFFF", activeBg: "#DC2626", inactiveBg: "#FFF1F2", inactiveBorder: "#FECDD3", inactiveText: "#B91C1C" },
          ].map((item) => {
            const active = submittedStatusFilter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setSubmittedStatusFilter(item.key as any)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  borderRadius: 100,
                  paddingHorizontal: 18,
                  paddingVertical: 10,
                  borderWidth: 1.5,
                  borderColor: active ? item.activeBg : item.inactiveBorder,
                  backgroundColor: active ? item.activeBg : item.inactiveBg,
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: "900", color: active ? "#FFFFFF" : item.inactiveText }}>
                  {item.label}
                </Text>
                <View style={{ borderRadius: 100, paddingHorizontal: 7, paddingVertical: 2, backgroundColor: active ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.08)" }}>
                  <Text style={{ fontSize: 13, fontWeight: "900", color: active ? "#FFFFFF" : item.inactiveText }}>
                    {item.count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Search bar */}
        <View style={{ marginHorizontal: 16, marginTop: 14, marginBottom: 16, flexDirection: "row", alignItems: "center", backgroundColor: "#F8FAFC", borderRadius: 16, borderWidth: 1.5, borderColor: "#E2E8F0", paddingHorizontal: 16, paddingVertical: 13 }}>
          <Search size={20} color="#0D9488" />
          <TextInput
            value={submittedSearchQuery}
            onChangeText={setSubmittedSearchQuery}
            placeholder="Search child or parent name..."
            placeholderTextColor="#94A3B8"
            style={{ flex: 1, marginLeft: 10, fontSize: 16, fontWeight: "700", color: "#1E293B" }}
          />
        </View>
      </View>

      {/* ── Content ─────────────────────────────────── */}
      {loadingSubmitted ? (
        <View className="rounded-3xl bg-white p-10 items-center" style={{ elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#6B7280", marginTop: 16 }}>
            Loading requests...
          </Text>
        </View>
      ) : submittedRequests.length === 0 ? (
        <View
          className="rounded-3xl bg-white p-10 items-center"
          style={{ elevation: 4, shadowColor: "#0D9488", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 }}
        >
          <View style={{ height: 84, width: 84, borderRadius: 24, backgroundColor: "#F0FDFA", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <FileText size={44} color="#0D9488" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#111827", textAlign: "center" }}>
            No Requests Yet
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#6B7280", textAlign: "center", marginTop: 8, maxWidth: 240, lineHeight: 24 }}>
            Switch to &quot;New Request&quot; to submit a child enrollment for review.
          </Text>
        </View>
      ) : filteredSubmittedRequests.length === 0 ? (
        <View
          className="rounded-3xl bg-white p-10 items-center"
          style={{ elevation: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12 }}
        >
          <View style={{ height: 84, width: 84, borderRadius: 24, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Search size={44} color="#64748B" />
          </View>
          <Text style={{ fontSize: 24, fontWeight: "900", color: "#111827", textAlign: "center" }}>
            No Matches Found
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#6B7280", textAlign: "center", marginTop: 8, maxWidth: 240, lineHeight: 24 }}>
            We couldn&apos;t find any requests matching your current filters.
          </Text>
          <Pressable
            onPress={() => { setSubmittedSearchQuery(""); setSubmittedStatusFilter("all"); }}
            style={{ marginTop: 20, backgroundColor: "#0D9488", borderRadius: 16, paddingHorizontal: 32, paddingVertical: 14, elevation: 4, shadowColor: "#0D9488", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 }}
          >
            <Text style={{ fontSize: 16, fontWeight: "900", color: "#FFFFFF" }}>Clear All Filters</Text>
          </Pressable>
        </View>
      ) : (
        <View className="gap-4">
          {filteredSubmittedRequests.map((request) => {
            const status = getStatusColors(request.status);
            const isRejected = request.status === "rejected";
            const isApproved = request.status === "approved";
            const statusAccentColor = isRejected
              ? "#DC2626"
              : isApproved
                ? "#059669"
                : "#D97706";
            const statusSoftBackground = isRejected
              ? "#FFF1F2"
              : isApproved
                ? "#ECFDF5"
                : "#FFFBEB";
            const childFullName = buildRequestChildName(request) || "Child not specified";
            const parentFullName = [request.parent.firstName, request.parent.lastName]
              .filter((value) => String(value || "").trim().length > 0)
              .join(" ");
            const programLabel =
              request.child.programType === "4Ps Beneficiary"
                ? "4Ps Beneficiary"
                : "Regular Enrollee";

            return (
              <View
                key={request._id}
                style={{
                  overflow: "hidden",
                  borderRadius: 24,
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  elevation: 6,
                  shadowColor: statusAccentColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.14,
                  shadowRadius: 14,
                }}
              >
                <View style={{ height: 6, backgroundColor: statusAccentColor }} />
                <View style={{ padding: 18 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <View
                          style={{
                            height: 46,
                            width: 46,
                            borderRadius: 14,
                            backgroundColor: statusSoftBackground,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <FileText size={20} color={statusAccentColor} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: "900",
                              letterSpacing: 0.7,
                              textTransform: "uppercase",
                              color: "#334155",
                            }}
                          >
                            Child Name
                          </Text>
                          <Text
                            style={{
                              fontSize: 22,
                              fontWeight: "900",
                              color: "#111827",
                              letterSpacing: -0.4,
                            }}
                          >
                            {childFullName}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View
                      style={{
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        backgroundColor: status.badgeBackgroundColor,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: "900",
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                          color: status.textColor,
                        }}
                      >
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={{
                      marginTop: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      backgroundColor: "#FFFFFF",
                      padding: 13,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "900",
                        textTransform: "uppercase",
                        letterSpacing: 0.7,
                        color: "#334155",
                      }}
                    >
                      Enrollment Details
                    </Text>
                    <View style={{ marginTop: 10, gap: 9 }}>
                      <View style={{ flexDirection: "row", gap: 10 }}>
                        <View
                          style={{
                            flex: 1,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#E2E8F0",
                            backgroundColor: "#F8FAFC",
                            paddingHorizontal: 10,
                            paddingVertical: 9,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.65, color: "#334155" }}>
                            Parent Name
                          </Text>
                          <Text numberOfLines={1} style={{ marginTop: 4, fontSize: 14, fontWeight: "800", color: "#1F2937" }}>
                            {parentFullName || "Parent not specified"}
                          </Text>
                        </View>
                        <View
                          style={{
                            flex: 1,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#E2E8F0",
                            backgroundColor: "#F8FAFC",
                            paddingHorizontal: 10,
                            paddingVertical: 9,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.65, color: "#334155" }}>
                            Program Type
                          </Text>
                          <Text numberOfLines={1} style={{ marginTop: 4, fontSize: 14, fontWeight: "800", color: "#1F2937" }}>
                            {programLabel}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={{
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: "#E2E8F0",
                          backgroundColor: "#F8FAFC",
                          paddingHorizontal: 10,
                          paddingVertical: 9,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.65, color: "#334155" }}>
                          Submitted Date
                        </Text>
                        <View style={{ marginTop: 4, flexDirection: "row", alignItems: "center" }}>
                          <Clock3 size={13} color="#64748B" />
                          <Text style={{ marginLeft: 6, fontSize: 14, fontWeight: "800", color: "#1F2937" }}>
                            {formatRequestDate(request.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      marginTop: 14,
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: "#E2E8F0",
                      backgroundColor: "#F8FAFC",
                      padding: 13,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "900",
                        textTransform: "uppercase",
                        letterSpacing: 0.7,
                        color: "#334155",
                      }}
                    >
                      Parent Contact
                    </Text>
                    <View style={{ marginTop: 8, gap: 8 }}>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Mail size={14} color="#475569" />
                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1,
                            marginLeft: 8,
                            fontSize: 13,
                            fontWeight: "700",
                            color: "#334155",
                          }}
                        >
                          {request.parent.email || "No email provided"}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Phone size={14} color="#475569" />
                        <Text style={{ marginLeft: 8, fontSize: 13, fontWeight: "700", color: "#334155" }}>
                          {request.parent.phone || "No phone provided"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {isRejected && request.review?.reason ? (
                    <View
                      style={{
                        marginTop: 14,
                        borderRadius: 16,
                        backgroundColor: "#FFF1F2",
                        borderWidth: 1,
                        borderColor: "#FECDD3",
                        padding: 14,
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <XCircle size={14} color="#B91C1C" />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: "900",
                            textTransform: "uppercase",
                            letterSpacing: 0.8,
                            color: "#B91C1C",
                          }}
                        >
                          Rejection Reason
                        </Text>
                      </View>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: "700",
                          color: "#991B1B",
                          lineHeight: 20,
                        }}
                      >
                        {request.review.reason}
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ marginTop: 2 }}>
                    <EnrollmentRequestBlockchainStatus request={request} />
                  </View>

                  <View
                    style={{
                      marginTop: 14,
                      paddingTop: 14,
                      borderTopWidth: 1,
                      borderTopColor: "#E5E7EB",
                      flexDirection: "row",
                      justifyContent: "flex-end",
                      flexWrap: "wrap",
                      gap: 8,
                    }}
                  >
                    <Pressable
                      onPress={() => onViewParentPassword(request)}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 8,
                        borderRadius: 16,
                        borderWidth: 1.5,
                        borderColor: "#BFDBFE",
                        backgroundColor: "#EFF6FF",
                        paddingHorizontal: 16,
                        paddingVertical: 10,
                      }}
                    >
                      <Eye size={14} color="#1D4ED8" />
                      <Text style={{ fontSize: 15, fontWeight: "700", color: "#1E40AF" }}>
                        View Password
                      </Text>
                    </Pressable>
                    {request.showResetParentPassword !== false ? (
                      <Pressable
                        onPress={() => onResetParentPassword(request)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 8,
                          borderRadius: 16,
                          borderWidth: 1.5,
                          borderColor: "#FDE68A",
                          backgroundColor: "#FFFBEB",
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                        }}
                      >
                        <Key size={14} color="#B45309" />
                        <Text style={{ fontSize: 15, fontWeight: "700", color: "#92400E" }}>
                          Reset Password
                        </Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </>
  );
}

