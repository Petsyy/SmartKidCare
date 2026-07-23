import { useState, useMemo } from "react";
import { Alert } from "react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { addYears, computeSchoolYear, formatYmd, toIsoUtc, validateDocument } from "@/src/features/enrollment/utils";
import { computeAgeFromDateOfBirth, childEnrollmentStepOneSchema, childEnrollmentStepTwoSchema } from "@/src/validations/child-enrollment-validation";
import DocumentPicker from "expo-document-picker";

const enrollmentSchema = z.intersection(childEnrollmentStepOneSchema, childEnrollmentStepTwoSchema);
export type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;

export const useEnrollmentForm = () => {
  const defaultEnrollmentDate = useMemo(() => formatYmd(new Date()), []);
  const defaultSchoolYear = useMemo(() => computeSchoolYear(defaultEnrollmentDate), [defaultEnrollmentDate]);
  const today = useMemo(() => new Date(), []);
  const minDateOfBirth = useMemo(() => addYears(today, -5), [today]);
  const maxDateOfBirth = useMemo(() => addYears(today, -3), [today]);

  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "male",
      programType: "" as any,
      enrollmentDate: defaultEnrollmentDate,
      schoolYear: defaultSchoolYear,
      daycareCenterId: "",
      parentFirstName: "",
      parentMiddleName: "",
      parentLastName: "",
      parentEmail: "",
      parentPhone: "",
    },
    mode: "onChange",
  });

  const { watch, setValue, trigger, reset, getValues } = form;

  // Document fields
  const [birthCertificateFile, setBirthCertificateFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [parentIdFile, setParentIdFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // Watch for computed values
  const dateOfBirth = watch("dateOfBirth");
  const enrollmentDate = watch("enrollmentDate");

  const childFullName = useMemo(
    () => [watch("firstName"), watch("middleName"), watch("lastName")].filter((v) => String(v || "").trim().length > 0).join(" "),
    [watch("firstName"), watch("middleName"), watch("lastName")]
  );

  const computedChildAge = dateOfBirth ? computeAgeFromDateOfBirth(dateOfBirth) : 0;

  const parentFullName = useMemo(
    () => [watch("parentFirstName"), watch("parentMiddleName"), watch("parentLastName")].filter((v) => String(v || "").trim().length > 0).join(" "),
    [watch("parentFirstName"), watch("parentMiddleName"), watch("parentLastName")]
  );

  const resetForm = () => {
    reset();
    setBirthCertificateFile(null);
    setParentIdFile(null);
  };

  // Validation functions
  const validateStepOne = async () => {
    const isValid = await trigger([
      "firstName",
      "middleName",
      "lastName",
      "dateOfBirth",
      "gender",
      "daycareCenterId",
      "programType",
      "enrollmentDate",
      "schoolYear",
    ]);
    if (!isValid) {
      const errors = form.formState.errors;
      const firstError = Object.values(errors)[0] as { message?: string } | undefined;
      if (firstError?.message) {
        Alert.alert("Validation", firstError.message);
      } else {
        Alert.alert("Validation", "Please complete the child information.");
      }
    }
    return isValid;
  };

  const validateStepTwo = async () => {
    const isValid = await trigger([
      "parentFirstName",
      "parentMiddleName",
      "parentLastName",
      "parentEmail",
      "parentPhone",
    ]);
    if (!isValid) {
      const errors = form.formState.errors;
      const firstError = Object.values(errors)[0] as { message?: string } | undefined;
      if (firstError?.message) {
        Alert.alert("Validation", firstError.message);
      } else {
        Alert.alert("Validation", "Please complete the parent information.");
      }
    }
    return isValid;
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

  const getSubmissionData = () => {
    const values = getValues();
    const age = computeAgeFromDateOfBirth(values.dateOfBirth);
    return {
      childData: {
        firstName: values.firstName.trim(),
        middleName: values.middleName?.trim() || undefined,
        lastName: values.lastName.trim(),
        dateOfBirth: toIsoUtc(values.dateOfBirth),
        age,
        gender: values.gender,
        programType: values.programType,
        daycareCenterId: values.daycareCenterId.trim(),
        enrollmentDate: toIsoUtc(values.enrollmentDate),
        schoolYear: values.schoolYear.trim(),
      },
      parentData: {
        parentFirstName: values.parentFirstName.trim(),
        parentMiddleName: values.parentMiddleName?.trim() || undefined,
        parentLastName: values.parentLastName.trim(),
        parentEmail: values.parentEmail.trim().toLowerCase(),
        parentPhone: values.parentPhone.trim(),
      },
      documentData: {
        birthCertificate: birthCertificateFile
          ? {
              uri: birthCertificateFile.uri,
              name: birthCertificateFile.name,
              mimeType: birthCertificateFile.mimeType || "application/octet-stream",
            }
          : null,
        parentId: parentIdFile
          ? {
              uri: parentIdFile.uri,
              name: parentIdFile.name,
              mimeType: parentIdFile.mimeType || "application/octet-stream",
            }
          : null,
      },
    };
  };

  return {
    form, // RHF methods and state
    control: form.control,

    // Expose commonly used values explicitly if needed, but mostly we use form.watch() in parent
    dateOfBirth,
    enrollmentDate,
    daycareCenterId: watch("daycareCenterId"),
    gender: watch("gender"),
    programType: watch("programType"),
    schoolYear: watch("schoolYear"),
    parentEmail: watch("parentEmail"),
    parentPhone: watch("parentPhone"),

    setDateOfBirth: (val: string) => setValue("dateOfBirth", val, { shouldValidate: true }),
    setEnrollmentDate: (val: string) => setValue("enrollmentDate", val, { shouldValidate: true }),
    setSchoolYear: (val: string) => setValue("schoolYear", val, { shouldValidate: true }),
    setDaycareCenterId: (val: string) => setValue("daycareCenterId", val, { shouldValidate: true }),
    setGender: (val: "male" | "female") => setValue("gender", val, { shouldValidate: true }),
    setProgramType: (val: any) => setValue("programType", val, { shouldValidate: true }),

    // Documents
    birthCertificateFile,
    setBirthCertificateFile,
    parentIdFile,
    setParentIdFile,

    // Computed values
    childFullName,
    computedChildAge,
    parentFullName,

    // Helpers
    resetForm,
    validateStepOne,
    validateStepTwo,
    validateStepThree,
    getSubmissionData,
    minDateOfBirth,
    maxDateOfBirth,
  };
};
