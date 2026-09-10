import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { updateChild } from "@/api/child.api";
import { getUsers, type User } from "@/api/authentication.api";
import { showErrorModal } from "@/utils/sweet-alert-modal";
import { editChildSchema, type EditChildFormValues } from "@/utils/form-validation";
import type { ChildForEdit } from "../components/EditChildModal";

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
  homeAddress: child.homeAddress ?? "",
  parentRelationship: (child.parentRelationship || "Other") as EditChildFormValues["parentRelationship"],
  weight: child.weight ? String(child.weight) : "",
  height: child.height ? String(child.height) : "",
  enrollmentDate: formatDateForInput(child.enrollmentDate),
  schoolYear:
    calculateSchoolYear(formatDateForInput(child.enrollmentDate)) || child.schoolYear,
  teacherId: child.teacher?._id || "",
});

export const useEditChildForm = ({ child, onClose, onUpdated }: UseEditChildFormProps) => {
  const queryClient = useQueryClient();
  const form = useForm<EditChildFormValues>({
    resolver: zodResolver(editChildSchema),
    defaultValues: getInitialForm(child),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { reset } = form;

  useEffect(() => {
    reset(getInitialForm(child));
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
        homeAddress: data.homeAddress,
        parentRelationship: data.parentRelationship,
        weight: Number(data.weight),
        height: Number(data.height),
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

    // Date limits
    minAgeDate,
    maxAgeDate,
  };
};
