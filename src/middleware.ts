import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let url = rawUrl.trim().replace(/\/$/, "");
  // Accidental Postgres URI → derive API URL
  if (/^postgres(ql)?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      const dbHost = parsed.hostname.match(
        /^(?:db\.)?([a-z0-9]+)\.supabase\.co$/i,
      );
      if (dbHost) {
        url = `https://${dbHost[1].toLowerCase()}.supabase.co`;
      } else {
        const user = decodeURIComponent(parsed.username || "");
        const poolerUser = user.match(/^postgres\.([a-z0-9]+)$/i);
        if (poolerUser) {
          url = `https://${poolerUser[1].toLowerCase()}.supabase.co`;
        }
      }
    } catch {
      // keep url as-is; client creation will fail clearly
    }
  } else if (
    url.startsWith("db.") &&
    url.endsWith(".supabase.co") &&
    !url.includes("://")
  ) {
    url = `https://${url.slice(3)}`;
  } else if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session — important for Server Components
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
