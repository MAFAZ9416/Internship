import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaCheck } from "react-icons/fa";

// Crisp inline SVGs for premium look
const RobotSVG = () => (
  <svg viewBox="0 0 200 200" className="w-56 h-56 mx-auto animate-float drop-shadow-[0_0_30px_rgba(124,58,237,0.4)]" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Glowing pedestal */}
    <ellipse cx="100" cy="175" rx="55" ry="14" fill="url(#pedestalGlow)" opacity="0.9" />
    <ellipse cx="100" cy="175" rx="45" ry="10" stroke="#7C3AED" strokeWidth="2" opacity="0.8" className="animate-pulse" />
    <ellipse cx="100" cy="175" rx="30" ry="6" stroke="#A855F7" strokeWidth="1.5" opacity="0.6" />
    
    <g>
      {/* Antennas */}
      <path d="M80 62 L65 48" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="65" cy="48" r="5" fill="#7C3AED" className="animate-pulse" />
      <path d="M120 62 L135 48" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
      <circle cx="135" cy="48" r="5" fill="#7C3AED" className="animate-pulse" />
      
      {/* Ears */}
      <rect x="58" y="76" width="6" height="16" rx="3" fill="#475569" />
      <rect x="136" y="76" width="6" height="16" rx="3" fill="#475569" />
      
      {/* Head Outer */}
      <rect x="64" y="60" width="72" height="62" rx="31" fill="url(#robotBody)" stroke="#334155" strokeWidth="2" />
      
      {/* Face Screen */}
      <rect x="71" y="67" width="58" height="44" rx="19" fill="#070B14" stroke="#1E293B" strokeWidth="1.5" />
      
      {/* Curved smiley eyes */}
      <path d="M81 86 Q87 79 93 86" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M107 86 Q113 79 119 86" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      
      {/* Cute Blush */}
      <circle cx="80" cy="95" r="3.5" fill="#F43F5E" opacity="0.7" />
      <circle cx="120" cy="95" r="3.5" fill="#F43F5E" opacity="0.7" />
      
      {/* Neck */}
      <rect x="91" y="120" width="18" height="8" rx="3" fill="#475569" />
      
      {/* Body */}
      <rect x="78" y="126" width="44" height="34" rx="17" fill="url(#robotBody)" stroke="#334155" strokeWidth="2" />
      
      {/* Glowing screen on chest */}
      <rect x="88" y="132" width="24" height="14" rx="7" fill="#070B14" stroke="#1E293B" strokeWidth="1" />
      {/* Star symbol inside screen */}
      <path d="M100 135 L101.5 138 L105 138.5 L102.5 141 L103 144.5 L100 143 L97 144.5 L97.5 141 L95 138.5 L98.5 138 Z" fill="#7C3AED" className="animate-pulse" />
      
      {/* Floating hands */}
      <circle cx="68" cy="144" r="7" fill="url(#robotBody)" stroke="#334155" strokeWidth="1.5" />
      <circle cx="132" cy="144" r="7" fill="url(#robotBody)" stroke="#334155" strokeWidth="1.5" />
    </g>
    
    <defs>
      <radialGradient id="pedestalGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
        <stop offset="70%" stopColor="#A855F7" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#070B14" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="robotBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#F1F5F9" />
        <stop offset="100%" stopColor="#CBD5E1" />
      </linearGradient>
    </defs>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const LogoSVG = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#7C3AED]" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" fill="currentColor" />
    <path d="M18 4L19.2 7.2L22.4 8L19.2 8.8L18 12L16.8 8.8L13.6 8L16.8 7.2L18 4Z" fill="#A855F7" opacity="0.8" />
  </svg>
);

const ChatBubbleGlow = ({ className, delay }) => (
  <div 
    className={`absolute z-20 p-2 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-white shadow-lg shadow-purple-500/25 animate-float flex items-center justify-center w-10 h-10 border border-white/10 select-none ${className}`} 
    style={{ animationDelay: delay }}
  >
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 11a1 1 0 110-2 1 1 0 010 2zm4 0a1 1 0 110-2 1 1 0 010 2zm4 0a1 1 0 110-2 1 1 0 010 2z"/>
    </svg>
  </div>
);

const SmartConvIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 border border-white/5 flex items-center justify-center text-[#A855F7] flex-shrink-0 transition-transform duration-300 hover:scale-105">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  </div>
);

const FileAnalysisIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 border border-white/5 flex items-center justify-center text-[#A855F7] flex-shrink-0 transition-transform duration-300 hover:scale-105">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  </div>
);

const ChatHistoryIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 border border-white/5 flex items-center justify-center text-[#A855F7] flex-shrink-0 transition-transform duration-300 hover:scale-105">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  </div>
);

const SecureIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 border border-white/5 flex items-center justify-center text-[#A855F7] flex-shrink-0 transition-transform duration-300 hover:scale-105">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  </div>
);

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Theme state: defaults to dark mode
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  const { login } = useAuth();
  const navigate = useNavigate();

  // Sync class on documentElement for light/dark support
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    setTheme(savedTheme);
    if (savedTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    } else {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please fill all fields");
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);
      navigate("/chat");
    } catch (err) {
      if (err.response) {
        const d = err.response.data;
        setError(
          d.detail ||
          d.error ||
          d.non_field_errors?.join(", ") ||
          "Invalid credentials"
        );
      } else {
        setError("Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center font-sans relative overflow-x-hidden p-4 md:p-6 transition-colors duration-300 ${
      theme === "dark" ? "bg-[#070B14]" : "bg-[#F8FAFC]"
    }`}>
      
      {/* Background Radial Particles and Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute w-[600px] h-[600px] rounded-full blur-[150px] opacity-20 bg-[#7C3AED] -top-[10%] -left-[10%]" />
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[130px] opacity-15 bg-[#A855F7] -bottom-[10%] -right-[10%]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />
      </div>

      {/* Global theme controls for Desktop view */}
      <div className="absolute top-6 right-8 hidden md:flex gap-4 z-50">
        <button 
          type="button" 
          onClick={toggleTheme}
          className={`p-2.5 rounded-xl border transition cursor-pointer text-xs font-semibold select-none flex items-center justify-center ${
            theme === "dark" 
              ? "bg-[#0F172A] border-white/5 text-[#A855F7] hover:border-white/10" 
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          }`}
          title="Toggle Light/Dark Theme"
        >
          {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      {/* ========================================================
          DESKTOP GRID VIEW (Hidden on Mobile)
          ======================================================== */}
      <div className="hidden md:grid grid-cols-12 w-full max-w-6xl gap-8 relative z-10 items-center">
        
        {/* LEFT COLUMN: Logo, Mascot robot with bubbles, checklist features, and quote card */}
        <div className="col-span-6 flex flex-col justify-between h-[650px] pr-4 select-none">
          {/* Logo Header */}
          <div className="flex items-center gap-3">
            <LogoSVG />
            <span className={`text-xl font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-[#070B14]"}`}>AI Chat</span>
          </div>

          {/* Welcome and Mascot Illustration */}
          <div className="flex-1 flex flex-col justify-center">
            <h2 className={`text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight ${
              theme === "dark" ? "text-white" : "text-[#070B14]"
            }`}>
              Welcome <span className="text-gradient">Back</span> 👋
            </h2>
            <p className={`mt-2 text-sm max-w-sm ${
              theme === "dark" ? "text-[#94A3B8]" : "text-slate-500"
            }`}>
              Login to continue your conversations with AI Chat Assistant
            </p>

            <div className="grid grid-cols-12 gap-4 mt-8 items-center">
              {/* Feature bullet list */}
              <div className="col-span-6 space-y-5">
                <div className="flex items-center gap-3">
                  <SmartConvIcon />
                  <div>
                    <h4 className={`text-sm font-bold leading-none ${theme === "dark" ? "text-white" : "text-slate-800"}`}>Smart Conversations</h4>
                    <p className={`text-[11px] mt-1 ${theme === "dark" ? "text-[#94A3B8]" : "text-slate-500"}`}>Get intelligent & accurate responses</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <FileAnalysisIcon />
                  <div>
                    <h4 className={`text-sm font-bold leading-none ${theme === "dark" ? "text-white" : "text-slate-800"}`}>File Analysis</h4>
                    <p className={`text-[11px] mt-1 ${theme === "dark" ? "text-[#94A3B8]" : "text-slate-500"}`}>Upload & analyze files</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <ChatHistoryIcon />
                  <div>
                    <h4 className={`text-sm font-bold leading-none ${theme === "dark" ? "text-white" : "text-slate-800"}`}>Chat History</h4>
                    <p className={`text-[11px] mt-1 ${theme === "dark" ? "text-[#94A3B8]" : "text-slate-500"}`}>Access chats anywhere</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <SecureIcon />
                  <div>
                    <h4 className={`text-sm font-bold leading-none ${theme === "dark" ? "text-white" : "text-slate-800"}`}>Secure & Private</h4>
                    <p className={`text-[11px] mt-1 ${theme === "dark" ? "text-[#94A3B8]" : "text-slate-500"}`}>Protected data encryption</p>
                  </div>
                </div>
              </div>

              {/* Floating Robot mascot box */}
              <div className="col-span-6 relative flex items-center justify-center h-64">
                <ChatBubbleGlow className="top-4 left-0" delay="0s" />
                <ChatBubbleGlow className="top-12 right-0" delay="1s" />
                <ChatBubbleGlow className="bottom-8 right-6 w-8 h-8" delay="2s" />
                
                {/* Glowing background halo */}
                <div className="absolute w-44 h-44 rounded-full bg-[#7C3AED]/10 blur-xl animate-pulse" />
                <RobotSVG />
              </div>
            </div>
          </div>

          {/* Frosted Quote bubble at bottom */}
          <div>
            <div className={`glass-card px-5 py-3 rounded-2xl text-xs inline-block max-w-xs ${
              theme === "dark" ? "text-[#94A3B8]" : "text-slate-500"
            }`}>
              <span className="text-[#A855F7] font-black mr-1">“</span>
              AI is not just the future, it's the present.
              <span className="text-[#A855F7] font-black ml-1">”</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: frosted glass card form (stacked vertical social logins) */}
        <div className="col-span-6 flex justify-center">
          <div className="glass-card w-full max-w-md p-8 md:p-10">
            <div className="mb-6">
              <h3 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Welcome Back</h3>
              <p className={`text-xs mt-1.5 ${theme === "dark" ? "text-[#94A3B8]" : "text-slate-500"}`}>Login to your account</p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-bounce">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${theme === "dark" ? "text-[#94A3B8]" : "text-slate-600"}`}>Email</label>
                <div className="relative w-full">
                  <FaEnvelope
                    className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                    pointer-events-none
                    z-10
                    "
                  />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your email"
                    className="
                    w-full
                    h-14
                    pl-12
                    pr-12
                    bg-[#070B14]
                    border
                    border-white/10
                    rounded-xl
                    text-white
                    outline-none
                    "
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className={`block text-xs font-bold mb-2 uppercase tracking-wider ${theme === "dark" ? "text-[#94A3B8]" : "text-slate-600"}`}>Password</label>
                <div className="relative w-full">
                  <FaLock
                    className="
                    absolute
                    left-4
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                    pointer-events-none
                    z-10
                    "
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="
                    w-full
                    h-14
                    pl-12
                    pr-12
                    bg-[#070B14]
                    border
                    border-white/10
                    rounded-xl
                    text-white
                    outline-none
                    "
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="
                    absolute
                    right-4
                    top-1/2
                    -translate-y-1/2
                    z-20
                    "
                  >
                    {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                  </button>
                </div>
              </div>

              {/* Keep Remember Me and Forgot password side by side */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="custom-checkbox rounded w-4 h-4 cursor-pointer bg-transparent border-white/10" />
                  <span className={theme === "dark" ? "text-[#94A3B8]" : "text-slate-600"}>Remember me</span>
                </label>
                <a 
                  href="#forgot" 
                  onClick={(e) => { e.preventDefault(); alert("Password reset option coming soon."); }} 
                  className="text-[#A855F7] hover:text-[#7C3AED] font-bold transition duration-200"
                >
                  Forgot password?
                </a>
              </div>

              {/* Login Button with purple gradient */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 rounded-xl font-bold text-white btn-gradient cursor-pointer flex items-center justify-center gap-2"
              >
                {isLoading ? "Signing in..." : "Login"}
              </button>
            </form>

            <div className="flex items-center my-6 select-none">
              <div className="flex-1 h-[1px] bg-white/5" />
              <span className={`px-3 text-[10px] tracking-widest font-extrabold uppercase ${theme === "dark" ? "text-gray-500" : "text-slate-400"}`}>or continue with</span>
              <div className="flex-1 h-[1px] bg-white/5" />
            </div>

            {/* Google / GitHub login stacked vertically */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => alert("Google Sign-In is mock connected.")}
                className={`w-full py-3.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${
                  theme === "dark"
                    ? "bg-[#070B14] border-white/5 text-white hover:bg-white/5 hover:border-white/10"
                    : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                }`}
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
              <button
                type="button"
                onClick={() => alert("GitHub Sign-In is mock connected.")}
                className={`w-full py-3.5 rounded-xl border text-sm font-semibold flex items-center justify-center gap-3 transition-all duration-300 cursor-pointer ${
                  theme === "dark"
                    ? "bg-[#070B14] border-white/5 text-white hover:bg-white/5 hover:border-white/10"
                    : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50"
                }`}
              >
                <GithubIcon />
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* Switch link */}
            <div className="mt-8 text-center text-xs">
              <span className={theme === "dark" ? "text-[#94A3B8]" : "text-slate-600"}>Don't have an account?</span>
              <Link to="/register" className="text-[#A855F7] hover:text-[#7C3AED] font-extrabold ml-1.5 transition">
                Sign up
              </Link>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================
          MOBILE VIEWPORT (Visible on screens < 768px)
          ======================================================== */}
      <div className="flex md:hidden flex-col w-full max-w-sm relative z-10 select-none pb-8">
        
        {/* Top Navbar */}
        <header className="flex items-center justify-between w-full mb-6">
          <div className="flex items-center gap-2">
            <LogoSVG />
            <span className={`text-base font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>AI Chat</span>
          </div>
          <button 
            type="button" 
            onClick={toggleTheme}
            className={`p-2.5 rounded-full border transition-all duration-200 cursor-pointer text-sm font-bold flex items-center justify-center ${
              theme === "dark" 
                ? "bg-[#0F172A] border-white/5 text-[#A855F7]" 
                : "bg-white border-slate-200 text-slate-700"
            }`}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
        </header>

        {/* Welcome Headers */}
        <div className="text-center mb-6">
          <h2 className={`text-3xl font-extrabold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            Welcome <span className="text-gradient">Back</span> 👋
          </h2>
          <p className={`mt-2 text-xs max-w-xs mx-auto ${theme === "dark" ? "text-[#94A3B8]" : "text-slate-500"}`}>
            Login to continue your conversations with AI Chat Assistant
          </p>
        </div>

        {/* Centered Robot Animation */}
        <div className="relative w-full flex items-center justify-center h-48 mb-6">
          <ChatBubbleGlow className="top-2 left-6" delay="0s" />
          <ChatBubbleGlow className="top-10 right-6" delay="1s" />
          <ChatBubbleGlow className="bottom-6 right-12 w-8 h-8" delay="2.5s" />
          
          <div className="absolute w-36 h-36 rounded-full bg-[#7C3AED]/10 blur-xl animate-pulse" />
          <RobotSVG />
        </div>

        {/* frosted glass form card */}
        <div className="glass-card w-full p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2 animate-bounce">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 uppercase ${theme === "dark" ? "text-[#94A3B8]" : "text-slate-600"}`}>Email</label>
              <div className="relative w-full">
                <FaEnvelope
                  className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                  pointer-events-none
                  z-10
                  "
                />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your email"
                  className="
                  w-full
                  h-14
                  pl-12
                  pr-12
                  bg-[#070B14]
                  border
                  border-white/10
                  rounded-xl
                  text-white
                  outline-none
                  "
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className={`block text-xs font-bold mb-1.5 uppercase ${theme === "dark" ? "text-[#94A3B8]" : "text-slate-600"}`}>Password</label>
              <div className="relative w-full">
                <FaLock
                  className="
                  absolute
                  left-4
                  top-1/2
                  -translate-y-1/2
                  text-gray-400
                  pointer-events-none
                  z-10
                  "
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="
                  w-full
                  h-14
                  pl-12
                  pr-12
                  bg-[#070B14]
                  border
                  border-white/10
                  rounded-xl
                  text-white
                  outline-none
                  "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="
                  absolute
                  right-4
                  top-1/2
                  -translate-y-1/2
                  z-20
                  "
                >
                  {showPassword ? <FaEyeSlash className="text-gray-400" /> : <FaEye className="text-gray-400" />}
                </button>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="flex items-center justify-between text-xs pt-1 select-none">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" className="custom-checkbox rounded w-3.5 h-3.5" />
                <span className={theme === "dark" ? "text-[#94A3B8]" : "text-slate-600"}>Remember</span>
              </label>
              <a 
                href="#forgot" 
                onClick={(e) => { e.preventDefault(); alert("Password reset option coming soon."); }} 
                className="text-[#A855F7] font-bold"
              >
                Forgot?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2.5 py-3 rounded-xl font-bold text-white btn-gradient"
            >
              {isLoading ? "Signing in..." : "Login"}
            </button>
          </form>

          {/* Social credentials stacked properly */}
          <div className="flex items-center my-5 select-none">
            <div className="flex-1 h-[1px] bg-white/5" />
            <span className={`px-2 text-[9px] font-bold tracking-widest uppercase ${theme === "dark" ? "text-gray-500" : "text-slate-400"}`}>or continue with</span>
            <div className="flex-1 h-[1px] bg-white/5" />
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => alert("Google Sign-In is mock connected.")}
              className={`w-full py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2.5 cursor-pointer transition ${
                theme === "dark"
                  ? "bg-[#070B14] border-white/5 text-white hover:bg-white/5"
                  : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
            <button
              type="button"
              onClick={() => alert("GitHub Sign-In is mock connected.")}
              className={`w-full py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2.5 cursor-pointer transition ${
                theme === "dark"
                  ? "bg-[#070B14] border-white/5 text-white hover:bg-white/5"
                  : "bg-white border-slate-200 text-slate-800"
              }`}
            >
              <GithubIcon />
              <span>Continue with GitHub</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs">
            <span className={theme === "dark" ? "text-[#94A3B8]" : "text-slate-600"}>Don't have an account?</span>
            <Link to="/register" className="text-[#A855F7] font-bold ml-1 transition">
              Sign up
            </Link>
          </div>
        </div>
      </div>
      
    </div>
  );
}