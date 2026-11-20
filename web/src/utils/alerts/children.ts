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
              [Redacted]
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
