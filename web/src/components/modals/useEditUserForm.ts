import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";
import { type User } from "@/api/authentication.api";
import { updateUser } from "@/api/admin.api";
import { showErrorModal } from "@/utils/sweetAlertModal";
import { editUserSchema, type EditUserFormValues } from "@/utils/formValidation";

type UseEditUserFormProps = {
  user: User;
  onClose: () => void;
  onUpdated: () => Promise<void> | void;
};

const getFormFromUser = (user: User): EditUserFormValues => ({
  firstName: user.firstName,
  middleName: user.middleName || "",
  lastName: user.lastName,
  email: user.email,
  phone: user.phone || "",
});

export const useEditUserForm = ({ user, onClose, onUpdated }: UseEditUserFormProps) => {
  const queryClient = useQueryClient();

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: getFormFromUser(user),
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { reset } = form;

  useEffect(() => {
    reset(getFormFromUser(user));
  }, [user, reset]);

  const mutation = useMutation({
    mutationFn: (data: EditUserFormValues) => updateUser(user._id, data),
    onSuccess: async () => {
      await Swal.fire({
        title: "Success",
        text: "User updated successfully",
        icon: "success",
        confirmButtonColor: "#0D9488",
      });

      onClose();
      await onUpdated();
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to update user";
      showErrorModal(message);
    },
  });

  return {
    form,
    isSubmitting: mutation.isPending,
    onSubmit: form.handleSubmit((data) => mutation.mutate(data)),
  };
};
