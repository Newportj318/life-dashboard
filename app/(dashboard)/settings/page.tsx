import type { Metadata } from "next";
import { PageHeader, PlannedSections } from "@/components/dashboard";

export const metadata: Metadata = { title: "Settings · Life Dashboard" };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" subtitle="Connections and preferences" />
      <PlannedSections
        accent="gray"
        step="step 1 (login) and later steps"
        sections={[
          { title: "Account", detail: "Your login and profile." },
          { title: "Connections", detail: "Hevy, Strava and PocketSmith API connections." },
        ]}
      />
    </>
  );
}
