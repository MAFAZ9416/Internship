import React, { useState, useEffect, useRef } from "react";
import { FaTimes, FaCamera, FaEnvelope, FaUser, FaInfoCircle, FaCalendarAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { API_HOST } from "../services/api";

export default function ProfileModal({ onClose, theme }) {
  const { user, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setBio(user.bio || "");
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      } else {
        setAvatarPreview("");
      }
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email Address is required");
      return;
    }

    setIsSaving(true);
    const formData = new FormData();
    formData.append("full_name", fullName.trim());
    formData.append("email", email.trim());
    formData.append("bio", bio.trim());
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      await updateProfile(formData);
      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      if (err.response && err.response.data) {
        const d = err.response.data;
        if (typeof d === "string") setError(d);
        else if (d.email) setError(d.email.join(", "));
        else if (d.full_name) setError(d.full_name.join(", "));
        else if (d.avatar) setError(d.avatar.join(", "));
        else if (d.error) setError(d.error);
        else setError("Failed to update profile. Please try again.");
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const formatMemberSince = (dateString) => {
    if (!dateString) return "June 2026";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div 
        className={`w-full max-w-lg rounded-3xl border shadow-2xl p-6 relative overflow-hidden transition-all duration-300 transform scale-100 ${
          theme === "dark" 
            ? "bg-[#0F172A]/90 border-white/10 text-white" 
            : "bg-white border-slate-200 text-slate-800"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background decorative glows */}
        <div className="absolute w-48 h-48 rounded-full blur-[80px] opacity-20 bg-purple-500 -top-10 -right-10 pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full blur-[80px] opacity-20 bg-blue-500 -bottom-10 -left-10 pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-6">
          <h2 className="text-xl font-bold tracking-tight text-gradient">Profile Settings</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
          >
            <FaTimes size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-bounce">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs flex items-center gap-2">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-purple-500/30 group-hover:border-purple-500/60 transition-all duration-300 shadow-lg">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="user-avatar w-full h-full object-cover" />
                ) : (
                  <div className="avatar-fallback w-full h-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white font-extrabold text-3xl select-none">
                    {fullName ? fullName.split(" ").filter(Boolean).map(w => w[0]).join("").toUpperCase().slice(0, 2) : "AI"}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-md transition-transform duration-200 hover:scale-110 cursor-pointer"
              >
                <FaCamera size={12} />
              </button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleAvatarChange} 
              accept="image/*" 
              className="hidden" 
            />
            <p className="text-[10px] text-gray-400">Allowed formats: JPG, PNG, GIF</p>
          </div>

          <div className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-400">Full Name</label>
              <div className="relative w-full">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your name"
                  className={`w-full px-4 h-11 outline-none border rounded-xl transition-all duration-200 ${
                    theme === "dark"
                      ? "bg-white/5 backdrop-blur-md text-white border-white/10 placeholder:text-slate-500 focus:border-[#7C3AED] focus:bg-white/10"
                      : "bg-black/5 backdrop-blur-md text-slate-900 border-slate-200 placeholder:text-slate-400 focus:border-[#7C3AED] focus:bg-black/10"
                  }`}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-400">Email Address</label>
              <div className="relative w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className={`w-full px-4 h-11 outline-none border rounded-xl transition-all duration-200 ${
                    theme === "dark"
                      ? "bg-white/5 backdrop-blur-md text-white border-white/10 placeholder:text-slate-500 focus:border-[#7C3AED] focus:bg-white/10"
                      : "bg-black/5 backdrop-blur-md text-slate-900 border-slate-200 placeholder:text-slate-400 focus:border-[#7C3AED] focus:bg-black/10"
                  }`}
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-gray-400">Bio</label>
              <div className="relative w-full">
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className={`w-full px-4 py-3 outline-none border rounded-xl transition-all duration-200 resize-none ${
                    theme === "dark"
                      ? "bg-white/5 backdrop-blur-md text-white border-white/10 placeholder:text-slate-500 focus:border-[#7C3AED] focus:bg-white/10"
                      : "bg-black/5 backdrop-blur-md text-slate-900 border-slate-200 placeholder:text-slate-400 focus:border-[#7C3AED] focus:bg-black/10"
                  }`}
                />
              </div>
            </div>

            {/* Member Since (Read-only) */}
            <div className="flex items-center gap-2 text-xs text-gray-400 mt-2 select-none">
              <FaCalendarAlt size={12} />
              <span>Member Since: {formatMemberSince(user?.date_joined)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                theme === "dark"
                  ? "bg-white/5 hover:bg-white/10 text-white"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700"
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 shadow-md shadow-purple-500/20 active:scale-95 transition-all duration-150 cursor-pointer flex items-center gap-2"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
