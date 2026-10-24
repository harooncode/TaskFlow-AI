import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { User } from "../models/User";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });

const signToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_SECRET as string, { expiresIn: "7d" });

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { name, email, password } = registerSchema.parse(req.body);
    if (await User.findOne({ email })) throw new HttpError(409, "Email already registered");
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    res.status(201).json({
      token: signToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
    });
  })
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await bcrypt.compare(password, user.password)))
      throw new HttpError(401, "Invalid email or password");
    res.json({
      token: signToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
    });
  })
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(401, "User no longer exists");
    res.json({ user: { id: user.id, name: user.name, email: user.email } });
  })
);

export default router;
