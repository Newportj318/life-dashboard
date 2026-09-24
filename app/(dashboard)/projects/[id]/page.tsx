import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/dashboard";
import { ProjectDetail } from "@/components/projects/project-detail";
import { today } from "@/lib/dates";
import { loadGoals, loadProjects } from "@/lib/goals";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Project · Life Dashboard" };

export default async function ProjectPage({ params }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [projects, goals] = await Promise.all([loadProjects(supabase), loadGoals(supabase)]);
  const project = projects.find((p) => p.id === id);
  if (!project) notFound();
  return (
    <>
      <Link href="/projects" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">
        <ChevronLeft className="h-4 w-4" /> All projects
      </Link>
      <PageHeader title={project.title} />
      <ProjectDetail
        project={project}
        goals={goals.filter((g) => g.status === "current" || g.status === "future" || g.id === project.goalId).map((g) => ({ id: g.id, title: g.title }))}
        today={today()}
      />
    </>
  );
}
