import { ReviewContentSkeleton } from "@/features/admin-moderation/components/review-content-skeleton";

/** Instant loading state of Admin › Review content while the page's rows are read. */
export default function AdminReviewLoading() {
  return (
    <main className="flex flex-1 flex-col gap-4">
      <ReviewContentSkeleton />
    </main>
  );
}
