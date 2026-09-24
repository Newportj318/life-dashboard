# Design System

## Current look: dark premium (v2)
- **Theme:** dark by default (`#05070d` base); light mode available via the toggle and remembered.
- **Background** (`components/app-background.tsx`, `.app-bg` in `app/globals.css`): an aurora glow tinted by the current area (purple on Training, emerald on Finances, …), a dot grid fading from the top, and fine film grain. The glow drifts slowly.
- **Surfaces:** every card uses `.surface`, frosted glass (translucent fill, 1px light border, top-edge highlight, backdrop blur). `.surface-hover` lifts 2px on hover. Dialogs stay solid.
- **Type:** Space Grotesk (`font-display`) for headings and big numbers; Inter for UI text.
- **Numbers:** stat values count up on load (`components/count-up.tsx`) and glow softly in their area colour (`.stat-glow` + `--glow`).
- **Motion:** cards rise in (`.rise`, `.stagger`), progress bars fill (`.bar-fill`). All disabled under "reduce motion".
- **Accents** (`lib/accents.ts`): glassy chips (`*-500/15` + ring) and a glowing inset bar on the selected sidebar item.
- **Logo:** `components/logo.tsx`, three rising bars on an indigo→fuchsia tile.

The sections below are the original v1 spec; layout, grids and area colours still apply.

Based on the 21st.dev "dashboard-with-collapsible-sidebar" component. It will be adapted for this app rather than copied verbatim.

## Layout
- **Desktop:** collapsible left sidebar (open `w-64`, collapsed `w-16` icons only), sticky, full height; main content scrolls
- **Phone:** sidebar becomes a slide-out drawer from a top-bar menu button (a fixed sidebar doesn't fit at phone width)
- **Page header:** title + one-line subtitle on the left; theme toggle + account button on the right
- **Grids:** stat row of 4 → 2 → 1 columns (`xl` / `sm` / mobile); content row of 3 columns at `xl` (2/3 main + 1/3 side), stacked below

## Sidebar navigation
| Item | Icon (lucide) | Accent |
|---|---|---|
| Home | `Home` | blue |
| Meal Planning | `UtensilsCrossed` | orange |
| Nutrition | `Apple` | green |
| Training | `Dumbbell` | purple |
| Finances | `Wallet` | emerald |
| Goals | `Target` | amber |
| Projects | `FolderKanban` | sky |
| — Account — | | |
| Settings | `Settings` | gray |

The title area shows the app name ("Life Dashboard") and today's date instead of the template's user/plan.

## Surfaces
- Page background: `gray-50` / dark `gray-950`
- Cards: `bg-white` / dark `gray-900`, `rounded-xl`, `border-gray-200` / dark `gray-800`, `shadow-sm`, hover `shadow-md`, `p-6`
- Sidebar: `bg-white` / dark `gray-900`, right border
- Selected nav item: tinted background + 2px left border in the accent colour

## Stat cards
- Icon in a tinted chip (`bg-{accent}-50` / dark `{accent}-900/20`, icon `{accent}-600` / dark `{accent}-400`)
- Small label (`text-gray-600`), big value (`text-2xl font-bold`), trend line in green / red
- Progress bars: `h-2 rounded-full`, gray track, accent fill

## Typography
- Page title `text-3xl font-bold`; card title `text-lg font-semibold`; body `text-sm`; meta `text-xs text-gray-500`
- Section labels: `text-xs uppercase tracking-wide text-gray-500`

## Dark mode
- `class` strategy on `<html>`; toggle in the header
- Choice saved and remembered (the template forgets it on reload)

## Fixes to the template when adapting
- Add TypeScript prop types (the template's props are untyped and won't compile under strict mode)
- Remove `Math.random()` in render (it causes hydration mismatches in Next.js)
- Drive the selected nav item from the URL route, not local state
- Give each accent colour a fixed class list so Tailwind doesn't purge dynamic colour classes
