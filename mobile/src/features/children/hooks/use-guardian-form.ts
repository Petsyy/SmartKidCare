import { useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { getChildById } from "@/src/api/parent.api";
import type { Guardian } from "@/src/api/api.types";
import { useDocumentPicker } from "@/src/features/enrollment/hooks/useDocumentPicker";
import { useDocumentVerification } from "@/src/features/documents/hooks";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import {
  getUserFriendlyErrorMessage,
  reportHandledError,
} from "@/src/lib/error-reporting";
import {
  guardianSchema,
  type GuardianFormValues,
} from "../validations/guardian-validation";
import { useGuardians } from "./useGuardian";

const emptyValues: GuardianFormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  relationship: "Guardian",
  customRelationship: null,
  phone: "",
};

export function useGuardianForm(
  childId: string | null,
  guardianIndex: number | null,
  onSaved: () => void,
) {
  const queryClient = useQueryClient();
  const { pickDocument } = useDocumentPicker();
  const guardiansState = useGuardians(childId || undefined);
  const documentVerification = useDocumentVerification();
  const guardianVerification = documentVerification.guardianId;
  const clearVerification = documentVerification.clear;
  const [guardianIdFile, setGuardianIdFile] = useState<any>(null);
  const [initializedGuardianId, setInitializedGuardianId] = useState<
    string | null
  >(null);
  const isEditMode = guardianIndex !== null;

  const childQuery = useQuery({
    queryKey: mobileQueryKeys.teacherChildDetails(childId || "missing"),
    queryFn: () => getChildById(childId!),
    enabled: Boolean(childId),
    networkMode: "always",
  });

  const form = useForm<GuardianFormValues>({
    resolver: zodResolver(guardianSchema),
    mode: "onChange",
    defaultValues: emptyValues,
  });
  const firstName = form.watch("firstName");
  const lastName = form.watch("lastName");
  const relationship = form.watch("relationship");
  const selectedGuardian =
    guardianIndex === null ? null : guardiansState.guardians[guardianIndex];

  useEffect(() => {
    if (!isEditMode || !selectedGuardian) return;
    const identity = selectedGuardian._id || String(guardianIndex);
    if (initializedGuardianId === identity) return;
    form.reset({
      firstName: selectedGuardian.firstName,
      middleName: selectedGuardian.middleName || "",
      lastName: selectedGuardian.lastName,
      relationship: selectedGuardian.relationship,
      customRelationship: selectedGuardian.customRelationship || null,
      phone: selectedGuardian.phone,
    });
    setInitializedGuardianId(identity);
  }, [
    form,
    guardianIndex,
    initializedGuardianId,
    isEditMode,
    selectedGuardian,
  ]);

  useEffect(() => {
    clearVerification("guardianId");
  }, [clearVerification, firstName, lastName]);

  const nameChanged = Boolean(
    selectedGuardian &&
    (selectedGuardian.firstName.trim().toLowerCase() !==
      firstName.trim().toLowerCase() ||
      selectedGuardian.lastName.trim().toLowerCase() !==
        lastName.trim().toLowerCase()),
  );
  const requiresVerification =
    !isEditMode || Boolean(guardianIdFile) || nameChanged;
  const verificationEligible =
    documentVerification.isEligible(guardianVerification);
  const saveDisabled =
    guardiansState.isOffline ||
    guardiansState.isMutating ||
    !form.formState.isValid ||
    guardianVerification.state === "checking" ||
    Boolean(guardianVerification.pendingAction) ||
    (requiresVerification && (!guardianIdFile || !verificationEligible));

  const verifyGuardianId = () => {
    if (guardiansState.isOffline) {
      Alert.alert(
        "Connection Required",
        "Connect to the internet to verify a guardian ID.",
      );
      return;
    }
    if (!guardianIdFile || !firstName.trim() || !lastName.trim()) return;
    void documentVerification.verify("guardianId", guardianIdFile, {
      guardianFirstName: firstName,
      guardianLastName: lastName,
    });
  };

  const pickGuardianId = async () => {
    if (guardiansState.isOffline) {
      Alert.alert(
        "Connection Required",
        "Connect to the internet to upload and verify a guardian ID.",
      );
      return;
    }
    const file = await pickDocument("parentId", "image");
    if (!file) return;
    setGuardianIdFile(file);
    clearVerification("guardianId");
    if (firstName.trim() && lastName.trim()) {
      await documentVerification.verify("guardianId", file, {
        guardianFirstName: firstName,
        guardianLastName: lastName,
      });
    }
  };

  const clearGuardianId = () => {
    setGuardianIdFile(null);
    clearVerification("guardianId");
  };

  const save = form.handleSubmit(async (values) => {
    if (!childId || saveDisabled) return;
    try {
      const payload: Partial<Guardian> = {
        firstName: values.firstName,
        middleName: values.middleName?.trim() || null,
        lastName: values.lastName,
        relationship: values.relationship,
        customRelationship: values.customRelationship || null,
        phone: values.phone,
        idUrl: selectedGuardian?.idUrl || null,
        documentVerificationId: requiresVerification
          ? guardianVerification.result?.verificationId
          : undefined,
      };
      if (isEditMode) {
        await guardiansState.updateGuardian({
          index: guardianIndex!,
          data: payload,
          files: { guardianId: guardianIdFile },
        });
      } else {
        await guardiansState.addGuardian({
          data: payload,
          files: { guardianId: guardianIdFile },
        });
      }
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: mobileQueryKeys.teacherChildrenOverview(),
        }),
        queryClient.invalidateQueries({
          queryKey: mobileQueryKeys.teacherChildDetails(childId),
        }),
      ]);
      form.reset(values);
      setGuardianIdFile(null);
      onSaved();
    } catch (error: unknown) {
      reportHandledError("guardian.form.save", error);
      Alert.alert(
        "Unable to Save Guardian",
        getUserFriendlyErrorMessage(
          error,
          "The guardian could not be saved. Please try again.",
        ),
      );
    }
  });

  const childName = useMemo(() => {
    const child = childQuery.data;
    if (!child) return "";
    return [child.firstName, child.middleName, child.lastName]
      .filter(Boolean)
      .join(" ");
  }, [childQuery.data]);

  return {
    form,
    firstName,
    lastName,
    relationship,
    guardianIdFile,
    guardianVerification,
    selectedGuardian,
    isEditMode,
    childName,
    childQuery,
    guardiansState,
    requiresVerification,
    saveDisabled,
    hasUnsavedChanges: form.formState.isDirty || Boolean(guardianIdFile),
    pickGuardianId,
    clearGuardianId,
    verifyGuardianId,
    confirmGuardianId: () => documentVerification.confirm("guardianId"),
    save,
  };
}
