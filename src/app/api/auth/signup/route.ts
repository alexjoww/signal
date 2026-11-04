import { NextResponse } from "next/server";
import {
  AuthError,
  SESSION_COOKIE,
  createSessionToken,
  registerUser,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };
    const user = await registerUser({
      name: String(body.name || ""),
      email: String(body.email || ""),
      password: String(body.password || ""),
    });
    const token = await createSessionToken(user);
    const res = NextResponse.json({ user }, { status: 201 });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
    });
    return res;
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error(err);
    return NextResponse.json({ error: "Sign up failed" }, { status: 500 });
  }
}
