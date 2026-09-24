// Fixed ambient layer behind every page: area-tinted aurora, fading dot grid and fine grain.
// Styles live in app/globals.css (.app-bg); the glow colours follow `area`.

export function AppBackground({ area = "home" }: { area?: string }) {
  return (
    <div aria-hidden className="app-bg pointer-events-none fixed inset-0 -z-10 overflow-hidden" data-area={area}>
      <div className="aurora" />
      <div className="dots" />
      <div className="grain" />
    </div>
  );
}
