import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { editCenterSchema, type EditCenterFormData } from "../validations";
import type { DaycareCenter } from "../types";

type UseEditCenterFormProps = {
  center: DaycareCenter | null;
  onUpdate: (id: string, data: Partial<DaycareCenter>) => Promise<void>;
  onClose: () => void;
};

export function useEditCenterForm({
  center,
  onUpdate,
  onClose,
}: UseEditCenterFormProps) {
  const form = useForm<EditCenterFormData>({
    resolver: zodResolver(editCenterSchema),
    defaultValues: {
      name: "",
      barangay: "",
      address: "",
    },
  });

  useEffect(() => {
    if (center) {
      form.reset({
        name: center.name || "",
        barangay: center.barangay || "",
        address: center.address || "",
      });
    }
  }, [center, form]);

  const mutation = useMutation({
    mutationFn: async (data: EditCenterFormData) => {
      if (!center) throw new Error("No center selected");
      await onUpdate(center._id, data);
    },
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  return {
    ...form,
    onSubmit,
    isSubmitting: mutation.isPending,
  };
}
