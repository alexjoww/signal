import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { query } from "@/lib/db/pool";
import type {
  Comment,
  Feedback,
  FeedbackStatus,
  FeedbackType,
  User,
} from "@/lib/types";

export type FeedbackFilters = {
  status?: FeedbackStatus | "all";
  team?: string;
  product_area?: string;
  type?: FeedbackType | "all";
  q?: string;
};

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
  author_name: string;
  created_at: string;
  updated_at: string;
  comment_count: number | string;
};

type CommentRow = {
  id: string;
  feedback_id: string;
  author_id: string;
  author_name: string;
  body: string;
  created_at: string;
};

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
    author_name: row.author_name,
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(row.created_at).toISOString(),
    updated_at:
      typeof row.updated_at === "string"
        ? row.updated_at
        : new Date(row.updated_at).toISOString(),
    comment_count: Number(row.comment_count) || 0,
  };
}

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    feedback_id: row.feedback_id,
    author_id: row.author_id,
    author_name: row.author_name,
    body: row.body,
    created_at:
      typeof row.created_at === "string"
        ? row.created_at
        : new Date(row.created_at).toISOString(),
  };
}

export async function listUsers(): Promise<User[]> {
  const { rows } = await query<User>(
    `select id, name, email, role from profiles order by name`,
  );
  return rows;
}

export async function getUser(id: string): Promise<User | undefined> {
  const { rows } = await query<User>(
    `select id, name, email, role from profiles where id = $1`,
    [id],
  );
  return rows[0];
}

export async function listFeedback(
  filters: FeedbackFilters = {},
): Promise<Feedback[]> {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (filters.status && filters.status !== "all") {
    params.push(filters.status);
    clauses.push(`f.status = $${params.length}`);
  }
  if (filters.team && filters.team !== "all") {
    params.push(filters.team);
    clauses.push(`f.team = $${params.length}`);
  }
  if (filters.product_area && filters.product_area !== "all") {
    params.push(filters.product_area);
    clauses.push(`f.product_area = $${params.length}`);
  }
  if (filters.type && filters.type !== "all") {
    params.push(filters.type);
    clauses.push(`f.type = $${params.length}`);
  }
  if (filters.q?.trim()) {
    params.push(`%${filters.q.trim()}%`);
    clauses.push(
      `(f.title ilike $${params.length} or f.body ilike $${params.length})`,
    );
  }

  const where = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const { rows } = await query<FeedbackRow>(
    `select f.id, f.title, f.body, f.type, f.status, f.team, f.product_area,
            f.screenshot_path, f.author_id, f.created_at, f.updated_at,
            p.name as author_name,
            (select count(*) from comments c where c.feedback_id = f.id) as comment_count
     from feedback f
     join profiles p on p.id = f.author_id
     ${where}
     order by
       case f.status when 'new' then 0 when 'in_progress' then 1 else 2 end,
       f.updated_at desc`,
    params,
  );
  return rows.map(mapFeedback);
}

export async function getFeedback(id: string): Promise<Feedback | undefined> {
  const { rows } = await query<FeedbackRow>(
    `select f.id, f.title, f.body, f.type, f.status, f.team, f.product_area,
            f.screenshot_path, f.author_id, f.created_at, f.updated_at,
            p.name as author_name,
            (select count(*) from comments c where c.feedback_id = f.id) as comment_count
     from feedback f
     join profiles p on p.id = f.author_id
     where f.id = $1`,
    [id],
  );
  return rows[0] ? mapFeedback(rows[0]) : undefined;
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
  const { rows } = await query<{ id: string }>(
    `insert into feedback
      (title, body, type, status, team, product_area, screenshot_path, author_id)
     values ($1, $2, $3, 'new', $4, $5, $6, $7)
     returning id`,
    [
      input.title,
      input.body,
      input.type,
      input.team ?? null,
      input.product_area ?? null,
      input.screenshot_path ?? null,
      input.author_id,
    ],
  );
  return (await getFeedback(rows[0].id))!;
}

export async function updateFeedback(
  id: string,
  patch: Partial<{
    status: FeedbackStatus;
    team: string | null;
    product_area: string | null;
  }>,
): Promise<Feedback | undefined> {
  const existing = await getFeedback(id);
  if (!existing) return undefined;

  await query(
    `update feedback
     set status = $2,
         team = $3,
         product_area = $4,
         updated_at = now()
     where id = $1`,
    [
      id,
      patch.status ?? existing.status,
      patch.team !== undefined ? patch.team : existing.team,
      patch.product_area !== undefined
        ? patch.product_area
        : existing.product_area,
    ],
  );
  return getFeedback(id);
}

export async function listComments(feedbackId: string): Promise<Comment[]> {
  const { rows } = await query<CommentRow>(
    `select c.id, c.feedback_id, c.author_id, c.body, c.created_at,
            p.name as author_name
     from comments c
     join profiles p on p.id = c.author_id
     where c.feedback_id = $1
     order by c.created_at asc`,
    [feedbackId],
  );
  return rows.map(mapComment);
}

export async function addComment(input: {
  feedback_id: string;
  author_id: string;
  body: string;
}): Promise<Comment> {
  const { rows } = await query<{ id: string }>(
    `insert into comments (feedback_id, author_id, body)
     values ($1, $2, $3)
     returning id`,
    [input.feedback_id, input.author_id, input.body],
  );
  await query(`update feedback set updated_at = now() where id = $1`, [
    input.feedback_id,
  ]);
  const { rows: full } = await query<CommentRow>(
    `select c.id, c.feedback_id, c.author_id, c.body, c.created_at,
            p.name as author_name
     from comments c
     join profiles p on p.id = c.author_id
     where c.id = $1`,
    [rows[0].id],
  );
  return mapComment(full[0]);
}

export async function countByStatus(): Promise<Record<FeedbackStatus, number>> {
  const { rows } = await query<{ status: FeedbackStatus; c: string }>(
    `select status, count(*)::text as c from feedback group by status`,
  );
  const result: Record<FeedbackStatus, number> = {
    new: 0,
    in_progress: 0,
    done: 0,
  };
  for (const row of rows) result[row.status] = Number(row.c) || 0;
  return result;
}

export async function uploadScreenshot(
  _userId: string,
  file: File,
): Promise<string> {
  const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") || "png";
  const filename = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/uploads/${filename}`;
}
