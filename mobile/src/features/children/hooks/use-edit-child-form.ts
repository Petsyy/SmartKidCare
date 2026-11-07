import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Child } from "@/src/api/api.types";
import {
  editChildSchema,
  type EditChildFormValues,
} from "../validations/edit-child-validation";
import { useDatePicker } from "@/src/features/enrollment/hooks/useDatePicker";
import { useEditChild } from "./use-edit-child";
import { getChildById } from "@/src/api/parent.api";
import { mobileQueryKeys } from "@/src/lib/query-keys";
import { useOffline } from "@/src/offline/offline-context";

interface UseEditChildFormProps {
  childId: string | null;
  onSuccess: () => void;
}

export function useEditChildForm({ childId, onSuccess }: UseEditChildFormProps) {
  const queryClient = useQueryClient();
  const { isConnected, isInternetReachable } = useOffline();
  const isOffline = !isConnected || !isInternetReachable;

  const {
    data: child,
    isLoading,
    error,
  } = useQuery({
    queryKey: mobileQueryKeys.teacherChildEdit(childId),
    enabled: Boolean(childId) && !isOffline,
    initialData: () => {
      if (!childId) return undefined;
      const details = queryClient.getQueryData<{ child?: Child }>(
        mobileQueryKeys.teacherChildDetails(childId),
      );
      return details?.child;
    },
    queryFn: async () => {
      if (!childId) throw new Error("Missing child ID");
      return getChildById(childId);
    },
  });

  const { mutate: updateChild, isPending } = useEditChild(childId);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isDirty },
  } = useForm<EditChildFormValues>({
    resolver: zodResolver(editChildSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "male",
      homeAddress: "",
      parentRelationship: "Mother",
    },
  });

  const watchDateOfBirth = watch("dateOfBirth");
  const watchGender = watch("gender");
  const watchParentRelationship = watch("parentRelationship");

  useEffect(() => {
    if (child) {
      reset({
        firstName: child.firstName,
        middleName: child.middleName || "",
        lastName: child.lastName,
        dateOfBirth: child.dateOfBirth
          ? new Date(child.dateOfBirth).toISOString().slice(0, 10)
          : "",
        gender: (child.gender as "male" | "female") || "male",
        homeAddress: child.homeAddress || "",
        parentRelationship: (child.parentRelationship as any) || "Mother",
      });
    }
  }, [child, reset]);

  const today = new Date();
  const minDateOfBirth = new Date(
    today.getFullYear() - 6,
    today.getMonth(),
    today.getDate() + 1,
  );
  const maxDateOfBirth = new Date(
    today.getFullYear() - 3,
    today.getMonth(),
    today.getDate(),
  );

  const datePicker = useDatePicker(
    watchDateOfBirth,
    "",
    minDateOfBirth,
    maxDateOfBirth,
    (field, date) => {
      if (field === "dateOfBirth") {
        setValue("dateOfBirth", date, {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
  );

  const onSubmit = (data: EditChildFormValues) => {
    updateChild(data, {
      onSuccess,
    });
  };

  return {
    isOffline,
    child,
    isLoading,
    error,
    control,
    handleSubmit,
    watchGender,
    watchParentRelationship,
    setValue,
    isDirty,
    isPending,
    datePicker,
    onSubmit,
  };
}

