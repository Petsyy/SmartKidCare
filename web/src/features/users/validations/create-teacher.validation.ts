import { z } from "zod";
import {
  userEmailSchema,
  userNameSchema,
} from "./user-fields.validation";

export const addTeacherSchema = z.object({
  firstName: userNameSchema("First name"),
  middleName: userNameSchema("Middle name"),
  lastName: userNameSchema("Last name"),
  email: userEmailSchema(),
  phone: z.string().regex(/^09\d{9}$/, "Use an 11-digit number starting with 09."),
});

export type AddTeacherFormValues = z.infer<typeof addTeacherSchema>;
