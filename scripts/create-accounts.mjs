/**
 * scripts/create-accounts.mjs
 *
 * Administrative setup script — creates the two (and only two) authorized
 * accounts for this private album. This is NOT a public sign-up flow: it
 * uses the Supabase service role key and is meant to be run once, locally,
 * by whoever is deploying the app.
 *
 * Usage:
 *   node scripts/create-accounts.mjs "you@example.com" "Your Name" "partner@example.com" "Partner Name"
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL to be set
 * in your environment (e.g. `source .env.local` first, or run via:
 *   node --env-file=.env.local scripts/create-accounts.mjs ...
 * ).
 *
 * Each account is created with a random temporary password that is printed
 * once — sign in and change it immediately from Settings → Account.
 */
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment.');
  process.exit(1);
}

const [email1, name1, email2, name2] = process.argv.slice(2);
if (!email1 || !email2) {
  console.error('Usage: node scripts/create-accounts.mjs <email1> <name1> <email2> <name2>');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

function tempPassword() {
  return crypto.randomBytes(12).toString('base64url');
}

async function createAccount(email, displayName) {
  const password = tempPassword();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no email verification step needed for a private, two-person app
    user_metadata: { display_name: displayName || email.split('@')[0] },
  });
  if (error) {
    console.error(`Failed to create ${email}: ${error.message}`);
    return;
  }
  console.log(`Created ${email} — temporary password: ${password}`);
  console.log(`  (user id: ${data.user.id} — a profiles row was created automatically by the DB trigger)`);
}

await createAccount(email1, name1);
await createAccount(email2, name2);

console.log('\nDone. Sign in with these temporary passwords and change them immediately from Settings.');
