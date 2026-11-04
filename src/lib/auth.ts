import { createClient } from "@/lib/supabase/server";
import type { Role, User } from "@/lib/types";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email, role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    return {
      id: user.id,
      name:
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        "User",
      email: user.email || "",
      role: "member",
    };
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as Role,
  };
}

export function isAdmin(user: User | null | undefined) {
  return user?.role === "admin";
}

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("Sign in required", 401);
  }
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (!isAdmin(user)) {
    throw new AuthError("Admins only", 403);
  }
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}
