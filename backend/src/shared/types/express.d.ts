import { JwtPayload } from "jsonwebtoken";
import { AuthenticatedUser } from "./auth.types";

declare global {
  namespace Express {
    interface Request {
      admin?: string | JwtPayload;
      user?: AuthenticatedUser;
    }
  }
}
