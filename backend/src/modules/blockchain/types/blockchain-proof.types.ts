export type ChildServiceResponse = {
  status: number;
  body: unknown;
};

export type AuthUser = {
  id: string;
  role: string;
  daycareCenterId?: string | null;
};
