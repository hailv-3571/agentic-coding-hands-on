/**
 * Table part of an admin loading state (spec § 5 "loading"): the #00101A header bar and pulsing
 * rows in the phase 06 table tokens. Shared by the Review content, User and Overview skeletons.
 */
export function AdminTableSkeletonRows({ rows = 5, rowHeight = "h-20" }: { rows?: number; rowHeight?: string }) {
  return (
    <div className="flex flex-col">
      <div className="h-11 border-b border-divider bg-background" />
      {Array.from({ length: rows }, (_, row) => (
        <div key={row} className={`flex ${rowHeight} items-center border-b border-divider bg-container-2 px-3`}>
          <div className="h-4 w-full animate-pulse rounded bg-divider" />
        </div>
      ))}
    </div>
  );
}
