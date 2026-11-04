export type Role = "member" | "admin";

export type FeedbackType = "feedback" | "feature" | "bug";

export type FeedbackStatus = "new" | "in_progress" | "done";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Feedback = {
  id: string;
  title: string;
  body: string;
  type: FeedbackType;
  status: FeedbackStatus;
  team: string | null;
  product_area: string | null;
  screenshot_path: string | null;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  comment_count?: number;
};

export type Comment = {
  id: string;
  feedback_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

export const TEAMS = [
  "Engineering",
  "Product",
  "Design",
  "Support",
  "Sales",
  "Ops",
] as const;

export const PRODUCT_AREAS = [
  "Onboarding",
  "Dashboard",
  "Billing",
  "Integrations",
  "Mobile",
  "Admin",
  "API",
] as const;

export const STATUS_LABELS: Record<FeedbackStatus, string> = {
  new: "New",
  in_progress: "In Progress",
  done: "Done",
};

export const TYPE_LABELS: Record<FeedbackType, string> = {
  feedback: "Feedback",
  feature: "Feature request",
  bug: "Bug report",
};
