import { AdminOverviewSkeleton } from "@/features/admin-overview/components/admin-overview-skeleton";

/** Instant loading state of Admin › Overview while the unit statistics are read. */
export default function AdminOverviewLoading() {
  return (
    <main className="flex flex-1 flex-col gap-4">
      <AdminOverviewSkeleton />
    </main>
  );
}
