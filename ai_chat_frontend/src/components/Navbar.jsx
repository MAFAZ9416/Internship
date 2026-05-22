import { useAuth } from "../context/AuthContext";

export default function Navbar({ onToggleSidebar, currentTitle }) {
  const { logout } = useAuth();

  return (
    <header className="h-14 flex items-center justify-between px-4 flex-shrink-0" style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border-subtle)' }}>
      <div className="flex items-center gap-3">
        {/* Hamburger for mobile */}
        <button id="sidebar-toggle" onClick={onToggleSidebar} className="lg:hidden p-2 rounded-lg transition-colors cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <h2 className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]" style={{ color: 'var(--color-text-primary)' }}>
          {currentTitle || "New Conversation"}
        </h2>
      </div>
      <button id="logout-button" onClick={logout} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 cursor-pointer" style={{ color: 'var(--color-text-secondary)', border: '1px solid var(--color-border-primary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248,113,113,0.1)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.color = 'var(--color-accent-red)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--color-border-primary)'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        <span className="hidden sm:inline">Logout</span>
      </button>
    </header>
  );
}
