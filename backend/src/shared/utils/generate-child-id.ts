export const generateStudentId = (year: number) => {
  const random = Math.floor(100000 + Math.random() * 900000);
  return `CDC-${year}-${random}`;
};
