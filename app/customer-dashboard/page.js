'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../lib/Navbar';

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
  const categoryIcons = { shop: '🏪', hospital: '🏥', pharmacy: '💊', restaurant: '🍽️' };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={profile?.name} />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Browse Businesses</h1>
          <Link href="/search" className="bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition text-center">
            🎤 Smart Search
          </Link>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          {['all', 'shop', 'hospital', 'pharmacy', 'restaurant'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition ${
                filterCategory === cat ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {cat === 'all' ? 'All' : `${categoryIcons[cat]} ${cat}`}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-slate-500 text-center py-12">No businesses found.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((biz) => (
              <div key={biz.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition">
                {biz.display_photo_url ? (
                  <img src={biz.display_photo_url} alt={biz.name} className="w-full h-40 object-cover" />
                ) : (
                  <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-4xl">
                    {categoryIcons[biz.category]}
                  </div>
                )}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-lg text-slate-900">{biz.name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold text-white shrink-0 ${
                      biz.current_status === 'open' ? 'bg-emerald-500' : 'bg-red-500'
                    }`}>
                      {biz.current_status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-400 capitalize text-xs mb-2">{biz.category}</p>
                  <p className="text-slate-600 text-sm">{biz.address}</p>
                  <p className="text-slate-600 text-sm">📞 {biz.contact_no}</p>
                  <p className="text-sm mt-2 text-amber-600">⭐ {biz.rating?.toFixed(1)}</p>

                  <Link href={`/report/${biz.id}`} className="mt-4 inline-block text-xs text-red-600 font-medium hover:underline">
                    Report if actually closed →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}