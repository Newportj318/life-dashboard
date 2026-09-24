# Life Dashboard 2026 — Project Brief

One private, unified web app for every area of life. Switch between areas from a sidebar; areas link to each other.

## Decisions

| Topic | Decision |
|---|---|
| Scope | One unified dashboard, all areas in one app |
| Platform | Hosted web app, used on phone + Mac |
| Access | Just me, private login |
| Auto data sources | Hevy (training), Strava (cardio), PocketSmith (finances) |
| Areas linked? | Yes — meals → nutrition, goals ← training/finance data, projects ↔ goals |
| Style | 21st.dev "dashboard with collapsible sidebar" (see DESIGN.md) |

## Areas

### Home
- Today's snapshot: today's meals, today's training session, supplement checklist, macro targets
- Goal progress bars (active goals)
- Money glance: net worth + next bills due
- Active projects: current stage + next task

### Meal Planning
- Weekly meal calendar (breakfast / lunch / dinner per day)
- Recipe library (ingredients + macros)
- Auto shopping list from the week's plan
- Meal prep / batch cooking sessions

### Nutrition
- Daily calorie + macro **targets** (no full food logging)
- Supplements: daily checklist, grouped by time (morning / pre-workout / night)

### Training
- **Weekly calendar (Mon–Sun)** — input the plan each week
  - Each day = a **Hevy routine name** (dropdown from Hevy routines), plus Rest / Strava cardio
  - "Copy last week" shortcut
  - Logged Hevy workouts auto-tick the planned day; shows done / moved / missed
  - Week totals: sessions, volume, distance
- Strength progress (PRs, key lifts over time) — Hevy
- Cardio progress (distance, pace, HR) — Strava
- Bodyweight + measurements — Hevy

### Finances (PocketSmith)
- Net worth + account balances
- Net worth over time
- Upcoming bills

### Goals
- Current and future goals: target, deadline, milestones, progress bar
- Future goals are ideas that get promoted to current
- Goals can link to real data (e.g. lift PR from Hevy, savings from PocketSmith)

### Projects
- Stages: Idea → Planning → Active → Done
- Task list per project
- Can link to a goal

## Tech stack
- Next.js (App Router) + TypeScript + Tailwind + shadcn/ui (`/components/ui`)
- Supabase — auth + database for own data (recipes, plans, goals, projects, supplements)
- Vercel — hosting
- APIs: Hevy (needs Hevy Pro API key), Strava (OAuth dev app), PocketSmith (developer key)
  - Keys stored server-side only, never in the browser

## Build order
1. **Foundation** — scaffold, login, sidebar navigation, style system, home screen with placeholder cards
2. Training (Hevy + Strava, weekly calendar)
3. Finances (PocketSmith)
4. Meal planning + nutrition + supplements
5. Goals + projects, wire goals to live data
