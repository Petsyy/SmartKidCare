export const validateDateOfBirth = (dateOfBirth: string) => {
  if (!dateOfBirth) return "Date of birth is required.";
  const birthDate = new Date(dateOfBirth);
  if (Number.isNaN(birthDate.getTime())) return "Date of birth is invalid.";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  birthDate.setHours(0, 0, 0, 0);

  if (birthDate > today) return "Date of birth cannot be in the future.";
  return undefined;
};

export const validateEnrollmentDate = (
  enrollmentDate: string,
  dateOfBirth: string,
) => {
  if (!enrollmentDate) return "Enrollment date is required.";
  const enrollDate = new Date(enrollmentDate);
  if (Number.isNaN(enrollDate.getTime())) return "Enrollment date is invalid.";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  enrollDate.setHours(0, 0, 0, 0);

  if (enrollDate > today) return "Enrollment date cannot be in the future.";

  if (dateOfBirth) {
    const birthDate = new Date(dateOfBirth);
    if (!Number.isNaN(birthDate.getTime())) {
      birthDate.setHours(0, 0, 0, 0);
      if (enrollDate < birthDate) {
        return "Enrollment date cannot be earlier than date of birth.";
      }
    }
  }

  return undefined;
};

export const validateDateFields = (data: {
  dateOfBirth: string;
  enrollmentDate: string;
}) => {
  return {
    dateOfBirth: validateDateOfBirth(data.dateOfBirth),
    enrollmentDate: validateEnrollmentDate(
      data.enrollmentDate,
      data.dateOfBirth,
    ),
  };
};
