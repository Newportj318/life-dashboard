import type { Metadata } from "next";
import { PageHeader, PlannedSections } from "@/components/dashboard";

export const metadata: Metadata = { title: "Finances · Life Dashboard" };

export default function FinancesPage() {
  return (
    <>
      <PageHeader title="Finances" subtitle="Net worth, accounts and bills" />
      <PlannedSections
        accent="emerald"
        step="step 3"
        sections={[
          { title: "Net worth", detail: "Current net worth and account balances from PocketSmith." },
          { title: "Net worth over time", detail: "How your net worth has changed month to month." },
          { title: "Upcoming bills", detail: "Bills due soon, from PocketSmith." },
        ]}
      />
    </>
  );
}
