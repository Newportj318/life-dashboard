import type { Metadata } from "next";
import { PageHeader, PlannedSections } from "@/components/dashboard";

export const metadata: Metadata = { title: "Projects · Life Dashboard" };

export default function ProjectsPage() {
  return (
    <>
      <PageHeader title="Projects" subtitle="Projects from idea to done" />
      <PlannedSections
        accent="sky"
        step="step 5"
        sections={[
          { title: "Projects by stage", detail: "Idea, Planning, Active and Done." },
          { title: "Task lists", detail: "Each project has its own tasks and a clear next step." },
        ]}
      />
    </>
  );
}
