import { Router } from "express";
import { z } from "zod";
import { Task } from "../models/Task";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";
import { buildSystemPrompt, callGroqChat } from "../utils/aiService";

const router = Router();
router.use(requireAuth);

const chatSchema = z.object({
  message: z.string().trim().min(1, "Message is required").max(1000),
  focusedTaskId: z.string().optional(),
  replyLang: z.enum(["ur-PK", "en-US"]).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(3000),
      })
    )
    .max(10)
    .optional(),
});

interface BoardAction {
  type: "MOVE_TASK" | "DELETE_TASK" | "CREATE_TASK";
  taskId?: string;
  status?: "todo" | "in-progress" | "done";
  // CREATE_TASK fields
  title?: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
}

function parseBoardAction(text: string) {
  const match = text.match(/```action([\s\S]*?)```/);
  if (!match) return { cleanedReply: text, action: undefined };

  const jsonStr = match[1].trim();
  const cleanedReply = text.replace(/```action[\s\S]*?```/, "").trim();
  try {
    const action = JSON.parse(jsonStr) as BoardAction;
    return { cleanedReply, action };
  } catch (err) {
    console.error("Failed to parse board action JSON:", err);
  }
  return { cleanedReply, action: undefined };
}

function parseSubtasks(text: string) {
  const match = text.match(/```subtasks([\s\S]*?)```/);
  if (!match) return { cleanedReply: text, subtasks: undefined };

  const jsonStr = match[1].trim();
  const cleanedReply = text.replace(/```subtasks[\s\S]*?```/, "").trim();
  try {
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      return { cleanedReply, subtasks: parsed };
    }
  } catch (err) {
    console.error("Failed to parse subtasks JSON:", err);
  }
  return { cleanedReply, subtasks: undefined };
}

// Strip the hidden task_draft tracking block — never shown to the user
function stripTaskDraft(text: string): string {
  return text.replace(/```task_draft[\s\S]*?```/g, "").trim();
}

// 1. General Context-Aware Chat
router.post(
  "/chat",
  asyncHandler(async (req, res) => {
    const { message, focusedTaskId, replyLang, history = [] } = chatSchema.parse(req.body);

    const rawTasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 }).limit(50);
    const now = new Date();

    const tasks = rawTasks.map((t) => ({
      _id: t._id.toString(),
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      isOverdue: !!(t.dueDate && t.status !== "done" && t.dueDate < now),
    }));

    const focusedTask = focusedTaskId ? tasks.find((t) => t._id === focusedTaskId) : undefined;
    const systemPrompt = buildSystemPrompt(tasks, focusedTask, replyLang);

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
      ...history.map((h) => ({ role: h.role, content: h.content })),
      { role: "user", content: message },
    ];

    const rawReply = await callGroqChat(messages);
    const draftStripped = stripTaskDraft(rawReply);
    const { cleanedReply: replyWithoutSubtasks, subtasks } = parseSubtasks(draftStripped);
    const { cleanedReply, action } = parseBoardAction(replyWithoutSubtasks);

    let boardUpdated = false;
    if (action) {
      if (action.type === "MOVE_TASK" && action.taskId && action.status) {
        await Task.findOneAndUpdate({ _id: action.taskId, user: req.userId }, { status: action.status });
        boardUpdated = true;
      } else if (action.type === "DELETE_TASK" && action.taskId) {
        await Task.findOneAndDelete({ _id: action.taskId, user: req.userId });
        boardUpdated = true;
      } else if (action.type === "CREATE_TASK" && action.title) {
        await Task.create({
          user: req.userId,
          title: action.title.trim(),
          description: action.description?.trim() || "",
          priority: action.priority || "medium",
          status: "todo",
          dueDate: action.dueDate ? new Date(action.dueDate) : null,
        });
        boardUpdated = true;
      }
    }

    res.json({
      reply: cleanedReply,
      suggestedSubtasks: subtasks,
      focusedTask: focusedTask ? { id: focusedTask._id, title: focusedTask.title } : null,
      boardUpdated,
    });
  })
);

// 2. Guide Specific Task (Roadmap vs Clarification)
router.post(
  "/guide-task",
  asyncHandler(async (req, res) => {
    const { taskId } = z.object({ taskId: z.string() }).parse(req.body);
    const task = await Task.findOne({ _id: taskId, user: req.userId });
    if (!task) throw new HttpError(404, "Task not found");

    const rawTasks = await Task.find({ user: req.userId }).sort({ createdAt: -1 });
    const now = new Date();
    const tasks = rawTasks.map((t) => ({
      _id: t._id.toString(),
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate?.toISOString() ?? null,
      isOverdue: !!(t.dueDate && t.status !== "done" && t.dueDate < now),
    }));

    const focusedTask = {
      _id: task._id.toString(),
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate?.toISOString() ?? null,
      isOverdue: !!(task.dueDate && task.status !== "done" && task.dueDate < now),
    };

    const isDescMissing = !task.description || !task.description.trim();
    const systemPrompt = buildSystemPrompt(tasks, focusedTask);

    let userPrompt = "";
    if (isDescMissing) {
      userPrompt = `I want guidance on my task "${task.title}". Notice that I have NOT written any description for it. Please address this, explain why a description is helpful, and ask me what specifically I want to accomplish.`;
    } else {
      userPrompt = `Please give me a step-by-step actionable roadmap and execution advice for my task: "${task.title}". Its description is: "${task.description}".`;
    }

    const messages = [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userPrompt },
    ];

    const rawReply = await callGroqChat(messages);
    const { cleanedReply, subtasks } = parseSubtasks(rawReply);

    res.json({
      reply: cleanedReply,
      isDescriptionMissing: isDescMissing,
      task: { id: task._id, title: task.title, description: task.description },
      suggestedSubtasks: subtasks,
    });
  })
);

// 3. Smart Task Breakdown
router.post(
  "/breakdown",
  asyncHandler(async (req, res) => {
    const { title, description } = z
      .object({
        title: z.string().trim().min(1).max(200),
        description: z.string().max(1000).optional(),
      })
      .parse(req.body);

    const messages = [
      {
        role: "system" as const,
        content: `You are TaskFlow AI. Given a task title and optional description, break it down into 3 to 4 actionable, bite-sized subtasks.
Reply ONLY with a raw JSON array matching this format (no markdown formatting, no markdown backticks, just valid JSON):
[
  { "title": "Subtask title", "priority": "high|medium|low", "status": "todo" }
]`,
      },
      {
        role: "user" as const,
        content: `Task Title: "${title}"\nDescription: "${description || "None provided"}"`,
      },
    ];

    const rawReply = await callGroqChat(messages, 0.3);
    let subtasks = [];
    try {
      const sanitized = rawReply.replace(/```json/g, "").replace(/```/g, "").trim();
      subtasks = JSON.parse(sanitized);
    } catch (err) {
      console.error("Failed to parse breakdown JSON:", err, "Raw was:", rawReply);
      subtasks = [
        { title: `${title} - Part 1: Setup & Planning`, priority: "medium", status: "todo" },
        { title: `${title} - Part 2: Core Implementation`, priority: "high", status: "todo" },
        { title: `${title} - Part 3: Review & Finalize`, priority: "low", status: "todo" },
      ];
    }

    res.json({ subtasks });
  })
);

export default router;
