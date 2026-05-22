import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!username.trim() || !email.trim() || !password.trim()) { setError("Please fill in all fields"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setIsLoading(true);
    try {
      await register(username, email, password);
      navigate("/login");
    } catch (err) {
      if (err.response) {
        const d = err.response.data;
        if (typeof d === "string") setError(d);
        else if (d.username) setError(`Username: ${d.username.join(", ")}`);
        else if (d.email) setError(`Email: ${d.email.join(", ")}`);
        else if (d.password) setError(`Password: ${d.password.join(", ")}`);
        else if (d.detail) setError(d.detail);
        else if (d.error) setError(d.error);
        else setError("Registration failed. Please try again.");
      } else if (err.request) setError("Network error. Check your connection.");
      else setError("Something went wrong.");
    } finally { setIsLoading(false); }
  };

  const inputStyle = { background: 'var(--color-bg-input)', border: '1px solid var(--color-border-primary)', color: 'var(--color-text-primary)' };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg-primary)' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-10" style={{ background: 'var(--color-accent-purple)', top: '-10%', right: '-10%' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full blur-[120px] opacity-8" style={{ background: 'var(--color-accent-cyan)', bottom: '-10%', left: '-10%' }} />
      </div>
      <div className="w-full max-w-md relative" style={{ animation: 'var(--animate-slide-up)' }}>
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, var(--color-accent-purple), var(--color-accent-cyan))', boxShadow: '0 0 20px rgba(124,92,255,0.3)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Create Account</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Join AI Chat today</p>
        </div>
        <div className="glass rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-elevated)' }}>
          <form onSubmit={handleSubmit} className="space-y-4" id="register-form">
            {error && (
              <div className="flex items-center gap-3 p-3 rounded-xl text-sm" style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: 'var(--color-accent-red)', animation: 'var(--animate-bounce-in)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Username</label>
              <input id="register-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Choose a username" className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 focus:ring-2 focus:outline-none" style={inputStyle} autoComplete="username" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
              <input id="register-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 focus:ring-2 focus:outline-none" style={inputStyle} autoComplete="email" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
              <div className="relative">
                <input id="register-password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" className="w-full px-4 pr-12 py-3 rounded-xl text-sm transition-all duration-200 focus:ring-2 focus:outline-none" style={inputStyle} autoComplete="new-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3.5 cursor-pointer" style={{ color: 'var(--color-text-muted)' }}>
                  {showPassword ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><line x1="1" y1="1" x2="23" y2="23"/></svg> : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>Confirm Password</label>
              <input id="register-confirm-password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm your password" className="w-full px-4 py-3 rounded-xl text-sm transition-all duration-200 focus:ring-2 focus:outline-none" style={inputStyle} autoComplete="new-password" />
            </div>
            <button id="register-submit" type="submit" disabled={isLoading} className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:-translate-y-0.5 mt-2" style={{ background: isLoading ? 'var(--color-bg-hover)' : 'linear-gradient(135deg, var(--color-accent-purple), var(--color-accent-cyan))', boxShadow: isLoading ? 'none' : '0 0 20px rgba(124,92,255,0.3)' }}>
              {isLoading ? <span className="flex items-center justify-center gap-2"><svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating account...</span> : "Create Account"}
            </button>
          </form>
          <div className="flex items-center my-6">
            <div className="flex-1 h-px" style={{ background: 'var(--color-border-primary)' }}/><span className="px-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>OR</span><div className="flex-1 h-px" style={{ background: 'var(--color-border-primary)' }}/>
          </div>
          <p className="text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>Already have an account?{" "}<Link to="/login" className="font-semibold hover:underline" style={{ color: 'var(--color-accent-blue)' }} id="link-to-login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
