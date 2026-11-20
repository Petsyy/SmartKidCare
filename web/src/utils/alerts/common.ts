import Swal from "sweetalert2";

export const showErrorModal = (errorMessage: string) => {
  return Swal.fire({
    title: "Error",
    text: errorMessage,
    icon: "error",
    confirmButtonText: "Close",
    confirmButtonColor: "#DC2626",
  });
};
