import type { Stats, SubtaskItem, Task, TaskInput, User } from "./types";

const TOKEN_KEY = "taskflow_token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) =>
  t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong");
  return data as T;
}

interface AuthResponse { token: string; user: User }

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    request<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request<{ user: User }>("/auth/me"),
  getTasks: (params: Record<string, string>) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request<{ tasks: Task[] }>(`/tasks${qs ? `?${qs}` : ""}`);
  },
  getStats: () => request<{ stats: Stats }>("/tasks/stats"),
  createTask: (body: TaskInput) =>
    request<{ task: Task }>("/tasks", { method: "POST", body: JSON.stringify(body) }),
  updateTask: (id: string, body: Partial<TaskInput>) =>
    request<{ task: Task }>(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteTask: (id: string) => request<void>(`/tasks/${id}`, { method: "DELETE" }),
  aiChat: (body: {
    message: string;
    focusedTaskId?: string;
    replyLang?: "ur-PK" | "en-US";
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  }) =>
    request<{
      reply: string;
      suggestedSubtasks?: SubtaskItem[];
      focusedTask?: { id: string; title: string };
      boardUpdated?: boolean;
    }>("/ai/chat", { method: "POST", body: JSON.stringify(body) }),
  aiGuideTask: (taskId: string) =>
    request<{
      reply: string;
      isDescriptionMissing: boolean;
      task: { id: string; title: string; description?: string };
      suggestedSubtasks?: SubtaskItem[];
    }>("/ai/guide-task", { method: "POST", body: JSON.stringify({ taskId }) }),
  aiBreakdown: (body: { title: string; description?: string }) =>
    request<{ subtasks: SubtaskItem[] }>("/ai/breakdown", {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
