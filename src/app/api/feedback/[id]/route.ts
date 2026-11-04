import { NextResponse } from "next/server";
import { AuthError, requireAdmin, requireUser } from "@/lib/auth";
import { getFeedback, listComments, updateFeedback } from "@/lib/db";
import type { FeedbackStatus } from "@/lib/types";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    await requireUser();
    const { id } = await ctx.params;
    const item = await getFeedback(id);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const comments = await listComments(id);
    return NextResponse.json({ item, comments });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to load item" }, { status: 500 });
  }
}

export async function PATCH(request: Request, ctx: Ctx) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      status?: FeedbackStatus;
      team?: string | null;
      product_area?: string | null;
    };

    if (body.status && !["new", "in_progress", "done"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const item = await updateFeedback(id, body);
    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
