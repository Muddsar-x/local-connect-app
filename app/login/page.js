'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient';

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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <Link href="/" className="text-2xl font-bold text-slate-900">
            Local<span className="text-blue-600">Connect</span>
          </Link>
        </div>

        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-lg border border-slate-200">
          <h1 className="text-xl font-semibold text-slate-800 mb-6">Welcome back</h1>

          {error && (
            <p className="text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4 text-sm">
              {error}
            </p>
          )}

          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input
            type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
          <input
            type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <button
            type="submit" disabled={loading}
            className="w-full bg-slate-900 text-white p-2.5 rounded-lg font-medium hover:bg-slate-800 transition disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="mt-5 text-sm text-center text-slate-500">
            No account?{' '}
            <Link href="/signup" className="text-blue-600 font-medium">Sign up here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}