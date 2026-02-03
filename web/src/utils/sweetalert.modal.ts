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

export const showTeacherCreatedWithPasswordModal = (
  firstName: string,
  lastName: string,
  email: string,
  credentials: TeacherCredentials
) => {
  return Swal.fire({
    title: "Teacher Account Created Successfully",
    html: `
      <div style="padding: 20px; text-align: left;">
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 8px 0; color: #166534; font-size: 14px;">
            <strong>✓ Account Created</strong>
          </p>
          <p style="margin: 8px 0; color: #166534; font-size: 14px;">
            Teacher: <strong>${firstName} ${lastName}</strong>
          </p>
          <p style="margin: 8px 0; color: #166534; font-size: 14px;">
            Email: <strong>${email}</strong>
          </p>
        </div>

        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 12px; border-radius: 4px;">
          <p style="margin: 0 0 8px 0; color: #92400e; font-weight: 600; font-size: 14px;">
            Temporary Password
          </p>
          <span style="
            font-family: monospace;
            background: #f3f4f6;
            padding: 10px 16px;
            border-radius: 4px;
            display: inline-block;
            font-size: 16px;
            letter-spacing: 1px;
            color: #1f2937;
          ">
            ${credentials.tempPassword}
          </span>
        </div>

        <p style="color: #666; font-size: 13px; margin-top: 16px;">
          ⚠ <strong>Security Notice:</strong> The teacher must change this password on their first login.
        </p>
      </div>
    `,
    icon: "success",
    confirmButtonText: "Done",
    confirmButtonColor: "#0D9488",
    allowOutsideClick: false,
  });
};

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

export interface ViewUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeId?: string;
  role: "admin" | "teacher" | "parent";
  isActive?: boolean;
}

export interface ToggleUserStatusOptions {
  userName: string;
  isActivating: boolean;
}

export interface ToggleUserStatusSuccessOptions {
  userName: string;
  isActivating: boolean;
}

export const showToggleUserStatusSuccessModal = ({
  userName,
  isActivating,
}: ToggleUserStatusSuccessOptions) => {
  return Swal.fire({
    title: isActivating ? "User Activated" : "User Deactivated",
    text: isActivating
      ? `${userName} can now log in again.`
      : `${userName} has been deactivated and can no longer log in.`,
    icon: "success",
    confirmButtonText: "OK",
    confirmButtonColor: "#0D9488",
  });
};

export const showToggleUserStatusModal = async ({
  userName,
  isActivating,
}: ToggleUserStatusOptions): Promise<boolean> => {
  const result = await Swal.fire({
    title: isActivating ? "Activate User?" : "Deactivate User?",
    text: isActivating
      ? `Are you sure you want to activate ${userName}? They will be able to log in again.`
      : `Are you sure you want to deactivate ${userName}? They will no longer be able to log in.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: isActivating ? "#0D9488" : "#DC2626",
    cancelButtonColor: "#6B7280",
    confirmButtonText: isActivating ? "Yes, activate" : "Yes, deactivate",
    cancelButtonText: "Cancel",
  });
  return result.isConfirmed;
};

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

export interface ViewChild {
  _id?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentId?: string;
  age: string | number;
  gender: string;
  schoolYear?: string;
  status?: string;
  enrollmentDate?: string;
  childLinkCode?: string;
  parent?: { firstName: string; lastName: string; email: string } | null;
}

export const showChangeChildStatusModal = async (
  childName: string,
  currentStatus: string
): Promise<string | null> => {
  const result = await Swal.fire({
    title: "Change Status",
    html: `
      <p class="text-gray-600 mb-4">Update status for ${childName}</p>
      <select id="child-status-select" class="swal2-input w-full">
        <option value="Active" ${currentStatus === "Active" ? "selected" : ""}>Active</option>
        <option value="Inactive" ${currentStatus === "Inactive" ? "selected" : ""}>Inactive</option>
        <option value="On Leave" ${currentStatus === "On Leave" ? "selected" : ""}>On Leave</option>
      </select>
    `,
    showCancelButton: true,
    confirmButtonColor: "#0D9488",
    cancelButtonColor: "#6B7280",
    confirmButtonText: "Update",
    cancelButtonText: "Cancel",
    preConfirm: () => {
      const select = document.getElementById("child-status-select") as HTMLSelectElement;
      return select?.value || null;
    },
  });
  return result.isConfirmed ? result.value : null;
};

export const showRegenerateLinkCodeConfirm = async (childName: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: "Regenerate Link Code?",
    text: `A new link code will be generated for ${childName}. The previous code will no longer work. Share the new code with the parent.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#0D9488",
    cancelButtonColor: "#6B7280",
    confirmButtonText: "Yes, regenerate",
    cancelButtonText: "Cancel",
  });
  return result.isConfirmed;
};

export const showUnlinkParentConfirm = async (childName: string): Promise<boolean> => {
  const result = await Swal.fire({
    title: "Unlink Parent?",
    text: `Remove the parent association for ${childName}? A new link code will be generated so a different parent can link to this child.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#DC2626",
    cancelButtonColor: "#6B7280",
    confirmButtonText: "Yes, unlink",
    cancelButtonText: "Cancel",
  });
  return result.isConfirmed;
};

export const showViewChildModal = (child: ViewChild) => {
  const fullName = `${child.lastName}, ${child.firstName}${child.middleName ? ` ${child.middleName}` : ""}`;
  const statusBadgeColor =
    child.status === "Active"
      ? "background:#D1FAE5;color:#065F46"
      : child.status === "Inactive"
      ? "background:#FEE2E2;color:#B91C1C"
      : "background:#FEF3C7;color:#92400E";
  const parentInfo = child.parent
    ? `${child.parent.firstName} ${child.parent.lastName} (${child.parent.email})`
    : "Not linked";
  const linkCodeDisplay = child.childLinkCode
    ? `<span style="font-family:monospace;background:#F3F4F6;padding:6px 10px;border-radius:6px">${child.childLinkCode}</span>`
    : '<span style="color:#6B7280">—</span>';
  const enrollmentDate = child.enrollmentDate
    ? new Date(child.enrollmentDate).toLocaleDateString()
    : "—";

  Swal.fire({
    title: "Child Details",
    html: `
      <div style="text-align:left;font-size:14px;padding:8px 0">
        <div style="margin-bottom:16px">
          <div style="color:#6B7280;font-size:12px;font-weight:500;margin-bottom:4px;text-transform:uppercase">Name</div>
          <div style="font-weight:600;font-size:16px">${fullName}</div>
        </div>
        <div style="margin-bottom:16px">
          <div style="color:#6B7280;font-size:12px;font-weight:500;margin-bottom:4px;text-transform:uppercase">Student ID</div>
          <span style="font-family:monospace;background:#F3F4F6;padding:6px 10px;border-radius:6px">${child.studentId || "—"}</span>
        </div>
        <div style="margin-bottom:16px">
          <div style="color:#6B7280;font-size:12px;font-weight:500;margin-bottom:4px;text-transform:uppercase">Age / Gender</div>
          <div>${child.age} years · ${String(child.gender).charAt(0).toUpperCase() + String(child.gender).slice(1)}</div>
        </div>
        <div style="margin-bottom:16px">
          <div style="color:#6B7280;font-size:12px;font-weight:500;margin-bottom:4px;text-transform:uppercase">School Year</div>
          <div>${child.schoolYear || "—"}</div>
        </div>
        <div style="margin-bottom:16px">
          <div style="color:#6B7280;font-size:12px;font-weight:500;margin-bottom:4px;text-transform:uppercase">Enrollment Date</div>
          <div>${enrollmentDate}</div>
        </div>
        <div style="margin-bottom:16px">
          <div style="color:#6B7280;font-size:12px;font-weight:500;margin-bottom:6px;text-transform:uppercase">Status</div>
          <span style="padding:6px 12px;border-radius:6px;font-size:12px;font-weight:600;${statusBadgeColor}">${child.status || "Active"}</span>
        </div>
        <div style="margin-bottom:16px">
          <div style="color:#6B7280;font-size:12px;font-weight:500;margin-bottom:4px;text-transform:uppercase">Parent</div>
          <div>${parentInfo}</div>
        </div>
        <div>
          <div style="color:#6B7280;font-size:12px;font-weight:500;margin-bottom:4px;text-transform:uppercase">Link Code</div>
          ${linkCodeDisplay}
        </div>
      </div>
    `,
    confirmButtonText: "Close",
    confirmButtonColor: "#0D9488",
    width: "420px",
  });
};

