'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../lib/Navbar';

/* -- small inline icons, no extra deps -- */
const IconMic = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6" strokeLinecap="round" />
  </svg>
);
const IconPhone = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <path d="M4.5 4.5h3.2l1.5 4-2 1.5a11.5 11.5 0 0 0 5.8 5.8l1.5-2 4 1.5v3.2a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3 6.1a1.5 1.5 0 0 1 1.5-1.6Z" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconPin = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <path d="M12 21s7-6.1 7-11.5a7 7 0 1 0-14 0C5 14.9 12 21 12 21Z" strokeLinejoin="round" />
    <circle cx="12" cy="9.5" r="2.3" />
  </svg>
);
const IconStar = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6-5.9-3.3-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8L12 2.5Z" />
  </svg>
);
const IconArrow = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconEmpty = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.6-3.6" strokeLinecap="round" />
  </svg>
);

const categoryMeta = {
  shop: { icon: '🏪', stripe: '#1B4B6B' },
  hospital: { icon: '🏥', stripe: '#D6473F' },
  pharmacy: { icon: '💊', stripe: '#2D8C8C' },
  restaurant: { icon: '🍽️', stripe: '#E8A33D' },
};

export default function CustomerDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [businesses, setBusinesses] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading]);

  useEffect(() => {
    fetchBusinesses();
    const channel = supabase
      .channel('businesses-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'businesses' }, () => {
        fetchBusinesses();
      })
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const fetchBusinesses = async () => {
    const { data } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
    setBusinesses(data || []);
  };

  const filtered = filterCategory === 'all' ? businesses : businesses.filter((b) => b.category === filterCategory);

  return (
    <div className="min-h-screen bg-[#EFF3F6]">
      <Navbar userName={profile?.name} />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2D8C8C] mb-1">Nearby & now</p>
            <h1 className="text-2xl font-bold text-[#101828]">Browse businesses</h1>
          </div>
          <Link
            href="/search"
            className="flex items-center gap-2 bg-gradient-to-r from-[#2D8C8C] to-[#1B4B6B] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-[#1B4B6B]/25 hover:brightness-110 transition text-center w-fit"
          >
            <IconMic className="h-4 w-4" /> Smart search
          </Link>
        </div>

        <div className="mb-7 flex gap-2 flex-wrap">
          {['all', 'shop', 'hospital', 'pharmacy', 'restaurant'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition border ${
                filterCategory === cat
                  ? 'bg-[#101828] text-white border-[#101828] shadow-md'
                  : 'bg-white border-slate-200 text-slate-600 hover:border-[#1B4B6B]/40 hover:text-[#1B4B6B]'
              }`}
            >
              {cat === 'all' ? 'All' : `${categoryMeta[cat].icon} ${cat}`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 text-slate-400">
            <IconEmpty className="h-9 w-9 mb-3" />
            <p className="text-slate-500 font-medium">No businesses found</p>
            <p className="text-sm mt-1">Try a different category.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((biz) => {
              const isOpen = biz.current_status === 'open';
              const meta = categoryMeta[biz.category] || { icon: '📍', stripe: '#1B4B6B' };
              return (
                <div
                  key={biz.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition"
                >
                  <div className="h-1.5" style={{ backgroundColor: meta.stripe }} />
                  <div className="relative">
                    {biz.display_photo_url ? (
                      <img src={biz.display_photo_url} alt={biz.name} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-4xl">
                        {meta.icon}
                      </div>
                    )}
                    <span
                      className={`absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide shadow-lg ${
                        isOpen ? 'bg-[#E8A33D] text-[#3B2A05] shadow-[#E8A33D]/50' : 'bg-[#D6473F] text-white shadow-[#D6473F]/40'
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${isOpen ? 'bg-[#3B2A05] animate-pulse' : 'bg-white/80'}`} />
                      {isOpen ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-1.5">
                      <h3 className="font-bold text-lg text-[#101828] leading-snug">{biz.name}</h3>
                    </div>
                    <p className="text-slate-400 capitalize text-xs font-medium mb-2.5">{meta.icon} {biz.category}</p>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p className="flex items-center gap-1.5"><IconPin className="h-3.5 w-3.5 text-[#1B4B6B] shrink-0" /> {biz.address}</p>
                      <p className="flex items-center gap-1.5"><IconPhone className="h-3.5 w-3.5 text-[#1B4B6B] shrink-0" /> {biz.contact_no}</p>
                    </div>
                    <p className="flex items-center gap-1 text-sm mt-2.5 text-amber-600 font-semibold">
                      <IconStar className="h-3.5 w-3.5" /> {biz.rating?.toFixed(1)}
                    </p>

                    <Link
                      href={`/report/${biz.id}`}
                      className="mt-4 inline-flex items-center gap-1 text-xs text-[#D6473F] font-semibold hover:gap-1.5 transition-all"
                    >
                      Report if actually closed <IconArrow className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
