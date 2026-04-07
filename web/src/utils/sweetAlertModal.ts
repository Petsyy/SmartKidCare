import Swal from "sweetalert2";

export interface ParentCredentials {
  email: string;
  password: string;
  message?: string;
}

export const showParentCredentialsModal = (credentials: ParentCredentials) => {
  const isNewParent = Boolean(credentials.password);
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

export interface TeacherCredentials {
  email: string;
  tempPassword: string;
}

export interface TeacherEmailDelivery {
  sent: boolean;
  to: string;
  message?: string;
}

export const showTeacherCredentialsModal = (
  firstName: string,
  lastName: string,
  email: string,
  emailDelivery?: TeacherEmailDelivery,
) => {
  const deliveryMessage = emailDelivery?.sent
    ? `Credentials have been sent to <strong>${emailDelivery.to}</strong>.`
    : emailDelivery?.message ||
      "Email delivery failed. Share credentials manually.";

  return Swal.fire({
    title: "Teacher Account Created Successfully",
    html: `
      <div style="padding: 20px; text-align: left;">
        <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 12px; border-radius: 4px; margin-bottom: 20px;">
          <p style="margin: 8px 0; color: #166534; font-size: 14px;">
            <strong>Account Created</strong>
          </p>
          <p style="margin: 8px 0; color: #166534; font-size: 14px;">
            Teacher: <strong>${firstName} ${lastName}</strong>
          </p>
          <p style="margin: 8px 0; color: #166534; font-size: 14px;">
            Email: <strong>${email}</strong>
          </p>
        </div>
        <div style="background: ${emailDelivery?.sent ? "#ecfeff" : "#fff7ed"}; border-left: 4px solid ${emailDelivery?.sent ? "#06b6d4" : "#f97316"}; padding: 12px; border-radius: 4px; margin-top: 16px;">
          <p style="margin: 0; color: ${emailDelivery?.sent ? "#155e75" : "#9a3412"}; font-size: 14px;">
            <strong>Email Delivery:</strong> ${deliveryMessage}
          </p>
        </div>
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

export interface LinkedChild {
  _id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  studentId?: string;
  age?: number;
  gender?: string;
  status?: string;
}

export const showLinkedChildrenModal = (
  children: LinkedChild[],
  parentName: string,
) => {
  if (!children.length) {
    return Swal.fire({
      title: "No Children Linked",
      html: `
        <div style="text-align: center; padding: 20px;">
          <div style="background: #f3f4f6; border-radius: 50%; width: 80px; height: 80px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <svg style="width: 40px; height: 40px; color: #9ca3af;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p style="color: #6b7280; margin: 0; font-size: 16px;">
            No children are currently linked to <strong>${parentName}</strong>.
          </p>
        </div>
      `,
      confirmButtonColor: "#0D9488",
      confirmButtonText: "Close",
    });
  }

  const childrenList = children
    .map((child) => {
      const middleName = child.middleName ? ` ${child.middleName}` : "";
      const fullName = `${child.firstName}${middleName} ${child.lastName}`;
      const statusColor =
        child.status === "Active"
          ? "#10b981"
          : child.status === "Inactive"
            ? "#ef4444"
            : "#f59e0b";

      return `
      <div style="
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 18px;
        margin-bottom: 14px;
        text-align: left;
        transition: all 0.2s;
      ">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
          <div style="flex: 1;">
            <p style="margin: 0 0 6px 0; font-size: 14px; color: #6b7280; font-weight: 500;">
              Child Name:
            </p>
            <p style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">
              ${fullName}
            </p>
          </div>
          ${
            child.status
              ? `
            <span style="
              background: ${statusColor}15;
              color: ${statusColor};
              padding: 6px 14px;
              border-radius: 12px;
              font-size: 14px;
              font-weight: 600;
            ">
              ${child.status}
            </span>
          `
              : ""
          }
        </div>
        <div style="margin-bottom: 12px;">
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280; font-weight: 500;">
            Student ID:
          </p>
          <p style="margin: 0; font-size: 16px; color: #374151; font-family: monospace; font-weight: 500;">
            ${child.studentId || "No Student ID"}
          </p>
        </div>
        ${
          child.age
            ? `
          <div>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #6b7280; font-weight: 500;">
              Age:
            </p>
            <p style="margin: 0; font-size: 16px; color: #374151; font-weight: 500;">
              ${child.age} years old
            </p>
          </div>
        `
            : ""
        }
      </div>
    `;
    })
    .join("");

  return Swal.fire({
    title: `Linked Children (${children.length})`,
    html: `
      <div style="padding: 12px 8px; max-height: 450px; overflow-y: auto;">
        <div style="margin: 0 0 20px 0; background: #f0fdf4; border-left: 4px solid #10b981; padding: 12px 16px; border-radius: 6px;">
          <p style="margin: 0; font-size: 15px; color: #166534; font-weight: 500;">
            Parent:
          </p>
          <p style="margin: 4px 0 0 0; font-size: 18px; color: #166534; font-weight: 700;">
            ${parentName}
          </p>
        </div>
        ${childrenList}
      </div>
    `,
    confirmButtonColor: "#0D9488",
    confirmButtonText: "Close",
    width: "650px",
  });
};

export interface ViewUser {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
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
        <p><strong>Role:</strong> ${user.role}</p>
        <p><strong>Status:</strong> ${user.isActive === false ? "Inactive" : "Active"}</p>
      </div>
    `,
    confirmButtonText: "Close",
    confirmButtonColor: "#0D9488",
  });
};

export const showChangeChildStatusModal = async (
  childName: string,
  currentStatus: string,
): Promise<string | null> => {
  const result = await Swal.fire({
    title: "Change Status",
    html: `
      <p class="text-gray-600 mb-4">Update status for ${childName}</p>
      <select id="child-status-select" class="swal2-input w-full">
        <option value="Active" ${currentStatus === "Active" ? "selected" : ""}>Active</option>
        <option value="Inactive" ${currentStatus === "Inactive" ? "selected" : ""}>Inactive</option>
      </select>
    `,
    showCancelButton: true,
    confirmButtonColor: "#0D9488",
    cancelButtonColor: "#6B7280",
    confirmButtonText: "Update",
    cancelButtonText: "Cancel",
    preConfirm: () => {
      const select = document.getElementById(
        "child-status-select",
      ) as HTMLSelectElement;
      return select?.value || null;
    },
  });
  return result.isConfirmed ? result.value : null;
};

export const showUnlinkParentConfirm = async (
  childName: string,
): Promise<boolean> => {
  const result = await Swal.fire({
    title: "Unlink Parent?",
    text: `Remove the parent association for ${childName}?`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#DC2626",
    cancelButtonColor: "#6B7280",
    confirmButtonText: "Yes, unlink",
    cancelButtonText: "Cancel",
  });
  return result.isConfirmed;
};

