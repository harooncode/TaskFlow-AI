
import type { Task } from "../types";

type NotificationPopupDrawerProps = {
  isOpen: boolean;
  overdueTasks: Task[];
  onClose: () => void;
  onTaskClick: (task: Task) => void;
};

export default function NotificationPopupDrawer({
  isOpen,
  overdueTasks,
  onClose,
  onTaskClick,
}: NotificationPopupDrawerProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <button
        type="button"
        aria-label="Close notifications"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-black/60"
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="notifications-title"
        className="absolute right-0 top-0 flex h-[100dvh] w-full max-w-md flex-col border-l border-white/10 bg-[#08141d] shadow-2xl sm:max-w-md"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-5">
          <div>
            <h2
              id="notifications-title"
              className="font-display text-xl font-bold text-cream"
            >
              Notifications
            </h2>

            <p className="mt-1 text-sm text-fog">
              {overdueTasks.length} overdue tasks
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 text-fog transition hover:bg-white/10 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {overdueTasks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center">
              <p className="text-sm text-fog">
                No overdue tasks found.
              </p>
            </div>
          ) : (
            overdueTasks.map((task) => (
              <button
                key={task._id}
                type="button"
                onClick={() => onTaskClick(task)}
                className="w-full rounded-2xl border border-rose-400/15 bg-rose-500/5 p-4 text-left transition hover:border-rose-400/40 hover:bg-rose-500/10"
              >
                <span className="block break-words font-semibold text-cream">
                  {task.title}
                </span>

                <span className="mt-2 block text-xs text-rose-400">
                  Due: {new Date(task.dueDate).toLocaleDateString()}
                </span>

                <span className="mt-1 block text-xs capitalize text-fog">
                  {task.status.replace("-", " ")} · {task.priority} priority
                </span>
              </button>
            ))
          )}
        </div>
      </aside>
    </div>
  );
}
