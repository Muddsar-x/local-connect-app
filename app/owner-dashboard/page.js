'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '../../lib/Navbar';

/* -- small inline icons, no extra deps -- */
const IconStore = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 5h18l1.2 4.4a2 2 0 0 1-2 2.6h-.4a2 2 0 0 1-2-2 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-4 0 2 2 0 0 1-2 2h-.4a2 2 0 0 1-2-2.6L3 5Z" strokeLinejoin="round" />
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
const IconEdit = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <path d="M4 20h4L18.5 9.5a2.8 2.8 0 0 0-4-4L4 16v4Z" strokeLinejoin="round" />
  </svg>
);
const IconImage = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
    <circle cx="8.5" cy="9.5" r="1.6" />
    <path d="m4.5 17.5 5-5 3 3 3.5-3.5 4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconLock = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.5" />
    <path d="M7.5 10.5V7.8a4.5 4.5 0 1 1 9 0v2.7" strokeLinecap="round" />
  </svg>
);

const inputClasses =
  'w-full p-2.5 border border-slate-200 bg-slate-50/60 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-[#1B4B6B]/40 focus:border-[#1B4B6B] transition';

export default function OwnerDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('shop');
  const [contactNo, setContactNo] = useState('');
  const [address, setAddress] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [displayPhotoFile, setDisplayPhotoFile] = useState(null);
  const [message, setMessage] = useState('');

  const [editingProfile, setEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && profile && profile.role !== 'owner') router.push('/customer-dashboard');
    if (profile) {
      setProfileName(profile.name || '');
      setProfilePhone(profile.phone || '');
    }
  }, [user, profile, loading]);

  useEffect(() => {
    if (user) fetchBusiness();
  }, [user]);

  const fetchBusiness = async () => {
    const { data } = await supabase.from('businesses').select('*').eq('owner_id', user.id).single();
    setBusiness(data);
  };

  const uploadPhoto = async (file, prefix) => {
    const fileName = `${prefix}-${user.id}-${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage.from('business-photos').upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from('business-photos').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        let photoUrl = '';
        let displayPhotoUrl = '';

        if (photoFile) photoUrl = await uploadPhoto(photoFile, 'closed');
        if (displayPhotoFile) displayPhotoUrl = await uploadPhoto(displayPhotoFile, 'display');

        const { error } = await supabase.from('businesses').insert({
          owner_id: user.id, name, category, latitude, longitude, address,
          contact_no: contactNo,
          baseline_closed_photo_url: photoUrl,
          display_photo_url: displayPhotoUrl,
          current_status: 'closed',
        });

        if (error) {
          setMessage('Error: ' + error.message);
        } else {
          setMessage('Business registered successfully!');
          fetchBusiness();
        }
      } catch (err) {
        setMessage('Photo upload failed: ' + err.message);
      }
    }, () => setMessage('Location access needed to register business.'));
  };

  const toggleStatus = async () => {
    const newStatus = business.current_status === 'open' ? 'closed' : 'open';
    const { error } = await supabase.from('businesses').update({ current_status: newStatus }).eq('id', business.id);
    if (!error) setBusiness({ ...business, current_status: newStatus });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage('');
    const { error } = await supabase.from('profiles').update({ name: profileName, phone: profilePhone }).eq('id', user.id);
    if (error) {
      setProfileMessage('Error: ' + error.message);
    } else {
      setProfileMessage('Profile updated successfully!');
      setEditingProfile(false);
    }
  };

  if (loading) return <p className="p-8 text-slate-500">Loading…</p>;

  const isOpen = business?.current_status === 'open';

  return (
    <div className="min-h-screen bg-[#EFF3F6]">
      <Navbar userName={profile?.name} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2D8C8C] mb-1">Owner Console</p>
            <h1 className="text-2xl font-bold text-[#101828]">Your business</h1>
          </div>
          <button
            onClick={() => setEditingProfile(!editingProfile)}
            className="flex items-center gap-1.5 text-sm font-semibold text-[#1B4B6B] bg-white border border-slate-200 rounded-full px-3.5 py-2 shadow-sm hover:bg-slate-50 transition"
          >
            <IconEdit className="h-4 w-4" />
            {editingProfile ? 'Cancel' : 'Edit profile'}
          </button>
        </div>

        {editingProfile ? (
          <form onSubmit={handleProfileUpdate} className="relative bg-white p-6 pt-7 rounded-2xl shadow-sm border border-slate-200/70 mb-6 overflow-hidden">
            <span className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#1B4B6B] to-[#2D8C8C]" />
            <h2 className="text-base font-bold text-[#101828] mb-4">Edit my profile</h2>
            {profileMessage && <p className="text-[#1B4B6B] bg-[#1B4B6B]/5 border border-[#1B4B6B]/15 rounded-lg px-3 py-2 text-sm mb-3">{profileMessage}</p>}
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#475467] mb-1.5">Name</label>
            <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)} className={inputClasses} required />
            <label className="block text-xs font-semibold uppercase tracking-wide text-[#475467] mb-1.5">Phone</label>
            <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} className={inputClasses} required />
            <button type="submit" className="w-full bg-gradient-to-r from-[#1B4B6B] to-[#2D8C8C] text-white p-2.5 py-3 rounded-xl font-semibold shadow-md shadow-[#1B4B6B]/25 hover:brightness-110 transition">
              Save changes
            </button>
          </form>
        ) : (
          <div className="flex items-center gap-3 mb-6 bg-white/70 border border-slate-200/70 rounded-xl px-4 py-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[#1B4B6B] to-[#2D8C8C] text-white flex items-center justify-center font-bold text-sm">
              {profile?.name?.[0]?.toUpperCase() || '?'}
            </div>
            <p className="text-sm text-slate-500">
              Logged in as <span className="font-semibold text-[#101828]">{profile?.name}</span> · {profile?.phone}
            </p>
          </div>
        )}

        {!business ? (
          <form onSubmit={handleRegister} className="relative bg-white p-6 pt-7 rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
            <span className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#E8A33D] via-[#1B4B6B] to-[#2D8C8C]" />
            <div className="flex items-center gap-2 mb-4">
              <IconStore className="h-5 w-5 text-[#1B4B6B]" />
              <h2 className="text-base font-bold text-[#101828]">Register your business</h2>
            </div>
            {message && <p className="text-[#B03A33] bg-[#FBEAE9] border border-[#F2C6C3] rounded-xl px-3 py-2.5 mb-4 text-sm">{message}</p>}

            <label className="block text-xs font-semibold uppercase tracking-wide text-[#475467] mb-1.5">Business name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClasses} required />

            <label className="block text-xs font-semibold uppercase tracking-wide text-[#475467] mb-1.5">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClasses}>
              <option value="shop">🏪 Shop</option>
              <option value="hospital">🏥 Hospital</option>
              <option value="pharmacy">💊 Pharmacy</option>
              <option value="restaurant">🍽️ Restaurant</option>
            </select>

            <label className="block text-xs font-semibold uppercase tracking-wide text-[#475467] mb-1.5">Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClasses} required />

            <label className="block text-xs font-semibold uppercase tracking-wide text-[#475467] mb-1.5">Contact number</label>
            <input type="tel" value={contactNo} onChange={(e) => setContactNo(e.target.value)} className={inputClasses} required />

            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#475467] mb-2">
              <IconImage className="h-4 w-4 text-[#2D8C8C]" /> Display photo — shown to customers
            </label>
            <input type="file" accept="image/*" onChange={(e) => setDisplayPhotoFile(e.target.files[0])}
              className="w-full text-sm text-slate-500 mb-4 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#2D8C8C]/10 file:text-[#1B4B6B] file:font-semibold hover:file:bg-[#2D8C8C]/20 transition" required />

            <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#475467] mb-2">
              <IconLock className="h-4 w-4 text-[#E8A33D]" /> Closed-shop reference photo — verification only
            </label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])}
              className="w-full text-sm text-slate-500 mb-6 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#E8A33D]/10 file:text-[#8A5B12] file:font-semibold hover:file:bg-[#E8A33D]/20 transition" required />

            <button type="submit" className="w-full bg-gradient-to-r from-[#1B4B6B] to-[#2D8C8C] text-white p-2.5 py-3 rounded-xl font-semibold shadow-md shadow-[#1B4B6B]/25 hover:brightness-110 transition">
              Register business
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/70 overflow-hidden">
            <div className="relative">
              {business.display_photo_url && (
                <img src={business.display_photo_url} alt={business.name} className="w-full h-48 object-cover" />
              )}
              <span className="absolute top-3 left-3 flex items-center gap-1 bg-white/90 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold text-[#1B4B6B] capitalize shadow-sm">
                {business.category}
              </span>
              <span
                className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg ${
                  isOpen ? 'bg-[#E8A33D] text-[#3B2A05] shadow-[#E8A33D]/50' : 'bg-[#D6473F] text-white shadow-[#D6473F]/40'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-[#3B2A05] animate-pulse' : 'bg-white/80'}`} />
                {isOpen ? 'OPEN' : 'CLOSED'}
              </span>
            </div>

            <div className="p-6">
              <h2 className="text-xl font-bold text-[#101828]">{business.name}</h2>
              <div className="mt-3 space-y-1.5 text-sm text-slate-600">
                <p className="flex items-center gap-1.5"><IconPin className="h-4 w-4 text-[#1B4B6B]" /> {business.address}</p>
                <p className="flex items-center gap-1.5"><IconPhone className="h-4 w-4 text-[#1B4B6B]" /> {business.contact_no}</p>
                <p className="flex items-center gap-1 text-amber-600 font-medium"><IconStar className="h-4 w-4" /> {business.rating}</p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="mb-3 font-medium text-slate-700">
                  Current status: <span className={isOpen ? 'text-[#B57415] font-bold' : 'text-[#D6473F] font-bold'}>{business.current_status.toUpperCase()}</span>
                </p>
                <button
                  onClick={toggleStatus}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-white shadow-md transition ${
                    isOpen ? 'bg-[#D6473F] hover:brightness-110 shadow-[#D6473F]/30' : 'bg-[#E8A33D] hover:brightness-105 shadow-[#E8A33D]/30 text-[#3B2A05]'
                  }`}
                >
                  Mark as {isOpen ? 'closed' : 'open'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
