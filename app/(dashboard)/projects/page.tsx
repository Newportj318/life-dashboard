import type { Metadata } from "next";
import { PageHeader, SetupNote } from "@/components/dashboard";
import { ProjectBoard } from "@/components/projects/project-board";
import { attempt } from "@/lib/attempt";
import { today } from "@/lib/dates";
import { loadProjects } from "@/lib/goals";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Projects · Life Dashboard" };

export default async function ProjectsPage() {
  const supabase = await createClient();
  const projects = await attempt(() => loadProjects(supabase));
  return (
    <>
      <PageHeader title="Projects" subtitle="Projects from idea to done" />
      {projects.error !== null ? (
        <SetupNote title="Projects tables not set up yet">
          Run <code className="font-mono text-xs">supabase/migrations/20260925_goals_projects.sql</code> in the Supabase SQL Editor, then reload. ({projects.error})
        </SetupNote>
      ) : (
        <ProjectBoard projects={projects.data} today={today()} />
      )}
    </>
  );
}
