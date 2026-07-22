'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar({ userName }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-slate-900 text-white px-4 py-3 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold tracking-tight">
          Local<span className="text-blue-400">Connect</span>
        </Link>

        <button
          className="md:hidden text-2xl"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className="hidden md:flex items-center gap-4 text-sm">
          {userName && <span className="text-slate-300">Hi, {userName}</span>}
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-slate-700 text-sm">
          {userName && <p className="text-slate-300">Hi, {userName}</p>}
        </div>
      )}
    </nav>
  );
}