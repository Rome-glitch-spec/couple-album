'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Heart, Eye, EyeOff } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlError = params.get('error');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      setError(
        error.message.toLowerCase().includes('invalid')
          ? 'That email or password isn’t right. Try again.'
          : 'Something went wrong signing you in. Please try again.'
      );
      return;
    }
    const redirectPath = params.get('redirectedFrom');
    router.replace(redirectPath && redirectPath !== '/' ? redirectPath : '/dashboard');
    router.refresh();
  }

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-paper px-5 py-10 relative overflow-hidden">
      {/* ambient warmth */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--gold-soft), transparent 70%)' }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, var(--wine), transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="h-12 w-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--wine)' }}>
            <Heart className="h-5 w-5 text-white" fill="white" strokeWidth={0} />
          </div>
          <h1 className="font-display italic text-3xl text-ink">Our Memories</h1>
          <p className="text-ink-soft text-sm mt-2">A private space, just for the two of us.</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-line bg-paper-raised/80 backdrop-blur p-6 sm:p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
        >
          {(error || urlError) && (
            <div className="mb-5 rounded-xl bg-wine/10 border border-wine/20 px-4 py-3 text-sm text-wine-deep">
              {error || 'You don’t have access to this album. Please sign in with an authorized account.'}
            </div>
          )}

          <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-wine/40 focus:border-wine/50 mb-4"
            placeholder="you@example.com"
          />

          <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="password">
            Password
          </label>
          <div className="relative mb-6">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 pr-11 text-ink placeholder:text-ink-soft/60 focus:outline-none focus:ring-2 focus:ring-wine/40 focus:border-wine/50"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-wine text-white font-medium py-2.5 hover:bg-wine-deep transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-wine/40 focus:ring-offset-2 focus:ring-offset-paper-raised"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-xs text-ink-soft mt-6">
          This album is private. There is no public sign-up — only the two of us have access.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
