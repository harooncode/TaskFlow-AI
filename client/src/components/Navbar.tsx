import LogoMark from "./LogoMark";

export default function Navbar(){
    return(
        <div className="mb-5 flex flex-col items-stretch justify-between gap-4 rounded-[22px] border border-white/10 bg-[#08141d]/55 px-3 py-3 backdrop-blur-lg sm:px-4 md:flex-row md:items-center md:gap-3 2xl:px-5">
                <div className="flex items-center gap-3">
                  <LogoMark />
                  <div>
                    <h1 className="font-display text-[1.35rem] tracking-tight">
                      TaskFlow | Smart Kanban 
                    </h1>
                    <span className="text-xs font-semibold text-fog">
                      Your daily board
                    </span>
                  </div>
                </div>
        
                <div className="flex w-full flex-wrap items-center justify-start gap-2 sm:gap-2.5 md:w-auto md:justify-end">
                  {/* Notifications button */}
                  <button
                    type="button"
                    title="Notifications"
                    aria-label={`Notifications: ${stats?.overdue ?? 0} overdue tasks`}
                    aria-expanded={isNotificationsOpen}
                    className="relative grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-fog transition hover:border-warn/40 hover:text-warn"
                    onClick={() => {
                      setIsAnalyticsOpen(false);
                      setIsCopilotOpen(false);
                      setIsNotificationsOpen((v) => !v);
                    }}
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
                    onClick={() => {
                      setIsCopilotOpen(false);
                      setIsNotificationsOpen(false);
                      setIsAnalyticsOpen((v) => !v);
                    }}
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
                      setIsNotificationsOpen(false);
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
        
                  <span className="flex min-w-0 max-w-[150px] flex-col leading-tight sm:max-w-[220px]">
                    <strong className="truncate text-[0.92rem]">{user?.name}</strong>
                    <span className="truncate text-xs text-fog">{user?.email}</span>
                  </span>
        
                  <button className={btnSmall} onClick={logout}>
                    Log out
                  </button>
                </div>
              </div>
    )    
} 