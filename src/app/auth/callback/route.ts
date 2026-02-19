import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  // PKCE flow: exchange code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${appUrl}${next}`);
    }
    console.error("Auth callback PKCE error:", error.message);
  }

  // Token hash flow: signup confirmation / magic link / recovery
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "signup" | "recovery" | "email" | "magiclink" | "invite" | "email_change",
    });
    if (!error) {
      return NextResponse.redirect(`${appUrl}${next}`);
    }
    console.error("Auth callback OTP error:", error.message);
  }

  // Fallback: try token_hash without explicit type (some Supabase versions)
  if (token_hash && !type) {
    for (const tryType of ["signup", "email", "magiclink", "recovery"] as const) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash,
        type: tryType,
      });
      if (!error) {
        return NextResponse.redirect(`${appUrl}${next}`);
      }
    }
  }

  // Redirect to error page
  return NextResponse.redirect(`${appUrl}/connexion?error=auth`);
}
