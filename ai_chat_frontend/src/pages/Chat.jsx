import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import api, { apiMethods } from "../services/api";
import { useAuth } from "../context/AuthContext";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";

import { 
  FaEdit, 
  FaShareAlt, 
  FaTrash, 
  FaEllipsisH, 
  FaStar, 
  FaBars, 
  FaMicrophone, 
  FaSearch,
  FaChevronDown,
  FaFileAlt
} from "react-icons/fa";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);

  const [isTyping, setIsTyping] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [showArchivedChats, setShowArchivedChats] = useState(false);

  // Responsive mobile states
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [activeMobileTab, setActiveMobileTab] = useState("chats"); // chats | files | voice | profile
  const [mobileSubTab, setMobileSubTab] = useState("recent"); // pinned | recent | archived
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Voice tab dictation state
  const [transcribedVoiceMsg, setTranscribedVoiceMsg] = useState("");
  const [isVoiceListening, setIsVoiceListening] = useState(false);

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
  
  // Theme state: defaults to dark mode
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");
  const voiceRecognitionRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync theme configurations
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

  // Voice tab Speech recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";

    rec.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscribedVoiceMsg(text);
    };

    rec.onend = () => {
      setIsVoiceListening(false);
    };

    voiceRecognitionRef.current = rec;
  }, []);

  const toggleMobileVoice = () => {
    if (!voiceRecognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    if (isVoiceListening) {
      voiceRecognitionRef.current.stop();
    } else {
      voiceRecognitionRef.current.start();
      setIsVoiceListening(true);
    }
  };

  useEffect(() => {
    const initChats = async () => {
      await fetchConversations();
      const saved = localStorage.getItem("currentConversationId");
      if (saved) {
        const conversationId = isNaN(Number(saved)) ? saved : Number(saved);
        selectConversation(conversationId);
      }
    };
    initChats();
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await api.get("/history/");
      const history = Array.isArray(response.data)
        ? response.data
        : response.data.results || [];

      setConversations(history.filter((chat) => !chat.is_archived));
      setArchivedConversations(history.filter((chat) => chat.is_archived));
    } catch (error) {
      console.log("History error:", error);
    }
  }, []);

  const sendMessage = async (data) => {
    const message = data.message || "";
    const files = data.files || [];
    const audioFile = data.audioFile;
    const videoFile = data.videoFile;

    if (!message.trim() && files.length === 0 && !audioFile && !videoFile)
      return;

    // Handle audio transcription
    if (audioFile) {
      await handleAudioTranscription(audioFile, message);
      return;
    }

    // Handle video processing
    if (videoFile) {
      await handleVideoProcessing(videoFile, message);
      return;
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      content:
        message ||
        (files.length > 0 ? `📎 ${files.length} file(s) attached` : ""),
      files: files.map((file) => ({
        name: file.name,
        type: file.type,
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null
      })),
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    try {
      let conversationId = currentConversationId;
      const payload = { message };

      if (conversationId) {
        payload.conversation_id = conversationId;
      }

      const response = await api.post("/", payload);
      conversationId = response.data.conversation_id;

      if (conversationId) {
        setCurrentConversationId(conversationId);
      }

      /* upload files */
      if (files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append("files", file);
        });
        formData.append("conversation_id", conversationId);

        await api.post("/upload/", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          }
        });
        await selectConversation(conversationId);
      }

      /* AI message */
      const aiMessage = {
        id: response.data.message_id || Date.now() + 1,
        role: "assistant",
        content: response.data.response || "No response",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMessage]);
      fetchConversations();
    } catch (error) {
      console.log("Send error:", error);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle audio transcription
  const handleAudioTranscription = async (audioFile, message) => {
    if (!currentConversationId) {
      try {
        const payload = { message: message || "Audio message" };
        const response = await api.post("/", payload);
        setCurrentConversationId(response.data.conversation_id);
      } catch (error) {
        console.log("Error creating conversation:", error);
        return;
      }
    }

    setIsTyping(true);

    try {
      const response = await apiMethods.transcribeAudio(
        audioFile,
        currentConversationId,
        message
      );

      const transcriptMessage = {
        id: response.data.user_message_id || Date.now(),
        role: "user",
        content: `Transcript:\n\n${response.data.transcript}`,
        timestamp: new Date()
      };

      const aiMessage = {
        id: response.data.ai_message_id || Date.now() + 1,
        role: "assistant",
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, transcriptMessage, aiMessage]);
      fetchConversations();
    } catch (error) {
      console.log("Audio transcription error:", error);
      alert("Failed to transcribe audio");
    } finally {
      setIsTyping(false);
    }
  };

  // Handle video processing
  const handleVideoProcessing = async (videoFile, message) => {
    if (!currentConversationId) {
      try {
        const payload = { message: message || "Video message" };
        const response = await api.post("/", payload);
        setCurrentConversationId(response.data.conversation_id);
      } catch (error) {
        console.log("Error creating conversation:", error);
        return;
      }
    }

    setIsTyping(true);

    try {
      const response = await apiMethods.processVideo(
        videoFile,
        currentConversationId,
        message
      );

      const videoInfoContent = `🎬 Video: ${response.data.video_info.filename}
Size: ${response.data.video_info.size_display}
${response.data.video_info.description ? `\nDescription:\n${response.data.video_info.description}` : ""}
${response.data.transcript && response.data.transcript !== "Audio extraction not available" ? `\n\nTranscript:\n${response.data.transcript}` : ""}`;

      const videoMessage = {
        id: response.data.user_message_id || Date.now(),
        role: "user",
        content: videoInfoContent,
        timestamp: new Date()
      };

      const aiMessage = {
        id: response.data.ai_message_id || Date.now() + 1,
        role: "assistant",
        content: response.data.response,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, videoMessage, aiMessage]);
      fetchConversations();
    } catch (error) {
      console.log("Video processing error:", error);
      alert("Failed to process video");
    } finally {
      setIsTyping(false);
    }
  };

  const editMessage = async (messageId, newContent) => {
    const previousMessages = [...messages];

    // Optimistically update local message state immediately
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            content: newContent,
            edited_at: new Date()
          };
        }
        return msg;
      })
    );

    try {
      const response = await api.patch(`/message/${messageId}/edit/`, {
        content: newContent
      });

      const updatedMessage = response.data.message || response.data;

      // Update with exact metadata from server response
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId) {
            return {
              ...msg,
              content: updatedMessage.content || newContent,
              edited_at: updatedMessage.edited_at || new Date()
            };
          }
          return msg;
        })
      );

      if (currentConversationId) {
        const refreshed = await api.get(`/history/${currentConversationId}/`);
        const formattedMessages = (refreshed.data.messages || []).map(
          (msg) => ({
            ...msg,
            files:
              msg.files?.map((file) => ({
                id: file.id,
                name: file.file_name,
                type: file.file_type,
                preview: file.file,
                url: file.file,
                size: file.file_size_display
              })) || []
          })
        );
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.log("Edit error:", error);
      // Revert if request fails
      setMessages(previousMessages);
      alert("Failed to edit message. Reverting changes.");
    }
  };

  const selectConversation = async (id) => {
    setCurrentConversationId(id);
    localStorage.setItem("currentConversationId", id);
    try {
      const response = await api.get(`/history/${id}/`);
      setMessages(response.data.messages || []);
      setUploadedFiles(response.data.uploaded_files || []);
      
      // Focus Chats on mobile
      if (isMobile) {
        setActiveMobileTab("chats");
      }
    } catch (error) {
      console.log("Fetch conversation error:", error);
    }
  };

  const deleteConversation = async (id) => {
    if (!confirm("Are you sure you want to delete this chat permanently?")) return;
    try {
      await api.delete(`/history/${id}/delete/`);
      if (id === currentConversationId) {
        setCurrentConversationId(null);
        localStorage.removeItem("currentConversationId");
        setMessages([]);
        setUploadedFiles([]);
      }
      fetchConversations();
    } catch (error) {
      console.log("Delete error:", error);
    }
  };

  const archiveConversation = async (id) => {
    try {
      await api.post(`/history/${id}/archive/`);
      fetchConversations();
      if (id === currentConversationId) {
        setCurrentConversationId(null);
        localStorage.removeItem("currentConversationId");
        setMessages([]);
        setUploadedFiles([]);
      }
    } catch (error) {
      console.log("Archive error:", error);
    }
  };

  const restoreConversation = async (id) => {
    try {
      await api.post(`/history/${id}/restore/`);
      fetchConversations();
    } catch (error) {
      console.log("Restore error:", error);
    }
  };

  const pinConversation = async (id) => {
    try {
      await api.post(`/history/${id}/pin/`);
      fetchConversations();
    } catch (error) {
      console.log("Pin error:", error);
    }
  };

  const unpinConversation = async (id) => {
    try {
      await api.post(`/history/${id}/unpin/`);
      fetchConversations();
    } catch (error) {
      console.log("Unpin error:", error);
    }
  };

  const newChat = () => {
    setCurrentConversationId(null);
    localStorage.removeItem("currentConversationId");
    setMessages([]);
    setUploadedFiles([]);
  };

  // Header Title Resolver
  const currentChatTitle = useMemo(() => {
    const activeChat = conversations.find((c) => c.id === currentConversationId);
    return activeChat ? activeChat.title : "New Conversation";
  }, [conversations, currentConversationId]);

  const isCurrentChatPinned = useMemo(() => {
    const activeChat = conversations.find((c) => c.id === currentConversationId);
    return activeChat ? activeChat.is_pinned : false;
  }, [conversations, currentConversationId]);

  // Rename Current Chat from Header
  const handleRenameCurrent = async () => {
    if (!currentConversationId) return;
    const newName = prompt("Rename conversation to:", currentChatTitle);
    if (!newName?.trim() || newName === currentChatTitle) return;
    try {
      await api.patch(`history/${currentConversationId}/rename/`, {
        title: newName
      });
      fetchConversations();
    } catch (error) {
      console.log(error);
    }
  };

  // Toggle pin from Header
  const handleTogglePinCurrent = async () => {
    if (!currentConversationId) return;
    try {
      if (isCurrentChatPinned) {
        await apiMethods.unpin(currentConversationId);
        unpinConversation(currentConversationId);
      } else {
        await apiMethods.pin(currentConversationId);
        pinConversation(currentConversationId);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Share current conversation
  const shareCurrentConversation = async () => {
    if (!currentConversationId) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert("Conversation link copied ✓");
    } catch (error) {
      console.log("Share error:", error);
    }
  };

  // Delete current conversation
  const deleteCurrentConversation = async () => {
    if (!currentConversationId) return;
    const confirmDelete = window.confirm("Delete this conversation permanently?");
    if (!confirmDelete) return;
    try {
      await deleteConversation(currentConversationId);
    } catch (error) {
      console.log("Delete current conversation error:", error);
    }
  };

  // Mobile Files Gallery Extractor
  const mobileUploadedFiles = useMemo(() => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      return uploadedFiles.map((file) => ({
        id: file.id,
        name: file.file_name || file.name,
        type: file.file_type || file.type,
        preview: file.file || file.url || file.preview,
        url: file.file || file.url,
        sender: "user"
      }));
    }

    const files = [];
    messages.forEach((msg) => {
      if (msg.files && msg.files.length > 0) {
        msg.files.forEach((f) => {
          files.push({
            ...f,
            sender: msg.role,
            timestamp: msg.timestamp
          });
        });
      }
    });
    return files;
  }, [messages, uploadedFiles]);

  // Mobile Send Dictation function
  const handleSendMobileVoice = () => {
    if (!transcribedVoiceMsg.trim()) return;
    sendMessage({ message: transcribedVoiceMsg });
    setTranscribedVoiceMsg("");
    setActiveMobileTab("chats");
  };

  // Mobile sub-tabs filter calculations
  const mobileConversationsList = useMemo(() => {
    if (mobileSubTab === "pinned") {
      return conversations.filter(c => c.is_pinned);
    }
    if (mobileSubTab === "archived") {
      return archivedConversations;
    }
    return conversations.filter(c => !c.is_pinned);
  }, [conversations, archivedConversations, mobileSubTab]);

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
      theme === "dark" ? "bg-[#070B14]" : "bg-[#F8FAFC]"
    }`}>
      
      {/* Desktop Sidebar drawer */}
      <Sidebar
        conversations={conversations}
        archivedConversations={archivedConversations}
        onSelectConversation={selectConversation}
        onNewChat={newChat}
        onDeleteConversation={deleteConversation}
        onArchiveConversation={archiveConversation}
        onRestoreConversation={restoreConversation}
        onPinConversation={pinConversation}
        onUnpinConversation={unpinConversation}
        activeConversationId={currentConversationId}
        sidebarWidth={sidebarWidth}
        onSidebarWidthChange={setSidebarWidth}
        isCollapsed={isCollapsed}
        onToggleCollapsed={setIsCollapsed}
        showArchivedChats={showArchivedChats}
        onToggleShowArchivedChats={setShowArchivedChats}
      />

      {/* Main Chat Viewport */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        
        {/* ========================================================
            HEADER BARS (Desktop vs Mobile)
            ======================================================== */}
        {isMobile ? (
          /* Mobile Top Navbar */
          <header className={`h-14 flex items-center justify-between px-4 border-b select-none z-30 flex-shrink-0 ${
            theme === "dark" ? "bg-[#070B14] border-white/5" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white transition cursor-pointer"
            >
              <FaBars size={18} />
            </button>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#7C3AED]" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14.8 9.2L22 12L14.8 14.8L12 22L9.2 14.8L2 12L9.2 9.2L12 2Z" fill="currentColor" />
              </svg>
              <span className={`text-sm font-bold tracking-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                AI Chat
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => alert("Search option.")}
                className="p-2 text-gray-400 hover:text-white cursor-pointer"
              >
                <FaSearch size={14} />
              </button>
              <button
                onClick={newChat}
                className="p-2 text-[#7C3AED] hover:text-[#A855F7] cursor-pointer"
                title="New Chat"
              >
                📝
              </button>
            </div>
          </header>
        ) : (
          /* Desktop Header Bar with chevron, share, delete, and theme switcher */
          <header className={`h-16 flex items-center justify-between px-6 border-b z-30 select-none flex-shrink-0 ${
            theme === "dark" ? "bg-[#070B14]/80 border-white/5 backdrop-blur-md" : "bg-white/80 border-slate-200 backdrop-blur-md shadow-sm"
          }`}>
            {/* Left title and chevron indicator */}
            <div className="flex items-center gap-3">
              {isCollapsed && (
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="p-2 bg-white/5 border border-white/5 text-white rounded-xl hover:bg-white/10 mr-2 cursor-pointer"
                  title="Show Sidebar"
                >
                  ☰
                </button>
              )}
              <h2 className={`text-sm font-bold flex items-center gap-2 ${
                theme === "dark" ? "text-white" : "text-slate-950"
              }`}>
                <span>{currentChatTitle}</span>
                <FaChevronDown size={10} className="text-gray-500 cursor-pointer" />
              </h2>
              {currentConversationId && (
                <button
                  onClick={handleTogglePinCurrent}
                  className={`text-xs ml-1.5 cursor-pointer transition ${
                    isCurrentChatPinned ? "text-yellow-400 animate-pulse" : "text-gray-500 hover:text-gray-300"
                  }`}
                  title={isCurrentChatPinned ? "Unpin chat" : "Pin chat"}
                >
                  <FaStar size={11} />
                </button>
              )}
            </div>

            {/* Right controls: rename, share, delete, ellipsis, theme togglers, and avatar */}
            <div className="flex items-center gap-6 text-gray-400">
              {currentConversationId && (
                <div className="flex items-center gap-3.5 border-r border-white/5 pr-4">
                  <button
                    onClick={handleRenameCurrent}
                    className="p-1.5 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
                    title="Rename Conversation"
                  >
                    <FaEdit size={12} />
                  </button>
                  <button
                    onClick={shareCurrentConversation}
                    className="p-1.5 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
                    title="Share Conversation"
                  >
                    <FaShareAlt size={12} />
                  </button>
                  <button
                    onClick={deleteCurrentConversation}
                    className="p-1.5 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                    title="Delete Conversation"
                  >
                    <FaTrash size={12} />
                  </button>
                  <button
                    onClick={() => alert("Settings")}
                    className="p-1.5 hover:text-white hover:bg-white/5 rounded-xl transition cursor-pointer"
                    title="Ellipsis"
                  >
                    <FaEllipsisH size={12} />
                  </button>
                </div>
              )}

              {/* Theme togglers (sun/moon) inside custom circular icons */}
              <div className="flex items-center gap-2 select-none border-r border-white/5 pr-4">
                <button
                  onClick={toggleTheme}
                  className={`p-2.5 rounded-full transition cursor-pointer flex items-center justify-center ${
                    theme === "light" ? "bg-purple-500/10 border border-purple-500/20 text-[#A855F7]" : "hover:text-white"
                  }`}
                  title="Light Mode"
                >
                  ☀️
                </button>
                <button
                  onClick={toggleTheme}
                  className={`p-2.5 rounded-full transition cursor-pointer flex items-center justify-center ${
                    theme === "dark" ? "bg-purple-500/15 border border-purple-500/20 text-[#A855F7]" : "hover:text-white"
                  }`}
                  title="Dark Mode"
                >
                  🌙
                </button>
              </div>

              {/* Dynamic Initials Avatar */}
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white font-extrabold text-sm shadow-md flex-shrink-0 select-none border border-white/10">
                {initials}
              </div>
            </div>
          </header>
        )}

        {/* ========================================================
            VIEWPORT BODY (Desktop vs Mobile Viewport Switcher)
            ======================================================== */}
        {isMobile ? (
          /* MOBILE PERSISTENT TABS VIEWPORT */
          <div className="flex-1 overflow-hidden flex flex-col bg-transparent relative">
            
            {/* Sub-tabs rendered below header for "chats" mobile tab */}
            {activeMobileTab === "chats" && (
              <div className={`h-11 border-b flex items-center px-4 justify-around text-xs font-bold select-none flex-shrink-0 ${
                theme === "dark" ? "bg-[#070B14]/60 border-white/5" : "bg-white border-slate-200"
              }`}>
                <button
                  onClick={() => setMobileSubTab("pinned")}
                  className={`py-2 px-3 border-b-2 transition ${
                    mobileSubTab === "pinned" ? "border-[#7C3AED] text-[#A855F7]" : "border-transparent text-gray-500"
                  }`}
                >
                  Pinned
                </button>
                <button
                  onClick={() => setMobileSubTab("recent")}
                  className={`py-2 px-3 border-b-2 transition ${
                    mobileSubTab === "recent" ? "border-[#7C3AED] text-[#A855F7]" : "border-transparent text-gray-500"
                  }`}
                >
                  Recent
                </button>
                <button
                  onClick={() => setMobileSubTab("archived")}
                  className={`py-2 px-3 border-b-2 transition ${
                    mobileSubTab === "archived" ? "border-[#7C3AED] text-[#A855F7]" : "border-transparent text-gray-500"
                  }`}
                >
                  Archived
                </button>
              </div>
            )}

            {/* Tab: Chats (renders chat list if current conversation id is null, else renders message bubble pane) */}
            {activeMobileTab === "chats" && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {!currentConversationId ? (
                  /* Conversations List for Mobile */
                  <div className="flex-1 overflow-y-auto p-4 space-y-2 select-none">
                    <h3 className="text-[10px] font-bold text-gray-500 tracking-wider uppercase pl-2 mb-2">
                      Conversations ({mobileConversationsList.length})
                    </h3>
                    {mobileConversationsList.map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => selectConversation(chat.id)}
                        className={`p-4 rounded-xl border flex items-center justify-between transition ${
                          theme === "dark" ? "bg-[#0F172A]/50 border-white/5 text-white" : "bg-white border-slate-200 shadow-sm"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate">{chat.title || "New Chat"}</p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            {chat.is_pinned ? "📌 Pinned" : "💬 Recent"}
                          </p>
                        </div>
                        <span className="text-xs text-gray-400 font-semibold select-none pr-1">→</span>
                      </div>
                    ))}
                    {mobileConversationsList.length === 0 && (
                      <div className="py-20 text-center">
                        <span className="text-4xl">💬</span>
                        <p className="text-xs text-gray-500 mt-2">No conversations in this section</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Live conversation chat pane for Mobile */
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Tiny header return banner on mobile */}
                    <div className={`h-9 px-4 border-b flex items-center justify-between text-[10px] font-bold select-none ${
                      theme === "dark" ? "bg-[#0F172A]/40 border-white/5" : "bg-slate-50 border-slate-200"
                    }`}>
                      <button 
                        onClick={() => setCurrentConversationId(null)}
                        className="text-[#A855F7] font-extrabold cursor-pointer"
                      >
                        ← Back to chats list
                      </button>
                      <button 
                        onClick={deleteCurrentConversation}
                        className="text-red-400 cursor-pointer"
                      >
                        Delete Chat
                      </button>
                    </div>
                    
                    <ChatWindow
                      messages={messages}
                      isTyping={isTyping}
                      onEditMessage={editMessage}
                      onSendSuggestion={sendMessage}
                    />
                    <ChatInput onSend={sendMessage} />
                  </div>
                )}
              </div>
            )}

            {/* Tab: Files list view on Mobile */}
            {activeMobileTab === "files" && (
              <div className="flex-1 overflow-y-auto p-4 select-none animate-fade-in">
                <h3 className={`text-xs font-bold mb-4 flex items-center gap-2 ${theme === "dark" ? "text-gray-300" : "text-slate-800"}`}>
                  <span>📁</span>
                  <span>Conversation Attachments ({mobileUploadedFiles.length})</span>
                </h3>
                {mobileUploadedFiles.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {mobileUploadedFiles.map((file, index) => (
                      <div key={index} className={`p-4 rounded-2xl border flex flex-col justify-between h-28 ${
                        theme === "dark" ? "bg-[#0F172A]/50 border-white/5 text-white" : "bg-white border-slate-200 text-slate-800 shadow-sm"
                      }`}>
                        <div className="min-w-0">
                          <p className="text-[9px] text-gray-500 truncate uppercase tracking-wider font-extrabold">{file.sender === "user" ? "Sent by You" : "AI File"}</p>
                          <p className="text-xs font-bold mt-1.5 truncate leading-tight pr-1">{file.name || "Attachment"}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-white/5">
                          <span className="text-[9px] uppercase font-bold text-gray-500">{file.type?.substring(0, 10) || "Document"}</span>
                          <a
                            href={file.preview || file.url || file.file}
                            download={file.name}
                            className="text-[10px] text-[#A855F7] font-bold hover:underline"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center py-20">
                    <span className="text-4xl mb-3 animate-float">📁</span>
                    <h4 className="text-sm font-bold text-gray-400">No media attached</h4>
                    <p className="text-xs text-gray-500 mt-1">Upload images, PDFs, or audio inside chats.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Voice recorder Dictation screen */}
            {activeMobileTab === "voice" && (
              <div className="flex-1 flex flex-col justify-between p-6 select-none animate-fade-in">
                <div className="text-center pt-4">
                  <h3 className={`text-base font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    Speech dictation transcription
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-1">Hands-free speech dictation</p>
                </div>

                {/* Circular mic triggers */}
                <div className="flex justify-center my-6">
                  <button
                    type="button"
                    onClick={toggleMobileVoice}
                    className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-lg ${
                      isVoiceListening 
                        ? "bg-red-500/20 text-red-500 border-2 border-red-500 animate-pulse shadow-red-500/30" 
                        : "bg-[#7C3AED]/10 text-[#A855F7] border-2 border-white/5 hover:border-[#7C3AED] shadow-purple-500/5"
                    }`}
                  >
                    <FaMicrophone size={32} />
                    <span className="text-[9px] uppercase tracking-widest font-extrabold mt-2.5">
                      {isVoiceListening ? "Listening..." : "Tap to Speak"}
                    </span>
                  </button>
                </div>

                <div className="flex-1 flex flex-col">
                  <label className="block text-[9px] font-bold text-gray-500 mb-2 uppercase tracking-widest">Transcription Output</label>
                  <textarea
                    value={transcribedVoiceMsg}
                    onChange={(e) => setTranscribedVoiceMsg(e.target.value)}
                    placeholder="Transcribed voice messages appear here..."
                    className={`w-full flex-1 p-4 rounded-2xl border text-xs outline-none resize-none transition ${
                      theme === "dark" 
                        ? "bg-[#070B14] border-white/5 text-white placeholder-gray-600" 
                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 shadow-inner"
                    }`}
                  />
                  
                  <button
                    onClick={handleSendMobileVoice}
                    disabled={!transcribedVoiceMsg.trim()}
                    className="w-full mt-4 py-3 rounded-xl font-bold text-white btn-gradient cursor-pointer disabled:opacity-40"
                  >
                    Send to AI Assistant
                  </button>
                </div>
              </div>
            )}

            {/* Tab: User Profile overview */}
            {activeMobileTab === "profile" && (
              <div className="flex-1 overflow-y-auto p-6 select-none flex flex-col justify-between animate-fade-in">
                <div className="space-y-6">
                  {/* General details */}
                  <div className="flex flex-col items-center text-center pt-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-purple-500/20 mb-4 select-none border border-white/10">
                      {initials}
                    </div>
                    <h3 className={`text-base font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      {user?.username || "AI Chat User"}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{user?.email || ""}</p>
                  </div>

                  {/* General mock stats */}
                  <div className={`p-4 rounded-2xl border ${
                    theme === "dark" ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200 shadow-sm"
                  }`}>
                    <h4 className="text-[9px] font-extrabold text-gray-500 uppercase tracking-widest mb-3">Usage Statistics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-gray-500 block">Total Chats</span>
                        <span className={`text-sm font-bold ${theme === "dark" ? "text-white" : "text-slate-800"}`}>
                          {conversations.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">Archived Chats</span>
                        <span className={`text-sm font-bold ${theme === "dark" ? "text-white" : "text-slate-800"}`}>
                          {archivedConversations.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Logout out pill button at bottom of mobile view */}
                <button
                  onClick={logout}
                  className="w-full mt-8 py-3.5 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md select-none active:scale-[0.98] duration-100"
                >
                  <RiLogoutBoxLine size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Persistent Mobile Bottom Navigation Bar */}
            <nav className={`h-16 border-t flex items-center justify-around select-none z-40 flex-shrink-0 ${
              theme === "dark" ? "bg-[#070B14] border-white/5 text-gray-400" : "bg-white border-slate-200 shadow-md text-slate-500"
            }`}>
              <button
                onClick={() => setActiveMobileTab("chats")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
                  activeMobileTab === "chats" ? "text-[#A855F7] font-bold" : "hover:text-white"
                }`}
              >
                <span className="text-base">💬</span>
                <span className="text-[9px]">Chats</span>
              </button>
              <button
                onClick={() => setActiveMobileTab("files")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
                  activeMobileTab === "files" ? "text-[#A855F7] font-bold" : "hover:text-white"
                }`}
              >
                <span className="text-base">📁</span>
                <span className="text-[9px]">Files</span>
              </button>
              <button
                onClick={() => setActiveMobileTab("voice")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
                  activeMobileTab === "voice" ? "text-[#A855F7] font-bold" : "hover:text-white"
                }`}
              >
                <span className="text-base">🎤</span>
                <span className="text-[9px]">Voice</span>
              </button>
              <button
                onClick={() => setActiveMobileTab("profile")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
                  activeMobileTab === "profile" ? "text-[#A855F7] font-bold" : "hover:text-white"
                }`}
              >
                <span className="text-base">👤</span>
                <span className="text-[9px]">Profile</span>
              </button>
            </nav>

            {/* Slide-over Mobile sidebar overlay container */}
            {isMobileSidebarOpen && (
              <Sidebar
                conversations={conversations}
                archivedConversations={archivedConversations}
                onSelectConversation={selectConversation}
                onNewChat={newChat}
                onDeleteConversation={deleteConversation}
                onArchiveConversation={archiveConversation}
                onRestoreConversation={restoreConversation}
                onPinConversation={pinConversation}
                onUnpinConversation={unpinConversation}
                activeConversationId={currentConversationId}
                isCollapsed={false}
                onToggleCollapsed={() => {}}
                onSidebarWidthChange={() => {}}
                showArchivedChats={showArchivedChats}
                onToggleShowArchivedChats={setShowArchivedChats}
                isMobileOpen={isMobileSidebarOpen}
                onCloseMobile={() => setIsMobileSidebarOpen(false)}
              />
            )}
          </div>
        ) : (
          /* DESKTOP VIEWPORT LAYOUT */
          <>
            <ChatWindow
              messages={messages}
              isTyping={isTyping}
              onEditMessage={editMessage}
              onSendSuggestion={sendMessage}
            />
            <ChatInput onSend={sendMessage} />
          </>
        )}

      </div>
      
    </div>
  );
}
