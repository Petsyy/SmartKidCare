import Swal from "sweetalert2";

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

export const showCaptainCredentialsModal = (
  firstName: string,
  lastName: string,
  credentials: TeacherCredentials,
  emailDelivery?: TeacherEmailDelivery,
) => {
  const deliveryMessage = emailDelivery?.sent
    ? `Credentials were sent to <strong>${emailDelivery.to}</strong>.`
    : emailDelivery?.message ||
      "Email delivery failed. Copy and share the temporary credentials securely.";

  return Swal.fire({
    title: "Barangay Captain Account Created",
    html: `
      <div style="padding: 16px; text-align: left;">
        <p><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p><strong>Email:</strong> ${credentials.email}</p>
        <p><strong>Temporary password:</strong><br>
          <span style="font-family: monospace; background: #f3f4f6; padding: 8px 12px; border-radius: 6px; display: inline-block; margin-top: 6px;">${credentials.tempPassword}</span>
        </p>
        <p style="margin-top: 16px; color: ${emailDelivery?.sent ? "#155e75" : "#9a3412"};">${deliveryMessage}</p>
        <p style="margin-top: 12px; color: #92400e;">The Captain must change this password on first login.</p>
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
  role: "barangay_captain" | "teacher" | "parent";
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
