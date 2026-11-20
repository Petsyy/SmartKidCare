import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { addCenterSchema, type AddCenterFormData } from "../validations";
import type { DaycareCenter } from "../types";

type UseAddCenterFormProps = {
  onAdd: (data: Partial<DaycareCenter>) => Promise<void>;
  onClose: () => void;
};

export function useAddCenterForm({ onAdd, onClose }: UseAddCenterFormProps) {
  const form = useForm<AddCenterFormData>({
    resolver: zodResolver(addCenterSchema),
    defaultValues: {
      name: "",
      barangay: "",
      address: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: AddCenterFormData) => {
      await onAdd(data);
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
