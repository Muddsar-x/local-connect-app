'use client';
import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import Link from 'next/link';
import Navbar from '../../lib/Navbar';

export default function SearchPage() {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const recognitionRef = useRef(null);

  const categoryIcons = { shop: '🏪', hospital: '🏥', pharmacy: '💊', restaurant: '🍽️' };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessage('Voice search not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      handleSearch(transcript);
    };

    recognition.start();
    recognitionRef.current = recognition;
  };

  const handleSearch = async (searchText) => {
    const textToSearch = searchText || query;
    if (!textToSearch.trim()) return;

    setLoading(true);
    setMessage('');

    const aiResponse = await fetch('/api/nlp-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: textToSearch }),
    });

    const filters = await aiResponse.json();

    let dbQuery = supabase.from('businesses').select('*');
    if (filters.category && filters.category !== 'any') dbQuery = dbQuery.eq('category', filters.category);
    if (filters.status && filters.status !== 'any') dbQuery = dbQuery.eq('current_status', filters.status);

    const { data, error } = await dbQuery;

    if (error) {
      setMessage('Search failed: ' + error.message);
    } else {
      setResults(data || []);
      if (!data || data.length === 0) setMessage('No matching businesses found.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={profile?.name} />

      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Smart Search</h1>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="e.g. I need a pharmacy open near me"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => handleSearch()}
                className="flex-1 sm:flex-none bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Search
              </button>
              <button
                onClick={startListening}
                className={`px-4 py-2.5 rounded-lg transition ${isListening ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                🎤
              </button>
            </div>
          </div>
          {isListening && <p className="text-sm text-blue-600 mt-3">🎙️ Listening...</p>}
          {loading && <p className="text-sm text-slate-400 mt-3">Searching...</p>}
          {message && <p className="text-sm text-red-500 mt-3">{message}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {results.map((biz) => (
            <div key={biz.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg text-slate-900">
                  {categoryIcons[biz.category]} {biz.name}
                </h3>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold text-white shrink-0 ${
                  biz.current_status === 'open' ? 'bg-emerald-500' : 'bg-red-500'
                }`}>
                  {biz.current_status.toUpperCase()}
                </span>
              </div>
              <p className="text-slate-600 text-sm">{biz.address}</p>
              <p className="text-slate-600 text-sm">📞 {biz.contact_no}</p>
            </div>
          ))}
        </div>

        <Link href="/customer-dashboard" className="mt-6 inline-block text-blue-600 text-sm font-medium hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}