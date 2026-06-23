import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import {
  FaChartBar,
  FaUsers,
  FaComments,
  FaCommentDots,
  FaCloudUploadAlt,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaSearch,
  FaBell,
  FaSun,
  FaMoon,
  FaBars,
  FaTimes,
  FaUserEdit,
  FaUserShield,
  FaTrashAlt,
  FaEye,
  FaDownload,
  FaToggleOn,
  FaToggleOff,
  FaFileAlt
} from "react-icons/fa";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from "recharts";

// A utility to format byte sizes
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function AdminDashboard() {
  const { user, logout, loading } = useAuth();
  
  // Tab states: 'dashboard', 'users', 'conversations', 'messages', 'uploads', 'analytics', 'settings'
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [notifications, setNotifications] = useState([
    { id: 1, text: "New user registered: Jane Doe", time: "5m ago", unread: true },
    { id: 2, text: "System load spiked to 88%", time: "1h ago", unread: false },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Sync theme
  useEffect(() => {
    const rootClass = document.documentElement.classList;
    if (isDarkMode) {
      rootClass.remove("light");
    } else {
      rootClass.add("light");
    }
  }, [isDarkMode]);

  // Auth Protection
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#070B14] text-white">
        <p className="text-lg">Loading administration console...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Only admin users (is_staff=True or is_superuser=True) can access
  if (!user.is_staff && !user.is_superuser) {
    return <Navigate to="/chat" replace />;
  }

  // Sidebar Links
  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaChartBar /> },
    { id: "users", label: "Users", icon: <FaUsers /> },
    { id: "conversations", label: "Conversations", icon: <FaComments /> },
    { id: "messages", label: "Messages", icon: <FaCommentDots /> },
    { id: "uploads", label: "Uploads", icon: <FaCloudUploadAlt /> },
    { id: "analytics", label: "Analytics", icon: <FaChartLine /> },
    { id: "settings", label: "Settings", icon: <FaCog /> },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchTerm("");
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-bg-primary text-text-primary transition-colors duration-300">
      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-bg-card border-r border-border-primary transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand/Logo */}
        <div className="h-20 flex items-center px-8 border-b border-border-primary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="font-extrabold text-white text-xl">N</span>
            </div>
            <div>
              <h1 className="font-bold text-white text-lg leading-none">Nova AI</h1>
              <span className="text-[10px] text-purple-400 font-medium tracking-widest uppercase">Admin Portal</span>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto sidebar-scroll">
          {sidebarItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 group ${
                  isActive 
                    ? "bg-[#7C3AED]/15 text-[#A855F7] border border-[#7C3AED]/20 shadow-md shadow-[#7C3AED]/5"
                    : "text-text-secondary hover:bg-hover-overlay hover:text-text-primary"
                }`}
              >
                <span className={`text-lg transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-[#A855F7]" : "text-text-secondary group-hover:text-text-primary"}`}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-border-primary">
          <button 
            onClick={logout}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl font-medium text-sm text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <FaSignOutAlt className="text-lg" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 flex items-center justify-between px-6 lg:px-8 border-b border-border-primary bg-bg-card/45 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Hamburger Button for Mobile */}
            <button 
              className="lg:hidden p-2 text-text-secondary hover:text-text-primary focus:outline-none"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <FaBars className="text-xl" />
            </button>

            {/* Header Search Bar */}
            <div className="relative w-64 md:w-80 hidden sm:block">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-text-secondary">
                <FaSearch />
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTab === 'dashboard' ? 'everything' : activeTab}...`}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-bg-primary border border-border-primary focus:outline-none focus:border-[#7C3AED]/40 transition-colors"
              />
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 rounded-xl bg-bg-primary border border-border-primary text-text-secondary hover:text-text-primary transition-all duration-200 hover:scale-105"
            >
              {isDarkMode ? <FaSun className="text-amber-400" /> : <FaMoon className="text-indigo-400" />}
            </button>

            {/* Notifications Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2.5 rounded-xl bg-bg-primary border border-border-primary text-text-secondary hover:text-text-primary transition-all duration-200 hover:scale-105 relative"
              >
                <FaBell />
                {notifications.some(n => n.unread) && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl bg-bg-card border border-border-primary shadow-2xl p-4 z-50">
                  <div className="flex items-center justify-between mb-4 border-b border-border-primary pb-2">
                    <h3 className="font-semibold text-sm">Notifications</h3>
                    <button 
                      onClick={() => setNotifications(notifications.map(n => ({...n, unread: false})))}
                      className="text-[11px] text-[#A855F7] hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="space-y-3">
                    {notifications.map(n => (
                      <div key={n.id} className="text-xs flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className={n.unread ? "font-semibold text-text-primary" : "text-text-secondary"}>{n.text}</span>
                          {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />}
                        </div>
                        <span className="text-[10px] text-text-secondary">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex items-center gap-3 border-l border-border-primary pl-4">
              <div className="text-right hidden md:block">
                <p className="font-semibold text-sm text-text-primary">{user.full_name || "Administrator"}</p>
                <span className="text-[10px] text-[#A855F7] font-semibold uppercase">Superadmin</span>
              </div>
              <div className="w-10 h-10 rounded-full border border-border-primary overflow-hidden bg-bg-primary flex items-center justify-center text-white font-extrabold text-sm">
                {user.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  (user.full_name || "AD")[0].toUpperCase()
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Tab Content Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-bg-primary">
          {activeTab === "dashboard" && <DashboardView debouncedSearch={debouncedSearch} onTabChange={handleTabChange} />}
          {activeTab === "users" && <UsersView debouncedSearch={debouncedSearch} />}
          {activeTab === "conversations" && <ConversationsView debouncedSearch={debouncedSearch} />}
          {activeTab === "messages" && <MessagesView debouncedSearch={debouncedSearch} />}
          {activeTab === "uploads" && <UploadsView debouncedSearch={debouncedSearch} />}
          {activeTab === "analytics" && <AnalyticsView />}
          {activeTab === "settings" && <SettingsView />}
        </main>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// TAB VIEW: DASHBOARD
// ----------------------------------------------------
function DashboardView({ debouncedSearch, onTabChange }) {
  const [stats, setStats] = useState({ total_users: 0, total_chats: 0, total_messages: 0, total_uploads: 0 });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentConvs, setRecentConvs] = useState([]);
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("admin/stats/");
        setStats(response.data.stats);
        setRecentUsers(response.data.recent_users);
        setRecentConvs(response.data.recent_conversations);
        setWeeklyStats(response.data.weekly_stats);
      } catch (err) {
        console.error("Error fetching dashboard statistics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!debouncedSearch) return recentUsers;
    return recentUsers.filter(u => 
      u.full_name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [recentUsers, debouncedSearch]);

  const filteredConvs = useMemo(() => {
    if (!debouncedSearch) return recentConvs;
    return recentConvs.filter(c => 
      c.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      c.user_email.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [recentConvs, debouncedSearch]);

  if (loading) return <div className="text-center py-10 text-text-secondary text-sm">Loading dashboard statistics...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 4 Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div onClick={() => onTabChange("users")} className="glass-card p-6 flex items-center justify-between cursor-pointer">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase">Total Users</span>
            <p className="text-3xl font-extrabold text-white">{stats.total_users}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 text-xl">
            <FaUsers />
          </div>
        </div>

        <div onClick={() => onTabChange("conversations")} className="glass-card p-6 flex items-center justify-between cursor-pointer">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase">Total Chats</span>
            <p className="text-3xl font-extrabold text-white">{stats.total_chats}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 text-xl">
            <FaComments />
          </div>
        </div>

        <div onClick={() => onTabChange("messages")} className="glass-card p-6 flex items-center justify-between cursor-pointer">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase">Total Messages</span>
            <p className="text-3xl font-extrabold text-white">{stats.total_messages}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 text-xl">
            <FaCommentDots />
          </div>
        </div>

        <div onClick={() => onTabChange("uploads")} className="glass-card p-6 flex items-center justify-between cursor-pointer">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase">Total Uploads</span>
            <p className="text-3xl font-extrabold text-white">{stats.total_uploads}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 text-xl">
            <FaCloudUploadAlt />
          </div>
        </div>
      </div>

      {/* Chart and Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Weekly Activity Chart */}
        <div className="glass-card p-6 xl:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-white text-base">Weekly Activity Chart</h3>
              <p className="text-xs text-text-secondary">Signups and message activity</p>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                <Area type="monotone" dataKey="users" name="New Users" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="messages" name="Messages" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#colorMessages)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Registrations */}
        <div className="glass-card p-6 flex flex-col">
          <div className="mb-4">
            <h3 className="font-bold text-white text-base">New Users</h3>
            <p className="text-xs text-text-secondary">Recent member signups</p>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto max-h-80 sidebar-scroll pr-1">
            {filteredUsers.length === 0 ? (
              <p className="text-xs text-text-secondary text-center py-4">No recent users found.</p>
            ) : (
              filteredUsers.map(u => (
                <div key={u.id} className="flex items-center justify-between p-2 rounded-xl bg-bg-primary/30 border border-border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-[#7C3AED]/10 flex items-center justify-center text-white text-xs font-bold border border-border-primary/40">
                      {u.avatar ? <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" /> : u.email[0].toUpperCase()}
                    </div>
                    <div className="text-xs leading-tight">
                      <p className="font-bold text-white">{u.full_name || u.username}</p>
                      <span className="text-[10px] text-text-secondary">{u.email}</span>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${u.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {u.is_active ? 'Active' : 'Banned'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <div className="glass-card p-6">
        <div className="mb-6">
          <h3 className="font-bold text-white text-base">Recent Conversations</h3>
          <p className="text-xs text-text-secondary">Latest user chats in the system</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-text-secondary border-b border-border-primary uppercase font-bold tracking-wider">
                <th className="pb-3 pl-2">Conversation</th>
                <th className="pb-3">User</th>
                <th className="pb-3">Messages</th>
                <th className="pb-3">Created Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredConvs.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-text-secondary">No conversations found.</td>
                </tr>
              ) : (
                filteredConvs.map(c => (
                  <tr key={c.id} className="border-b border-border-primary/20 hover:bg-hover-overlay/5 transition-colors">
                    <td className="py-4 pl-2 font-bold text-white">{c.title || "Untitled Chat"}</td>
                    <td className="py-4 text-text-secondary">{c.user_name || c.user_email}</td>
                    <td className="py-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#A855F7] font-extrabold">{c.message_count}</span>
                    </td>
                    <td className="py-4 text-text-secondary">{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// TAB VIEW: USERS
// ----------------------------------------------------
function UsersView({ debouncedSearch }) {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", is_active: true, is_staff: false });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("admin/users/", {
        params: {
          search: debouncedSearch,
          page: page
        }
      });
      setUsers(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10) || 1);
    } catch (err) {
      console.error("Error fetching users list", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle page resets on search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleToggleStatus = async (userObj) => {
    try {
      const response = await api.patch(`admin/users/${userObj.id}/`, {
        is_active: !userObj.is_active
      });
      // update list locally
      setUsers(users.map(u => u.id === userObj.id ? { ...u, is_active: response.data.is_active } : u));
    } catch (err) {
      alert("Failed to toggle status");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you absolutely sure you want to delete this user? This will also delete their profile and history.")) return;
    try {
      await api.delete(`admin/users/${userId}/`);
      fetchUsers();
    } catch (err) {
      alert("Failed to delete user: " + (err.response?.data?.error || "Error occurred"));
    }
  };

  const handleEditClick = (userObj) => {
    setEditUser(userObj);
    setEditForm({
      full_name: userObj.full_name,
      email: userObj.email,
      is_active: userObj.is_active,
      is_staff: userObj.is_staff
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.patch(`admin/users/${editUser.id}/`, editForm);
      setUsers(users.map(u => u.id === editUser.id ? { 
        ...u, 
        full_name: response.data.full_name,
        email: response.data.email,
        is_active: response.data.is_active,
        is_staff: response.data.is_staff
      } : u));
      setEditUser(null);
    } catch (err) {
      alert("Failed to update user info");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">User Management</h2>
          <p className="text-xs text-text-secondary">View, modify, and ban users</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-text-secondary border-b border-border-primary uppercase font-bold tracking-wider">
                <th className="pb-3 pl-2">User Details</th>
                <th className="pb-3">Username</th>
                <th className="pb-3">Joined Date</th>
                <th className="pb-3">Privileges</th>
                <th className="pb-3">Status</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-text-secondary">Loading accounts list...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-text-secondary">No users found.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="border-b border-border-primary/20 hover:bg-hover-overlay/5 transition-colors">
                    <td className="py-4 pl-2 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-[#7C3AED]/10 flex items-center justify-center text-white text-xs font-bold border border-border-primary/45">
                        {u.avatar ? <img src={u.avatar} alt="Avatar" className="w-full h-full object-cover" /> : u.email[0].toUpperCase()}
                      </div>
                      <div className="leading-tight">
                        <p className="font-bold text-white">{u.full_name || "No Profile Set"}</p>
                        <span className="text-[10px] text-text-secondary">{u.email}</span>
                      </div>
                    </td>
                    <td className="py-4 text-text-secondary font-mono text-[11px]">{u.username}</td>
                    <td className="py-4 text-text-secondary">{new Date(u.date_joined).toLocaleDateString()}</td>
                    <td className="py-4">
                      {u.is_staff ? (
                        <span className="inline-flex items-center gap-1 text-[#A855F7] font-bold text-[10px] uppercase bg-[#7C3AED]/10 px-2 py-0.5 rounded-full">
                          <FaUserShield /> Admin
                        </span>
                      ) : (
                        <span className="text-text-secondary text-[10px] uppercase bg-bg-primary px-2 py-0.5 rounded-full">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="py-4">
                      <button 
                        onClick={() => handleToggleStatus(u)}
                        className={`inline-flex items-center gap-1.5 font-bold text-[10px] uppercase px-2 py-0.5 rounded-full cursor-pointer hover:scale-105 transition-transform ${
                          u.is_active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}
                      >
                        {u.is_active ? <FaToggleOn /> : <FaToggleOff />}
                        {u.is_active ? 'Active' : 'Banned'}
                      </button>
                    </td>
                    <td className="py-4 text-right pr-2 space-x-2">
                      <button onClick={() => setViewUser(u)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer" title="View details">
                        <FaEye />
                      </button>
                      <button onClick={() => handleEditClick(u)} className="p-2 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer" title="Edit account">
                        <FaUserEdit />
                      </button>
                      <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer" title="Delete account">
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-primary mt-6 pt-4">
            <span className="text-xs text-text-secondary">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-xl border border-border-primary bg-bg-primary text-xs text-text-secondary hover:text-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 rounded-xl border border-border-primary bg-bg-primary text-xs text-text-secondary hover:text-white disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-bg-card border border-border-primary shadow-2xl p-6 relative animate-fade-in">
            <button onClick={() => setViewUser(null)} className="absolute top-4 right-4 p-2 text-text-secondary hover:text-white rounded-lg hover:bg-hover-overlay/10">
              <FaTimes />
            </button>
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full border border-border-primary overflow-hidden mx-auto bg-bg-primary flex items-center justify-center font-extrabold text-2xl text-white">
                {viewUser.avatar ? <img src={viewUser.avatar} alt="Avatar" className="w-full h-full object-cover" /> : viewUser.email[0].toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">{viewUser.full_name || "Profile Uninitialized"}</h3>
                <span className="text-xs text-[#A855F7] font-semibold">{viewUser.is_staff ? "Administrator" : "Standard Account"}</span>
              </div>
              <div className="text-left border-t border-border-primary pt-4 space-y-2 text-xs">
                <p><strong className="text-text-secondary">Username:</strong> <span className="font-mono text-white">{viewUser.username}</span></p>
                <p><strong className="text-text-secondary">Email:</strong> <span className="text-white">{viewUser.email}</span></p>
                <p><strong className="text-text-secondary">Joined:</strong> <span className="text-white">{new Date(viewUser.date_joined).toLocaleString()}</span></p>
                <p><strong className="text-text-secondary">Status:</strong> <span className={viewUser.is_active ? "text-green-400" : "text-red-400"}>{viewUser.is_active ? "Active" : "Banned"}</span></p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Edit Modal */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleEditSubmit} className="w-full max-w-md rounded-2xl bg-bg-card border border-border-primary shadow-2xl p-6 relative animate-fade-in space-y-4">
            <button type="button" onClick={() => setEditUser(null)} className="absolute top-4 right-4 p-2 text-text-secondary hover:text-white rounded-lg hover:bg-hover-overlay/10">
              <FaTimes />
            </button>
            <h3 className="font-bold text-white text-base">Edit Account Details</h3>

            <div className="space-y-3 text-xs">
              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary font-medium">Full Name</label>
                <input 
                  type="text" 
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border-primary focus:outline-none focus:border-[#7C3AED]/40 text-white"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-text-secondary font-medium">Email Address</label>
                <input 
                  type="email" 
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border-primary focus:outline-none focus:border-[#7C3AED]/40 text-white"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                  <input 
                    type="checkbox"
                    checked={editForm.is_active}
                    onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    className="custom-checkbox"
                  />
                  Is Active / Verified
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-text-secondary">
                  <input 
                    type="checkbox"
                    checked={editForm.is_staff}
                    onChange={(e) => setEditForm({ ...editForm, is_staff: e.target.checked })}
                    className="custom-checkbox"
                  />
                  Admin Privileges (is_staff)
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => setEditUser(null)}
                className="px-4 py-2 text-xs text-text-secondary hover:text-white hover:bg-hover-overlay/10 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="btn-gradient px-4 py-2 text-xs rounded-xl font-bold transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// TAB VIEW: CONVERSATIONS
// ----------------------------------------------------
function ConversationsView({ debouncedSearch }) {
  const [convs, setConvs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [viewChatMessages, setViewChatMessages] = useState(null);
  const [chatMessagesList, setChatMessagesList] = useState([]);
  const [loadingChatMsgs, setLoadingChatMsgs] = useState(false);

  const fetchConvs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("admin/conversations/", {
        params: {
          search: debouncedSearch,
          page: page
        }
      });
      setConvs(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10) || 1);
    } catch (err) {
      console.error("Error fetching conversations list", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchConvs();
  }, [fetchConvs]);

  // Handle page resets on search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDeleteConv = async (convId) => {
    if (!window.confirm("Are you sure you want to delete this conversation? This will delete all associated messages.")) return;
    try {
      await api.delete(`admin/conversations/${convId}/`);
      fetchConvs();
    } catch (err) {
      alert("Failed to delete conversation");
    }
  };

  const handleViewMessages = async (conv) => {
    setViewChatMessages(conv);
    setLoadingChatMsgs(true);
    try {
      const response = await api.get(`history/${conv.id}/`);
      setChatMessagesList(response.data.messages || []);
    } catch (err) {
      console.error("Error fetching conversation messages", err);
      setChatMessagesList([]);
    } finally {
      setLoadingChatMsgs(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">Conversation Management</h2>
        <p className="text-xs text-text-secondary">View conversation transcripts and clean up history</p>
      </div>

      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-text-secondary border-b border-border-primary uppercase font-bold tracking-wider">
                <th className="pb-3 pl-2">Conversation Title</th>
                <th className="pb-3">User</th>
                <th className="pb-3">Created At</th>
                <th className="pb-3">Messages Count</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-text-secondary">Loading chat logs...</td>
                </tr>
              ) : convs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-text-secondary">No conversations found.</td>
                </tr>
              ) : (
                convs.map(c => (
                  <tr key={c.id} className="border-b border-border-primary/20 hover:bg-hover-overlay/5 transition-colors">
                    <td className="py-4 pl-2 font-bold text-white">{c.title || "Untitled Chat"}</td>
                    <td className="py-4 text-text-secondary">
                      <div className="leading-tight">
                        <p className="font-semibold text-white">{c.user.full_name || "Profile Unset"}</p>
                        <span className="text-[10px] text-text-secondary font-mono">{c.user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 text-text-secondary">{new Date(c.created_at).toLocaleString()}</td>
                    <td className="py-4">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#A855F7] font-extrabold">{c.message_count}</span>
                    </td>
                    <td className="py-4 text-right pr-2 space-x-2">
                      <button onClick={() => handleViewMessages(c)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer" title="View messages">
                        <FaEye />
                      </button>
                      <button onClick={() => handleDeleteConv(c.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer" title="Delete conversation">
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-primary mt-6 pt-4">
            <span className="text-xs text-text-secondary">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-xl border border-border-primary bg-bg-primary text-xs text-text-secondary hover:text-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 rounded-xl border border-border-primary bg-bg-primary text-xs text-text-secondary hover:text-white disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Conversation Messages Modal */}
      {viewChatMessages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl rounded-2xl bg-bg-card border border-border-primary shadow-2xl p-6 relative animate-fade-in flex flex-col h-[70vh]">
            <button onClick={() => { setViewChatMessages(null); setChatMessagesList([]); }} className="absolute top-4 right-4 p-2 text-text-secondary hover:text-white rounded-lg hover:bg-hover-overlay/10">
              <FaTimes />
            </button>
            <div className="mb-4">
              <h3 className="font-bold text-white text-base">Conversation Transcript</h3>
              <p className="text-xs text-text-secondary">{viewChatMessages.title || "Untitled Chat"} - {viewChatMessages.user.email}</p>
            </div>

            <div className="flex-1 overflow-y-auto sidebar-scroll space-y-4 p-3 bg-bg-primary/40 rounded-xl border border-border-primary/20">
              {loadingChatMsgs ? (
                <div className="text-center py-10 text-xs text-text-secondary">Loading chat transcript...</div>
              ) : chatMessagesList.length === 0 ? (
                <div className="text-center py-10 text-xs text-text-secondary">No messages in this conversation.</div>
              ) : (
                chatMessagesList.map((msg, index) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={msg.id || index} className={`flex flex-col max-w-[85%] ${isUser ? "ml-auto items-end" : "mr-auto items-start"}`}>
                      <span className="text-[10px] text-text-secondary font-semibold uppercase mb-1">{isUser ? "User" : "AI"}</span>
                      <div className={`p-3 rounded-2xl text-xs ${
                        isUser 
                          ? "bg-[#7C3AED]/20 text-white border border-[#7C3AED]/30 rounded-tr-none" 
                          : "bg-bg-card text-text-secondary border border-border-primary rounded-tl-none"
                      }`}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-text-secondary mt-1">{new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// TAB VIEW: MESSAGES
// ----------------------------------------------------
function MessagesView({ debouncedSearch }) {
  const [messages, setMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("admin/messages/", {
        params: {
          search: debouncedSearch,
          page: page
        }
      });
      setMessages(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10) || 1);
    } catch (err) {
      console.error("Error fetching messages list", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Handle page resets on search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDeleteMessage = async (msgId) => {
    if (!window.confirm("Are you sure you want to delete this message? This will delete both the prompt and the assistant response.")) return;
    try {
      await api.delete(`admin/messages/${msgId}/`);
      fetchMessages();
    } catch (err) {
      alert("Failed to delete message");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">System Messages Logs</h2>
        <p className="text-xs text-text-secondary">Inspect message prompt-response pairs</p>
      </div>

      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-text-secondary border-b border-border-primary uppercase font-bold tracking-wider">
                <th className="pb-3 pl-2">User</th>
                <th className="pb-3">Prompt</th>
                <th className="pb-3">AI Response</th>
                <th className="pb-3">Date</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-text-secondary">Loading system logs...</td>
                </tr>
              ) : messages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-text-secondary">No messages logged.</td>
                </tr>
              ) : (
                messages.map(m => (
                  <tr key={m.id} className="border-b border-border-primary/20 hover:bg-hover-overlay/5 transition-colors">
                    <td className="py-4 pl-2 text-text-secondary">
                      <div className="leading-tight">
                        <p className="font-semibold text-white">{m.user.full_name || "Profile Unset"}</p>
                        <span className="text-[10px] text-text-secondary font-mono">{m.user.email}</span>
                      </div>
                    </td>
                    <td className="py-4 max-w-[200px] truncate text-white font-medium">{m.prompt}</td>
                    <td className="py-4 max-w-[200px] truncate text-text-secondary">{m.ai_response || <em className="text-[10px] opacity-40">No response</em>}</td>
                    <td className="py-4 text-text-secondary">{new Date(m.created_at).toLocaleString()}</td>
                    <td className="py-4 text-right pr-2 space-x-2">
                      <button onClick={() => setSelectedMessage(m)} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer" title="View details">
                        <FaEye />
                      </button>
                      <button onClick={() => handleDeleteMessage(m.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer" title="Delete message">
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-primary mt-6 pt-4">
            <span className="text-xs text-text-secondary">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-xl border border-border-primary bg-bg-primary text-xs text-text-secondary hover:text-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 rounded-xl border border-border-primary bg-bg-primary text-xs text-text-secondary hover:text-white disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Message Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-bg-card border border-border-primary shadow-2xl p-6 relative animate-fade-in flex flex-col max-h-[80vh]">
            <button onClick={() => setSelectedMessage(null)} className="absolute top-4 right-4 p-2 text-text-secondary hover:text-white rounded-lg hover:bg-hover-overlay/10">
              <FaTimes />
            </button>
            <div className="mb-4 border-b border-border-primary pb-3">
              <h3 className="font-bold text-white text-base">Prompt & AI Response Details</h3>
              <p className="text-xs text-text-secondary">User: {selectedMessage.user.email} - Logged on {new Date(selectedMessage.created_at).toLocaleString()}</p>
            </div>

            <div className="flex-1 overflow-y-auto sidebar-scroll space-y-4 pr-1">
              <div className="p-4 rounded-xl bg-[#7C3AED]/10 border border-[#7C3AED]/20">
                <span className="text-[10px] text-purple-400 font-extrabold uppercase block mb-1">User Prompt</span>
                <p className="text-xs text-white whitespace-pre-wrap">{selectedMessage.prompt}</p>
              </div>

              <div className="p-4 rounded-xl bg-bg-primary border border-border-primary">
                <span className="text-[10px] text-[#A855F7] font-extrabold uppercase block mb-1">AI Assistant Response</span>
                <p className="text-xs text-text-secondary whitespace-pre-wrap">{selectedMessage.ai_response || "No response generated."}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------
// TAB VIEW: UPLOADS
// ----------------------------------------------------
function UploadsView({ debouncedSearch }) {
  const [uploads, setUploads] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchUploads = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("admin/uploads/", {
        params: {
          search: debouncedSearch,
          page: page
        }
      });
      setUploads(response.data.results);
      setTotalPages(Math.ceil(response.data.count / 10) || 1);
    } catch (err) {
      console.error("Error fetching uploads list", err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchUploads();
  }, [fetchUploads]);

  // Handle page resets on search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const handleDeleteUpload = async (uploadId) => {
    if (!window.confirm("Are you sure you want to delete this file? This cannot be undone.")) return;
    try {
      await api.delete(`admin/uploads/${uploadId}/`);
      fetchUploads();
    } catch (err) {
      alert("Failed to delete file");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">System Uploaded Files</h2>
        <p className="text-xs text-text-secondary">Manage files uploaded by chat users</p>
      </div>

      <div className="glass-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-text-secondary border-b border-border-primary uppercase font-bold tracking-wider">
                <th className="pb-3 pl-2">File Name</th>
                <th className="pb-3">File Type</th>
                <th className="pb-3">Size</th>
                <th className="pb-3">User</th>
                <th className="pb-3">Upload Date</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-text-secondary">Loading system files...</td>
                </tr>
              ) : uploads.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-text-secondary">No files uploaded.</td>
                </tr>
              ) : (
                uploads.map(u => (
                  <tr key={u.id} className="border-b border-border-primary/20 hover:bg-hover-overlay/5 transition-colors">
                    <td className="py-4 pl-2 font-bold text-white flex items-center gap-2">
                      <FaFileAlt className="text-purple-400" />
                      {u.file_name}
                    </td>
                    <td className="py-4 text-text-secondary font-mono uppercase text-[10px]">{u.file_type || "unknown"}</td>
                    <td className="py-4 text-text-secondary">{formatBytes(u.file_size)}</td>
                    <td className="py-4 text-text-secondary">
                      {u.user ? (
                        <div className="leading-tight">
                          <p className="font-semibold text-white">{u.user.full_name || "Profile Unset"}</p>
                          <span className="text-[10px] text-text-secondary font-mono">{u.user.email}</span>
                        </div>
                      ) : (
                        <span className="italic opacity-40">System orphaned</span>
                      )}
                    </td>
                    <td className="py-4 text-text-secondary">{new Date(u.upload_date).toLocaleString()}</td>
                    <td className="py-4 text-right pr-2 space-x-2">
                      {u.file_url && (
                        <a 
                          href={u.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          download
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors cursor-pointer inline-block" 
                          title="Download file"
                        >
                          <FaDownload />
                        </a>
                      )}
                      <button onClick={() => handleDeleteUpload(u.id)} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer" title="Delete file">
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border-primary mt-6 pt-4">
            <span className="text-xs text-text-secondary">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3.5 py-1.5 rounded-xl border border-border-primary bg-bg-primary text-xs text-text-secondary hover:text-white disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3.5 py-1.5 rounded-xl border border-border-primary bg-bg-primary text-xs text-text-secondary hover:text-white disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ----------------------------------------------------
// TAB VIEW: ANALYTICS
// ----------------------------------------------------
function AnalyticsView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.get("admin/stats/");
        setStats(response.data);
      } catch (err) {
        console.error("Error fetching analytics stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const chartData = useMemo(() => {
    if (!stats) return [];
    return stats.weekly_stats;
  }, [stats]);

  const fileTypeData = useMemo(() => {
    if (!stats || !stats.analytics.upload_types) return [];
    return Object.entries(stats.analytics.upload_types).map(([type, count]) => ({
      name: type.toUpperCase(),
      count
    }));
  }, [stats]);

  if (loading) return <div className="text-center py-10 text-text-secondary text-sm">Loading system analytics...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">System Analytics</h2>
        <p className="text-xs text-text-secondary">Analyze system usage, activity, and uploads</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase">Daily Active Users</span>
            <p className="text-3xl font-extrabold text-white">{stats.analytics.dau}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 text-xl">
            <FaUsers />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase">Total API Requests</span>
            <p className="text-3xl font-extrabold text-white">{stats.analytics.total_api_requests}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#7C3AED]/10 flex items-center justify-center text-[#A855F7] text-xl">
            <FaChartLine />
          </div>
        </div>

        <div className="glass-card p-6 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold tracking-widest text-text-secondary uppercase">Upload Types Count</span>
            <p className="text-3xl font-extrabold text-white">{Object.keys(stats.analytics.upload_types).length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 text-xl">
            <FaCloudUploadAlt />
          </div>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Daily API Requests and Messages Chart */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-white text-base mb-6">Weekly Messages & Uploads Trend</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                <Line type="monotone" dataKey="messages" name="Messages" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="uploads" name="Uploads" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Uploads by Type Bar Chart */}
        <div className="glass-card p-6">
          <h3 className="font-bold text-white text-base mb-6">Uploaded Files by File Type</h3>
          <div className="h-80 w-full">
            {fileTypeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-text-secondary">No upload files logged to generate chart.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={fileTypeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
                  <Tooltip contentStyle={{ background: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} cursor={{ fill: 'rgba(124, 58, 237, 0.05)' }} />
                  <Bar dataKey="count" name="Files" fill="#8B5CF6" radius={[8, 8, 0, 0]}>
                    {fileTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#7C3AED" : "#A855F7"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------
// TAB VIEW: SETTINGS
// ----------------------------------------------------
function SettingsView() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [allowSignups, setAllowSignups] = useState(true);
  const [maxUploadSize, setMaxUploadSize] = useState("5MB");
  const [aiModelDefault, setAiModelDefault] = useState("gemini-1.5-flash");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-white">System Settings</h2>
        <p className="text-xs text-text-secondary">Configure administrative and security settings</p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSave} className="space-y-6 text-xs text-text-secondary">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-text-primary">Default AI Model</label>
              <select 
                value={aiModelDefault} 
                onChange={(e) => setAiModelDefault(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border-primary focus:outline-none focus:border-[#7C3AED]/40 text-white"
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Default)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-text-primary">Maximum File Upload Size</label>
              <select 
                value={maxUploadSize} 
                onChange={(e) => setMaxUploadSize(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-bg-primary border border-border-primary focus:outline-none focus:border-[#7C3AED]/40 text-white"
              >
                <option value="2MB">2 MB</option>
                <option value="5MB">5 MB (Default)</option>
                <option value="10MB">10 MB</option>
                <option value="25MB">25 MB</option>
              </select>
            </div>
          </div>

          <div className="border-t border-border-primary pt-6 space-y-4">
            <h3 className="font-bold text-white text-sm">System Operations</h3>
            
            <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-primary/20 border border-border-primary/20">
              <div>
                <p className="font-bold text-white text-xs">Allow New Registrations</p>
                <span className="text-[10px] text-text-secondary">Enable or disable new user signups</span>
              </div>
              <button 
                type="button" 
                onClick={() => setAllowSignups(!allowSignups)}
                className="text-2xl cursor-pointer hover:scale-105 transition-transform"
              >
                {allowSignups ? <FaToggleOn className="text-[#A855F7]" /> : <FaToggleOff className="text-text-secondary" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-bg-primary/20 border border-border-primary/20">
              <div>
                <p className="font-bold text-white text-xs">System Maintenance Mode</p>
                <span className="text-[10px] text-text-secondary">Puts the front-end chat in a read-only state for users</span>
              </div>
              <button 
                type="button" 
                onClick={() => setMaintenanceMode(!maintenanceMode)}
                className="text-2xl cursor-pointer hover:scale-105 transition-transform"
              >
                {maintenanceMode ? <FaToggleOn className="text-[#A855F7]" /> : <FaToggleOff className="text-text-secondary" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-border-primary">
            {saveSuccess ? (
              <span className="text-green-400 font-semibold">Settings saved successfully!</span>
            ) : (
              <span />
            )}
            <button 
              type="submit"
              className="btn-gradient px-6 py-2.5 rounded-xl font-bold text-xs transition-all"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
