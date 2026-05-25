import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Crisp inline SVGs for premium look
const RobotSVG = () => (
  <svg viewBox="0 0 200 200" className="w-56 h-56 mx-auto animate-float drop-shadow-[0_0_25px_rgba(56,189,248,0.4)]" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Glowing platform */}
    <ellipse cx="100" cy="175" rx="55" ry="14" fill="url(#pedestalGlow)" opacity="0.9" />
    <ellipse cx="100" cy="175" rx="45" ry="10" stroke="#38bdf8" strokeWidth="2" opacity="0.8" className="animate-pulse" />
    <ellipse cx="100" cy="175" rx="30" ry="6" stroke="#7c5cff" strokeWidth="1.5" opacity="0.6" />
    
    <g>
      {/* Antennas */}
      <path d="M80 62 L65 48" stroke="#8a9ab5" strokeWidth="3" strokeLinecap="round" />
      <circle cx="65" cy="48" r="5" fill="#38bdf8" className="animate-pulse" />
      <path d="M120 62 L135 48" stroke="#8a9ab5" strokeWidth="3" strokeLinecap="round" />
      <circle cx="135" cy="48" r="5" fill="#38bdf8" className="animate-pulse" />
      
      {/* Ears */}
      <rect x="58" y="76" width="6" height="16" rx="3" fill="#5a6d8a" />
      <rect x="136" y="76" width="6" height="16" rx="3" fill="#5a6d8a" />
      
      {/* Head Outer */}
      <rect x="64" y="60" width="72" height="62" rx="31" fill="url(#robotBody)" stroke="#1a2d4f" strokeWidth="2" />
      
      {/* Face Screen */}
      <rect x="71" y="67" width="58" height="44" rx="19" fill="#0c1626" stroke="#253a5c" strokeWidth="1.5" />
      
      {/* Animated cute curved smiley eyes */}
      <path d="M81 86 Q87 79 93 86" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M107 86 Q113 79 119 86" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      
      {/* Cute Blush */}
      <circle cx="80" cy="95" r="3.5" fill="#f43f5e" opacity="0.6" />
      <circle cx="120" cy="95" r="3.5" fill="#f43f5e" opacity="0.6" />
      
      {/* Neck */}
      <rect x="91" y="120" width="18" height="8" rx="3" fill="#5a6d8a" />
      
      {/* Body */}
      <rect x="78" y="126" width="44" height="34" rx="17" fill="url(#robotBody)" stroke="#1a2d4f" strokeWidth="2" />
      
      {/* Glowing screen on chest */}
      <rect x="88" y="132" width="24" height="14" rx="7" fill="#0c1626" stroke="#253a5c" strokeWidth="1" />
      <circle cx="100" cy="139" r="4.5" fill="#38bdf8" className="animate-pulse" />
      
      {/* Floating hands */}
      <circle cx="68" cy="144" r="7" fill="url(#robotBody)" stroke="#1a2d4f" strokeWidth="1.5" />
      <circle cx="132" cy="144" r="7" fill="url(#robotBody)" stroke="#1a2d4f" strokeWidth="1.5" />
    </g>
    
    <defs>
      <radialGradient id="pedestalGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
        <stop offset="70%" stopColor="#7c5cff" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#030b1f" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="robotBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="50%" stopColor="#f3f4f6" />
        <stop offset="100%" stopColor="#d1d5db" />
      </linearGradient>
    </defs>
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
  </svg>
);

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.577.688.479C19.138 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
  </svg>
);

const LogoSVG = () => (
  <svg viewBox="0 0 40 40" className="w-8 h-8 text-blue-400 drop-shadow-[0_0_10px_rgba(56,189,248,0.6)]" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="20" cy="20" r="18" stroke="url(#logoGlow)" strokeWidth="2" fill="#0c1626" />
    <rect x="10" y="14" width="20" height="15" rx="6" fill="#1e2d4f" stroke="#38bdf8" strokeWidth="1.5" />
    <rect x="13" y="17" width="14" height="9" rx="3.5" fill="#030b1f" />
    <circle cx="17" cy="21.5" r="1.5" fill="#38bdf8" />
    <circle cx="23" cy="21.5" r="1.5" fill="#38bdf8" />
    <path d="M19 23.5h2" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" />
    <path d="M20 14v-3" stroke="#8a9ab5" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="20" cy="10" r="1.5" fill="#38bdf8" />
    <defs>
      <linearGradient id="logoGlow" x1="0" y1="0" x2="40" y2="40">
        <stop offset="0%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#7c5cff" />
      </linearGradient>
    </defs>
  </svg>
);

const ChatBubbleGlow = ({ className, delay }) => (
  <div className={`absolute z-20 p-2 rounded-full bg-gradient-to-br from-[#7c5cff] to-[#4f7cff] text-white shadow-lg shadow-purple-500/25 animate-float flex items-center justify-center w-10 h-10 border border-white/10 select-none ${className}`} style={{ animationDelay: delay }}>
    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 11a1 1 0 110-2 1 1 0 010 2zm4 0a1 1 0 110-2 1 1 0 010 2zm4 0a1 1 0 110-2 1 1 0 010 2z"/>
    </svg>
  </div>
);

const SmartConvIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shadow-md shadow-blue-500/5 flex-shrink-0 transition-transform duration-300 hover:scale-105">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  </div>
);

const FileAnalysisIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-md shadow-purple-500/5 flex-shrink-0 transition-transform duration-300 hover:scale-105">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  </div>
);

const ChatHistoryIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-md shadow-cyan-500/5 flex-shrink-0 transition-transform duration-300 hover:scale-105">
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  </div>
);

const SecureIcon = () => (
  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-md shadow-indigo-500/5 flex-shrink-0 transition-transform duration-300 hover:scale-105">
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
    <div className={`min-h-screen flex items-center justify-center font-sans relative overflow-hidden p-4 transition-colors duration-300 ${
      theme === "dark" ? "bg-[#020512]" : "bg-[#f8fafc]"
    }`}>
      
      {/* Background Gradients & Particle Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {theme === "dark" ? (
          <>
            <div className="absolute w-[600px] h-[600px] rounded-full blur-[140px] opacity-20 bg-blue-600 top-[-10%] left-[-10%]" />
            <div className="absolute w-[500px] h-[500px] rounded-full blur-[130px] opacity-15 bg-purple-600 bottom-[-10%] right-[-10%]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(18,24,38,0.15)_1px,transparent_1px)] bg-[size:32px_32px] opacity-25" />
          </>
        ) : (
          <>
            <div className="absolute w-[600px] h-[600px] rounded-full blur-[140px] opacity-10 bg-blue-400 top-[-10%] left-[-10%]" />
            <div className="absolute w-[500px] h-[500px] rounded-full blur-[130px] opacity-10 bg-purple-400 bottom-[-10%] right-[-10%]" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:32px_32px] opacity-30" />
          </>
        )}
      </div>

      {/* Outer Wrapper Panel */}
      <div className={`w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden border transition-all duration-300 shadow-2xl relative z-10 ${
        theme === "dark" 
          ? "border-gray-800/80 bg-[#060818]/60 backdrop-blur-xl shadow-[0_0_50px_rgba(79,124,255,0.1)]" 
          : "border-slate-200 bg-white/85 backdrop-blur-xl"
      }`}>
        
        {/* Top-right Controls panel (sun/moon light-dark control toggle) */}
        <div className="absolute top-6 right-8 flex gap-4 transition z-50">
          <button 
            type="button" 
            onClick={toggleTheme}
            className={`p-2.5 rounded-xl border transition cursor-pointer text-sm font-semibold select-none flex items-center justify-center ${
              theme === "dark" 
                ? "bg-gray-900/60 border-gray-800 text-yellow-400 hover:border-gray-600" 
                : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"
            }`}
            title="Toggle Light/Dark Theme"
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>

        {/* ================= LEFT SIDE: DESKTOP ONLY ILLUSTRATION & FEATURES ================= */}
        <div className={`hidden md:flex p-10 lg:p-12 flex-col justify-between border-r transition-all duration-300 relative overflow-hidden ${
          theme === "dark" 
            ? "bg-gradient-to-br from-[#0c0f24] to-[#040615] border-gray-800/60" 
            : "bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200"
        }`}>
          
          {/* Subtle floating particles in dark mode */}
          {theme === "dark" && (
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
              <div className="absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
              <div className="absolute top-1/2 right-12 w-2 h-2 bg-cyan-400 rounded-full animate-bounce" />
            </div>
          )}

          {/* Upper Title Logo Bar */}
          <div className="flex items-center gap-3 w-full">
            <LogoSVG />
            <span className={`text-xl font-bold tracking-wide ${theme === "dark" ? "text-white" : "text-slate-900"}`}>AI Chat</span>
          </div>

          {/* Centered Desktop Layout Section */}
          <div className="flex-1 flex flex-col justify-center my-auto w-full">
            
            {/* Title and description block */}
            <div className="text-left mb-8">
              <h2 className={`text-4xl font-extrabold tracking-tight transition-colors duration-300 ${
                theme === "dark" ? "text-white" : "text-slate-900"
              }`}>
                Welcome <span className="text-[#6c8cff] bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Back</span> 👋
              </h2>
              <p className={`mt-2 text-sm leading-relaxed transition-colors duration-300 ${
                theme === "dark" ? "text-gray-400" : "text-slate-500"
              }`}>
                Login to continue your conversations with AI Chat Assistant
              </p>
            </div>

            {/* Checklist & Robot side-by-side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center w-full">
              
              {/* Feature list */}
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <SmartConvIcon />
                  <div>
                    <h4 className={`text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-slate-800"}`}>Smart Conversations</h4>
                    <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>Get intelligent & accurate responses</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <FileAnalysisIcon />
                  <div>
                    <h4 className={`text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-slate-800"}`}>File Analysis</h4>
                    <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>Upload & analyze documents, images & more</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <ChatHistoryIcon />
                  <div>
                    <h4 className={`text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-slate-800"}`}>Chat History</h4>
                    <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>Access your conversations anywhere</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <SecureIcon />
                  <div>
                    <h4 className={`text-sm font-semibold ${theme === "dark" ? "text-gray-200" : "text-slate-800"}`}>Secure & Private</h4>
                    <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>Your data is encrypted and protected</p>
                  </div>
                </div>
              </div>

              {/* Robot with floating chat bubbles */}
              <div className="relative w-full flex items-center justify-center h-72">
                <ChatBubbleGlow className="top-8 left-4" delay="0s" />
                <ChatBubbleGlow className="top-16 right-4" delay="1s" />
                <ChatBubbleGlow className="bottom-12 right-2 w-8 h-8" delay="2s" />
                <RobotSVG />
              </div>

            </div>

          </div>

          {/* Quote Footer Container */}
          <div className="mt-8 pt-4">
            <div className={`glass px-5 py-2.5 rounded-2xl text-xs inline-block max-w-xs text-gray-400 border border-gray-800/40 shadow-md backdrop-blur-sm`}>
              "AI is not just the future, it's the present."
            </div>
          </div>
        </div>

        {/* ================= RIGHT SIDE: GLASSMORPHISM CARD FORM ================= */}
        <div className={`p-8 md:p-12 flex flex-col justify-center transition-all duration-300 ${
          theme === "dark" ? "bg-[#07091d]/85" : "bg-white/95"
        }`}>
          <div className="w-full max-w-sm mx-auto">
            
            {/* Mobile-only Header & Illustration (hidden on Desktop) */}
            <div className="md:hidden flex flex-col items-center w-full mb-6">
              {/* Mobile Header Bar */}
              <div className="w-full flex items-center justify-between mb-8 select-none">
                <div className="flex items-center gap-2.5">
                  <LogoSVG />
                  <span className="text-lg font-bold text-white tracking-wide">AI Chat</span>
                </div>
              </div>

              {/* Mobile Centered Robot with bubbles */}
              <div className="relative w-60 h-60 flex items-center justify-center mb-6">
                <ChatBubbleGlow className="top-6 left-2" delay="0s" />
                <ChatBubbleGlow className="top-14 right-4" delay="1s" />
                <ChatBubbleGlow className="bottom-10 right-2 w-8 h-8" delay="2s" />
                <RobotSVG />
              </div>

              {/* Mobile Welcome Text */}
              <div className="text-center mb-2">
                <h2 className="text-3xl font-extrabold tracking-tight text-white">
                  Welcome <span className="text-[#6c8cff] bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Back</span> 👋
                </h2>
                <p className="mt-2 text-xs text-gray-400 max-w-xs mx-auto">
                  Login to continue your conversations with AI Chat Assistant
                </p>
              </div>
            </div>

            {/* Desktop-only card header */}
            <div className="hidden md:block mb-8">
              <h3 className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Welcome Back</h3>
              <p className={`text-xs mt-1.5 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>Login to your account</p>
            </div>

            {/* Error handling */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 animate-pulse">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username Field */}
              <div>
                <label className={`block text-xs font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-slate-700"}`}>Email</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your email"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl text-sm outline-none transition duration-200 ${
                      theme === "dark"
                        ? "bg-[#0b0e24] border border-gray-800 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                        : "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    }`}
                    autoComplete="username"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label className={`block text-xs font-semibold mb-2 ${theme === "dark" ? "text-gray-300" : "text-slate-700"}`}>Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className={`w-full pl-12 pr-12 py-3 rounded-xl text-sm outline-none transition duration-200 ${
                      theme === "dark"
                        ? "bg-[#0b0e24] border border-gray-800 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30"
                        : "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
                    }`}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember Me and Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className={`flex items-center gap-2 cursor-pointer ${theme === "dark" ? "text-gray-400" : "text-slate-600"}`}>
                  <input type="checkbox" className="custom-checkbox rounded w-3.5 h-3.5 cursor-pointer bg-transparent border-gray-800" />
                  <span>Remember me</span>
                </label>
                <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Password reset is currently disabled. Please contact your administrator."); }} className="text-purple-500 hover:text-purple-400 hover:underline font-semibold">
                  Forgot password?
                </a>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  "Login"
                )}
              </button>

            </form>

            {/* Separator */}
            <div className="flex items-center my-6">
              <div className={`flex-1 h-[1px] ${theme === "dark" ? "bg-gray-800/80" : "bg-slate-200"}`} />
              <span className={`px-3 text-[10px] tracking-wider font-bold uppercase ${theme === "dark" ? "text-gray-500" : "text-slate-400"}`}>or continue with</span>
              <div className={`flex-1 h-[1px] ${theme === "dark" ? "bg-gray-800/80" : "bg-slate-200"}`} />
            </div>

            {/* Social Logins - Desktop stacked version */}
            <div className="hidden md:flex flex-col gap-3">
              <button
                type="button"
                onClick={() => alert("Google sign in is currently in mockup mode.")}
                className={`py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 cursor-pointer border transition duration-300 w-full ${
                  theme === "dark"
                    ? "social-button text-gray-200"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-slate-300"
                }`}
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </button>
              <button
                type="button"
                onClick={() => alert("GitHub sign in is currently in mockup mode.")}
                className={`py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2.5 cursor-pointer border transition duration-300 w-full ${
                  theme === "dark"
                    ? "social-button text-gray-200"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-slate-300"
                }`}
              >
                <GithubIcon />
                <span>Continue with GitHub</span>
              </button>
            </div>

            {/* Social Logins - Mobile side-by-side icons version */}
            <div className="flex md:hidden grid grid-cols-2 gap-3.5 w-full">
              <button
                type="button"
                onClick={() => alert("Google sign in is currently in mockup mode.")}
                className={`py-3 rounded-xl text-sm font-semibold flex items-center justify-center cursor-pointer border transition duration-300 ${
                  theme === "dark"
                    ? "social-button text-gray-200"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-slate-300"
                }`}
              >
                <GoogleIcon />
              </button>
              <button
                type="button"
                onClick={() => alert("GitHub sign in is currently in mockup mode.")}
                className={`py-3 rounded-xl text-sm font-semibold flex items-center justify-center cursor-pointer border transition duration-300 ${
                  theme === "dark"
                    ? "social-button text-gray-200"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700 hover:border-slate-300"
                }`}
              >
                <GithubIcon />
              </button>
            </div>

            {/* Switch to Register */}
            <div className={`mt-8 text-center text-xs ${theme === "dark" ? "text-gray-400" : "text-slate-600"}`}>
              <span>Don't have an account?</span>
              <Link to="/register" className="text-purple-500 hover:text-purple-400 font-bold ml-1.5 transition">
                Sign up
              </Link>
            </div>

          </div>
        </div>

      </div>
      
    </div>
  );
}