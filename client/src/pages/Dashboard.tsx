import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import LogoMark from "../components/LogoMark";
import AICopilotDrawer from "../components/AICopilotDrawer";
import AnalyticsDrawer from "../components/AnalyticsDrawer";
import { btnSmall, card, errorBox, field } from "../ui";
import type { Stats, Status, Task, TaskInput } from "../types";

const COLUMNS: { key: Status; label: string; pip: string }[] = [
  { key: "todo", label: "To do", pip: "bg-warn shadow-[0_0_10px_#f5c14a]" },
  { key: "in-progress", label: "In progress", pip: "bg-sky shadow-[0_0_10px_#4cc3ff]" },
  { key: "done", label: "Done", pip: "bg-mint shadow-[0_0_10px_#2ee6a6]" },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [filters, setFilters] = useState({ q: "", priority: "" });
  const [editing, setEditing] = useState<Task | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [aiFocusedTask, setAiFocusedTask] = useState<Task | null>(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const [t, s] = await Promise.all([api.getTasks(filters), api.getStats()]);
      setTasks(t.tasks);
      setStats(s.stats);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const create = async (data: TaskInput) => { await api.createTask(data); await load(); };
  const update = async (data: TaskInput) => {
    if (!editing) return;
    await api.updateTask(editing._id, data);
    setEditing(null);
    await load();
  };
  const changeStatus = async (id: string, status: Status) => { await api.updateTask(id, { status }); await load(); };
  const remove = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    await api.deleteTask(id);
    await load();
  };

  const initial = user?.name?.trim()?.charAt(0).toUpperCase() || "U";

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-5">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-[#08141d]/55 px-3.5 py-3 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <LogoMark />
          <div>
            <h1 className="font-display text-[1.35rem] tracking-tight">TaskFlow</h1>
            <span className="text-xs font-semibold text-fog">Your daily board</span>
          </div>
        </div>
        <div className="flex min-w-max items-center gap-2.5">
          {/* Bell — overdue notifications */}
          <button
            type="button"
            title="Notifications"
            className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-fog transition hover:border-warn/40 hover:text-warn"
            onClick={() => { setIsAnalyticsOpen(false); setIsCopilotOpen(false); }}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {/* Red badge when overdue tasks exist */}
            {(stats?.overdue ?? 0) > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-[0_0_8px_rgba(239,68,68,0.8)]">
                {(stats?.overdue ?? 0) > 9 ? "9+" : stats?.overdue}
              </span>
            )}
          </button>

          {/* Analytics button */}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-sky/40 bg-gradient-to-r from-sky/15 via-[#1a9fd4]/20 to-sky/15 px-3 py-2 text-xs font-bold text-sky shadow-[0_0_15px_rgba(76,195,255,0.18)] transition hover:-translate-y-px hover:border-sky/60 hover:shadow-[0_0_22px_rgba(76,195,255,0.38)]"
            onClick={() => { setIsCopilotOpen(false); setIsAnalyticsOpen((v) => !v); }}
          >
            <span className="grid h-5 w-5 place-items-center rounded-md bg-sky text-[11px] text-ink font-black shadow-[0_0_8px_rgba(76,195,255,0.5)]">
              📊
            </span>
            <span>Analytics</span>
          </button>

          {/* AI Assistant button */}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-mint/40 bg-gradient-to-r from-mint/15 via-[#18c48c]/20 to-mint/15 px-3 py-2 text-xs font-bold text-mint shadow-[0_0_15px_rgba(46,230,166,0.18)] transition hover:-translate-y-px hover:border-mint/60 hover:shadow-[0_0_22px_rgba(46,230,166,0.38)]"
            onClick={() => {
              setAiFocusedTask(null);
              setIsAnalyticsOpen(false);
              setIsCopilotOpen(true);
            }}
          >
            <span className="grid h-5 w-5 place-items-center rounded-md bg-mint text-[11px] text-ink font-black shadow-mint">
              ✨
            </span>
            <span>AI</span>
          </button>

          <span className="grid h-9 w-9 place-items-center rounded-full border border-mint/35 bg-mint/15 text-sm font-extrabold text-mint">
            {initial}
          </span>
          <span className="flex flex-col leading-tight">
            <strong className="text-[0.92rem]">{user?.name}</strong>
            <span className="text-xs text-fog">{user?.email}</span>
          </span>
          <button className={btnSmall} onClick={logout}>Log out</button>
        </div>
      </header>

      {stats && (
        <div className="mb-5 grid grid-cols-4 gap-2 md:grid-cols-8">
          <Stat value={stats.total}             label="Total"    valueClass="text-cream"    blob="bg-sky" />
          <Stat value={stats.todo}              label="To Do"    valueClass="text-warn"     blob="bg-warn" />
          <Stat value={stats["in-progress"]}    label="Ongoing"  valueClass="text-sky"      blob="bg-sky" />
          <Stat value={stats.done}              label="Done"     valueClass="text-mint"     blob="bg-mint" />
          <Stat value={stats.overdue ?? 0}      label="Overdue"  valueClass={(stats.overdue ?? 0) > 0 ? "text-rose-400" : "text-fog"} blob={(stats.overdue ?? 0) > 0 ? "bg-rose-500" : "bg-white"} />
          <Stat value={stats.priority?.high   ?? 0} label="High"   valueClass="text-rose-300" blob="bg-rose-500" />
          <Stat value={stats.priority?.medium ?? 0} label="Medium" valueClass="text-warn"     blob="bg-warn" />
          <Stat value={stats.priority?.low    ?? 0} label="Low"    valueClass="text-fog"      blob="bg-sky" />
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[320px_1fr]">
        <aside>
          {editing ? (
            <TaskForm key={editing._id} initial={editing} onSubmit={update} onCancel={() => setEditing(null)} />
          ) : (
            <TaskForm onSubmit={create} />
          )}
        </aside>

        <main>
          <div className="mb-3.5 flex flex-wrap items-center gap-2">
            <input className={`${field} min-w-0 flex-1`} placeholder="Search tasks…" value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })} />
            <select className={`${field} min-w-0 flex-1 lg:max-w-[200px]`} value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
              <option value="">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          {error && <div className={`${errorBox} mb-3`}>{error}</div>}
          {loading ? (
            <div className="grid min-h-[180px] place-items-center gap-2.5 text-fog">
              <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-mint/20 border-t-mint" />
              <p>Loading board…</p>
            </div>
          ) : (
            <div className="grid gap-3.5 md:grid-cols-3">
              {COLUMNS.map((col) => {
                const items = tasks.filter((t) => t.status === col.key);
                return (
                  <section key={col.key} className="flex min-h-[220px] flex-col gap-2.5 rounded-[20px] border border-white/10 bg-[#061018]/45 p-3">
                    <div className="flex items-center justify-between px-1 pb-2">
                      <h3 className="flex items-center gap-2 font-display text-[0.95rem]">
                        <span className={`h-2 w-2 rounded-full ${col.pip}`} />
                        {col.label}
                      </h3>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold">{items.length}</span>
                    </div>
                    {items.length === 0 && (
                      <p className="mx-2 my-4 rounded-[14px] border border-dashed border-white/10 py-5 text-center text-sm text-fog">
                        Nothing here yet
                      </p>
                    )}
                    {items.map((t) => (
                      <TaskCard
                        key={t._id}
                        task={t}
                        onStatusChange={changeStatus}
                        onEdit={setEditing}
                        onDelete={remove}
                        onAskAI={(task) => {
                          setAiFocusedTask(task);
                          setIsCopilotOpen(true);
                        }}
                      />
                    ))}
                  </section>
                );
              })}
            </div>
          )}
        </main>
      </div>

      <AICopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        focusedTask={aiFocusedTask}
        onClearFocusedTask={() => setAiFocusedTask(null)}
        onSubtasksCreated={load}
      />

      <AnalyticsDrawer
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        stats={stats}
      />
    </div>
  );
}

function Stat({ value, label, valueClass, blob }: { value: number; label: string; valueClass: string; blob: string }) {
  return (
    <div className={`${card} relative overflow-hidden p-4 text-left`}>
      <span className={`pointer-events-none absolute -right-5 -top-6 h-[90px] w-[90px] rounded-full opacity-20 ${blob}`} />
      <b className={`block font-display text-3xl ${valueClass}`}>{value}</b>
      <span className="text-[0.82rem] font-semibold text-fog">{label}</span>
    </div>
  );
}
