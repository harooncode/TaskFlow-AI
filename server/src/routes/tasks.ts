import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { PRIORITIES, STATUSES, Task } from "../models/Task";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";

const router = Router();
router.use(requireAuth);

const taskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  description: z.string().max(1000).optional(),
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  dueDate: z.string().nullable().optional(),
});

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { status, priority, q } = req.query as Record<string, string | undefined>;
    const filter: Record<string, unknown> = { user: req.userId };
    if (status && (STATUSES as readonly string[]).includes(status)) filter.status = status;
    if (priority && (PRIORITIES as readonly string[]).includes(priority)) filter.priority = priority;
    if (q) filter.title = { $regex: escapeRegex(q), $options: "i" };
    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json({ tasks });
  })
);

router.get(
  "/stats",
  asyncHandler(async (req, res) => {
    const userId = new mongoose.Types.ObjectId(req.userId);
    const now = new Date();

    // Single aggregation with $facet — one DB round-trip, fully user-scoped.
    // $match is the very first stage so MongoDB can use the { user, status } index
    // and never touches any other user's documents.
    const [result] = await Task.aggregate([
      { $match: { user: userId } },                         // privacy: only this user's tasks
      {
        $facet: {
          byStatus: [
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ],
          overdue: [
            {
              $match: {
                status: { $ne: "done" },
                dueDate: { $lt: now, $ne: null },
              },
            },
            { $count: "count" },
          ],
          byPriority: [
            { $match: { status: { $ne: "done" } } },       // only pending/in-progress tasks
            { $group: { _id: "$priority", count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    // Build status counts
    const stats: Record<string, number> = { todo: 0, "in-progress": 0, done: 0, total: 0 };
    for (const r of result.byStatus) {
      stats[r._id] = r.count;
      stats.total += r.count;
    }

    // Overdue count
    const overdue: number = result.overdue[0]?.count ?? 0;

    // Priority breakdown (non-done tasks only)
    const priority: Record<string, number> = { high: 0, medium: 0, low: 0 };
    for (const r of result.byPriority) {
      priority[r._id] = r.count;
    }

    res.json({ stats: { ...stats, overdue, priority } });
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = taskSchema.parse(req.body);
    const task = await Task.create({
      ...data,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      user: req.userId,
    });
    res.status(201).json({ task });
  })
);

router.put(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid task id");
    const data = taskSchema.partial().parse(req.body);
    const update: Record<string, unknown> = { ...data };
    if ("dueDate" in data) update.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.userId }, update, {
      new: true,
      runValidators: true,
    });
    if (!task) throw new HttpError(404, "Task not found");
    res.json({ task });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(400, "Invalid task id");
    const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!task) throw new HttpError(404, "Task not found");
    res.status(204).end();
  })
);

export default router;
