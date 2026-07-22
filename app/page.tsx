import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">LocalConnect</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Check which shops, hospitals, pharmacies, and restaurants near you 
        are actually open — verified in real-time.
      </p>

      <div className="flex gap-4">
        <Link href="/login" className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
          Login
        </Link>
        <Link href="/signup" className="bg-white border border-blue-600 text-blue-600 px-6 py-3 rounded hover:bg-blue-50">
          Sign Up
        </Link>
      </div>
    </div>
  );
}