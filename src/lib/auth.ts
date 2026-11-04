import { cookies } from "next/headers";
import { getUser, listUsers } from "./db";
import type { User } from "./types";

export const USER_COOKIE = "signal_user";

export async function getCurrentUser(): Promise<User> {
  const jar = await cookies();
  const id = jar.get(USER_COOKIE)?.value;
  if (id) {
    const user = getUser(id);
    if (user) return user;
  }
  // Default to a member submitter for the demo persona switcher
  return listUsers().find((u) => u.role === "member") ?? listUsers()[0];
}

export function isAdmin(user: User) {
  return user.role === "admin";
}
