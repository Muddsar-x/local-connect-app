'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../lib/useAuth';

export default function ReportPage() {
  const { id } = useParams();
  const { user } = useAuth();
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

    // Upload customer's photo
    const fileName = `report-${user.id}-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('business-photos')
      .upload(fileName, photoFile);

    if (uploadError) {
      setMessage('Photo upload failed: ' + uploadError.message);
      setLoading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('business-photos')
      .getPublicUrl(fileName);

    // Get business baseline photo for comparison
    const { data: business } = await supabase
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();

    // Call AI verification API
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

    // Save report with AI verdict
    const { error: insertError } = await supabase.from('reports').insert({
      business_id: id,
      customer_id: user.id,
      photo_url: urlData.publicUrl,
      review_text: reviewText,
      ai_verdict: aiResult.verdict,
      ai_reasoning: aiResult.reasoning,
    });

    if (insertError) {
      setMessage('Error saving report: ' + insertError.message);
      setLoading(false);
      return;
    }

    // If verified, lower rating
    if (aiResult.verdict === 'verified') {
      const newRating = Math.max(1, (business.rating || 5) - 0.5);
      await supabase.from('businesses').update({ rating: newRating }).eq('id', id);
    }

    setMessage(`Report submitted! AI Verdict: ${aiResult.verdict}. ${aiResult.reasoning}`);
    setLoading(false);
    setTimeout(() => router.push('/customer-dashboard'), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-xl font-bold mb-2">Report Closed Shop</h1>
        <p className="text-sm text-gray-500 mb-4">
          ⚠️ Take a photo of the shop right now. Make sure a clock/phone showing 
          the current time is visible in the frame.
        </p>

        {message && <p className="text-blue-600 mb-4 text-sm">{message}</p>}

        <label className="block mb-2 text-sm font-medium">Photo (with visible time):</label>
        <input
          type="file" accept="image/*" capture="environment"
          onChange={(e) => setPhotoFile(e.target.files[0])}
          className="w-full p-2 border rounded mb-4" required
        />

        <label className="block mb-2 text-sm font-medium">What did you notice?</label>
        <textarea
          placeholder="e.g. Shutter is down, lights are off..."
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          className="w-full p-2 border rounded mb-6" rows={3} required
        />

        <button
          type="submit" disabled={loading}
          className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? 'Analyzing with AI...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}