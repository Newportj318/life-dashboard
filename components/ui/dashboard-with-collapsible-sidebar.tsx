"use client";

// Adapted from the 21st.dev "dashboard-with-collapsible-sidebar" component:
// typed props, route-driven selection, remembered collapse state, and a
// slide-out drawer on phones.

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ChevronsRight, LogOut, Menu, X } from "lucide-react";
import { signOut } from "@/app/actions/auth";
import { AppBackground } from "@/components/app-background";
import { Logo } from "@/components/logo";
import { accents } from "@/lib/accents";
import { accountNav, isActive, mainNav, type NavItem } from "@/lib/nav";

const COLLAPSE_KEY = "sidebar-open";
const COLLAPSE_EVENT = "sidebar-open-change";

function subscribeCollapse(onChange: () => void) {
  window.addEventListener(COLLAPSE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(COLLAPSE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readCollapse() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) !== "false";
  } catch {
    return true;
  }
}

const noopSubscribe = () => () => {};

function areaFor(pathname: string) {
  const first = pathname.split("/")[1];
  return first || "home";
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen w-full text-gray-900 dark:text-gray-100">
      <AppBackground area={areaFor(pathname)} />
      <DesktopSidebar />

      {/* Phone drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
          />
          <nav className="relative flex h-full w-72 max-w-[85vw] flex-col border-r border-gray-200 dark:border-white/[0.08] bg-white/95 dark:bg-[#0a0d16]/95 p-2 shadow-xl backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <TitleSection open />
              </div>
              <button
                aria-label="Close menu"
                onClick={() => setDrawerOpen(false)}
                className="m-2 rounded-md p-2 text-gray-500 hover:bg-gray-900/[0.04] dark:hover:bg-white/[0.05]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <NavLinks open onNavigate={() => setDrawerOpen(false)} />
          </nav>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phone top bar */}
        <div className="sticky top-0 z-30 flex items-center gap-3 border-b border-gray-200/80 dark:border-white/[0.06] bg-white/70 dark:bg-[#05070d]/70 px-4 py-3 backdrop-blur-xl md:hidden">
          <button
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 -ml-2 text-gray-600 dark:text-gray-300 hover:bg-gray-900/[0.04] dark:hover:bg-white/[0.05]"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Logo size={32} />
          <span className="font-display text-sm font-semibold tracking-tight">Life Dashboard</span>
        </div>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

function DesktopSidebar() {
  // Server renders it open; the saved choice applies once the page loads.
  const open = useSyncExternalStore(subscribeCollapse, readCollapse, () => true);

  const toggle = () => {
    try {
      localStorage.setItem(COLLAPSE_KEY, String(!open));
    } catch {}
    window.dispatchEvent(new Event(COLLAPSE_EVENT));
  };

  return (
    <nav
      className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r transition-all duration-300 ease-in-out md:flex ${
        open ? "w-64" : "w-16"
      } border-gray-200/80 dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] p-2 backdrop-blur-xl`}
    >
      <TitleSection open={open} />
      <NavLinks open={open} />
      <button
        onClick={toggle}
        aria-label={open ? "Collapse sidebar" : "Expand sidebar"}
        className="-mx-2 -mb-2 mt-auto border-t border-gray-200/80 dark:border-white/[0.06] transition-colors hover:bg-gray-900/[0.04] dark:hover:bg-white/[0.05]"
      >
        <div className="flex items-center p-3">
          <div className="grid size-10 place-content-center">
            <ChevronsRight
              className={`h-4 w-4 transition-transform duration-300 text-gray-500 dark:text-gray-400 ${
                open ? "rotate-180" : ""
              }`}
            />
          </div>
          {open && (
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Hide</span>
          )}
        </div>
      </button>
    </nav>
  );
}

function NavLinks({ open, onNavigate }: { open: boolean; onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      <div className="mb-8 space-y-1">
        {mainNav.map((item) => (
          <Option
            key={item.href}
            item={item}
            open={open}
            selected={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <div className="space-y-1 border-t border-gray-200/80 dark:border-white/[0.06] pt-4">
        {open && (
          <div className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Account
          </div>
        )}
        {accountNav.map((item) => (
          <Option
            key={item.href}
            item={item}
            open={open}
            selected={isActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
        <form action={signOut}>
          <button
            type="submit"
            title={open ? undefined : "Sign out"}
            className="relative flex h-11 w-full items-center rounded-md text-gray-600 dark:text-gray-400 transition-all duration-200 hover:bg-gray-900/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-200"
          >
            <div className="grid h-full w-12 shrink-0 place-content-center">
              <LogOut className="h-4 w-4" />
            </div>
            {open && <span className="truncate text-sm font-medium">Sign out</span>}
          </button>
        </form>
      </div>
    </>
  );
}

function Option({
  item,
  open,
  selected,
  onNavigate,
}: {
  item: NavItem;
  open: boolean;
  selected: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={open ? undefined : item.title}
      aria-current={selected ? "page" : undefined}
      className={`relative flex h-11 w-full items-center rounded-md transition-all duration-200 ${
        selected
          ? accents[item.accent].navSelected
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-900/[0.04] dark:hover:bg-white/[0.05] hover:text-gray-900 dark:hover:text-gray-200"
      }`}
    >
      <div className="grid h-full w-12 shrink-0 place-content-center">
        <Icon className="h-4 w-4" />
      </div>
      {open && <span className="truncate text-sm font-medium">{item.title}</span>}
    </Link>
  );
}

function TitleSection({ open }: { open: boolean }) {
  // Date is set on the client so it uses your timezone, not the server's.
  const today = useSyncExternalStore(
    noopSubscribe,
    () => new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }),
    () => ""
  );

  return (
    <div className="mb-6 border-b border-gray-200/80 dark:border-white/[0.06] pb-4">
      <div className="flex items-center gap-3 rounded-md p-2">
        <Logo />
        {open && (
          <div className="min-w-0">
            <span className="block truncate font-display text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
              Life Dashboard
            </span>
            <span className="block h-4 text-xs text-gray-500 dark:text-gray-400">{today}</span>
          </div>
        )}
      </div>
    </div>
  );
}
