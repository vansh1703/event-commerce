"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function SeekerSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [idProofPhoto, setIdProofPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  // Preview URLs
  const [profilePreview, setProfilePreview] = useState<string>("");
  const [idProofPreview, setIdProofPreview] = useState<string>("");

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handleIdProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIdProofPhoto(file);
      setIdProofPreview(URL.createObjectURL(file));
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('seeker-documents')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL
    const { data } = supabase.storage
      .from('seeker-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profilePhoto || !idProofPhoto) {
      alert("Please upload both profile photo and ID proof!");
      return;
    }

    setLoading(true);

    try {
      // Upload profile photo
      console.log('Uploading profile photo...');
      const profilePhotoUrl = await uploadFile(profilePhoto, 'profiles');
      
      // Upload ID proof
      console.log('Uploading ID proof...');
      const idProofPhotoUrl = await uploadFile(idProofPhoto, 'id-proofs');

      console.log('Photos uploaded successfully');

      // Create user account
      const res = await fetch('/api/auth/seeker/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          phone,
          profilePhoto: profilePhotoUrl,
          idProofPhoto: idProofPhotoUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      if (data.success) {
        alert("✅ Signup Successful! Please login.");
        router.push("/seeker/login");
      }
    } catch (error: any) {
      alert(error.message || 'Signup failed');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 px-6 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-2xl rounded-3xl p-8 border border-gray-100">
          <h1 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Job Seeker Signup
          </h1>

          <form onSubmit={handleSignup} className="space-y-5">
            <input
              type="text"
              placeholder="Full Name"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading}
            />

            <input
              type="email"
              placeholder="Email address"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />

            <input
              type="tel"
              placeholder="Phone Number"
              className="w-full border-2 border-gray-200 p-4 rounded-2xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition-all placeholder:text-gray-400 text-gray-800"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
            />

            {/* Profile Photo Upload - Compact */}
            <div>
              <label className="flex items-center justify-between cursor-pointer border-2 border-gray-200 p-4 rounded-2xl bg-white hover:border-indigo-400 transition-all">
                <div className="flex items-center gap-3">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile preview"
                      className="w-12 h-12 object-cover rounded-full border-2 border-indigo-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-2xl">📸</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-700">Profile Photo *</p>
                    <p className="text-xs text-gray-500">
                      {profilePhoto ? profilePhoto.name : "Click to upload"}
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePhotoChange}
                  className="hidden"
                  required
                  disabled={loading}
                />
              </label>
            </div>

            {/* ID Proof Upload - Compact */}
            <div>
              <label className="flex items-center justify-between cursor-pointer border-2 border-gray-200 p-4 rounded-2xl bg-white hover:border-indigo-400 transition-all">
                <div className="flex items-center gap-3">
                  {idProofPreview ? (
                    <img
                      src={idProofPreview}
                      alt="ID preview"
                      className="w-12 h-12 object-cover rounded-lg border-2 border-indigo-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <span className="text-2xl">🆔</span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-700">ID Proof (Aadhar/License) *</p>
                    <p className="text-xs text-gray-500">
                      {idProofPhoto ? idProofPhoto.name : "Click to upload"}
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIdProofChange}
                  className="hidden"
                  required
                  disabled={loading}
                />
              </label>
            </div>

            <button
              disabled={loading}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-gray-600">
            Already have an account?{" "}
            <span
              className="text-indigo-600 cursor-pointer font-semibold hover:text-purple-600 transition-colors"
              onClick={() => router.push("/seeker/login")}
            >
              Sign In
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}