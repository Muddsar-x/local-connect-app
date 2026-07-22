'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/useAuth';
import Navbar from '../../../lib/Navbar';

export default function ReportPage() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const router = useRouter();
  const [photoFile, setPhotoFile] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    if (!user) {
      setMessage('Please login first.');
      setLoading(false);
      return;
    }

    const fileName = `report-${user.id}-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from('business-photos').upload(fileName, photoFile);

    if (uploadError) {
      setMessage('Photo upload failed: ' + uploadError.message);
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from('business-photos').getPublicUrl(fileName);
    const { data: business } = await supabase.from('businesses').select('*').eq('id', id).single();

    const aiResponse = await fetch('/api/verify-dispute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerPhotoUrl: urlData.publicUrl,
        baselinePhotoUrl: business.baseline_closed_photo_url,
        reviewText,
        businessName: business.name,
      }),
    });

    const aiResult = await aiResponse.json();

    const { error: insertError } = await supabase.from('reports').insert({
      business_id: id, customer_id: user.id, photo_url: urlData.publicUrl,
      review_text: reviewText, ai_verdict: aiResult.verdict, ai_reasoning: aiResult.reasoning,
    });

    if (insertError) {
      setMessage('Error saving report: ' + insertError.message);
      setLoading(false);
      return;
    }

    if (aiResult.verdict === 'verified') {
      const newRating = Math.max(1, (business.rating || 5) - 0.5);
      await supabase.from('businesses').update({ rating: newRating }).eq('id', id);
    }

    setMessage(`Report submitted! AI Verdict: ${aiResult.verdict}. ${aiResult.reasoning}`);
    setLoading(false);
    setTimeout(() => router.push('/customer-dashboard'), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={profile?.name} />

      <div className="flex items-center justify-center px-4 py-10">
        <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 w-full max-w-sm">
          <h1 className="text-xl font-semibold text-slate-900 mb-2">Report Closed Shop</h1>
          <p className="text-sm text-slate-500 mb-5 leading-relaxed">
            ⚠️ Take a photo of the shop right now. Make sure a clock/phone showing
            the current time is visible in the frame.
          </p>

          {message && <p className="text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2 mb-4 text-sm">{message}</p>}

          <label className="block text-sm font-medium text-slate-700 mb-2">Photo (with visible time)</label>
          <input type="file" accept="image/*" capture="environment" onChange={(e) => setPhotoFile(e.target.files[0])}
            className="w-full text-sm text-slate-500 mb-4 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" required />

          <label className="block text-sm font-medium text-slate-700 mb-1">What did you notice?</label>
          <textarea
            placeholder="e.g. Shutter is down, lights are off..."
            value={reviewText} onChange={(e) => setReviewText(e.target.value)}
            className="w-full p-2.5 border border-slate-300 rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500" rows={3} required
          />

          <button type="submit" disabled={loading}
            className="w-full bg-red-600 text-white p-2.5 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50">
            {loading ? 'Analyzing with AI...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  );
}