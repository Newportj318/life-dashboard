# Design System

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
