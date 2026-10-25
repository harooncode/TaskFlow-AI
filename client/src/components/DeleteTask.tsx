
import type { Task } from "../types";
import { errorBox } from "../ui";

type DeleteTaskProps = {
  taskToDelete: Task | null;
  isDeleting: boolean;
  error: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteTask({
  taskToDelete,
  isDeleting,
  error,
  onCancel,
  onConfirm,
}: DeleteTaskProps) {
  if (!taskToDelete) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Cancel task deletion"
        disabled={isDeleting}
        onClick={onCancel}
        className="absolute inset-0 bg-[#02070b]/50"
      />

      {/* Confirmation card */}
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        aria-describedby="delete-description"
        className="relative z-10 my-auto max-h-[calc(100dvh-2rem)] w-full max-w-[360px] overflow-y-auto rounded-[22px] border border-[#2EE6A6]/25 bg-[#08141d] shadow-[0_0_45px_rgba(46,230,166,0.12)] animate-in fade-in zoom-in-95 duration-200 sm:max-w-[380px]"
      >
        {/* Mint accent line */}
        <div className="h-1 w-full bg-gradient-to-r from-[#2EE6A6]/30 via-[#2EE6A6] to-[#2EE6A6]/30" />

        <div className="p-5">
          {/* Icon */}
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl border border-[#2EE6A6]/25 bg-[#2EE6A6]/10 shadow-[0_0_22px_rgba(46,230,166,0.12)]">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-6 w-6 text-[#2EE6A6]"
              aria-hidden="true"
            >
              <path
                d="M3 6h18M8 6V4h8v2m-11 0 1 14h12l1-14M10 10v6m4-6v6"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Heading */}
          <div className="text-center">
            <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#2EE6A6]">
              Confirm action
            </p>

            <h2
              id="delete-title"
              className="font-display text-xl font-bold tracking-tight text-cream"
            >
              Delete this task?
            </h2>

            <p
              id="delete-description"
              className="mt-2 text-xs leading-5 text-fog"
            >
              Are you sure you want to delete this task? This action cannot be
              undone.
            </p>
          </div>

          {/* Selected task details */}
          <div className="mt-4 rounded-xl border border-[#2EE6A6]/15 bg-[#2EE6A6]/[0.04] p-3">
            <p className="break-words text-sm font-bold text-cream">
              {taskToDelete.title}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold capitalize">
              <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-fog">
                {taskToDelete.status.replace("-", " ")}
              </span>

              <span
                className={`rounded-md border px-2 py-1 ${
                  taskToDelete.priority === "high"
                    ? "border-rose-400/20 bg-rose-500/10 text-rose-300"
                    : taskToDelete.priority === "medium"
                      ? "border-warn/20 bg-warn/10 text-warn"
                      : "border-[#2EE6A6]/20 bg-[#2EE6A6]/10 text-[#2EE6A6]"
                }`}
              >
                {taskToDelete.priority} priority
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className={`${errorBox} mt-3`} role="alert">
              {error}
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onCancel}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-bold text-cream transition hover:border-white/20 hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#2EE6A6]/40 bg-[#2EE6A6] hover:bg-[#f73b51] px-3 py-2.5 text-xs font-extrabold text-[#061018] shadow-[0_0_16px_rgba(46,230,166,0.2)] transition hover:-translate-y-0.5 hover:bg-[#55f0bd] hover:text-white hover:shadow-[0_0_22px_rgba(46,230,166,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#061018]/30 border-t-[#061018]" />
                  Deleting...
                </>
              ) : (
                "Delete Task"
              )}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
