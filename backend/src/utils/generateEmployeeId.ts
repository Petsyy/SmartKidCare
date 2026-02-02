export const generateEmployeeId = async (): Promise<string> => {
  const prefix = "EMP";
  const year = new Date().getFullYear();
  const randomNumber = Math.floor(100000 + Math.random() * 900000);
  return `${prefix}-${year}-${randomNumber}`;
};
