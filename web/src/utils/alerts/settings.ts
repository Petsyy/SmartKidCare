import Swal from "sweetalert2";

export const showAdminProfileSavedModal = () => {
  return Swal.fire({
    title: "Profile Saved",
    text: "Admin profile has been updated successfully.",
    icon: "success",
    confirmButtonColor: "#0D9488",
  });
};

export const showAdminPasswordChangedModal = () => {
  return Swal.fire({
    title: "Password Changed",
    text: "Your password has been changed successfully.",
    icon: "success",
    confirmButtonColor: "#0D9488",
  });
};
