import LogoMark from "./LogoMark";
import { btnSmall } from "../ui";

type DashboardHeaderProps = {
  initial: string;
  userName?: string;
  userEmail?: string;
  overdueCount: number;
  isNotificationsOpen: boolean;
  onToggleNotifications: () => void;
  onToggleAnalytics: () => void;
  onOpenAI: () => void;
  onLogout: () => void;
};

export default function DashboardHeader({
  initial,
  userName,
  userEmail,
  overdueCount,
  isNotificationsOpen,
  onToggleNotifications,
  onToggleAnalytics,
  onOpenAI,
  onLogout,
}: DashboardHeaderProps) {
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-[22px] border border-white/10 bg-[#08141d]/55 px-3.5 py-3 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <LogoMark />

        <div>
          <h1 className="font-display text-[1.35rem] tracking-tight">
            TaskFlow
          </h1>

          <span className="text-xs font-semibold text-fog">
            Your daily board
          </span>
        </div>
      </div>

      <div className="flex min-w-max items-center gap-2.5">
        {/* Notifications button */}
        <button
          type="button"
          title="Notifications"
          aria-label={`Notifications: ${overdueCount} overdue tasks`}
          aria-expanded={isNotificationsOpen}
          className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-fog transition hover:border-warn/40 hover:text-warn"
          onClick={onToggleNotifications}
        >
          <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
            <path
              d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          {overdueCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-[0_0_8px_rgba(239,68,68,0.8)]">
              {overdueCount > 9 ? "9+" : overdueCount}
            </span>
          )}
        </button>

        {/* Analytics button */}
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-xl border border-sky/40 bg-gradient-to-r from-sky/15 via-[#1a9fd4]/20 to-sky/15 px-3 py-2 text-xs font-bold text-sky shadow-[0_0_15px_rgba(76,195,255,0.18)] transition hover:-translate-y-px hover:border-sky/60 hover:shadow-[0_0_22px_rgba(76,195,255,0.38)]"
          onClick={onToggleAnalytics}
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
          onClick={onOpenAI}
        >
          <span className="grid h-5 w-5 place-items-center rounded-md bg-mint text-[11px] text-ink font-black shadow-mint">
            ✨
          </span>

          <span>AI</span>
        </button>

        {/* User information */}
        <span className="grid h-9 w-9 place-items-center rounded-full border border-mint/35 bg-mint/15 text-sm font-extrabold text-mint">
          {initial}
        </span>

        <span className="flex flex-col leading-tight">
          <strong className="text-[0.92rem]">{userName}</strong>
          <span className="text-xs text-fog">{userEmail}</span>
        </span>

        {/* Logout button */}
        <button className={btnSmall} onClick={onLogout}>
          Log out
        </button>
      </div>
    </header>
  );
}