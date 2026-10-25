import { FormEvent, useState } from "react";
import type { Priority, Status, Task, TaskInput } from "../types";
import { btn, btnPrimary, card, errorBox, field } from "../ui";

interface Props {
  initial?: Task;
  onSubmit: (data: TaskInput) => Promise<void>;
  onCancel?: () => void;
}

export default function TaskForm({ initial, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [status, setStatus] = useState<Status>(initial?.status ?? "todo");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.slice(0, 10) : "");
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await onSubmit({ title, description, status, priority, dueDate: dueDate || null });
      if (!initial) {
        setTitle(""); setDescription(""); setStatus("todo"); setPriority("medium"); setDueDate("");
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <form className={`${card} flex flex-col gap-2.5 lg:sticky lg:top-5`} onSubmit={submit}>
      <h3 className="font-display text-lg tracking-tight">{initial ? "Edit task" : "New task"}</h3>
      <p className="m-0 text-sm text-fog">
        {initial ? "Update the details, then save." : "Drop it on the board in one step."}
      </p>
      {error && <div className={errorBox}>{error}</div>}
      <input className={field} placeholder="Title" value={title} required maxLength={120}
        onChange={(e) => setTitle(e.target.value)} />
      <textarea className={`${field} min-h-[72px] resize-y`} placeholder="Description (optional)" value={description} rows={2}
        onChange={(e) => setDescription(e.target.value)} />
      <div className="flex flex-wrap gap-2">
        <select className={`${field} min-w-0 flex-1`} value={status} onChange={(e) => setStatus(e.target.value as Status)}>
          <option value="todo">To do</option>
          <option value="in-progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <select className={`${field} min-w-0 flex-1`} value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <input className={`${field} [color-scheme:white]`} type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      
      <div className="flex flex-wrap gap-2">
        <button className={btnPrimary}>{initial ? "Save" : "Add task"}</button>
        {onCancel && <button type="button" className={btn} onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}
