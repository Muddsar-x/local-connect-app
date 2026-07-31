'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

/* -- small inline icons, no extra deps -- */
const IconMail = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m4 7 8 6 8-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconLock = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
    <path d="M7.5 10.5V7.8a4.5 4.5 0 1 1 9 0v2.7" strokeLinecap="round" />
  </svg>
);
const IconSignal = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
    <path d="M7.5 9.5a6 6 0 0 1 9 0M4.5 6.5a10.3 10.3 0 0 1 15 0" strokeLinecap="round" />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      setError('Could not fetch user role.');
      setLoading(false);
      return;
    }

    router.push(profile.role === 'owner' ? '/owner-dashboard' : '/customer-dashboard');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 overflow-hidden bg-[#EFF3F6]">
      {/* ambient brand glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-[#2D8C8C]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[#E8A33D]/25 blur-3xl" />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex items-center gap-1.5 text-2xl font-bold tracking-tight text-[#101828]">
            <IconSignal className="h-6 w-6 text-[#E8A33D]" />
            Local<span className="text-[#1B4B6B]">Connect</span>
          </Link>
          <p className="mt-1.5 text-xs font-medium uppercase tracking-[0.18em] text-[#475467]">
            Know what's open, right now
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="relative bg-white p-8 pt-9 rounded-2xl shadow-xl shadow-[#101828]/5 border border-slate-200/70 overflow-hidden"
        >
          <span className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1B4B6B] via-[#2D8C8C] to-[#E8A33D]" />

          <h1 className="text-xl font-bold text-[#101828] mb-6">Welcome back</h1>

          {error && (
            <p className="flex items-center gap-2 text-[#B03A33] bg-[#FBEAE9] border border-[#F2C6C3] rounded-xl px-3 py-2.5 mb-4 text-sm">
              {error}
            </p>
          )}

          <label className="block text-xs font-semibold uppercase tracking-wide text-[#475467] mb-1.5">Email</label>
          <div className="relative mb-4">
            <IconMail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="email" value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4B6B]/40 focus:border-[#1B4B6B] transition"
              required
            />
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wide text-[#475467] mb-1.5">Password</label>
          <div className="relative mb-6">
            <IconLock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
            <input
              type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-3 py-2.5 border border-slate-200 bg-slate-50/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1B4B6B]/40 focus:border-[#1B4B6B] transition"
              required
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-[#1B4B6B] to-[#2D8C8C] text-white p-2.75 py-3 rounded-xl font-semibold shadow-md shadow-[#1B4B6B]/25 hover:brightness-110 active:brightness-95 transition disabled:opacity-50"
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>

          <p className="mt-5 text-sm text-center text-slate-500">
            No account?{' '}
            <Link href="/signup" className="text-[#2D8C8C] font-semibold hover:underline">Sign up here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
