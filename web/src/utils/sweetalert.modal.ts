import Swal from "sweetalert2";

export interface ParentCredentials {
  email: string;
  password: string;
  message?: string;
}

export const showParentCredentialsModal = (credentials: ParentCredentials) => {
  Swal.fire({
    title: "Parent Account Created",
    html: `<div style="text-align: left; padding: 20px;">
      <p><strong>Email:</strong> <span style="font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${credentials.email}</span></p>
      <p><strong>Password:</strong> <span style="font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${credentials.password}</span></p>
      <p style="color: #666; margin-top: 15px; font-size: 14px;">Share these credentials with the parent so they can log in to the mobile app.</p>
    </div>`,
    icon: "success",
    confirmButtonText: "Done",
    confirmButtonColor: "#0D9488",
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
};

export const showErrorModal = (errorMessage: string) => {
  Swal.fire({
    title: "Error",
    text: errorMessage,
    icon: "error",
    confirmButtonText: "Close",
    confirmButtonColor: "#DC2626",
  });
};
