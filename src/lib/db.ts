import { createClient } from "@/lib/supabase/server";
import type {
  Comment,
  Feedback,
  FeedbackStatus,
  FeedbackType,
  User,
} from "@/lib/types";

type FeedbackRow = {
  id: string;
  title: string;
  body: string;
  type: FeedbackType;
  status: FeedbackStatus;
  team: string | null;
  product_area: string | null;
  screenshot_path: string | null;
  author_id: string;
  created_at: string;
  updated_at: string;
  author?: { name: string } | { name: string }[] | null;
  comments?: { count: number }[] | null;
};

type CommentRow = {
  id: string;
  feedback_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: { name: string } | { name: string }[] | null;
};

function authorName(
  author: { name: string } | { name: string }[] | null | undefined,
) {
  if (!author) return "Unknown";
  if (Array.isArray(author)) return author[0]?.name || "Unknown";
  return author.name;
}

function mapFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    status: row.status,
    team: row.team,
    product_area: row.product_area,
    screenshot_path: row.screenshot_path,
    author_id: row.author_id,
    author_name: authorName(row.author),
    created_at: row.created_at,
    updated_at: row.updated_at,
    comment_count: row.comments?.[0]?.count ?? 0,
  };
}

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    feedback_id: row.feedback_id,
    author_id: row.author_id,
    author_name: authorName(row.author),
    body: row.body,
    created_at: row.created_at,
  };
}

export type FeedbackFilters = {
  status?: FeedbackStatus | "all";
  team?: string;
  product_area?: string;
  type?: FeedbackType | "all";
  q?: string;
};

const FEEDBACK_SELECT = `
  id, title, body, type, status, team, product_area, screenshot_path,
  author_id, created_at, updated_at,
  author:profiles!author_id(name),
  comments(count)
`;

export async function listUsers(): Promise<User[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .order("name");
  if (error) throw error;
  return (data || []) as User[];
}

export async function getUser(id: string): Promise<User | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as User | null) || undefined;
}

export async function listFeedback(
  filters: FeedbackFilters = {},
): Promise<Feedback[]> {
  const supabase = await createClient();
  let query = supabase.from("feedback").select(FEEDBACK_SELECT);

  if (filters.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters.team && filters.team !== "all") {
    query = query.eq("team", filters.team);
  }
  if (filters.product_area && filters.product_area !== "all") {
    query = query.eq("product_area", filters.product_area);
  }
  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    query = query.or(`title.ilike.%${q}%,body.ilike.%${q}%`);
  }

  const { data, error } = await query.order("updated_at", { ascending: false });
  if (error) throw error;

  const items = ((data || []) as FeedbackRow[]).map(mapFeedback);
  const rank: Record<FeedbackStatus, number> = {
    new: 0,
    in_progress: 1,
    done: 2,
  };
  return items.sort((a, b) => {
    const byStatus = rank[a.status] - rank[b.status];
    if (byStatus !== 0) return byStatus;
    return b.updated_at.localeCompare(a.updated_at);
  });
}

export async function getFeedback(id: string): Promise<Feedback | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .select(FEEDBACK_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapFeedback(data as FeedbackRow) : undefined;
}

export async function createFeedback(input: {
  title: string;
  body: string;
  type: FeedbackType;
  team?: string | null;
  product_area?: string | null;
  screenshot_path?: string | null;
  author_id: string;
}): Promise<Feedback> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .insert({
      title: input.title,
      body: input.body,
      type: input.type,
      team: input.team ?? null,
      product_area: input.product_area ?? null,
      screenshot_path: input.screenshot_path ?? null,
      author_id: input.author_id,
      status: "new",
    })
    .select(FEEDBACK_SELECT)
    .single();
  if (error) throw error;
  return mapFeedback(data as FeedbackRow);
}

export async function updateFeedback(
  id: string,
  patch: Partial<{
    status: FeedbackStatus;
    team: string | null;
    product_area: string | null;
  }>,
): Promise<Feedback | undefined> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback")
    .update(patch)
    .eq("id", id)
    .select(FEEDBACK_SELECT)
    .maybeSingle();
  if (error) throw error;
  return data ? mapFeedback(data as FeedbackRow) : undefined;
}

export async function listComments(feedbackId: string): Promise<Comment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      id, feedback_id, author_id, body, created_at,
      author:profiles!author_id(name)
    `,
    )
    .eq("feedback_id", feedbackId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return ((data || []) as CommentRow[]).map(mapComment);
}

export async function addComment(input: {
  feedback_id: string;
  author_id: string;
  body: string;
}): Promise<Comment> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .insert({
      feedback_id: input.feedback_id,
      author_id: input.author_id,
      body: input.body,
    })
    .select(
      `
      id, feedback_id, author_id, body, created_at,
      author:profiles!author_id(name)
    `,
    )
    .single();
  if (error) throw error;

  // Bump parent updated_at for board sorting
  await supabase
    .from("feedback")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", input.feedback_id);

  return mapComment(data as CommentRow);
}

export async function countByStatus(): Promise<Record<FeedbackStatus, number>> {
  const supabase = await createClient();
  const result: Record<FeedbackStatus, number> = {
    new: 0,
    in_progress: 0,
    done: 0,
  };

  const statuses: FeedbackStatus[] = ["new", "in_progress", "done"];
  await Promise.all(
    statuses.map(async (status) => {
      const { count, error } = await supabase
        .from("feedback")
        .select("id", { count: "exact", head: true })
        .eq("status", status);
      if (error) throw error;
      result[status] = count || 0;
    }),
  );

  return result;
}

export async function uploadScreenshot(
  userId: string,
  file: File,
): Promise<string> {
  const supabase = await createClient();
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from("screenshots")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
  if (error) throw error;

  const { data } = supabase.storage.from("screenshots").getPublicUrl(path);
  return data.publicUrl;
}
