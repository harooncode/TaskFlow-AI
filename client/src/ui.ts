const tap =
  "inline-flex shrink-0 items-center justify-center rounded-xl font-bold transition hover:-translate-y-px hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0";

export const field =
  "w-full rounded-xl border border-white/10 bg-[#061018]/65 px-3.5 py-2.5 text-cream placeholder:text-[#6d8696] outline-none transition focus:border-mint/70 focus:ring-4 focus:ring-mint/15";

export const card =
  "rounded-[18px] border border-white/10 bg-ink-3/70 p-4 shadow-glow backdrop-blur-md";

export const btn = `${tap} border border-white/10 bg-ink-3/80 px-4 py-2.5 text-cream`;

export const btnPrimary =
  `${tap} border border-transparent bg-gradient-to-b from-[#3aefb3] to-mint-dim px-4 py-2.5 text-[#062016] shadow-mint`;

export const btnSmall = `${tap} border border-white/10 bg-ink-3/80 px-2.5 py-1.5 text-sm text-cream`;

export const btnDanger =
  `${tap} border border-rose-400/30 bg-rose-500/10 px-2.5 py-1.5 text-sm text-[#ff6b7a]`;

export const errorBox =
  "rounded-xl border border-rose-400/30 bg-rose-500/15 px-3 py-2.5 text-[#ffd0d5]";

export const badge: Record<string, string> = {
  high: "h-fit whitespace-nowrap rounded-full bg-rose-400/15 px-2 py-0.5 text-[0.66rem] font-extrabold uppercase tracking-wide text-[#ffb3bb]",
  medium: "h-fit whitespace-nowrap rounded-full bg-warn/15 px-2 py-0.5 text-[0.66rem] font-extrabold uppercase tracking-wide text-[#f8d98a]",
  low: "h-fit whitespace-nowrap rounded-full bg-mint/15 px-2 py-0.5 text-[0.66rem] font-extrabold uppercase tracking-wide text-[#8cf3cc]",
};
