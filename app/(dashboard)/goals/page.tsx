import type { Metadata } from "next";
import { PageHeader, PlannedSections } from "@/components/dashboard";

export const metadata: Metadata = { title: "Goals · Life Dashboard" };

export default function GoalsPage() {
  return (
    <>
      <PageHeader title="Goals" subtitle="Current and future goals" />
      <PlannedSections
        accent="amber"
        step="step 5"
        sections={[
          { title: "Current goals", detail: "Each with a target, deadline, milestones and a progress bar." },
          { title: "Future goals", detail: "Ideas waiting to be promoted to current goals." },
          { title: "Live-tracked goals", detail: "Goals that read real numbers from Hevy, Strava or PocketSmith." },
        ]}
      />
    </>
  );
}
