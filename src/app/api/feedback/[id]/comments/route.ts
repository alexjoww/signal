import { NextResponse } from "next/server";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { addComment, getFeedback } from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  const user = await getCurrentUser();
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const item = getFeedback(id);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as { body?: string };
  const text = body.body?.trim();
  if (!text) {
    return NextResponse.json({ error: "Comment required" }, { status: 400 });
  }

  const comment = addComment({
    feedback_id: id,
    author_id: user.id,
    body: text,
  });

  return NextResponse.json({ comment }, { status: 201 });
}
