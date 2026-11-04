import { NextResponse } from "next/server";
import { USER_COOKIE, getCurrentUser } from "@/lib/auth";
import { getUser, listUsers } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json({ user, users: listUsers() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { userId?: string };
  if (!body.userId) {
    return NextResponse.json({ error: "userId required" }, { status: 400 });
  }
  const user = getUser(body.userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const res = NextResponse.json({ user });
  res.cookies.set(USER_COOKIE, user.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return res;
}
