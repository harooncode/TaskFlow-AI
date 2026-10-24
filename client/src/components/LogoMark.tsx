export default function LogoMark({ className = "h-[42px] w-[42px]" }: { className?: string }) {
  return (
    <span
      className={`grid place-items-center rounded-[14px] bg-gradient-to-br from-mint to-[#149e7a] text-[#062016] shadow-mint ${className}`}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-[22px] w-[22px]">
        <path
          d="M5 13.5 9.2 18 19 7"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
