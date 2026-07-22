'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomerDashboard() {
  const { user, loading } = useAuth();
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'businesses' },
        () => {
          fetchBusinesses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBusinesses = async () => {
    const { data } = await supabase.from('businesses').select('*').order('created_at', { ascending: false });
    setBusinesses(data || []);
  };

  const filtered = filterCategory === 'all'
    ? businesses
    : businesses.filter((b) => b.category === filterCategory);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Browse Businesses</h1>
        <Link href="/search" className="bg-blue-600 text-white px-4 py-2 rounded">
          🎤 Smart Search
        </Link>
      </div>

      <div className="mb-6 flex gap-2 flex-wrap">
        {['all', 'shop', 'hospital', 'pharmacy', 'restaurant'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded capitalize ${
              filterCategory === cat ? 'bg-blue-600 text-white' : 'bg-white border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((biz) => (
          <div key={biz.id} className="bg-white p-4 rounded-lg shadow-md">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-lg">{biz.name}</h3>
              <span
                className={`px-2 py-1 rounded text-xs font-medium text-white ${
                  biz.current_status === 'open' ? 'bg-green-600' : 'bg-red-600'
                }`}
              >
                {biz.current_status.toUpperCase()}
              </span>
            </div>
            <p className="text-gray-500 capitalize text-sm">{biz.category}</p>
            <p className="text-gray-600 text-sm mt-1">{biz.address}</p>
            <p className="text-gray-600 text-sm">📞 {biz.contact_no}</p>
            <p className="text-sm mt-1">⭐ {biz.rating?.toFixed(1)}</p>

            <Link
              href={`/report/${biz.id}`}
              className="mt-3 inline-block text-sm text-red-600 underline"
            >
              Report if actually closed
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}