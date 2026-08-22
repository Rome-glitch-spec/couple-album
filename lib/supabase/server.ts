import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Server-side client for Server Components / Route Handlers / Server Actions.
// Still uses the anon key + the signed-in user's session — never the
// service role key. RLS remains the real enforcement boundary.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component with no request context — safe
            // to ignore because middleware refreshes the session on nav.
          }
        },
      },
    }
  );
}

// Admin client using the service role key. ONLY ever import this from
// server-only files (route handlers / server actions). Never imported by
// any file that ships to the browser.
import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set on the server.');
  }
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
