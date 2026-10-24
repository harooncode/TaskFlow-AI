import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/asyncHandler";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(new HttpError(401, "Not authenticated"));
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET as string) as { id: string };
    req.userId = payload.id;
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired token"));
  }
}
