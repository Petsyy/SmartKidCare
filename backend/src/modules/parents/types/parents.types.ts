export type ParentAccountInput = {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
};

export type ParentCredentials = {
  email: string;
  phone: string;
  tempPassword: string | null;
};
