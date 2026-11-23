import { AdminUsersSkeleton } from "@/features/admin-users/components/admin-users-skeleton";

/** Instant loading state of Admin › User while the page's rows are read. */
export default function AdminUsersLoading() {
  return (
    <main className="flex flex-1 flex-col gap-4">
      <AdminUsersSkeleton />
    </main>
  );
}
