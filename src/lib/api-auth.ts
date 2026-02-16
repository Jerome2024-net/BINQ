import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Vérifie l'authentification Supabase dans les API routes.
 * Retourne l'utilisateur authentifié ou null.
 */
export async function getAuthenticatedUser() {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // API routes ne peuvent pas set de cookies
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}
