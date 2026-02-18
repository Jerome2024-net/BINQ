import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes qui nécessitent d'être connecté
const protectedRoutes = ["/dashboard", "/tontines", "/paiements", "/portefeuille", "/transactions", "/membres"];
// Routes accessibles uniquement quand NON connecté
const authRoutes = ["/connexion", "/inscription"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Utiliser getSession() pour des vérifications de routing rapides (lecture cookie locale)
  // getUser() fait un appel réseau à chaque navigation (~200-500ms de latence)
  // La validation sécurisée du token se fait côté client dans AuthContext
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const pathname = request.nextUrl.pathname;

  // Si non connecté et route protégée → rediriger vers /connexion
  if (!user && protectedRoutes.some((route) => pathname.startsWith(route))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/connexion";
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Si connecté et sur une page d'auth → rediriger vers /dashboard
  if (user && authRoutes.some((route) => pathname.startsWith(route))) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/dashboard";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
