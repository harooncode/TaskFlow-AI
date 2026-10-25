import TaskCard from "./TaskCard";
import type { Status,Task } from "../types";

const COLUMNS: { key: Status; label: string; pip: string }[] = [
  {
    key: "todo",
    label: "To do",
    pip: "bg-warn shadow-[0_0_10px_#f5c14a]",
  },
  {
    key: "in-progress",
    label: "In progress",
    pip: "bg-sky shadow-[0_0_10px_#4cc3ff]",
  },
  {
    key: "done",
    label: "Done",
    pip: "bg-mint shadow-[0_0_10px_#2ee6a6]",
  },
];

type TaskBoardProps = {
  tasks: Task[];
  loading: boolean;
  onStatusChange: (id: string, status: Status) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onAskAI: (task: Task) => void;
};

export default function TaskBoard({
  tasks,
  loading,
  onStatusChange,
  onEdit,
  onDelete,
  onAskAI,
}: TaskBoardProps) {
  if (loading) {
    return (
      <div className="grid min-h-[180px] place-items-center gap-2.5 text-fog">
        <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-mint/20 border-t-mint" />
        <p>Loading board...</p>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3 2xl:gap-4">
      {COLUMNS.map((col) => {
        const items = tasks.filter((task) => task.status === col.key);

        return (
          <section
            key={col.key}
            className="flex min-h-[220px] min-w-0 flex-col gap-2.5 rounded-[20px] border border-white/10 bg-[#061018]/45 p-3 sm:p-3.5 2xl:p-4"
          >
            <div className="flex items-center justify-between px-1 pb-2">
              <h3 className="flex items-center gap-2 font-display text-[0.95rem]">
                <span className={`h-2 w-2 rounded-full ${col.pip}`} />
                {col.label}
              </h3>

              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold">
                {items.length}
              </span>
            </div>

            {items.length === 0 && (
              <p className="mx-2 my-4 rounded-[14px] border border-dashed border-white/10 py-5 text-center text-sm text-fog">
                Nothing here yet
              </p>
            )}

            {items.map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onStatusChange={onStatusChange}
                onEdit={onEdit}
                onDelete={onDelete}
                onAskAI={onAskAI}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}