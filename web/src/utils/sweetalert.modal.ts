import Swal from "sweetalert2";

export interface ParentCredentials {
  email: string;
  password: string;
  childLinkCode?: string | null;
  message?: string;
}

export const showParentCredentialsModal = (credentials: ParentCredentials) => {
  const isNewParent = Boolean(credentials.password);
  const linkCodeDisplay = credentials.childLinkCode
    ? `<span style="font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px;">${credentials.childLinkCode}</span>`
    : "<span style='color: #6b7280;'>N/A (child linked to this account)</span>";

  const passwordBlock = isNewParent
    ? `<p style="margin-bottom: 12px;"><strong>Temporary password:</strong><br><span style="font-family: monospace; background: #f3f4f6; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 4px;">${credentials.password}</span></p>`
    : "<p style='margin-bottom: 12px; color: #6b7280;'><strong>Password:</strong> No new password — parent already has an account.</p>";

  const footerText = isNewParent
    ? "Share these credentials with the parent so they can log in to the mobile app. The parent should change the temporary password on first login."
    : "Child was linked to the existing parent account. Parent can log in with their current password.";

  Swal.fire({
    title: isNewParent ? "Parent Account Created" : "Child Enrolled",
    html: `<div style="text-align: left; padding: 20px;">
      <p style="margin-bottom: 12px;"><strong>Email:</strong><br><span style="font-family: monospace; background: #f3f4f6; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 4px;">${credentials.email}</span></p>
      ${passwordBlock}
      <p style="margin-bottom: 12px;"><strong>Child link code:</strong><br>${linkCodeDisplay}</p>
      <p style="color: #666; margin-top: 16px; font-size: 14px;">${footerText}</p>
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

export interface TeacherCredentials {
  email: string;
  tempPassword: string;
}

export const showTeacherCredentialsModal = (credentials: TeacherCredentials) => {
  return Swal.fire({
    title: "Teacher Account Created!",
    html: `<div style="text-align: left; padding: 20px;">
      <p style="margin-bottom: 12px;"><strong>Email:</strong><br>
      <span style="font-family: monospace; background: #f3f4f6; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 4px;">${credentials.email}</span></p>
      <p style="margin-bottom: 12px;"><strong>Temporary Password:</strong><br>
      <span style="font-family: monospace; background: #f3f4f6; padding: 6px 10px; border-radius: 4px; display: inline-block; margin-top: 4px;">${credentials.tempPassword}</span></p>
      <p style="color: #DC2626; margin-top: 16px; font-size: 14px;">
        ⚠ <strong>Important:</strong> Save these credentials now. The teacher will be required to change their password on first login.
      </p>
    </div>`,
    icon: "success",
    confirmButtonText: "Done",
    confirmButtonColor: "#0D9488",
    allowOutsideClick: false,
    allowEscapeKey: false,
  });
};

export interface ViewUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  role: "admin" | "teacher" | "parent";
  isActive?: boolean;
}

export const handleViewUser = (user: ViewUser) => {
  Swal.fire({
    title: "User Details",
    html: `
      <div style="text-align:left;font-size:14px">
        <p><strong>Name:</strong> ${user.firstName} ${user.lastName}</p>
        <p><strong>Email:</strong> ${user.email}</p>
        ${user.employeeId ? `<p><strong>Employee ID:</strong> ${user.employeeId}</p>` : ""}
        <p><strong>Role:</strong> ${user.role}</p>
        <p><strong>Status:</strong> ${user.isActive === false ? "Inactive" : "Active"}</p>
      </div>
    `,
    confirmButtonText: "Close",
    confirmButtonColor: "#0D9488",
  });
};

