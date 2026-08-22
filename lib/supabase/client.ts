import { createBrowserClient } from '@supabase/ssr';

// Uses the public anon key only. RLS on every table/bucket enforces that
// only the two authorized profiles can ever read or write data — the anon
// key alone grants no access.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
