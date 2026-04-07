import { useState, useMemo } from "react";
import { Alert } from "react-native";
import { addYears, computeSchoolYear, formatYmd, toIsoUtc, validateDocument } from "@/src/features/enrollment/utils";
import { computeAgeFromDateOfBirth, validateChildEnrollmentStepOne, validateChildEnrollmentStepTwo } from "@/src/validations/child-enrollment-validation";
import DocumentPicker from "expo-document-picker";
import type { ProgramType, Step } from "@/src/features/enrollment/types";

export const useEnrollmentForm = () => {
  const defaultEnrollmentDate = useMemo(() => formatYmd(new Date()), []);
  const defaultSchoolYear = useMemo(() => computeSchoolYear(defaultEnrollmentDate), [defaultEnrollmentDate]);
  const today = useMemo(() => new Date(), []);
  const minDateOfBirth = useMemo(() => addYears(today, -5), [today]);
  const maxDateOfBirth = useMemo(() => addYears(today, -3), [today]);

  // Child form fields
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [programType, setProgramType] = useState<ProgramType | "">("");
  const [enrollmentDate, setEnrollmentDate] = useState(defaultEnrollmentDate);
  const [schoolYear, setSchoolYear] = useState(defaultSchoolYear);
  const [daycareCenterId, setDaycareCenterId] = useState("");

  // Parent form fields
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentMiddleName, setParentMiddleName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");

  // Document fields
  const [birthCertificateFile, setBirthCertificateFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [parentIdFile, setParentIdFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);

  // Computed values
  const childFullName = useMemo(
    () => [firstName, middleName, lastName].filter((v) => String(v || "").trim().length > 0).join(" "),
    [firstName, middleName, lastName]
  );

  const computedChildAge = dateOfBirth ? computeAgeFromDateOfBirth(dateOfBirth) : 0;

  const parentFullName = useMemo(
    () => [parentFirstName, parentMiddleName, parentLastName].filter((v) => String(v || "").trim().length > 0).join(" "),
    [parentFirstName, parentMiddleName, parentLastName]
  );

  const resetForm = () => {
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setDateOfBirth("");
    setGender("male");
    setProgramType("");
    setEnrollmentDate(defaultEnrollmentDate);
    setSchoolYear(defaultSchoolYear);
    setDaycareCenterId("");
    setParentFirstName("");
    setParentMiddleName("");
    setParentLastName("");
    setParentEmail("");
    setParentPhone("");
    setBirthCertificateFile(null);
    setParentIdFile(null);
  };

  // Validation functions
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
      Alert.alert("Validation", result.error.issues[0]?.message || "Please complete the child information.");
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
      Alert.alert("Validation", result.error.issues[0]?.message || "Please complete the parent information.");
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

  const getSubmissionData = () => {
    const age = computeAgeFromDateOfBirth(dateOfBirth);
    return {
      childData: {
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
      },
      parentData: {
        parentFirstName: parentFirstName.trim(),
        parentMiddleName: parentMiddleName.trim() || undefined,
        parentLastName: parentLastName.trim(),
        parentEmail: parentEmail.trim().toLowerCase(),
        parentPhone: parentPhone.trim(),
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
    // Child fields
    firstName,
    setFirstName,
    middleName,
    setMiddleName,
    lastName,
    setLastName,
    dateOfBirth,
    setDateOfBirth,
    gender,
    setGender,
    programType,
    setProgramType,
    enrollmentDate,
    setEnrollmentDate,
    schoolYear,
    setSchoolYear,
    daycareCenterId,
    setDaycareCenterId,

    // Parent fields
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
