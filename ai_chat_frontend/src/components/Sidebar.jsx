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
  onRenameConversation,

  activeConversationId,

  sidebarWidth = 280,
  onSidebarWidthChange,

  isCollapsed = false,
  onToggleCollapsed,

  showArchivedChats = false,
  onToggleShowArchivedChats,

  // Add these for mobile support
  isMobileOpen = false,
  onCloseMobile

}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState("recent"); // pinned | recent | archived
  const [activeMenuId, setActiveMenuId] = useState(null);
  const sidebarRef = useRef(null);

  const { user, logout } = useAuth();

  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveMenuId(null);
    };
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

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
    if (onRenameConversation) {
      await onRenameConversation(id);
      return;
    }
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
    if (e) e.stopPropagation();
    try {
      await apiMethods.pin(id);
      onPinConversation?.(id);
    } catch (error) {
      console.log("Pin error:", error);
    }
  };

  const handleUnpin = async (e, id) => {
    if (e) e.stopPropagation();
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
    const isMenuOpen = activeMenuId === id;

    return (
      <div
        key={id}
        onClick={() => handleSelectConversation(id)}
        className={`group relative flex items-center justify-between pl-3 pr-4 py-3 rounded-xl cursor-pointer transition-all duration-200 select-none border-l-4 ${
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

        <div className="flex items-center gap-1.5 flex-shrink-0 relative">
          {isPinned && (
            <span className="text-[10px] text-yellow-400">📌</span>
          )}

          {/* 3 Dot Menu Trigger */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenuId(isMenuOpen ? null : id);
            }}
            className="p-1 rounded-lg opacity-0 group-hover:opacity-100 transition cursor-pointer text-gray-400 hover:text-white"
          >
            <FaEllipsisH size={10} />
          </button>

          {/* Three-Dot Menu Options Dropdown */}
          {isMenuOpen && (
            <div
              className={`absolute right-0 top-7 rounded-xl border shadow-xl z-50 p-1 flex flex-col w-32 ${
                theme === "dark"
                  ? "bg-[#0F172A] border-white/10 text-white animate-fade-in"
                  : "bg-white border-slate-200 text-slate-800 shadow-md animate-fade-in"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {!isArchived ? (
                <>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActiveMenuId(null);
                      try {
                        if (isPinned) {
                          if (onUnpinConversation) await onUnpinConversation(id);
                          else await apiMethods.unpin(id);
                        } else {
                          if (onPinConversation) await onPinConversation(id);
                          else await apiMethods.pin(id);
                        }
                      } catch (err) {
                        console.log('Pin/Unpin error:', err);
                      }
                    }}
                    className="text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/5 transition cursor-pointer"
                  >
                    {isPinned ? "Unpin Chat" : "Pin Chat"}
                  </button>
                  <button
                    onClick={() => { setActiveMenuId(null); renameConversation(id); }}
                    className="text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/5 transition cursor-pointer"
                  >
                    Rename Chat
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActiveMenuId(null);
                      try {
                        if (onArchiveConversation) await onArchiveConversation(id);
                        else await apiMethods.archive(id);
                      } catch (error) {
                        console.log("Archive error:", error);
                      }
                    }}
                    className="text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/5 transition cursor-pointer"
                  >
                    Archive Chat
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActiveMenuId(null);
                      try {
                        if (onDeleteConversation) {
                          await onDeleteConversation(id);
                        } else {
                          if (confirm("Are you sure you want to delete this conversation?")) {
                            await apiMethods.delete(id);
                          }
                        }
                      } catch (error) {
                        console.log("Delete error:", error);
                      }
                    }}
                    className="text-left px-2.5 py-1.5 text-[10px] font-bold text-red-400 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                  >
                    Delete Chat
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActiveMenuId(null);
                      try {
                        if (onRestoreConversation) await onRestoreConversation(id);
                        else await apiMethods.restore(id);
                      } catch (error) {
                        console.log("Restore error:", error);
                      }
                    }}
                    className="text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/5 transition cursor-pointer"
                  >
                    Restore Chat
                  </button>
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      setActiveMenuId(null);
                      try {
                        if (onDeleteConversation) {
                          await onDeleteConversation(id);
                        } else {
                          if (confirm("Are you sure you want to delete this conversation permanently?")) {
                            await apiMethods.delete(id);
                          }
                        }
                      } catch (error) {
                        console.log("Delete error:", error);
                      }
                    }}
                    className="text-left px-2.5 py-1.5 text-[10px] font-bold text-red-400 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                  >
                    Delete Chat
                  </button>
                </>
              )}
            </div>
          )}
        </div>
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
    return null;
  }

  // Mobile render helper for conversation items with action menu
  const renderMobileItem = (conversation, isPinned = false, isArchived = false) => {
    const id = conversation.id;
    const title = conversation.title || "Untitled Conversation";
    const active = id === activeConversationId;
    const isMenuOpen = activeMenuId === id;

    return (
      <div
        key={id}
        className={`relative flex flex-col p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none mb-2 ${
          active 
            ? "bg-gradient-to-br from-[#7C3AED]/15 to-[#A855F7]/15 border-[#7C3AED] text-white" 
            : theme === "dark" 
              ? "bg-[#0F172A]/40 border-white/5 text-gray-200 hover:bg-white/5" 
              : "bg-slate-50 border-slate-200 text-slate-800 shadow-xs hover:bg-slate-100"
        }`}
        onClick={() => {
          handleSelectConversation(id);
          onCloseMobile?.();
        }}
      >
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
              active ? "bg-[#7C3AED] text-white" : "bg-[#7C3AED]/10 text-[#A855F7]"
            }`}>
              <span className="text-xs font-black">📄</span>
            </div>
            <div className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold leading-tight">{title}</span>
              <span className="block text-[9px] text-gray-500 mt-0.5 uppercase tracking-widest font-extrabold">
                {isPinned ? "📌 Pinned" : isArchived ? "📦 Archived" : "💬 Chat"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 relative">
            {isPinned && (
              <span className="text-[10px] text-[#A855F7]">📌</span>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuId(isMenuOpen ? null : id);
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer text-gray-400 hover:text-white"
            >
              <FaEllipsisH size={10} />
            </button>

            {isMenuOpen && (
              <div
                className={`absolute right-0 top-7 rounded-xl border shadow-xl z-50 p-1 flex flex-col w-32 ${
                  theme === "dark"
                    ? "bg-[#0F172A] border-white/10 text-white animate-fade-in"
                    : "bg-white border-slate-200 text-slate-800 shadow-md animate-fade-in"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                {!isArchived ? (
                  <>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setActiveMenuId(null);
                        if (isPinned) {
                          await handleUnpin(e, id);
                        } else {
                          await handlePin(e, id);
                        }
                      }}
                      className="text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/5 transition cursor-pointer"
                    >
                      {isPinned ? "Unpin Chat" : "Pin Chat"}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); renameConversation(id); }}
                      className="text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/5 transition cursor-pointer"
                    >
                      Rename Chat
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setActiveMenuId(null);
                        try {
                          await apiMethods.archive(id);
                          onArchiveConversation?.(id);
                        } catch (error) {
                          console.log("Archive error:", error);
                        }
                      }}
                      className="text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/5 transition cursor-pointer"
                    >
                      Archive Chat
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setActiveMenuId(null);
                        if (onDeleteConversation) {
                          await onDeleteConversation(id);
                        } else {
                          if (confirm("Are you sure you want to delete this conversation?")) {
                            try {
                              await apiMethods.delete(id);
                            } catch (error) {
                              console.log("Delete error:", error);
                            }
                          }
                        }
                      }}
                      className="text-left px-2.5 py-1.5 text-[10px] font-bold text-red-400 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                    >
                      Delete Chat
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setActiveMenuId(null);
                        try {
                          await apiMethods.restore(id);
                          onRestoreConversation?.(id);
                        } catch (error) {
                          console.log("Restore error:", error);
                        }
                      }}
                      className="text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/5 transition cursor-pointer"
                    >
                      Restore Chat
                    </button>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        setActiveMenuId(null);
                        if (onDeleteConversation) {
                          await onDeleteConversation(id);
                        } else {
                          if (confirm("Are you sure you want to delete this conversation permanently?")) {
                            try {
                              await apiMethods.delete(id);
                            } catch (error) {
                              console.log("Delete error:", error);
                            }
                          }
                        }
                      }}
                      className="text-left px-2.5 py-1.5 text-[10px] font-bold text-red-400 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                    >
                      Delete Chat
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Mobile Slide-over Drawer
  if (isMobile && isMobileOpen) {
    return (
      <div className="fixed inset-0 z-50 md:hidden animate-fade-in select-none">
        {/* Backdrop blur */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={onCloseMobile}
        />

        {/* Drawer panel */}
        <div className={`absolute left-0 top-0 bottom-0 w-[80vw] sm:w-[320px] flex flex-col border-r shadow-2xl transition-all duration-300 animate-slide-left ${
          theme === "dark" ? "bg-[#070B14] border-white/5" : "bg-white border-slate-200"
        }`}>
          {/* Header */}
          <div className="p-4 border-b border-white/5 flex items-center justify-between select-none">
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#A855F7] fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l2.4 7.2 7.2 2.4-7.2 2.4-2.4 7.2-2.4-7.2-7.2-2.4 7.2-2.4Z"/>
              </svg>
              <h1 className={`text-sm font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                AI Chat
              </h1>
            </div>
            <button onClick={onCloseMobile} className="p-1.5 text-gray-400 hover:text-white transition cursor-pointer">
              <FaTimes size={16} />
            </button>
          </div>

          {/* Search box inside the drawer */}
          <div className="p-4 flex-shrink-0">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search chats"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full h-10 pl-4 pr-10 rounded-xl outline-none border text-xs font-semibold ${
                  theme === "dark"
                    ? "bg-[#0F172A] border-white/5 text-white placeholder-gray-500 focus:border-[#7C3AED]"
                    : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#7C3AED]"
                }`}
              />
              <FaSearch className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={11} />
            </div>
          </div>

          {/* Sub-tabs horizontal nav */}
          <div className="flex border-b border-white/5 select-none w-full justify-around mb-2 text-xs font-bold flex-shrink-0">
            <button
              onClick={() => setMobileTab("pinned")}
              className={`py-3 px-4 border-b-2 transition duration-200 cursor-pointer ${
                mobileTab === "pinned" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Pinned
            </button>
            <button
              onClick={() => setMobileTab("recent")}
              className={`py-3 px-4 border-b-2 transition duration-200 cursor-pointer ${
                mobileTab === "recent" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setMobileTab("archived")}
              className={`py-3 px-4 border-b-2 transition duration-200 cursor-pointer ${
                mobileTab === "archived" ? "border-purple-500 text-purple-400" : "border-transparent text-gray-400 hover:text-white"
              }`}
            >
              Archived
            </button>
          </div>

          {/* New Chat Button */}
          <div className="px-4 py-2 flex-shrink-0">
            <button
              onClick={() => { onNewChat(); onCloseMobile?.(); }}
              className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20 active:scale-95 transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="text-lg font-black">+</span>
              <span>New Chat</span>
            </button>
          </div>

          {/* Chat Lists depending on tab */}
          <div className="flex-1 overflow-y-auto px-2 space-y-2 py-2">
            {mobileTab === "pinned" && (
              <>
                {filteredPinned.map(c => renderMobileItem(c, true, false))}
                {filteredPinned.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-8">No pinned conversations</p>
                )}
              </>
            )}
            {mobileTab === "recent" && (
              <>
                {filteredRecent.map(c => renderMobileItem(c, false, false))}
                {filteredRecent.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-8">No recent conversations</p>
                )}
              </>
            )}
            {mobileTab === "archived" && (
              <>
                {filteredArchived.map(c => renderMobileItem(c, false, true))}
                {filteredArchived.length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-8">No archived conversations</p>
                )}
              </>
            )}
          </div>

          {/* Profile & Logout near bottom */}
          <div className="p-4 border-t border-white/5 space-y-3 flex-shrink-0">
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
