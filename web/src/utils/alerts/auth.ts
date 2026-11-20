import Swal from "sweetalert2";
import type { TeacherCredentials } from "./users";

export const showResetPasswordModal = (credentials: TeacherCredentials) => {
  return Swal.fire({
    title: "Password Reset Successful",
    html: `
      <div style="padding: 20px; text-align: center;">
        <p style="margin-bottom: 16px;">
          A new temporary password has been generated for this user.
        </p>

        <div style="margin: 24px 0;">
          <p style="margin-bottom: 8px; font-weight: 600;">
            Temporary Password
          </p>
          <span style="
            font-family: monospace;
            background: #f3f4f6;
            padding: 12px 20px;
            border-radius: 6px;
            display: inline-block;
            font-size: 18px;
            letter-spacing: 1px;
          ">
            ${credentials.tempPassword}
          </span>
        </div>

        <p style="color: #DC2626; font-size: 14px; margin-top: 16px;">
          ⚠ <strong>Security Notice:</strong><br>
          The user will be required to change this password on their next login.
        </p>
      </div>
    `,
    icon: "success",
    confirmButtonText: "Done",
    confirmButtonColor: "#0D9488",
    allowOutsideClick: false,
  });
};
