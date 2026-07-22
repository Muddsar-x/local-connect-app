'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../lib/useAuth';
import { useRouter } from 'next/navigation';

export default function OwnerDashboard() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [business, setBusiness] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('shop');
  const [contactNo, setContactNo] = useState('');
  const [address, setAddress] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [message, setMessage] = useState('');

  // Profile edit states
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
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', user.id)
      .single();
    setBusiness(data);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      let photoUrl = '';
      if (photoFile) {
        const fileName = `${user.id}-${Date.now()}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('business-photos')
          .upload(fileName, photoFile);

        if (uploadError) {
          setMessage('Photo upload failed: ' + uploadError.message);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('business-photos')
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      const { error } = await supabase.from('businesses').insert({
        owner_id: user.id,
        name,
        category,
        latitude,
        longitude,
        address,
        contact_no: contactNo,
        baseline_closed_photo_url: photoUrl,
        current_status: 'closed',
      });

      if (error) {
        setMessage('Error: ' + error.message);
      } else {
        setMessage('Business registered successfully!');
        fetchBusiness();
      }
    }, () => {
      setMessage('Location access needed to register business.');
    });
  };

  const toggleStatus = async () => {
    const newStatus = business.current_status === 'open' ? 'closed' : 'open';
    const { error } = await supabase
      .from('businesses')
      .update({ current_status: newStatus })
      .eq('id', business.id);

    if (!error) {
      setBusiness({ ...business, current_status: newStatus });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileMessage('');

    const { error } = await supabase
      .from('profiles')
      .update({ name: profileName, phone: profilePhone })
      .eq('id', user.id);

    if (error) {
      setProfileMessage('Error: ' + error.message);
    } else {
      setProfileMessage('Profile updated successfully!');
      setEditingProfile(false);
    }
  };

  if (loading) return <p className="p-8">Loading...</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Owner Dashboard</h1>
        <button
          onClick={() => setEditingProfile(!editingProfile)}
          className="text-sm text-blue-600 underline"
        >
          {editingProfile ? 'Cancel' : 'Edit My Profile'}
        </button>
      </div>

      {/* PROFILE EDIT SECTION */}
      {editingProfile && (
        <form onSubmit={handleProfileUpdate} className="bg-white p-6 rounded-lg shadow-md max-w-md mb-6">
          <h2 className="text-lg font-semibold mb-4">Edit My Profile</h2>
          {profileMessage && <p className="text-blue-600 mb-4 text-sm">{profileMessage}</p>}

          <label className="block mb-1 text-sm font-medium">Name</label>
          <input
            type="text" value={profileName}
            onChange={(e) => setProfileName(e.target.value)}
            className="w-full p-2 border rounded mb-4" required
          />

          <label className="block mb-1 text-sm font-medium">Phone</label>
          <input
            type="tel" value={profilePhone}
            onChange={(e) => setProfilePhone(e.target.value)}
            className="w-full p-2 border rounded mb-4" required
          />

          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Save Changes
          </button>
        </form>
      )}

      {!editingProfile && (
        <p className="mb-6 text-sm text-gray-500">
          Logged in as: <span className="font-medium">{profile?.name}</span> ({profile?.phone})
        </p>
      )}

      {!business ? (
        <form onSubmit={handleRegister} className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-lg font-semibold mb-4">Register Your Business</h2>
          {message && <p className="text-red-500 mb-4">{message}</p>}

          <input
            type="text" placeholder="Business Name" value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border rounded mb-4" required
          />

          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full p-2 border rounded mb-4"
          >
            <option value="shop">Shop</option>
            <option value="hospital">Hospital</option>
            <option value="pharmacy">Pharmacy</option>
            <option value="restaurant">Restaurant</option>
          </select>

          <input
            type="text" placeholder="Address" value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full p-2 border rounded mb-4" required
          />

          <input
            type="tel" placeholder="Contact Number" value={contactNo}
            onChange={(e) => setContactNo(e.target.value)}
            className="w-full p-2 border rounded mb-4" required
          />

          <label className="block mb-2 text-sm font-medium">
            Upload photo of your CLOSED shop (name/board visible):
          </label>
          <input
            type="file" accept="image/*"
            onChange={(e) => setPhotoFile(e.target.files[0])}
            className="w-full p-2 border rounded mb-6" required
          />

          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Register Business
          </button>
        </form>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md">
          <h2 className="text-xl font-semibold">{business.name}</h2>
          <p className="text-gray-600 capitalize">{business.category}</p>
          <p className="text-gray-600">{business.address}</p>
          <p className="text-gray-600">📞 {business.contact_no}</p>
          <p className="mt-2">⭐ Rating: {business.rating}</p>

          <div className="mt-6">
            <p className="mb-2 font-medium">
              Current Status:{' '}
              <span className={business.current_status === 'open' ? 'text-green-600' : 'text-red-600'}>
                {business.current_status.toUpperCase()}
              </span>
            </p>
            <button
              onClick={toggleStatus}
              className={`px-6 py-2 rounded font-medium text-white ${
                business.current_status === 'open' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              Mark as {business.current_status === 'open' ? 'Closed' : 'Open'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}