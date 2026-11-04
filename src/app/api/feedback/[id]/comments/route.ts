import { NextResponse } from "next/server";
import { AuthError, requireAdmin } from "@/lib/auth";
import { addComment, getFeedback } from "@/lib/db";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const user = await requireAdmin();
    const { id } = await ctx.params;
    const item = await getFeedback(id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = (await request.json()) as { body?: string };
    const text = body.body?.trim();
    if (!text) {
      return NextResponse.json({ error: "Comment required" }, { status: 400 });
    }

    const comment = await addComment({
      feedback_id: id,
      author_id: user.id,
      body: text,
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 });
  }
}
