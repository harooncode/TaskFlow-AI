export type Status = "todo" | "in-progress" | "done";
export type Priority = "low" | "medium" | "high";

export interface User { id: string; name: string; email: string }

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  dueDate: string | null;
  createdAt: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  dueDate?: string | null;
}

export interface Stats { todo: number; "in-progress": number; done: number; total: number }
