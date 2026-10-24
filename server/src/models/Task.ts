import { Schema, model, InferSchemaType } from "mongoose";

export const STATUSES = ["todo", "in-progress", "done"] as const;
export const PRIORITIES = ["low", "medium", "high"] as const;

const taskSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: "", maxlength: 1000 },
    status: { type: String, enum: STATUSES, default: "todo" },
    priority: { type: String, enum: PRIORITIES, default: "medium" },
    dueDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export type ITask = InferSchemaType<typeof taskSchema>;
export const Task = model("Task", taskSchema);
