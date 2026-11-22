import { notificationSurface } from "@/features/notifications/components/notification-styles";

/** Instant loading state of `/notifications`: the 680-wide panel with placeholder rows. */
export default function NotificationsLoading() {
  return (
    <main aria-busy="true" className="flex flex-col items-center px-4 pt-12 pb-24 md:pt-28">
      <div className={`${notificationSurface} w-full max-w-170`}>
        <div className="h-12 w-40 animate-pulse rounded bg-secondary" />
        {[0, 1, 2, 3].map((row) => (
          <div key={row} className="flex gap-6 border-b border-divider pt-2 pb-4 pl-4 pr-12">
            <div className="size-10 shrink-0 animate-pulse rounded bg-secondary" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-5 w-full animate-pulse rounded bg-secondary" />
              <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
