import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/ui/dashboard-with-collapsible-sidebar";
import { createClient } from "@/lib/supabase/server";

// Second check after proxy.ts: never render the dashboard without a verified session.
export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  return <DashboardShell>{children}</DashboardShell>;
}
