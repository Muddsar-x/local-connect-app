'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import { useRouter } from 'next/navigation';
import Navbar from '../../lib/Navbar';

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

  if (loading) return <p className="p-8 text-slate-500">Loading...</p>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar userName={profile?.name} />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Owner Dashboard</h1>
          <button onClick={() => setEditingProfile(!editingProfile)} className="text-sm text-blue-600 font-medium hover:underline">
            {editingProfile ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editingProfile && (
          <form onSubmit={handleProfileUpdate} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Edit My Profile</h2>
            {profileMessage && <p className="text-blue-600 text-sm mb-3">{profileMessage}</p>}
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" value={profileName} onChange={(e) => setProfileName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
            <input type="tel" value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            <button type="submit" className="w-full bg-slate-900 text-white p-2.5 rounded-lg font-medium hover:bg-slate-800 transition">
              Save Changes
            </button>
          </form>
        )}

        {!editingProfile && (
          <p className="mb-6 text-sm text-slate-500">
            Logged in as <span className="font-medium text-slate-700">{profile?.name}</span> ({profile?.phone})
          </p>
        )}

        {!business ? (
          <form onSubmit={handleRegister} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h2 className="text-base font-semibold text-slate-800 mb-4">Register Your Business</h2>
            {message && <p className="text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4 text-sm">{message}</p>}

            <label className="block text-sm font-medium text-slate-700 mb-1">Business Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" required />

            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="shop">Shop</option>
              <option value="hospital">Hospital</option>
              <option value="pharmacy">Pharmacy</option>
              <option value="restaurant">Restaurant</option>
            </select>

            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" required />

            <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
            <input type="tel" value={contactNo} onChange={(e) => setContactNo(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500" required />

            <label className="block text-sm font-medium text-slate-700 mb-2">
              📸 Display Photo (shown to customers on your listing)
            </label>
            <input type="file" accept="image/*" onChange={(e) => setDisplayPhotoFile(e.target.files[0])}
              className="w-full text-sm text-slate-500 mb-4 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" required />

            <label className="block text-sm font-medium text-slate-700 mb-2">
              🔒 Closed-Shop Reference Photo (for verification only, name/board visible)
            </label>
            <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])}
              className="w-full text-sm text-slate-500 mb-6 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" required />

            <button type="submit" className="w-full bg-slate-900 text-white p-2.5 rounded-lg font-medium hover:bg-slate-800 transition">
              Register Business
            </button>
          </form>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {business.display_photo_url && (
              <img src={business.display_photo_url} alt={business.name} className="w-full h-48 object-cover" />
            )}
            <div className="p-6">
              <h2 className="text-xl font-semibold text-slate-900">{business.name}</h2>
              <p className="text-slate-400 capitalize text-sm">{business.category}</p>
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                <p>{business.address}</p>
                <p>📞 {business.contact_no}</p>
                <p className="text-amber-600">⭐ {business.rating}</p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="mb-3 font-medium text-slate-700">
                  Current Status:{' '}
                  <span className={business.current_status === 'open' ? 'text-emerald-600' : 'text-red-600'}>
                    {business.current_status.toUpperCase()}
                  </span>
                </p>
                <button
                  onClick={toggleStatus}
                  className={`px-6 py-2.5 rounded-lg font-medium text-white transition ${
                    business.current_status === 'open' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  Mark as {business.current_status === 'open' ? 'Closed' : 'Open'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}