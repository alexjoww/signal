import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { Comment, Feedback, FeedbackStatus, FeedbackType, User } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "signal.db");

let dbInstance: Database.Database | null = null;

function ensureDirs() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const uploads = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploads)) {
    fs.mkdirSync(uploads, { recursive: true });
  }
}

function seed(db: Database.Database) {
  const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get() as {
    c: number;
  };
  if (userCount.c > 0) return;

  const insertUser = db.prepare(
    `INSERT INTO users (id, name, email, role) VALUES (?, ?, ?, ?)`,
  );

  const users: User[] = [
    {
      id: "u_maya",
      name: "Maya Chen",
      email: "maya@acme.co",
      role: "member",
    },
    {
      id: "u_jordan",
      name: "Jordan Lee",
      email: "jordan@acme.co",
      role: "member",
    },
    {
      id: "u_sam",
      name: "Sam Rivera",
      email: "sam@acme.co",
      role: "admin",
    },
    {
      id: "u_alex",
      name: "Alex Okonkwo",
      email: "alex@acme.co",
      role: "admin",
    },
  ];

  for (const u of users) {
    insertUser.run(u.id, u.name, u.email, u.role);
  }

  const now = Date.now();
  const insertFeedback = db.prepare(
    `INSERT INTO feedback
      (id, title, body, type, status, team, product_area, screenshot_path, author_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const samples: Array<{
    id: string;
    title: string;
    body: string;
    type: FeedbackType;
    status: FeedbackStatus;
    team: string;
    product_area: string;
    author_id: string;
    hoursAgo: number;
  }> = [
    {
      id: "fb_1",
      title: "Export CSV from the dashboard",
      body: "We keep copying rows by hand for weekly reviews. A CSV export on the main dashboard would save a lot of time.",
      type: "feature",
      status: "new",
      team: "Product",
      product_area: "Dashboard",
      author_id: "u_maya",
      hoursAgo: 5,
    },
    {
      id: "fb_2",
      title: "Checkout fails with Apple Pay",
      body: "On Safari 18, tapping Apple Pay returns a blank modal and never completes. Reproduced on two MacBooks.",
      type: "bug",
      status: "in_progress",
      team: "Engineering",
      product_area: "Billing",
      author_id: "u_jordan",
      hoursAgo: 26,
    },
    {
      id: "fb_3",
      title: "Onboarding feels abrupt after invite",
      body: "New hires land on an empty home screen after accepting an invite. A short tour or checklist would help.",
      type: "feedback",
      status: "done",
      team: "Design",
      product_area: "Onboarding",
      author_id: "u_maya",
      hoursAgo: 72,
    },
  ];

  for (const s of samples) {
    const created = new Date(now - s.hoursAgo * 3600_000).toISOString();
    insertFeedback.run(
      s.id,
      s.title,
      s.body,
      s.type,
      s.status,
      s.team,
      s.product_area,
      null,
      s.author_id,
      created,
      created,
    );
  }

  db.prepare(
    `INSERT INTO comments (id, feedback_id, author_id, body, created_at)
     VALUES (?, ?, ?, ?, ?)`,
  ).run(
    "c_1",
    "fb_2",
    "u_sam",
    "Reproduced — looks tied to the payment sheet handshake. Pulling into this sprint.",
    new Date(now - 20 * 3600_000).toISOString(),
  );
}

export function getDb() {
  if (dbInstance) return dbInstance;
  ensureDirs();
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      role TEXT NOT NULL CHECK(role IN ('member', 'admin'))
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('feedback', 'feature', 'bug')),
      status TEXT NOT NULL CHECK(status IN ('new', 'in_progress', 'done')) DEFAULT 'new',
      team TEXT,
      product_area TEXT,
      screenshot_path TEXT,
      author_id TEXT NOT NULL REFERENCES users(id),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      feedback_id TEXT NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
      author_id TEXT NOT NULL REFERENCES users(id),
      body TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
    CREATE INDEX IF NOT EXISTS idx_feedback_team ON feedback(team);
    CREATE INDEX IF NOT EXISTS idx_comments_feedback ON comments(feedback_id);
  `);

  seed(db);
  dbInstance = db;
  return db;
}

export function listUsers(): User[] {
  return getDb().prepare("SELECT * FROM users ORDER BY name").all() as User[];
}

export function getUser(id: string): User | undefined {
  return getDb().prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | User
    | undefined;
}

export type FeedbackFilters = {
  status?: FeedbackStatus | "all";
  team?: string;
  product_area?: string;
  type?: FeedbackType | "all";
  q?: string;
};

export function listFeedback(filters: FeedbackFilters = {}): Feedback[] {
  const clauses: string[] = [];
  const params: string[] = [];

  if (filters.status && filters.status !== "all") {
    clauses.push("f.status = ?");
    params.push(filters.status);
  }
  if (filters.team && filters.team !== "all") {
    clauses.push("f.team = ?");
    params.push(filters.team);
  }
  if (filters.product_area && filters.product_area !== "all") {
    clauses.push("f.product_area = ?");
    params.push(filters.product_area);
  }
  if (filters.type && filters.type !== "all") {
    clauses.push("f.type = ?");
    params.push(filters.type);
  }
  if (filters.q?.trim()) {
    clauses.push("(f.title LIKE ? OR f.body LIKE ?)");
    const like = `%${filters.q.trim()}%`;
    params.push(like, like);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const rows = getDb()
    .prepare(
      `SELECT f.*, u.name AS author_name,
              (SELECT COUNT(*) FROM comments c WHERE c.feedback_id = f.id) AS comment_count
       FROM feedback f
       JOIN users u ON u.id = f.author_id
       ${where}
       ORDER BY
         CASE f.status WHEN 'new' THEN 0 WHEN 'in_progress' THEN 1 ELSE 2 END,
         f.updated_at DESC`,
    )
    .all(...params) as Feedback[];

  return rows;
}

export function getFeedback(id: string): Feedback | undefined {
  return getDb()
    .prepare(
      `SELECT f.*, u.name AS author_name,
              (SELECT COUNT(*) FROM comments c WHERE c.feedback_id = f.id) AS comment_count
       FROM feedback f
       JOIN users u ON u.id = f.author_id
       WHERE f.id = ?`,
    )
    .get(id) as Feedback | undefined;
}

export function createFeedback(input: {
  title: string;
  body: string;
  type: FeedbackType;
  team?: string | null;
  product_area?: string | null;
  screenshot_path?: string | null;
  author_id: string;
}): Feedback {
  const id = `fb_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO feedback
        (id, title, body, type, status, team, product_area, screenshot_path, author_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.title,
      input.body,
      input.type,
      input.team ?? null,
      input.product_area ?? null,
      input.screenshot_path ?? null,
      input.author_id,
      now,
      now,
    );
  return getFeedback(id)!;
}

export function updateFeedback(
  id: string,
  patch: Partial<{
    status: FeedbackStatus;
    team: string | null;
    product_area: string | null;
  }>,
): Feedback | undefined {
  const existing = getFeedback(id);
  if (!existing) return undefined;

  const status = patch.status ?? existing.status;
  const team = patch.team !== undefined ? patch.team : existing.team;
  const product_area =
    patch.product_area !== undefined ? patch.product_area : existing.product_area;
  const now = new Date().toISOString();

  getDb()
    .prepare(
      `UPDATE feedback SET status = ?, team = ?, product_area = ?, updated_at = ? WHERE id = ?`,
    )
    .run(status, team, product_area, now, id);

  return getFeedback(id);
}

export function listComments(feedbackId: string): Comment[] {
  return getDb()
    .prepare(
      `SELECT c.*, u.name AS author_name
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.feedback_id = ?
       ORDER BY c.created_at ASC`,
    )
    .all(feedbackId) as Comment[];
}

export function addComment(input: {
  feedback_id: string;
  author_id: string;
  body: string;
}): Comment {
  const id = `c_${crypto.randomUUID().slice(0, 8)}`;
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO comments (id, feedback_id, author_id, body, created_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, input.feedback_id, input.author_id, input.body, now);

  getDb()
    .prepare(`UPDATE feedback SET updated_at = ? WHERE id = ?`)
    .run(now, input.feedback_id);

  return getDb()
    .prepare(
      `SELECT c.*, u.name AS author_name
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.id = ?`,
    )
    .get(id) as Comment;
}

export function countByStatus(): Record<FeedbackStatus, number> {
  const rows = getDb()
    .prepare(`SELECT status, COUNT(*) as c FROM feedback GROUP BY status`)
    .all() as Array<{ status: FeedbackStatus; c: number }>;
  const result: Record<FeedbackStatus, number> = {
    new: 0,
    in_progress: 0,
    done: 0,
  };
  for (const r of rows) result[r.status] = r.c;
  return result;
}
