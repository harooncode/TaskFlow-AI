import { card } from "../ui";
import type { Stats } from "../types";

type DashboardStatsProps = {
  stats: Stats;
};

export default function DashboardStats({stats}: DashboardStatsProps) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8 sm:gap-3">
      <Stat
        value={stats.total}
        label="Total"
        valueClass="text-cream"
        blob="bg-sky"
      />

      <Stat
        value={stats.todo}
        label="To Do"
        valueClass="text-warn"
        blob="bg-warn"
      />

      <Stat
        value={stats["in-progress"]}
        label="Ongoing"
        valueClass="text-sky"
        blob="bg-sky"
      />

      <Stat
        value={stats.done}
        label="Done"
        valueClass="text-mint"
        blob="bg-mint"
      />

      <Stat
        value={stats.overdue ?? 0}
        label="Overdue"
        valueClass={
          (stats.overdue ?? 0) > 0
            ? "text-rose-400"
            : "text-fog"
        }
        blob={
          (stats.overdue ?? 0) > 0
            ? "bg-rose-500"
            : "bg-white"
        }
      />

      <Stat
        value={stats.priority?.high ?? 0}
        label="High"
        valueClass="text-rose-300"
        blob="bg-rose-500"
      />

      <Stat
        value={stats.priority?.medium ?? 0}
        label="Medium"
        valueClass="text-warn"
        blob="bg-warn"
      />

      <Stat
        value={stats.priority?.low ?? 0}
        label="Low"
        valueClass="text-fog"
        blob="bg-sky"
      />
    </div>
  );
}

type StatProps = {
  value: number;
  label: string;
  valueClass: string;
  blob: string;
};

function Stat({
  value,
  label,
  valueClass,
  blob,
}: StatProps) {
  return (
    <div className={`${card} relative overflow-hidden p-4 text-left`}>
      <span
        className={`pointer-events-none absolute -right-5 -top-6 h-[90px] w-[90px] rounded-full opacity-20 ${blob}`}
      />

      <b className={`block font-display text-3xl ${valueClass}`}>
        {value}
      </b>

      <span className="text-[0.82rem] font-semibold text-fog">
        {label}
      </span>
    </div>
  );
}