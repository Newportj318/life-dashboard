import {
  Apple,
  Dumbbell,
  FolderKanban,
  House,
  Settings,
  Target,
  UtensilsCrossed,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { Accent } from "./accents";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  accent: Accent;
  description: string;
};

export const mainNav: NavItem[] = [
  { title: "Home", href: "/", icon: House, accent: "blue", description: "Today at a glance" },
  { title: "Meal Planning", href: "/meals", icon: UtensilsCrossed, accent: "orange", description: "Weekly meals, recipes and shopping" },
  { title: "Nutrition", href: "/nutrition", icon: Apple, accent: "green", description: "Daily targets and supplements" },
  { title: "Training", href: "/training", icon: Dumbbell, accent: "purple", description: "Weekly plan, strength, cardio and body" },
  { title: "Finances", href: "/finances", icon: Wallet, accent: "emerald", description: "Net worth, accounts and bills" },
  { title: "Goals", href: "/goals", icon: Target, accent: "amber", description: "Current and future goals" },
  { title: "Projects", href: "/projects", icon: FolderKanban, accent: "sky", description: "Projects from idea to done" },
];

export const accountNav: NavItem[] = [
  { title: "Settings", href: "/settings", icon: Settings, accent: "gray", description: "Connections and preferences" },
];

export function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
}
