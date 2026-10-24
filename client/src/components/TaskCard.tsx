import type { Status, Task } from "../types";
import { badge, btnDanger, btnSmall, card, field } from "../ui";

interface Props {
  task: Task;
  onStatusChange: (id: string, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAskAI?: (task: Task) => void;
}

export default function TaskCard({ task, onStatusChange, onEdit, onDelete, onAskAI }: Props) {
  const overdue = task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date();
  return (
    <div className={`${card} flex flex-col gap-2 p-3.5 shadow-md transition hover:-translate-y-0.5 hover:border-mint/35`}>
      <div className="flex justify-between gap-2">
        <strong className="text-[0.98rem] leading-snug">{task.title}</strong>
        <span className={badge[task.priority] ?? badge.medium}>{task.priority}</span>
      </div>
      {task.description && <p className="m-0 text-sm leading-relaxed text-fog">{task.description}</p>}
      <div className="flex items-center justify-between gap-2 pt-0.5">
        {task.dueDate ? (
          <small className={overdue ? "font-bold text-[#ff6b7a]" : "text-fog"}>
            Due {new Date(task.dueDate).toLocaleDateString()} {overdue && "· overdue"}
          </small>
        ) : (
          <span className="text-[11px] italic text-fog/50">No due date</span>
        )}
        <div className="flex items-center gap-1.5">
          {onAskAI && (
            <button
              type="button"
              title="Get AI guidance for this task"
              className="inline-flex items-center gap-1 rounded-lg border border-mint/30 bg-mint/10 px-2 py-1 text-xs font-bold text-mint transition hover:bg-mint/20 hover:border-mint/50"
              onClick={() => onAskAI(task)}
            >
              <span>✨</span>
              <span>Guide</span>
            </button>
          )}
          <button type="button" className={`${btnSmall} px-2.5 py-1 text-xs`} onClick={() => onEdit(task)}>
            Edit
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <select
          className={`${field} min-w-0 flex-1 py-1.5 text-xs font-medium`}
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value as Status)}
        >
          <option value="todo">To do</option>
          <option value="in-progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <button type="button" className={`${btnDanger} px-3 py-1.5 text-xs`} onClick={() => onDelete(task._id)}>
          Delete
        </button>
      </div>
    </div>
  );
}
