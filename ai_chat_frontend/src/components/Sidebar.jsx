import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api, { apiMethods } from "../services/api";

import {
  FaEdit,
  FaTrash,
  FaArchive,
  FaUndo,
  FaSearch,
  FaStar,
  FaBars,
  FaTimes,
  FaComments,
  FaEllipsisH
} from "react-icons/fa";
import { RiLogoutBoxLine } from "react-icons/ri";

export default function Sidebar({
  conversations = [],
  archivedConversations = [],

  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onArchiveConversation,
  onRestoreConversation,
  onPinConversation,
  onUnpinConversation,

  activeConversationId,

  sidebarWidth = 280,
  onSidebarWidthChange,

  isCollapsed = false,
  onToggleCollapsed,

  showArchivedChats = false,
  onToggleShowArchivedChats

}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const sidebarRef = useRef(null);
  const { user, logout } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const theme = localStorage.getItem("theme") || "dark";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize sidebar collapse state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedCollapsed !== null) {
      onToggleCollapsed?.(JSON.parse(savedCollapsed));
    }
  }, []);

  const handleToggleCollapse = () => {
    const newState = !isCollapsed;
    localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
    onToggleCollapsed?.(newState);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth > 220 && newWidth < 500) {
        onSidebarWidthChange?.(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, onSidebarWidthChange]);

  const handleSelectConversation = (id) => {
    onSelectConversation(id);
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  const renameConversation = async (id) => {
    const newName = prompt("Enter new chat name");
    if (!newName?.trim()) return;

    try {
      await api.patch(`history/${id}/rename/`, {
        title: newName
      });
      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  const handlePin = async (e, id) => {
    e.stopPropagation();
    try {
      await apiMethods.pin(id);
      onPinConversation?.(id);
    } catch (error) {
      console.log("Pin error:", error);
    }
  };

  const handleUnpin = async (e, id) => {
    e.stopPropagation();
    try {
      await apiMethods.unpin(id);
      onUnpinConversation?.(id);
    } catch (error) {
      console.log("Unpin error:", error);
    }
  };

  // Separate pinned and recent conversations
  const pinnedConversations = useMemo(() => {
    return conversations.filter(c => c.is_pinned).sort((a, b) =>
      new Date(b.pinned_at) - new Date(a.pinned_at)
    );
  }, [conversations]);

  const recentConversations = useMemo(() => {
    return conversations.filter(c => !c.is_pinned).sort((a, b) =>
      new Date(b.updated_at) - new Date(a.updated_at)
    );
  }, [conversations]);

  const filteredRecent = useMemo(() => {
    return recentConversations.filter((conversation) => {
      const title = conversation.title || "New Chat";
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [recentConversations, searchQuery]);

  const filteredPinned = useMemo(() => {
    return pinnedConversations.filter((conversation) => {
      const title = conversation.title || "New Chat";
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [pinnedConversations, searchQuery]);

  const filteredArchived = useMemo(() => {
    return archivedConversations;
  }, [archivedConversations]);

  // Render conversation item with Sparkle/Active highlights and responsive controls
  const renderConversationItem = (conversation, isPinned = false) => {
    const id = conversation.id;
    const title = conversation.title || "Untitled Conversation";
    const active = id === activeConversationId;

    return (
      <div
        key={id}
        onClick={() => handleSelectConversation(id)}
        className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer mb-2.5 transition-all duration-200 select-none ${
          active 
            ? "bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white shadow-md shadow-blue-500/10 border-l-4 border-blue-400" 
            : theme === "dark" 
              ? "hover:bg-gray-800/60 border-l-4 border-transparent text-gray-200" 
              : "hover:bg-slate-200/80 border-l-4 border-transparent text-slate-700"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-sm text-gray-400 group-hover:text-white flex-shrink-0">💬</span>
          <span className="truncate text-sm font-medium flex-1 pr-2">{title}</span>
        </div>

        <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transition duration-150 flex-shrink-0">
          {!isPinned ? (
            <button
              onClick={(e) => handlePin(e, id)}
              className="text-gray-400 hover:text-yellow-400"
              title="Pin chat"
            >
              <FaStar size={12} />
            </button>
          ) : (
            <button
              onClick={(e) => handleUnpin(e, id)}
              className="text-yellow-400 hover:text-gray-300"
              title="Unpin chat"
            >
              <FaStar size={12} />
            </button>
          )}

          <button
            onClick={(e) => { e.stopPropagation(); renameConversation(id); }}
            className="text-gray-400 hover:text-blue-400"
            title="Rename chat"
          >
            <FaEdit size={12} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onArchiveConversation(id); }}
            className="text-gray-400 hover:text-orange-400"
            title="Archive chat"
          >
            <FaArchive size={12} />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onDeleteConversation(id); }}
            className="text-gray-400 hover:text-red-400"
            title="Delete chat"
          >
            <FaTrash size={12} />
          </button>
        </div>
      </div>
    );
  };

  // Profile Card Component placed inside Sidebar
  const renderProfileCard = () => (
    <div className="space-y-3">
      {/* Profile Details Card */}
      <div className={`p-4 rounded-2xl border transition-all duration-300 backdrop-blur-sm ${
        theme === "dark" 
          ? "bg-[#0d1a2f]/40 border-gray-800/80 hover:border-gray-700/60" 
          : "bg-slate-50 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar circle */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
              {user?.username?.substring(0, 2).toUpperCase() || "MA"}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold truncate ${theme === "dark" ? "text-white" : "text-slate-800"}`}>
                {user?.username || "Mafaz Ahmad"}
              </p>
              <p className={`text-[9px] truncate ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                {user?.email || "mafazahmad@example.com"}
              </p>
            </div>
          </div>
          <button className="text-gray-500 hover:text-white transition p-1">
            <FaEllipsisH size={12} />
          </button>
        </div>
      </div>
      
      {/* Logout pill at the very bottom */}
      <button
        onClick={logout}
        className={`w-full py-2 px-3 rounded-xl border font-semibold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
          theme === "dark"
            ? "border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-400"
            : "border-red-200 hover:border-red-300 bg-red-50/50 hover:bg-red-50 text-red-600"
        }`}
      >
        <RiLogoutBoxLine size={14} />
        <span>Logout</span>
      </button>
    </div>
  );

  // Mobile hamburger toggle bar (when sidebar is collapsed on mobile view)
  if (isMobile && isCollapsed) {
    return (
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 bg-[#0B1120] border border-gray-800 text-white p-3 rounded-xl hover:bg-[#1E293B]"
        title="Open menu"
      >
        <FaBars size={18} />
      </button>
    );
  }

  // Mobile Slide-over Overlay Sidebar Drawer
  if (isMobile && isMobileSidebarOpen) {
    return (
      <div className="fixed inset-0 z-50 md:hidden">
        {/* Semi-transparent backdrop blur */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        {/* Sidebar Drawer container */}
        <div className={`absolute left-0 top-0 bottom-0 w-72 flex flex-col border-r shadow-2xl transition-all duration-300 ${
          theme === "dark" ? "bg-[#0B1120] border-gray-800/80" : "bg-white border-slate-200"
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-800/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)] fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l2.4 7.2 7.2 2.4-7.2 2.4-2.4 7.2-2.4-7.2-7.2-2.4 7.2-2.4z"/>
              </svg>
              <span className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>AI Chat</span>
            </div>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1 text-gray-400 hover:text-white"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* New Chat & Search */}
          <div className="p-3 space-y-3">
            <button
              onClick={() => { onNewChat(); setIsMobileSidebarOpen(false); }}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 shadow-md shadow-blue-500/20 active:scale-95 transition-all duration-150 flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span className="text-base font-black">+</span>
                <span className="text-sm font-semibold">New Chat</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/50 border border-white/10 font-normal">⌘K</span>
            </button>

            <div className="relative group">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors">
                <FaSearch size={12} />
              </span>
              <input
                type="text"
                placeholder="Search chats"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none border transition ${
                  theme === "dark"
                    ? "bg-[#111827]/40 border-gray-800 text-white placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
                }`}
              />
            </div>
          </div>

          {/* Scrolling Conversations */}
          <div className="flex-1 flex flex-col overflow-hidden px-2">
            {/* Pinned section */}
            {filteredPinned.length > 0 && (
              <div className="flex flex-col min-h-0 pt-4">
                <h3 className="text-sm text-gray-400 px-3 py-1 font-semibold tracking-wide uppercase">
                  📌 PINNED CHATS
                </h3>
                <div className="h-[1px] mt-1.5 mx-3 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 flex-shrink-0" />
                <div className="max-h-[120px] overflow-y-auto sidebar-scroll py-1 flex-shrink-0">
                  {filteredPinned.map((c) => renderConversationItem(c, true))}
                </div>
              </div>
            )}

            {/* Recent section */}
            <div className="flex flex-col min-h-0 flex-1 pt-4">
              <h3 className="text-sm text-gray-400 px-3 py-1 font-semibold tracking-wide uppercase">
                🕒 RECENT CHATS
              </h3>
              <div className="h-[1px] mt-1.5 mx-3 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 flex-shrink-0" />
              <div className="max-h-[200px] overflow-y-auto sidebar-scroll py-1 flex-1">
                {filteredRecent.length > 0 ? (
                  filteredRecent.map((c) => renderConversationItem(c, false))
                ) : (
                  <p className="text-xs text-gray-500 px-3 py-2 italic">No conversations</p>
                )}
              </div>
            </div>

            {/* Archived section */}
            {archivedConversations.length > 0 && (
              <div className="flex flex-col min-h-0 pt-4">
                <h3 className="text-sm text-gray-400 px-3 py-1 font-semibold tracking-wide uppercase">
                  📦 ARCHIVED CHATS
                </h3>
                <div className="h-[1px] mt-1.5 mx-3 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 flex-shrink-0" />
                <div className="max-h-[80px] overflow-y-auto sidebar-scroll py-1 flex-shrink-0">
                  {filteredArchived.map((conversation) => {
                    const id = conversation.id;
                    const title = conversation.title || "Untitled Chat";
                    const active = id === activeConversationId;

                    return (
                      <div
                        key={id}
                        onClick={() => handleSelectConversation(id)}
                        className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition select-none ${
                          active 
                            ? "bg-blue-600/90 text-white" 
                            : "hover:bg-gray-800/50 text-gray-300"
                        }`}
                      >
                        <span className="truncate text-xs flex-1 pr-2">{title}</span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition duration-150 flex-shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); onRestoreConversation(id); }}
                            className="text-emerald-400 hover:text-emerald-300"
                            title="Restore chat"
                          >
                            <FaUndo size={11} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteConversation(id); }}
                            className="text-red-400 hover:text-red-300"
                            title="Delete permanently"
                          >
                            <FaTrash size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Profile card */}
          <div className="p-3 border-t border-gray-800/40">
            {renderProfileCard()}
          </div>
        </div>
      </div>
    );
  }

  if (isCollapsed) {
    return null;
  }

  // Desktop Responsive Sidebar view
  return (
    <div
      ref={sidebarRef}
      className={`h-screen border-r flex flex-col relative transition-all duration-300 hidden md:flex ${
        theme === "dark" ? "bg-[#0B1120] border-gray-800/80" : "bg-white border-slate-200"
      }`}
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Upper Logo header with sparkle and collapse button */}
      <div className="p-4 border-b border-gray-800/40 flex items-center justify-between select-none">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-blue-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.6)] fill-current" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2l2.4 7.2 7.2 2.4-7.2 2.4-2.4 7.2-2.4-7.2-7.2-2.4 7.2-2.4z"/>
          </svg>
          <h1 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
            AI Chat
          </h1>
        </div>
        <button
          onClick={handleToggleCollapse}
          className={`p-2 rounded-lg transition-all duration-300 ${
            theme === "dark"
              ? "hover:bg-gray-800/60 text-gray-400 hover:text-white"
              : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"
          }`}
          title="Collapse sidebar"
        >
          <FaBars size={16} />
        </button>
      </div>

      {/* Control Buttons & Search bar */}
      <div className="p-4 space-y-3">
        {/* New Chat button with gradient, + icon, and ⌘K */}
        <button
          onClick={onNewChat}
          className="w-full py-2.5 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 shadow-md shadow-blue-500/20 active:scale-95 transition-all duration-150 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-black">+</span>
            <span className="text-sm font-semibold">New Chat</span>
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/50 border border-white/10 font-normal">⌘K</span>
        </button>

        {/* Search Input bar - icon on left */}
        <div className="relative group">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors duration-200">
            <FaSearch size={12} />
          </span>
          <input
            type="text"
            placeholder="Search chats"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs outline-none border transition-all duration-200 ${
              theme === "dark"
                ? "bg-[#111827]/40 border-gray-800 text-white placeholder-gray-500 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 focus:shadow-lg focus:shadow-blue-500/10" 
                : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20"
            }`}
          />
        </div>
      </div>

      {/* Main scrolling layout area with improved spacing */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Pinned section */}
        {filteredPinned.length > 0 && (
          <div className="flex flex-col min-h-0 pt-5">
            <h3 className="text-sm font-semibold text-gray-400 px-3 py-1.5 tracking-wide uppercase flex items-center gap-2 select-none flex-shrink-0">
              <span>📌</span>
              <span>PINNED CHATS</span>
            </h3>
            <div className="h-[1px] mt-2 mx-3 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 flex-shrink-0" />
            <div className="max-h-[120px] overflow-y-auto sidebar-scroll px-2 py-1 flex-shrink-0">
              {filteredPinned.map((c) => renderConversationItem(c, true))}
            </div>
          </div>
        )}

        {/* Recent section */}
        <div className="flex flex-col min-h-0 flex-1 pt-5">
          <h3 className="text-sm font-semibold text-gray-400 px-3 py-1.5 tracking-wide uppercase flex items-center gap-2 select-none flex-shrink-0">
            <span>🕒</span>
            <span>RECENT CHATS</span>
          </h3>
          <div className="h-[1px] mt-2 mx-3 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 flex-shrink-0" />
          <div className="max-h-[320px] overflow-y-auto sidebar-scroll px-2 py-1 flex-1">
            {filteredRecent.length > 0 ? (
              filteredRecent.map((c) => renderConversationItem(c, false))
            ) : (
              <p className="text-xs text-gray-500 px-3 py-2 italic select-none">No active conversations</p>
            )}
          </div>
        </div>

        {/* Archived section */}
        {archivedConversations.length > 0 && (
          <div className="flex flex-col min-h-0 pt-5">
            <h3 className="text-sm font-semibold text-gray-400 px-3 py-1.5 tracking-wide uppercase flex items-center gap-2 select-none flex-shrink-0">
              <span>📦</span>
              <span>ARCHIVED CHATS</span>
            </h3>
            <div className="h-[1px] mt-2 mx-3 bg-gradient-to-r from-purple-500/0 via-purple-500/30 to-purple-500/0 flex-shrink-0" />
            <div className="max-h-[100px] overflow-y-auto sidebar-scroll px-2 py-1 flex-shrink-0">
              {filteredArchived.map((conversation) => {
                const id = conversation.id;
                const title = conversation.title || "Untitled Chat";
                const active = id === activeConversationId;

                return (
                  <div
                    key={id}
                    onClick={() => handleSelectConversation(id)}
                    className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer mb-1.5 transition-all duration-200 select-none ${
                      active 
                        ? "bg-gradient-to-r from-blue-600/90 to-purple-600/90 text-white shadow-md shadow-blue-500/10 border-l-4 border-blue-400" 
                        : theme === "dark" 
                          ? "hover:bg-gray-800/60 border-l-4 border-transparent text-gray-200" 
                          : "hover:bg-slate-200/80 border-l-4 border-transparent text-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-sm text-gray-400 group-hover:text-white flex-shrink-0">💬</span>
                      <span className="truncate text-sm font-medium flex-1 pr-2">{title}</span>
                    </div>

                    <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transition duration-150 flex-shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); onRestoreConversation(id); }}
                        className="text-gray-400 hover:text-emerald-400"
                        title="Restore chat"
                      >
                        <FaUndo size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteConversation(id); }}
                        className="text-gray-400 hover:text-red-400"
                        title="Delete permanently"
                      >
                        <FaTrash size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Profile card fixed at bottom with better spacing */}
      <div className="p-3 border-t border-gray-800/40">
        {renderProfileCard()}
      </div>

      {/* Resize handle (desktop only) */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-gradient-to-b hover:from-blue-500 hover:to-purple-500 transition-colors z-40"
      />
    </div>
  );
}
