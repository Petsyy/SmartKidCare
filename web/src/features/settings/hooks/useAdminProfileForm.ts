import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import type { AdminProfileForm, UseAdminProfileFormProps } from "../types";
import { adminProfileSchema } from "../validations";
import { showAdminProfileSavedModal } from "@/utils/alerts";

export function useAdminProfileForm({
  profile,
  saveProfile,
}: UseAdminProfileFormProps) {
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  const [profileSnapshot, setProfileSnapshot] =
    useState<AdminProfileForm | null>(null);
  const [profileState, setProfileState] = useState<{
    saving: boolean;
    success: string | null;
    error: string | null;
  }>({
    saving: false,
    success: null,
    error: null,
  });

  const profileForm = useForm<AdminProfileForm>({
    defaultValues: profile,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { reset: resetProfileForm, getValues: getProfileValues } = profileForm;

  const validateProfileField = (
    key: keyof AdminProfileForm,
    value: string,
  ): string | undefined => {
    const fieldSchema = adminProfileSchema.shape[key];
    if (!fieldSchema) return undefined;
    const result = fieldSchema.safeParse(value);
    return result.success ? undefined : result.error.issues[0]?.message;
  };

  useEffect(() => {
    resetProfileForm(profile);
  }, [profile, resetProfileForm]);

  const onSubmitProfile = async (form: AdminProfileForm) => {
    if (!isProfileEditing) {
      return;
    }

    const profileKeys: Array<keyof AdminProfileForm> = [
      "username",
      "firstName",
      "middleName",
      "lastName",
      "email",
      "phone",
    ];
    const hasErrors = profileKeys.some((key) =>
      Boolean(validateProfileField(key, String(form[key] ?? ""))),
    );
    if (hasErrors) {
      setProfileState({
        saving: false,
        success: null,
        error: "Please fix the highlighted fields.",
      });
      return;
    }

    setProfileState({ saving: true, success: null, error: null });

    try {
      const savedProfile = await saveProfile(form);
      setProfileState({
        saving: false,
        success: "Profile updated successfully.",
        error: null,
      });
      setIsProfileEditing(false);
      setProfileSnapshot(null);
      resetProfileForm(savedProfile);
      await showAdminProfileSavedModal();
    } catch (error: unknown) {
      setProfileState({
        saving: false,
        success: null,
        error:
          error instanceof Error ? error.message : "Failed to update profile.",
      });
    }
  };

  const handleEnableProfileEdit = () => {
    setProfileSnapshot({ ...getProfileValues() });
    setProfileState({ saving: false, success: null, error: null });
    setIsProfileEditing(true);
  };

  const handleCancelProfileEdit = () => {
    if (profileSnapshot) {
      resetProfileForm({ ...profileSnapshot });
    }
    setIsProfileEditing(false);
    setProfileSnapshot(null);
    setProfileState({ saving: false, success: null, error: null });
  };

  const profileFormValues = useWatch({
    control: profileForm.control,
    defaultValue: profile,
  });

  const requiredProfileCount = [
    profileFormValues.username,
    profileFormValues.firstName,
    profileFormValues.middleName,
    profileFormValues.lastName,
    profileFormValues.email,
    profileFormValues.phone,
  ].filter((value) => (value ?? "").trim().length > 0).length;
  const profileCompletion = Math.round((requiredProfileCount / 6) * 100);

  return {
    isProfileEditing,
    profileState,
    profileForm,
    profileCompletion,
    validateProfileField,
    onSubmitProfile,
    handleEnableProfileEdit,
    handleCancelProfileEdit,
  };
}
