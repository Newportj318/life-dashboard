// Life Dashboard mark: three rising bars (areas of life, trending up) on an indigo-violet tile.

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div
      className="grid shrink-0 place-content-center rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500 shadow-[0_8px_24px_-8px_rgb(139_92_246_/_0.6)] ring-1 ring-white/20"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="3" y="13" width="4.5" height="8" rx="1.5" fill="white" fillOpacity="0.7" />
        <rect x="9.75" y="8" width="4.5" height="13" rx="1.5" fill="white" fillOpacity="0.85" />
        <rect x="16.5" y="3" width="4.5" height="18" rx="1.5" fill="white" />
      </svg>
    </div>
  );
}
