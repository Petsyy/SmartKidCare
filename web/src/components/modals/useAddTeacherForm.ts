import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createTeacher } from "@/api/teacher.api";
import { getDaycareCenters, type DaycareCenter } from "@/api/daycare-center.api";
import { showTeacherCredentialsModal, showErrorModal } from "@/utils/sweetAlertModal";
import { addTeacherSchema, type AddTeacherFormValues } from "@/utils/formValidation";

type UseAddTeacherFormProps = {
  onClose: () => void;
  onCreated: () => void;
};

const EMPTY_FORM: AddTeacherFormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  phone: "",
  daycareCenterId: "",
};

export const useAddTeacherForm = ({ onClose, onCreated }: UseAddTeacherFormProps) => {
  const queryClient = useQueryClient();

  const form = useForm<AddTeacherFormValues>({
    resolver: zodResolver(addTeacherSchema),
    defaultValues: EMPTY_FORM,
    mode: "onBlur",
    reValidateMode: "onChange",
  });

  const { data: centers = [], isLoading: loadingCenters } = useQuery<DaycareCenter[]>({
    queryKey: ["daycare-centers"],
    queryFn: getDaycareCenters,
    select: (data) => data.filter((center) => center.isActive !== false),
  });

  const mutation = useMutation({
    mutationFn: (data: AddTeacherFormValues) => createTeacher(data),
    onSuccess: (res, variables) => {
      onClose();
      // Invalidate queries if needed
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      
      setTimeout(async () => {
        await showTeacherCredentialsModal(
          variables.firstName,
          variables.lastName,
          res.credentials.email,
          res.emailDelivery,
        );
        onCreated();
      }, 150);
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : "Failed to create teacher";
      showErrorModal(message);
    },
  });

  return {
    form,
    centers,
    loadingCenters,
    isSubmitting: mutation.isPending,
    onSubmit: form.handleSubmit((data) => mutation.mutate(data)),
  };
};
