import { z } from "zod";
import {
  optionalUserNameSchema,
  userEmailSchema,
  userNameSchema,
} from "./user-fields.validation";

export const addCaptainSchema = z.object({
  firstName: userNameSchema("First name"),
  middleName: optionalUserNameSchema("Middle name"),
  lastName: userNameSchema("Last name"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]{4,30}$/, "Use 4-30 letters or numbers only."),
  email: userEmailSchema(),
  phone: z.string().regex(/^09\d{9}$/, "Use an 11-digit number starting with 09."),
});

export type AddCaptainFormValues = z.infer<typeof addCaptainSchema>;
