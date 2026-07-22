'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('customer');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      name,
      role,
      phone,
    });

    if (profileError) {
      setError(profileError.message);
      return;
    }

    router.push(role === 'owner' ? '/owner-dashboard' : '/customer-dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSignup} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Sign Up - LocalConnect</h1>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        <input
          type="text" placeholder="Full Name" value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-2 border rounded mb-4" required
        />
        <input
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded mb-4" required
        />
        <input
          type="password" placeholder="Password" value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded mb-4" required
        />
        <input
          type="tel" placeholder="Phone Number" value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border rounded mb-4" required
        />

        <label className="block mb-2 font-medium">I am a:</label>
        <select
          value={role} onChange={(e) => setRole(e.target.value)}
          className="w-full p-2 border rounded mb-6"
        >
          <option value="customer">Customer</option>
          <option value="owner">Business Owner</option>
        </select>

        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
          Sign Up
        </button>
      </form>
    </div>
  );
}