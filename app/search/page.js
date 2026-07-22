'use client';
import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const recognitionRef = useRef(null);

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

    // Ask Gemini to extract structured filters from natural language
    const aiResponse = await fetch('/api/nlp-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: textToSearch }),
    });

    const filters = await aiResponse.json();

    let dbQuery = supabase.from('businesses').select('*');

    if (filters.category && filters.category !== 'any') {
      dbQuery = dbQuery.eq('category', filters.category);
    }
    if (filters.status && filters.status !== 'any') {
      dbQuery = dbQuery.eq('current_status', filters.status);
    }

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
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold mb-6">Smart Search</h1>

      <div className="bg-white p-4 rounded-lg shadow-md mb-6 max-w-xl">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. I need a pharmacy open near me"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 p-2 border rounded"
          />
          <button
            onClick={() => handleSearch()}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Search
          </button>
          <button
            onClick={startListening}
            className={`px-4 py-2 rounded ${isListening ? 'bg-red-600' : 'bg-gray-200'}`}
          >
            🎤
          </button>
        </div>
        {isListening && <p className="text-sm text-blue-600 mt-2">Listening...</p>}
        {loading && <p className="text-sm text-gray-500 mt-2">Searching...</p>}
        {message && <p className="text-sm text-red-500 mt-2">{message}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {results.map((biz) => (
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
          </div>
        ))}
      </div>

      <Link href="/customer-dashboard" className="mt-6 inline-block text-blue-600 underline">
        ← Back to Dashboard
      </Link>
    </div>
  );
}