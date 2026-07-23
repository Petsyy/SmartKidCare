import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { updateChild } from "@/api/child.api";
import { getUsers, type User } from "@/api/authentication.api";
import { showErrorModal } from "@/utils/sweetAlertModal";
import { editChildSchema, type EditChildFormValues } from "@/utils/formValidation";
import { formatConfidentialName, maskNamePart } from "@/utils/namePrivacy";
import { type ChildForEdit } from "./edit-child-modal";

type UseEditChildFormProps = {
  child: ChildForEdit;
  onClose: () => void;
  onUpdated: (updated: ChildForEdit) => void;
};

const formatDateForInput = (d: string | Date | undefined) => {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
};

const calculateSchoolYear = (enrollmentDate: string) => {
  if (!enrollmentDate) return "";
  const year = new Date(enrollmentDate).getFullYear();
  if (isNaN(year)) return "";
  return `${year}-${year + 1}`;
};

const getInitialForm = (child: ChildForEdit): EditChildFormValues => ({
  firstName: child.firstName,
  middleName: child.middleName ?? "",
  lastName: child.lastName,
  dateOfBirth: formatDateForInput(child.dateOfBirth),
  age: String(child.age),
  gender: child.gender as "male" | "female",
  enrollmentDate: formatDateForInput(child.enrollmentDate),
  schoolYear:
    calculateSchoolYear(formatDateForInput(child.enrollmentDate)) || child.schoolYear,
  teacherId: child.teacher?._id || "",
});

export const useEditChildForm = ({ child, onClose, onUpdated }: UseEditChildFormProps) => {
  const queryClient = useQueryClient();
  const [revealChildName, setRevealChildName] = useState(false);

  const form = useForm<EditChildFormValues>({
    resolver: zodResolver(editChildSchema),
    defaultValues: getInitialForm(child),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { reset, watch } = form;

  useEffect(() => {
    reset(getInitialForm(child));
    setRevealChildName(false);
  }, [child, reset]);

  const { data: teachers = [], isLoading: loadingTeachers } = useQuery<User[]>({
    queryKey: ["teachers"],
    queryFn: () => getUsers({ role: "teacher" }),
    select: (data) => data.filter((t) => t.role === "teacher" && t.isActive !== false),
  });

  const mutation = useMutation({
    mutationFn: (data: EditChildFormValues) =>
      updateChild(child._id, {
        firstName: data.firstName,
        middleName: data.middleName || undefined,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth,
        age: Number(data.age),
        gender: data.gender,
        enrollmentDate: data.enrollmentDate,
        schoolYear: data.schoolYear,
        teacherId: data.teacherId || null,
      }),
    onSuccess: (updated) => {
      // Need to cast because API response might slightly differ from ChildForEdit but it's compatible
      onUpdated(updated as unknown as ChildForEdit);
      onClose();
      void queryClient.invalidateQueries({ queryKey: ["children"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update child";
      showErrorModal(message);
    },
  });

  // Masking helpers
  const firstName = watch("firstName");
  const middleName = watch("middleName");
  const lastName = watch("lastName");

  const maskedChildName = formatConfidentialName({ firstName, middleName, lastName }) || "N/A";
  const firstNameInputValue = revealChildName ? firstName : maskNamePart(firstName);
  const middleNameInputValue = revealChildName ? middleName : maskNamePart(middleName);
  const lastNameInputValue = revealChildName ? lastName : maskNamePart(lastName);

  // Age calculations for date picker min/max
  const today = new Date();
  const minAgeDate = new Date(today.getFullYear() - 6, today.getMonth(), today.getDate() + 1)
    .toISOString()
    .slice(0, 10);
  const maxAgeDate = new Date(today.getFullYear() - 3, today.getMonth(), today.getDate())
    .toISOString()
    .slice(0, 10);

  return {
    form,
    teachers,
    loadingTeachers,
    isSubmitting: mutation.isPending,
    onSubmit: form.handleSubmit((data) => mutation.mutate(data)),
    
    // Privacy state
    revealChildName,
    setRevealChildName,
    maskedChildName,
    firstNameInputValue,
    middleNameInputValue,
    lastNameInputValue,
    
    // Date limits
    minAgeDate,
    maxAgeDate,
  };
};
