import { z } from "zod";
import {
  userEmailSchema,
  userNameSchema,
  userPhoneSchema,
} from "./user-fields.validation";

export const editUserSchema = z.object({
  firstName: userNameSchema("First name"),
  middleName: userNameSchema("Middle name"),
  lastName: userNameSchema("Last name"),
  email: userEmailSchema(),
  phone: userPhoneSchema(),
});

export type EditUserFormValues = z.infer<typeof editUserSchema>;
