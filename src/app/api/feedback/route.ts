import { NextResponse } from "next/server";
import { AuthError, requireUser } from "@/lib/auth";
import { createFeedback, listFeedback, uploadScreenshot } from "@/lib/db";
import type { FeedbackType } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    await requireUser();
    const { searchParams } = new URL(request.url);
    const items = await listFeedback({
      status: (searchParams.get("status") as "all") || "all",
      team: searchParams.get("team") || undefined,
      product_area: searchParams.get("product_area") || undefined,
      type: (searchParams.get("type") as "all") || "all",
      q: searchParams.get("q") || undefined,
    });
    return NextResponse.json({ items });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to list feedback" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const form = await request.formData();

    const title = String(form.get("title") || "").trim();
    const body = String(form.get("body") || "").trim();
    const type = String(form.get("type") || "feedback") as FeedbackType;
    const team = String(form.get("team") || "").trim() || null;
    const product_area = String(form.get("product_area") || "").trim() || null;

    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and details are required." },
        { status: 400 },
      );
    }
    if (!["feedback", "feature", "bug"].includes(type)) {
      return NextResponse.json({ error: "Invalid type." }, { status: 400 });
    }

    let screenshot_path: string | null = null;
    const file = form.get("screenshot");
    if (file && file instanceof File && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Screenshot must be under 5MB." },
          { status: 400 },
        );
      }
      const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
      if (!allowed.includes(file.type)) {
        return NextResponse.json(
          { error: "Screenshot must be PNG, JPEG, WebP, or GIF." },
          { status: 400 },
        );
      }
      screenshot_path = await uploadScreenshot(user.id, file);
    }

    const item = await createFeedback({
      title,
      body,
      type,
      team,
      product_area,
      screenshot_path,
      author_id: user.id,
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}
