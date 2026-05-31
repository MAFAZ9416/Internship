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

  const initials = useMemo(() => {
    if (!user?.username) return "AI";
    return user.username
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [user]);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const theme = localStorage.getItem("theme") || "dark";

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize sidebar collapse state
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
      if (newWidth > 240 && newWidth < 450) {
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
    return archivedConversations.filter((conversation) => {
      const title = conversation.title || "Untitled Chat";
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [archivedConversations, searchQuery]);

  // Render a sleek conversation list card
  const renderConversationItem = (conversation, isPinned = false, isArchived = false) => {
    const id = conversation.id;
    const title = conversation.title || "Untitled Conversation";
    const active = id === activeConversationId;

    return (
      <div
        key={id}
        onClick={() => handleSelectConversation(id)}
        className={`group flex items-center justify-between pl-3 pr-5 py-3 rounded-xl cursor-pointer transition-all duration-200 select-none border-l-4 ${
          active 
            ? "bg-gradient-to-r from-[#7C3AED]/90 to-[#A855F7]/90 text-white shadow-md shadow-purple-500/10 border-l-[#A855F7]" 
            : theme === "dark" 
              ? "hover:bg-white/5 border-l-transparent text-gray-200" 
              : "hover:bg-slate-100 border-l-transparent text-slate-700"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="text-xs text-gray-400 group-hover:text-white flex-shrink-0">💬</span>
          <span className="truncate text-xs font-semibold flex-1 pr-1">{title}</span>
        </div>

        {!isArchived && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition duration-150 flex-shrink-0 relative z-50">
            {!isPinned ? (
              <button
                onClick={(e) => handlePin(e, id)}
                className="text-gray-400 hover:text-yellow-400 transition"
                title="Pin chat"
              >
                <FaStar size={11} />
              </button>
            ) : (
              <button
                onClick={(e) => handleUnpin(e, id)}
                className="text-yellow-400 hover:text-gray-300 transition"
                title="Unpin chat"
              >
                <FaStar size={11} />
              </button>
            )}

            <button
              onClick={(e) => { e.stopPropagation(); renameConversation(id); }}
              className="text-gray-400 hover:text-blue-400 transition"
              title="Rename chat"
            >
              <FaEdit size={11} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onArchiveConversation(id); }}
              className="text-gray-400 hover:text-orange-400 transition"
              title="Archive chat"
            >
              <FaArchive size={11} />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); onDeleteConversation(id); }}
              className="text-gray-400 hover:text-red-400 transition"
              title="Delete chat"
            >
              <FaTrash size={11} />
            </button>
          </div>
        )}

        {isArchived && (
          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition duration-150 flex-shrink-0 relative z-50">
            <button
              onClick={(e) => { e.stopPropagation(); onRestoreConversation(id); }}
              className="text-gray-400 hover:text-emerald-400 transition"
              title="Restore chat"
            >
              <FaUndo size={11} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteConversation(id); }}
              className="text-gray-400 hover:text-red-400 transition"
              title="Delete permanently"
            >
              <FaTrash size={11} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Profile Card Component
  const renderProfileCard = () => (
    <div className="space-y-3">
      {/* Frosted glass details card */}
      <div className={`p-4 rounded-2xl border transition-all duration-300 backdrop-blur-sm ${
        theme === "dark" 
          ? "bg-white/5 border-white/5 hover:border-white/10" 
          : "bg-slate-50 border-slate-200 shadow-sm"
      }`}>
        <div className="flex items-center gap-3 justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {/* Round avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white font-extrabold text-sm shadow-md flex-shrink-0 select-none">
              {initials}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-bold truncate ${theme === "dark" ? "text-white" : "text-slate-800"}`}>
                {user?.username || "AI Chat User"}
              </p>
              <p className={`text-[9px] truncate mt-0.5 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                {user?.email || ""}
              </p>
            </div>
          </div>
          <button className="text-gray-500 hover:text-white transition p-1 cursor-pointer">
            <FaEllipsisH size={12} />
          </button>
        </div>
      </div>
      
      {/* Separate logout button with a red/dark outline */}
      <button
        onClick={logout}
        className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer active:scale-95 duration-100 ${
          theme === "dark"
            ? "border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-400"
            : "border-red-200 hover:border-red-300 bg-red-50/50 hover:bg-red-50 text-red-600 shadow-sm"
        }`}
      >
        <RiLogoutBoxLine size={14} />
        <span>Logout</span>
      </button>
    </div>
  );

  // Logo / Header
  const renderSidebarHeader = (onCloseBtnClick = null) => (
    <div className="p-4 border-b border-white/5 flex items-center justify-between select-none">
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#7C3AED] drop-shadow-[0_0_8px_rgba(124,58,237,0.6)] fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2l2.4 7.2 7.2 2.4-7.2 2.4-2.4 7.2-2.4-7.2-7.2-2.4 7.2-2.4Z"/>
        </svg>
        <h1 className={`text-lg font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
          AI Chat
        </h1>
      </div>
      {onCloseBtnClick ? (
        <button onClick={onCloseBtnClick} className="p-1.5 text-gray-400 hover:text-white transition cursor-pointer">
          <FaTimes size={16} />
        </button>
      ) : (
        <button
          onClick={handleToggleCollapse}
          className={`p-2 rounded-lg transition-all duration-300 cursor-pointer ${
            theme === "dark"
              ? "hover:bg-white/5 text-gray-400 hover:text-white"
              : "hover:bg-slate-200 text-slate-600 hover:text-slate-900"
          }`}
          title="Collapse sidebar"
        >
          <FaBars size={14} />
        </button>
      )}
    </div>
  );

  // Search and New Chat buttons
  const renderSidebarControls = (isMobileView = false) => (
    <div className="p-4 space-y-3 flex-shrink-0">
      {/* Gradient New Chat button */}
      <button
        onClick={() => { onNewChat(); if (isMobileView) setIsMobileSidebarOpen(false); }}
        className="w-full py-2.5 px-4 rounded-xl font-extrabold text-white bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:opacity-95 shadow-md shadow-purple-500/20 active:scale-95 transition-all duration-150 flex items-center justify-between cursor-pointer"
      >
        <span className="text-base font-black flex-shrink-0">+</span>
        <span className="text-sm font-semibold flex-1 text-center">New Chat</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white/10 text-white/60 border border-white/10 font-normal select-none flex-shrink-0">Ctrl+K</span>
      </button>

      {/* Search Input bar */}
      <div className="relative w-full">

      <input
      type="text"
      placeholder="Search chats"
      value={searchQuery}
      onChange={(e)=>setSearchQuery(e.target.value)}
      className="
      w-full
      h-12
      pl-4
      pr-12
      rounded-xl
      outline-none
      bg-bg-card
      border
      border-border-primary
      text-text-primary
      placeholder-text-secondary
      "
      />

      <FaSearch
      className="
      absolute
      right-4
      top-1/2
      -translate-y-1/2
      text-text-secondary
      pointer-events-none
      "
      />

      </div>
    </div>
  );

  // List Sections container
  const renderSidebarLists = () => (
    <div className="flex-1 flex flex-col justify-start gap-5 overflow-hidden px-2 min-h-0 select-none">
      
      {/* Pinned section: Small fixed height */}
      <div className="flex flex-col h-[130px] min-h-0 flex-shrink-0 mt-[20px]">
        <h3 className="text-[10px] font-extrabold text-gray-500 px-3 py-1.5 tracking-widest uppercase select-none">
          📌 PINNED CHATS
        </h3>
        <div
          className="mt-1 mb-2 flex-shrink-0"
          style={{
            borderBottom:
              theme === "dark"
                ? "1px solid rgba(255,255,255,0.12)"
                : "2px solid #94A3B8"
          }}
        />
        <div className="overflow-y-auto sidebar-scroll px-1 flex-1 flex flex-col gap-3 scroll-smooth">
          {filteredPinned.length > 0 ? (
            filteredPinned.map((c) => renderConversationItem(c, true, false))
          ) : (
            <p className="text-[10px] text-gray-500 px-3 py-1.5 italic select-none">No pinned chats</p>
          )}
        </div>
      </div>

      {/* Recent section: Takes remaining height (Largest) */}
      <div className="flex-1 flex flex-col min-h-0 mt-[20px]">
        <h3 className="text-[10px] font-extrabold text-gray-500 px-3 py-1.5 tracking-widest uppercase select-none">
          🕒 RECENT CHATS
        </h3>
        <div
          className="mt-1 mb-2 flex-shrink-0"
          style={{
            borderBottom:
              theme === "dark"
                ? "1px solid rgba(255,255,255,0.12)"
                : "2px solid #94A3B8"
          }}
        />
        <div className="overflow-y-auto sidebar-scroll px-1 flex-1 flex flex-col gap-3 scroll-smooth">
          {filteredRecent.length > 0 ? (
            filteredRecent.map((c) => renderConversationItem(c, false, false))
          ) : (
            <p className="text-[10px] text-gray-500 px-3 py-1.5 italic select-none">No recent chats</p>
          )}
        </div>
      </div>

      {/* Archived section: Small fixed height */}
      <div className="flex flex-col h-[110px] min-h-0 flex-shrink-0 mt-[20px]">
        <h3 className="text-[10px] font-extrabold text-gray-500 px-3 py-1.5 tracking-widest uppercase select-none">
          📦 ARCHIVED CHATS
        </h3>
        <div
          className="mt-1 mb-2 flex-shrink-0"
          style={{
            borderBottom:
              theme === "dark"
                ? "1px solid rgba(255,255,255,0.12)"
                : "2px solid #94A3B8"
          }}
        />
        <div className="overflow-y-auto sidebar-scroll px-1 flex-1 flex flex-col gap-3 scroll-smooth">
          {filteredArchived.length > 0 ? (
            filteredArchived.map((c) => renderConversationItem(c, false, true))
          ) : (
            <p className="text-[10px] text-gray-500 px-3 py-1.5 italic select-none">No archived chats</p>
          )}
        </div>
      </div>

    </div>
  );

  // Render trigger bar on mobile collapse
  if (isMobile && isCollapsed) {
    return (
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="fixed top-4 left-4 z-50 bg-[#070B14] border border-white/5 text-white p-3 rounded-xl hover:bg-white/5 shadow-md cursor-pointer"
        title="Open menu"
      >
        <FaBars size={16} />
      </button>
    );
  }

  // Mobile Slide-over Drawer
  if (isMobile && isMobileSidebarOpen) {
    return (
      <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
        {/* Backdrop blur */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        {/* Drawer panel */}
        <div className={`absolute left-0 top-0 bottom-0 w-72 flex flex-col border-r shadow-2xl transition-all duration-300 animate-slide-left ${
          theme === "dark" ? "bg-[#070B14] border-white/5" : "bg-white border-slate-200"
        }`}>
          {renderSidebarHeader(() => setIsMobileSidebarOpen(false))}
          {renderSidebarControls(true)}
          {renderSidebarLists()}
          <div className="p-4 border-t border-white/5 flex-shrink-0">
            {renderProfileCard()}
          </div>
        </div>
      </div>
    );
  }

  // Return standard collapsed placeholder
  if (isCollapsed) {
    return null;
  }

  // Desktop viewport
  return (
    <div
      ref={sidebarRef}
      className={`h-screen border-r flex flex-col relative transition-all duration-300 hidden md:flex ${
        theme === "dark" ? "bg-[#070B14] border-white/5" : "bg-white border-slate-200"
      }`}
      style={{ width: `${sidebarWidth}px` }}
    >
      {renderSidebarHeader(null)}
      {renderSidebarControls(false)}
      {renderSidebarLists()}
      
      {/* Bottom profile and logout */}
      <div className="p-4 border-t border-white/5 flex-shrink-0">
        {renderProfileCard()}
      </div>

      {/* Draggable resize handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="absolute right-0 top-0 w-1.5 h-full cursor-col-resize hover:bg-gradient-to-b hover:from-[#7C3AED] hover:to-[#A855F7] transition z-40"
      />
    </div>
  );
}
