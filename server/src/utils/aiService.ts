interface TaskContext {
  _id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "done";
  priority: "low" | "medium" | "high";
  dueDate?: string | null;
  isOverdue?: boolean;
}

export interface AIChatResponse {
  reply: string;
  suggestedSubtasks?: Array<{
    title: string;
    description?: string;
    priority: "low" | "medium" | "high";
    status: "todo" | "in-progress" | "done";
  }>;
  isDescriptionMissing?: boolean;
}

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";

export async function callGroqChat(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
  temperature = 0.5
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured in server/.env");
  }

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Groq API error:", response.status, errorText);
    throw new Error(`Groq API returned ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Builds the strict system prompt that grounds the AI strictly in the user's tasks
 * and prevents it from answering off-topic generic questions.
 */
export function buildSystemPrompt(tasks: TaskContext[], focusedTask?: TaskContext): string {
  const today = new Date().toISOString().split("T")[0];

  const formattedTasks = tasks.map((t) => {
    const overdueStr = t.isOverdue ? " [OVERDUE!]" : "";
    const dueStr = t.dueDate ? `Due: ${new Date(t.dueDate).toISOString().split("T")[0]}` : "No due date";
    const descStr = t.description?.trim() ? `Desc: "${t.description.trim()}"` : "Desc: [MISSING / EMPTY]";
    return `- [${t.status.toUpperCase()}] "${t.title}" | Priority: ${t.priority.toUpperCase()} | ${dueStr}${overdueStr} | ${descStr}`;
  }).join("\n");

  let focusedNote = "";
  if (focusedTask) {
    const descMissing = !focusedTask.description || !focusedTask.description.trim();
    focusedNote = `\nFOCUSED TASK RIGHT NOW:
Title: "${focusedTask.title}"
Status: ${focusedTask.status}
Priority: ${focusedTask.priority}
Description: ${descMissing ? "[EMPTY / NOT PROVIDED]" : `"${focusedTask.description}"`}
${descMissing ? "IMPORTANT: This task has NO description! If the user asks how to do or execute this task, you MUST notify them politely that they have not written a description yet, ask 2 specific clarifying questions about what they want to achieve, and offer to help write the description." : ""}
`;
  }

  return `You are "TaskFlow AI Copilot", a high-performance personal project manager and productivity coach embedded inside TaskFlow.
Today's Date: ${today}

STRICT GUARDRAILS & RULES:
1. DOMAIN RESTRICTION: You ONLY assist with managing, prioritizing, breaking down, and guiding the user on their TaskFlow board.
2. REFUSAL POLICY: If the user asks general trivia, cooking recipes, philosophy, general coding unrelated to their tasks, or open-ended world questions, POLITELY REFUSE and remind them that you are their TaskFlow Copilot dedicated solely to their active tasks and daily productivity.
3. GROUNDING: Base your advice strictly on the user's actual tasks provided below. Reference task titles, statuses, and deadlines directly.
4. LANGUAGE: If the user speaks/writes in Urdu or Roman Urdu, reply in natural, friendly Roman Urdu or Urdu. If they write in English, reply in English.
5. FORMATTING: Use concise bullet points, bold key terms, and keep responses actionable and brief. Do not write long essays.
6. JSON SUBTASKS (OPTIONAL): When explicitly asked to break down a task or create subtasks, you may include a JSON block at the end of your response with this exact tag:
\`\`\`subtasks
[
  { "title": "Subtask title", "priority": "high|medium|low", "status": "todo" }
]
\`\`\`

USER'S CURRENT TASK BOARD:
${formattedTasks || "No tasks currently on the board."}
${focusedNote}`;
}
