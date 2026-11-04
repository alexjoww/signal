import { STATUS_LABELS, type FeedbackStatus } from "@/lib/types";

export function StatusBadge({ status }: { status: FeedbackStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide status-${status}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
