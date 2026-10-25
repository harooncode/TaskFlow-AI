import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Stats } from "../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  stats: Stats | null;
}

// ── Colour palette (matches the app's design tokens) ─────────────────────────
const C_WARN  = "#f5c14a"; // todo   / medium
const C_SKY   = "#4cc3ff"; // in-progress
const C_MINT  = "#2ee6a6"; // done
const C_ROSE  = "#f87171"; // overdue / high
const C_FOG   = "#6b8fa8"; // low

export default function AnalyticsDrawer({ isOpen, onClose, stats }: Props) {
  if (!isOpen) return null;

  // ── Donut chart data ───────────────────────────────────────────────────────
  const statusData = [
    { name: "To Do",       value: stats?.todo          ?? 0, color: C_WARN },
    { name: "In Progress", value: stats?.["in-progress"] ?? 0, color: C_SKY  },
    { name: "Done",        value: stats?.done           ?? 0, color: C_MINT },
  ].filter((d) => d.value > 0);

  const totalTasks = stats?.total ?? 0;

  // ── Bar chart data (priority of non-done tasks) ───────────────────────────
  const priorityData = [
    { name: "High",   count: stats?.priority?.high   ?? 0, fill: C_ROSE },
    { name: "Medium", count: stats?.priority?.medium ?? 0, fill: C_WARN },
    { name: "Low",    count: stats?.priority?.low    ?? 0, fill: C_FOG  },
  ];

  // ── Overdue ring values ────────────────────────────────────────────────────
  const overdue   = stats?.overdue ?? 0;
  const active    = (stats?.todo ?? 0) + (stats?.["in-progress"] ?? 0);
  const onTrack   = Math.max(active - overdue, 0);
  const overdueData = [
    { name: "Overdue",  value: overdue,  color: C_ROSE },
    { name: "On Track", value: onTrack,  color: C_MINT },
  ].filter((d) => d.value > 0);
  // fallback when no active tasks
  const overdueDisplay = overdueData.length === 0
    ? [{ name: "No active tasks", value: 1, color: "#1e3a4a" }]
    : overdueData;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex">
      <div className="flex h-full w-full max-w-[460px] flex-col border-l border-white/10 bg-[#07131b]/98 shadow-2xl backdrop-blur-2xl">

        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-sky to-[#1a9fd4] text-ink shadow-[0_0_14px_rgba(76,195,255,0.4)]">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M18 20V10M12 20V4M6 20v-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <h2 className="font-display text-base font-bold tracking-tight text-cream">Analytics</h2>
              <span className="flex items-center gap-1.5 text-[0.72rem] font-semibold text-fog">
                <span className="h-1.5 w-1.5 rounded-full bg-sky animate-pulse" />
                Live board data
              </span>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-fog transition hover:bg-white/10 hover:text-cream"
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-7">

          {!stats || totalTasks === 0 ? (
            <div className="grid place-items-center h-48 text-fog text-sm">
              No tasks yet — add some tasks to see analytics.
            </div>
          ) : (
            <>
              {/* ── 1. Task Status Donut ──────────────────────────────────── */}
              <section>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-fog">
                  Task Status
                </h3>
                <div className="rounded-2xl border border-white/10 bg-[#0a1e2b]/70 p-4">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {statusData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#0d212e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                        itemStyle={{ color: "#dbe8ef" }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(v) => <span style={{ color: "#dbe8ef", fontSize: 12 }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centre label */}
                  <p className="text-center -mt-2 text-[0.78rem] text-fog">
                    <span className="font-bold text-cream text-lg">{totalTasks}</span> total tasks
                  </p>
                </div>
              </section>

              {/* ── 2. Priority Breakdown Bar ─────────────────────────────── */}
              <section>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-fog">
                  Priority Breakdown <span className="normal-case font-normal">(pending tasks)</span>
                </h3>
                <div className="rounded-2xl border border-white/10 bg-[#0a1e2b]/70 p-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={priorityData} barSize={36}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "#6b8fa8", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "#6b8fa8", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        width={24}
                      />
                      <Tooltip
                        contentStyle={{ background: "#0d212e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                        itemStyle={{ color: "#dbe8ef" }}
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                        {priorityData.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* ── 3. Overdue Ring ───────────────────────────────────────── */}
              <section>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-fog">
                  Overdue vs On Track
                </h3>
                <div className="rounded-2xl border border-white/10 bg-[#0a1e2b]/70 p-4">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={overdueDisplay}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={overdue > 0 ? 4 : 0}
                        dataKey="value"
                        startAngle={90}
                        endAngle={-270}
                      >
                        {overdueDisplay.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ background: "#0d212e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, fontSize: 12 }}
                        itemStyle={{ color: "#dbe8ef" }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(v) => <span style={{ color: "#dbe8ef", fontSize: 12 }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <p className="text-center -mt-2 text-[0.78rem] text-fog">
                    {overdue === 0
                      ? <span className="text-mint font-semibold">All active tasks are on track ✓</span>
                      : <span className="text-rose-400 font-semibold">{overdue} task{overdue > 1 ? "s" : ""} overdue</span>
                    }
                  </p>
                </div>
              </section>

              {/* ── 4. Summary row ───────────────────────────────────────── */}
              <section className="grid grid-cols-3 gap-3 pb-2">
                {[
                  { label: "Completion", value: totalTasks > 0 ? Math.round(((stats?.done ?? 0) / totalTasks) * 100) : 0, suffix: "%", color: "text-mint" },
                  { label: "In Progress", value: stats?.["in-progress"] ?? 0, suffix: "", color: "text-sky" },
                  { label: "Overdue", value: overdue, suffix: "", color: overdue > 0 ? "text-rose-400" : "text-fog" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/10 bg-[#0a1e2b]/70 p-3 text-center">
                    <b className={`block font-display text-2xl ${s.color}`}>{s.value}{s.suffix}</b>
                    <span className="text-[0.72rem] text-fog">{s.label}</span>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
