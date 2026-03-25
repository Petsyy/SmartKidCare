import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as Clipboard from "expo-clipboard";
import { useAuth } from "@/src/hooks/use-auth";
import {
  getEnrollmentRequestParentCredentials,
  getEnrollmentCenters,
  getMyEnrollmentRequests,
  getTeacherProfile,
  resetEnrollmentRequestParentPassword,
  submitChildEnrollmentRequest,
  type EnrollmentCenterOption,
  type TeacherEnrollmentRequest,
} from "@/src/api/teacher.api";
import {
  computeAgeFromDateOfBirth,
  validateChildEnrollmentStepOne,
  validateChildEnrollmentStepTwo,
} from "@/src/validations/child-enrollment-validation";
import {
  ALLOWED_MIME_TYPES,
  ChildInfoStepSection,
  DocumentsStepSection,
  EnrollmentStartState,
  EnrollmentTabSwitcher,
  ParentInfoStepSection,
  ReviewSubmitStepSection,
  StepProgress,
  SubmittedRequestsPanel,
  addYears,
  buildRequestChildName,
  computeSchoolYear,
  displayDate,
  enrollFieldStyles,
  formatYmd,
  inferMimeType,
  parseYmd,
  toIsoUtc,
  type DateFieldKey,
  type ProgramType,
  type Step,
  validateDocument,
} from "@/src/features/enrollment";
import { getDaycareCenterDisplay } from "@/src/utils/daycare-center-format";
import { ChevronLeft } from "lucide-react-native";
import { useNavigation } from "expo-router";

type DatePickerNativeModule = typeof import("@react-native-community/datetimepicker");

const getNativeDatePickerModule = (): DatePickerNativeModule | null => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("@react-native-community/datetimepicker") as DatePickerNativeModule;
  } catch {
    return null;
  }
};

export default function EnrollChildScreen() {
  const { token } = useAuth();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;
  const contentMaxWidth = isWide ? 860 : undefined;
  const contentPadding = isWide ? 28 : 16;

  const defaultEnrollmentDate = useMemo(() => formatYmd(new Date()), []);
  const defaultSchoolYear = useMemo(
    () => computeSchoolYear(defaultEnrollmentDate),
    [defaultEnrollmentDate],
  );
  const today = useMemo(() => new Date(), []);
  const minDateOfBirth = useMemo(() => addYears(today, -5), [today]);
  const maxDateOfBirth = useMemo(() => addYears(today, -3), [today]);

  const [activeTab, setActiveTab] = useState<"new" | "submitted">("new");
  const [hasStarted, setHasStarted] = useState(false);
  const [step, setStep] = useState<Step>(1);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [programType, setProgramType] = useState<ProgramType | "">("");
  const [enrollmentDate, setEnrollmentDate] = useState(defaultEnrollmentDate);
  const [schoolYear, setSchoolYear] = useState(defaultSchoolYear);
  const [daycareCenterId, setDaycareCenterId] = useState("");
  const [enrollmentCenters, setEnrollmentCenters] = useState<
    EnrollmentCenterOption[]
  >([]);
  const [assignedTeacherCenterId, setAssignedTeacherCenterId] = useState("");
  const [assignedTeacherCenter, setAssignedTeacherCenter] = useState<{
    name?: string;
    barangay?: string;
  } | null>(null);
  const [loadingCenters, setLoadingCenters] = useState(false);

  const [parentFirstName, setParentFirstName] = useState("");
  const [parentMiddleName, setParentMiddleName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  const [birthCertificateFile, setBirthCertificateFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [parentIdFile, setParentIdFile] =
    useState<DocumentPicker.DocumentPickerAsset | null>(null);

  const [submittedRequests, setSubmittedRequests] = useState<
    TeacherEnrollmentRequest[]
  >([]);
  const [loadingSubmitted, setLoadingSubmitted] = useState(false);
  const [submittedStatusFilter, setSubmittedStatusFilter] = useState<
    "all" | "pending" | "rejected"
  >("all");
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState<DateFieldKey | null>(null);
  const [pickerDate, setPickerDate] = useState<Date>(new Date());
  const [pickerInput, setPickerInput] = useState("");
  const [pickerMode, setPickerMode] = useState<"native" | "manual">("manual");
  const nativeDatePicker = useMemo(() => getNativeDatePickerModule(), []);
  const NativeDateTimePicker = nativeDatePicker?.default;
  const NativeDateTimePickerAndroid = nativeDatePicker?.DateTimePickerAndroid;
  const defaultCenterId = useMemo(
    () =>
      assignedTeacherCenterId &&
      enrollmentCenters.some((center) => center._id === assignedTeacherCenterId)
        ? assignedTeacherCenterId
        : enrollmentCenters[0]?._id || "",
    [assignedTeacherCenterId, enrollmentCenters],
  );

  const resetForm = () => {
    setHasStarted(false);
    setStep(1);
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setDateOfBirth("");
    setGender("male");
    setProgramType("");
    setEnrollmentDate(defaultEnrollmentDate);
    setSchoolYear(defaultSchoolYear);
    setDaycareCenterId(defaultCenterId);
    setParentFirstName("");
    setParentMiddleName("");
    setParentLastName("");
    setParentEmail("");
    setParentPhone("");
    setBirthCertificateFile(null);
    setParentIdFile(null);
  };

  const refreshSubmitted = useCallback(async () => {
    if (!token) return;
    setLoadingSubmitted(true);
    try {
      const data = await getMyEnrollmentRequests(token);
      // Teacher submitted tab should only keep actionable requests.
      // Approved requests are hidden once admin approval is done.
      setSubmittedRequests(
        data.filter((request) => request.status !== "approved"),
      );
    } catch (error: any) {
      Alert.alert(
        "Load Error",
        error?.message || "Failed to load submitted requests.",
      );
    } finally {
      setLoadingSubmitted(false);
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === "submitted") {
      void refreshSubmitted();
    }
  }, [activeTab, refreshSubmitted]);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    const loadCenters = async () => {
      setLoadingCenters(true);
      try {
        const [profileResult, centersResult] = await Promise.allSettled([
          getTeacherProfile(token),
          getEnrollmentCenters(token),
        ]);
        if (!isMounted) return;

        if (
          profileResult.status === "rejected" &&
          centersResult.status === "rejected"
        ) {
          throw new Error(
            profileResult.reason?.message ||
              centersResult.reason?.message ||
              "Failed to load assigned centers.",
          );
        }

        const profile =
          profileResult.status === "fulfilled" ? profileResult.value : null;
        const centers =
          centersResult.status === "fulfilled" ? centersResult.value : [];

        const activeCenters = centers.filter(
          (center) => center.isActive !== false,
        );
        const profileCenterRaw = profile?.daycareCenter;
        const profileCenterId =
          typeof profileCenterRaw === "string"
            ? profileCenterRaw
            : String(profileCenterRaw?._id || "");
        const profileCenterOption =
          profileCenterRaw && typeof profileCenterRaw === "object"
            ? {
                _id: String(profileCenterRaw._id || ""),
                name: String(profileCenterRaw.name || ""),
                barangay: String(profileCenterRaw.barangay || ""),
                code: String(profileCenterRaw.code || ""),
                isActive: profileCenterRaw.isActive !== false,
              }
            : null;
        setAssignedTeacherCenter(
          profileCenterRaw && typeof profileCenterRaw === "object"
            ? {
                name: String(profileCenterRaw.name || ""),
                barangay: String(profileCenterRaw.barangay || ""),
              }
            : null,
        );
        const mergedCenters = [...activeCenters];
        if (
          profileCenterOption?._id &&
          !mergedCenters.some(
            (center) => center._id === profileCenterOption._id,
          )
        ) {
          mergedCenters.unshift(profileCenterOption);
        }

        setAssignedTeacherCenterId(profileCenterId);
        setEnrollmentCenters(mergedCenters);
        setDaycareCenterId((prev) => {
          if (
            profileCenterId &&
            mergedCenters.some((center) => center._id === profileCenterId)
          ) {
            return profileCenterId;
          }
          if (prev && mergedCenters.some((center) => center._id === prev)) {
            return prev;
          }
          return mergedCenters[0]?._id || "";
        });
      } catch (error: any) {
        if (!isMounted) return;
        Alert.alert(
          "Load Error",
          error?.message || "Failed to load assigned centers.",
        );
        setAssignedTeacherCenterId("");
        setAssignedTeacherCenter(null);
        setEnrollmentCenters([]);
        setDaycareCenterId("");
      } finally {
        if (isMounted) setLoadingCenters(false);
      }
    };

    void loadCenters();

    return () => {
      isMounted = false;
    };
  }, [token]);

  useEffect(() => {
    // Pass high-level param to layout to handle hiding
    (navigation as any).setParams({ hideTabBar: hasStarted });
  }, [hasStarted, navigation]);

  useEffect(() => {
    const nextSchoolYear = computeSchoolYear(enrollmentDate);
    setSchoolYear(nextSchoolYear);
  }, [enrollmentDate]);

  const validateStepOne = () => {
    const result = validateChildEnrollmentStepOne({
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      gender,
      daycareCenterId,
      programType,
      enrollmentDate,
      schoolYear,
    });

    if (!result.success) {
      Alert.alert(
        "Validation",
        result.error.issues[0]?.message ||
          "Please complete the child information.",
      );
      return false;
    }

    return true;
  };

  const validateStepTwo = () => {
    const result = validateChildEnrollmentStepTwo({
      parentFirstName,
      parentMiddleName,
      parentLastName,
      parentEmail,
      parentPhone,
    });

    if (!result.success) {
      Alert.alert(
        "Validation",
        result.error.issues[0]?.message ||
          "Please complete the parent information.",
      );
      return false;
    }

    return true;
  };

  const validateStepThree = () => {
    const birthError = validateDocument(birthCertificateFile);
    if (birthError) {
      Alert.alert("Validation", `Birth Certificate: ${birthError}`);
      return false;
    }

    const parentIdError = validateDocument(parentIdFile);
    if (parentIdError) {
      Alert.alert("Validation", `Parent ID: ${parentIdError}`);
      return false;
    }

    return true;
  };

  const nextStep = () => {
    if (step === 1 && !validateStepOne()) return;
    if (step === 2 && !validateStepTwo()) return;
    if (step === 3 && !validateStepThree()) return;
    setStep((prev) => (prev < 4 ? ((prev + 1) as Step) : prev));
  };

  const previousStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : prev));
  };

  const applyPickedDate = (field: DateFieldKey, pickedDate: Date) => {
    const normalized = formatYmd(pickedDate);
    if (field === "dateOfBirth") {
      setDateOfBirth(normalized);
      return;
    }
    setEnrollmentDate(normalized);
  };

  const validatePickedDate = (
    field: DateFieldKey,
    pickedDate: Date,
  ): string | null => {
    if (field !== "dateOfBirth") return null;

    const normalizedPickedDate = formatYmd(pickedDate);
    const minAllowedDate = formatYmd(minDateOfBirth);
    const maxAllowedDate = formatYmd(maxDateOfBirth);

    if (
      normalizedPickedDate < minAllowedDate ||
      normalizedPickedDate > maxAllowedDate
    ) {
      return `Date of birth must be between ${displayDate(minAllowedDate)} and ${displayDate(maxAllowedDate)}.`;
    }

    return null;
  };

  const openDatePicker = (field: DateFieldKey) => {
    const currentValue = field === "dateOfBirth" ? dateOfBirth : enrollmentDate;
    const fallbackDate = field === "dateOfBirth" ? maxDateOfBirth : new Date();
    const initialDate = parseYmd(currentValue) || fallbackDate;

    if (Platform.OS === "android" && NativeDateTimePickerAndroid) {
      NativeDateTimePickerAndroid.open({
        value: initialDate,
        mode: "date",
        minimumDate: field === "dateOfBirth" ? minDateOfBirth : undefined,
        maximumDate: field === "dateOfBirth" ? maxDateOfBirth : undefined,
        onChange: (event: any, selectedDate?: Date) => {
          if (event.type !== "set" || !selectedDate) return;
          const validationError = validatePickedDate(field, selectedDate);
          if (validationError) {
            Alert.alert("Validation", validationError);
            return;
          }
          applyPickedDate(field, selectedDate);
        },
      });
      return;
    }

    setPickerField(field);
    setPickerDate(initialDate);
    setPickerInput(formatYmd(initialDate));
    setPickerMode(
      Platform.OS === "ios" && NativeDateTimePicker ? "native" : "manual",
    );
    setPickerVisible(true);
  };

  const closePicker = () => {
    setPickerVisible(false);
    setPickerField(null);
  };

  const confirmPicker = () => {
    if (!pickerField) return;

    if (pickerMode === "native" && Platform.OS === "ios") {
      const validationError = validatePickedDate(pickerField, pickerDate);
      if (validationError) {
        Alert.alert("Validation", validationError);
        return;
      }

      applyPickedDate(pickerField, pickerDate);
      closePicker();
      return;
    }

    const parsedInput = parseYmd(pickerInput.trim());
    if (!parsedInput) {
      Alert.alert("Invalid Date", "Use YYYY-MM-DD format (example: 2021-09-15).");
      return;
    }

    const validationError = validatePickedDate(pickerField, parsedInput);
    if (validationError) {
      Alert.alert("Validation", validationError);
      return;
    }

    applyPickedDate(pickerField, parsedInput);
    closePicker();
  };

  const pickDocument = async (
    type: "birthCertificate" | "parentId",
    mode: "image" | "file" = "file",
  ) => {
    try {
      const mimeTypes =
        mode === "image"
          ? ["image/jpeg", "image/png"]
          : [...ALLOWED_MIME_TYPES];

      const result = await DocumentPicker.getDocumentAsync({
        type: mimeTypes,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets?.[0] ?? null;
      const error = validateDocument(file);
      if (error) {
        Alert.alert("Invalid Document", error);
        return;
      }

      if (type === "birthCertificate") {
        setBirthCertificateFile(file);
      } else {
        setParentIdFile(file);
      }
    } catch (error: any) {
      Alert.alert("Document Error", error?.message || "Failed to pick file.");
    }
  };

  const submitEnrollment = async () => {
    if (!token) {
      Alert.alert("Error", "No authentication token.");
      return;
    }

    if (!validateStepOne()) return;
    if (!validateStepTwo()) return;
    if (!validateStepThree()) return;

    const age = computeAgeFromDateOfBirth(dateOfBirth);
    if (age <= 0) {
      Alert.alert("Validation", "Computed age is invalid from date of birth.");
      return;
    }
    if (!programType) {
      Alert.alert("Validation", "Please select a program type.");
      return;
    }
    if (!daycareCenterId.trim()) {
      Alert.alert("Validation", "Please select an assigned center.");
      return;
    }

    setIsSubmitting(true);
    try {
      const submission = await submitChildEnrollmentRequest(
        token,
        {
          firstName: firstName.trim(),
          middleName: middleName.trim() || undefined,
          lastName: lastName.trim(),
          dateOfBirth: toIsoUtc(dateOfBirth),
          age,
          gender,
          programType,
          daycareCenterId: daycareCenterId.trim(),
          enrollmentDate: toIsoUtc(enrollmentDate),
          schoolYear: schoolYear.trim(),
          parentFirstName: parentFirstName.trim(),
          parentMiddleName: parentMiddleName.trim() || undefined,
          parentLastName: parentLastName.trim(),
          parentEmail: parentEmail.trim().toLowerCase(),
          parentPhone: parentPhone.trim(),
        },
        {
          birthCertificate: birthCertificateFile
            ? {
                uri: birthCertificateFile.uri,
                name: birthCertificateFile.name,
                mimeType:
                  birthCertificateFile.mimeType ||
                  inferMimeType(birthCertificateFile.name || "") ||
                  "application/octet-stream",
              }
            : null,
          parentId: parentIdFile
            ? {
                uri: parentIdFile.uri,
                name: parentIdFile.name,
                mimeType:
                  parentIdFile.mimeType ||
                  inferMimeType(parentIdFile.name || "") ||
                  "application/octet-stream",
              }
            : null,
        },
      );

      const credentials = submission.parentCredentials;
      const submittedEmail =
        credentials?.email || parentEmail.trim().toLowerCase();
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
              resetForm();
              setActiveTab("submitted");
              void refreshSubmitted();
            },
          },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        "Submission Error",
        error?.message || "Failed to submit enrollment request.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (value: string, successMessage: string) => {
    try {
      await Clipboard.setStringAsync(value);
      Alert.alert("Copied", successMessage);
    } catch {
      Alert.alert("Copy Error", "Failed to copy to clipboard.");
    }
  };

  const showCredentialsAlert = (
    title: string,
    credentials: {
      email: string;
      phone: string;
      tempPassword: string | null;
    },
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
          void copyToClipboard(
            fullCredentialsText,
            "Credentials copied to clipboard.",
          );
        },
      },
      { text: "Close", style: "cancel" },
    ];

    if (hasPassword && credentials.tempPassword) {
      buttons.unshift({
        text: "Copy Password",
        onPress: () => {
          void copyToClipboard(
            credentials.tempPassword as string,
            "Password copied to clipboard.",
          );
        },
      });
    }

    Alert.alert(title, message, buttons);
  };

  const handleViewParentPassword = async (request: TeacherEnrollmentRequest) => {
    if (!token) {
      Alert.alert("Error", "No authentication token.");
      return;
    }

    try {
      const response = await getEnrollmentRequestParentCredentials(
        token,
        request._id,
      );
      showCredentialsAlert("Parent Credentials", response.credentials);
    } catch (error: any) {
      Alert.alert(
        "View Password Error",
        error?.message || "Failed to fetch parent credentials.",
      );
    }
  };

  const handleResetParentPassword = (request: TeacherEnrollmentRequest) => {
    if (!token) {
      Alert.alert("Error", "No authentication token.");
      return;
    }

    Alert.alert(
      "Reset Parent Password",
      `Generate a new temporary password for ${request.parent.firstName} ${request.parent.lastName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await resetEnrollmentRequestParentPassword(
                token,
                request._id,
              );

              showCredentialsAlert(
                "Parent Credentials Updated",
                response.credentials,
              );

              void refreshSubmitted();
            } catch (error: any) {
              Alert.alert(
                "Reset Error",
                error?.message || "Failed to reset parent password.",
              );
            }
          },
        },
      ],
    );
  };

  const childFullName = [firstName, middleName, lastName]
    .filter((value) => String(value || "").trim().length > 0)
    .join(" ");
  const computedChildAge = dateOfBirth
    ? computeAgeFromDateOfBirth(dateOfBirth)
    : 0;

  const parentFullName = [parentFirstName, parentMiddleName, parentLastName]
    .filter((value) => String(value || "").trim().length > 0)
    .join(" ");
  const assignedCenterSource = useMemo(() => {
    const selectedCenter = enrollmentCenters.find(
      (center) => center._id === daycareCenterId,
    );
    return selectedCenter || assignedTeacherCenter;
  }, [enrollmentCenters, daycareCenterId, assignedTeacherCenter]);
  const assignedCenterDisplayInfo = useMemo(
    () => getDaycareCenterDisplay(assignedCenterSource),
    [assignedCenterSource],
  );
  const assignedCenterReviewValue = useMemo(() => {
    const { primary, secondary } = assignedCenterDisplayInfo;
    if (secondary) return `${primary} (${secondary})`;
    return primary;
  }, [assignedCenterDisplayInfo]);
  const assignedCenterPrimary = loadingCenters
    ? "Loading assigned center..."
    : assignedCenterDisplayInfo.primary;
  const assignedCenterSecondary = loadingCenters
    ? ""
    : assignedCenterDisplayInfo.secondary;

  const primaryLabel =
    step < 4 ? "Next" : isSubmitting ? "Submitting..." : "Submit Request";

  const submittedSummary = useMemo(() => {
    const pending = submittedRequests.filter(
      (item) => item.status === "pending",
    ).length;
    const rejected = submittedRequests.filter(
      (item) => item.status === "rejected",
    ).length;
    return {
      all: submittedRequests.length,
      pending,
      rejected,
    };
  }, [submittedRequests]);

  const filteredSubmittedRequests = useMemo(() => {
    const query = submittedSearchQuery.trim().toLowerCase();
    return submittedRequests.filter((request) => {
      if (
        submittedStatusFilter !== "all" &&
        request.status !== submittedStatusFilter
      ) {
        return false;
      }

      if (!query) return true;
      const childName = buildRequestChildName(request).toLowerCase();
      const parentName =
        `${request.parent.firstName} ${request.parent.lastName}`.toLowerCase();
      return childName.includes(query) || parentName.includes(query);
    });
  }, [submittedRequests, submittedStatusFilter, submittedSearchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={["bottom"]}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View
          style={{ paddingTop: insets.top + 12 }}
          className="bg-teal-600 px-5 pb-5"
        >
          <View className="flex-row items-center">
            {hasStarted && (
              <Pressable
                onPress={() => {
                  if (step > 1) {
                    previousStep();
                  } else {
                    resetForm();
                  }
                }}
                className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white/20 active:bg-white/30"
              >
                <ChevronLeft size={24} color="white" />
              </Pressable>
            )}
            <View className="flex-1">
              <Text className="text-3xl font-extrabold text-white">
                Child Enrollment
              </Text>
              <Text className="mt-1 text-lg text-teal-100">
                Submit and track enrollment requests
              </Text>
            </View>
          </View>
        </View>

        {!hasStarted ? (
          <EnrollmentTabSwitcher activeTab={activeTab} onChange={setActiveTab} />
        ) : null}
        {activeTab === "new" ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: contentPadding,
              paddingTop: 16,
              paddingBottom: 36,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              className="w-full self-center"
              style={{ maxWidth: contentMaxWidth }}
            >
              {!hasStarted ? (
                <EnrollmentStartState
                  onStart={() => {
                    setHasStarted(true);
                    setStep(1);
                  }}
                />
              ) : (
                <>
                  <View
                    className="mb-2 rounded-2xl border border-gray-200 bg-white px-3 py-3"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.05,
                      shadowRadius: 6,
                      elevation: 2,
                    }}
                  >
                    <StepProgress step={step} />
                  </View>

                  {step === 1 ? (
                    <ChildInfoStepSection
                      firstName={firstName}
                      setFirstName={setFirstName}
                      middleName={middleName}
                      setMiddleName={setMiddleName}
                      lastName={lastName}
                      setLastName={setLastName}
                      dateOfBirth={dateOfBirth}
                      onPickDateOfBirth={() => openDatePicker("dateOfBirth")}
                      computedChildAge={computedChildAge}
                      gender={gender}
                      setGender={setGender}
                      enrollmentDate={enrollmentDate}
                      onPickEnrollmentDate={() =>
                        openDatePicker("enrollmentDate")
                      }
                      assignedCenterPrimary={assignedCenterPrimary}
                      assignedCenterSecondary={assignedCenterSecondary}
                      programType={programType}
                      setProgramType={setProgramType}
                      schoolYear={schoolYear}
                    />
                  ) : null}

                  {step === 2 ? (
                    <ParentInfoStepSection
                      parentFirstName={parentFirstName}
                      setParentFirstName={setParentFirstName}
                      parentMiddleName={parentMiddleName}
                      setParentMiddleName={setParentMiddleName}
                      parentLastName={parentLastName}
                      setParentLastName={setParentLastName}
                      parentEmail={parentEmail}
                      setParentEmail={setParentEmail}
                      parentPhone={parentPhone}
                      setParentPhone={setParentPhone}
                    />
                  ) : null}

                  {step === 3 ? (
                    <DocumentsStepSection
                      isWide={isWide}
                      birthCertificateFile={birthCertificateFile}
                      parentIdFile={parentIdFile}
                      onPickBirthCertificate={() =>
                        void pickDocument("birthCertificate", "file")
                      }
                      onPickParentId={() => void pickDocument("parentId", "file")}
                      onClearBirthCertificate={() => setBirthCertificateFile(null)}
                      onClearParentId={() => setParentIdFile(null)}
                    />
                  ) : null}

                  {step === 4 ? (
                    <ReviewSubmitStepSection
                      childFullName={childFullName}
                      dateOfBirth={dateOfBirth}
                      computedChildAge={computedChildAge}
                      gender={gender}
                      enrollmentDate={enrollmentDate}
                      assignedCenterReviewValue={assignedCenterReviewValue}
                      programType={programType}
                      schoolYear={schoolYear}
                      parentFullName={parentFullName}
                      parentEmail={parentEmail}
                      parentPhone={parentPhone}
                      hasBirthCertificate={Boolean(birthCertificateFile)}
                      hasParentId={Boolean(parentIdFile)}
                    />
                  ) : null}

                  <View className="mt-5 flex-row gap-3">
                    <Pressable
                      onPress={step === 1 ? resetForm : previousStep}
                      className="active:scale-95"
                      style={[
                        enrollFieldStyles.footerBtn,
                        enrollFieldStyles.footerBtnSecondary,
                      ]}
                    >
                      <Text className="text-center text-lg font-semibold text-gray-900">
                        {step === 1 ? "Cancel" : "Back"}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={step < 4 ? nextStep : submitEnrollment}
                      disabled={isSubmitting}
                      className="active:scale-95"
                      style={[
                        enrollFieldStyles.footerBtn,
                        isSubmitting
                          ? enrollFieldStyles.footerBtnPrimaryDisabled
                          : enrollFieldStyles.footerBtnPrimaryIdle,
                        !isSubmitting && {
                          shadowColor: "#0D9488",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 4,
                        },
                      ]}
                    >
                      <Text className="text-center text-lg font-bold text-white">
                        {primaryLabel}
                      </Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        ) : (
          <ScrollView
            className="flex-1"
            refreshControl={
              <RefreshControl
                refreshing={loadingSubmitted}
                onRefresh={() => {
                  void refreshSubmitted();
                }}
                tintColor="#0D9488"
              />
            }
            contentContainerStyle={{
              paddingHorizontal: contentPadding,
              paddingTop: 16,
              paddingBottom: 36,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <View
              className="w-full self-center"
              style={{ maxWidth: contentMaxWidth }}
            >
              <SubmittedRequestsPanel
                submittedSummary={submittedSummary}
                submittedStatusFilter={submittedStatusFilter}
                setSubmittedStatusFilter={setSubmittedStatusFilter}
                submittedSearchQuery={submittedSearchQuery}
                setSubmittedSearchQuery={setSubmittedSearchQuery}
                loadingSubmitted={loadingSubmitted}
                submittedRequests={submittedRequests}
                filteredSubmittedRequests={filteredSubmittedRequests}
                onViewParentPassword={handleViewParentPassword}
                onResetParentPassword={handleResetParentPassword}
              />
            </View>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {pickerVisible && pickerField ? (
        <Modal transparent animationType="slide" visible={pickerVisible}>
          <View className="flex-1 justify-end bg-black/30">
            <View className="rounded-t-3xl bg-white px-4 pb-6 pt-4">
              <View className="mb-3 flex-row items-center justify-between">
                <Pressable onPress={closePicker}>
                  <Text className="text-lg font-semibold text-gray-600">
                    Cancel
                  </Text>
                </Pressable>
                <Text className="text-base font-semibold text-gray-700">
                  {pickerField === "dateOfBirth"
                    ? "Select Date of Birth"
                    : "Select Enrollment Date"}
                </Text>
                <Pressable onPress={confirmPicker}>
                  <Text className="text-lg font-bold text-teal-600">Done</Text>
                </Pressable>
              </View>

              {pickerMode === "native" &&
              Platform.OS === "ios" &&
              NativeDateTimePicker ? (
                <NativeDateTimePicker
                  value={pickerDate}
                  mode="date"
                  display="spinner"
                  minimumDate={
                    pickerField === "dateOfBirth" ? minDateOfBirth : undefined
                  }
                  maximumDate={
                    pickerField === "dateOfBirth" ? maxDateOfBirth : undefined
                  }
                  onChange={(_: any, selectedDate?: Date) => {
                    if (selectedDate) setPickerDate(selectedDate);
                  }}
                />
              ) : (
                <View>
                  <Text className="mb-2 text-sm font-semibold text-gray-500">
                    Enter date as YYYY-MM-DD
                  </Text>
                  <TextInput
                    value={pickerInput}
                    onChangeText={(value) => {
                      setPickerInput(value.replace(/[^0-9-]/g, "").slice(0, 10));
                    }}
                    autoCapitalize="none"
                    autoCorrect={false}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#9CA3AF"
                    style={{
                      borderWidth: 1.5,
                      borderColor: "#D1D5DB",
                      borderRadius: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      fontSize: 16,
                      color: "#111827",
                    }}
                  />
                  {pickerField === "dateOfBirth" ? (
                    <Text className="mt-2 text-xs text-gray-500">
                      Allowed range: {displayDate(formatYmd(minDateOfBirth))} to{" "}
                      {displayDate(formatYmd(maxDateOfBirth))}
                    </Text>
                  ) : (
                    <Text className="mt-2 text-xs text-gray-500">
                      Example: {formatYmd(new Date())}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}
