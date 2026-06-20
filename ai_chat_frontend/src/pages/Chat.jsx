import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import api, { apiMethods, API_HOST } from "../services/api";
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
  const [showSelectorMenu, setShowSelectorMenu] = useState(false);

  // Voice tab dictation state
  const [transcribedVoiceMsg, setTranscribedVoiceMsg] = useState("");
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  const { user, logout } = useAuth();

  const getAbsoluteUrl = (filePath) => {
    if (!filePath) return filePath;
    if (filePath.startsWith("http")) return filePath;
    return `${API_HOST.replace(/\/$/, "")}${filePath.startsWith("/") ? "" : "/"}${filePath}`;
  };

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

    rec.onstart = () => {
      setIsVoiceListening(true);
    };

    rec.onend = () => {
      setIsVoiceListening(false);
    };

    rec.onerror = (err) => {
      console.log('Voice recognition error:', err);
      setIsVoiceListening(false);
    };

    voiceRecognitionRef.current = rec;
  }, []);

  const toggleMobileVoice = () => {
    if (!voiceRecognitionRef.current) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    try {
      if (isVoiceListening) {
        voiceRecognitionRef.current.stop();
        setIsVoiceListening(false);
      } else {
        voiceRecognitionRef.current.start();
        setIsVoiceListening(true);
      }
    } catch (err) {
      console.log('toggleMobileVoice error:', err);
      setIsVoiceListening(false);
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
      const response = await api.get("history/");
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

      const response = await api.post("", payload);
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

        await api.post("upload/", formData, {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            if (data.onProgress) {
              files.forEach((file) => {
                data.onProgress(file.name, percentCompleted);
              });
            }
          }
        });
        await selectConversation(conversationId);
      }

      /* AI message */
      const aiMessage = {
        id: response.data.ai_message_id || Date.now() + 1,
        role: "assistant",
        content: response.data.response || "No response",
        timestamp: new Date(),
        isNew: true
      };

      setMessages((prev) => {
        const updated = prev.map((msg) => {
          if (msg.id === userMessage.id) {
            return {
              ...msg,
              id: response.data.message_id || msg.id
            };
          }
          return msg;
        });
        return [...updated, aiMessage];
      });
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
        const response = await api.post("", payload);
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
        timestamp: new Date(),
        isNew: true
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
        const response = await api.post("", payload);
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
        timestamp: new Date(),
        isNew: true
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
    // Prevent editing if message hasn't received a DB ID yet (timestamp ID)
    if (typeof messageId === 'number' && messageId > 1000000000000) {
      alert("Please wait for the message to finish sending before editing.");
      return;
    }

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
      const response = await api.patch(`message/${messageId}/edit/`, {
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
        const refreshed = await api.get(`history/${currentConversationId}/`);
        const formattedMessages = (refreshed.data.messages || []).map(
          (msg) => ({
            ...msg,
            files:
              msg.files?.map((file) => {
                const fileUrl = getAbsoluteUrl(file.file || file.url || file.preview);
                return {
                  id: file.id,
                  name: file.file_name || file.name,
                  type: file.file_type || file.type,
                  preview: fileUrl,
                  url: fileUrl,
                  size: file.file_size_display || file.size
                };
              }) || []
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

  const deleteMessage = async (messageId) => {
    // Prevent deleting if message hasn't received a DB ID yet
    if (typeof messageId === 'number' && messageId > 1000000000000) {
      alert("Please wait for the message to finish sending before deleting.");
      return;
    }

    if (!confirm("Are you sure you want to delete this message?")) return;
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    try {
      await api.delete(`history/messages/${messageId}/`);
    } catch (e) {
      console.log("Backend message delete:", e);
    }
  };

  const regenerateMessage = async (messageId) => {
    // Prevent regenerating if message hasn't received a DB ID yet
    if (typeof messageId === 'number' && messageId > 1000000000000) {
      alert("Please wait for the message to finish sending before regenerating.");
      return;
    }

    const index = messages.findIndex(msg => msg.id === messageId);
    if (index === -1) return;

    let userPromptMsg = null;
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].role === "user") {
        userPromptMsg = messages[i];
        break;
      }
    }

    if (!userPromptMsg) {
      alert("Could not locate original prompt for regeneration.");
      return;
    }

    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    await sendMessage({ message: userPromptMsg.content });
  };

  const selectConversation = async (id) => {
    setCurrentConversationId(id);
    localStorage.setItem("currentConversationId", id);
    try {
      const response = await api.get(`history/${id}/`);
      const formattedMessages = (response.data.messages || []).map(
        (msg) => ({
          ...msg,
          files:
            msg.files?.map((file) => {
              const fileUrl = getAbsoluteUrl(file.file || file.url || file.preview);
              return {
                id: file.id,
                name: file.file_name || file.name,
                type: file.file_type || file.type,
                preview: fileUrl || file.preview,
                url: fileUrl,
                size: file.file_size_display || file.size
              };
            }) || []
        })
      );
      setMessages(formattedMessages);
      setUploadedFiles(response.data.uploaded_files || []);
      
      // Focus Chats on mobile
      if (isMobile) {
        setActiveMobileTab("chats");
      }
    } catch (error) {
      console.log("Fetch conversation error:", error);
      if (error.response && error.response.status === 404) {
        setCurrentConversationId(null);
        localStorage.removeItem("currentConversationId");
        setMessages([]);
        setUploadedFiles([]);
      }
    }
  };

  const deleteConversation = async (id) => {
    if (!confirm("Are you sure you want to delete this chat permanently?")) return;
    try {
      await api.delete(`history/${id}/delete/`);
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
      await api.post(`history/${id}/archive/`);
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
      await api.post(`history/${id}/restore/`);
      fetchConversations();
    } catch (error) {
      console.log("Restore error:", error);
    }
  };

  const pinConversation = async (id) => {
    try {
      await api.post(`history/${id}/pin/`);
      fetchConversations();
    } catch (error) {
      console.log("Pin error:", error);
    }
  };

  const unpinConversation = async (id) => {
    try {
      await api.post(`history/${id}/unpin/`);
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

  const renameConversation = async (id) => {
    const activeChat = conversations.find((c) => c.id === id) || archivedConversations.find((c) => c.id === id);
    const currentTitle = activeChat ? activeChat.title : "";
    const newName = prompt("Rename conversation to:", currentTitle);
    if (!newName?.trim() || newName === currentTitle) return;
    try {
      await api.patch(`history/${id}/rename/`, {
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
        onRenameConversation={renameConversation}
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
          <header className={`h-16 flex items-center justify-between px-4 border-b select-none z-30 flex-shrink-0 sticky top-0 ${
            theme === "dark" ? "bg-[#070B14] border-white/5 text-white" : "bg-white border-slate-200 text-slate-800 shadow-sm"
          }`}>
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className={`p-2 transition cursor-pointer rounded-lg hover:bg-white/5 ${
                theme === "dark" ? "text-white hover:text-purple-400" : "text-slate-800 hover:text-purple-600"
              }`}
            >
              <FaBars size={16} />
            </button>
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#A855F7] fill-current" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2l2.4 7.2 7.2 2.4-7.2 2.4-2.4 7.2-2.4-7.2-7.2-2.4 7.2-2.4Z"/>
              </svg>
              <span className="text-sm font-extrabold tracking-tight">
                AI Chat
              </span>
            </div>
            <div className="flex gap-1.5 items-center">
              <button
                onClick={() => setIsMobileSidebarOpen(true)}
                className={`p-2 transition cursor-pointer rounded-lg hover:bg-white/5 ${
                  theme === "dark" ? "text-white" : "text-slate-600 hover:text-slate-800"
                }`}
                title="Search Chats"
              >
                <FaSearch size={12} />
              </button>
              <button
                onClick={() => {
                  newChat();
                  setCurrentConversationId(null);
                }}
                className="w-8 h-8 rounded-lg bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center cursor-pointer transition font-bold shadow-md shadow-purple-500/10 text-xs active:scale-95 duration-100"
                title="New Chat"
              >
                ➕
              </button>
                <button
                  onClick={toggleTheme}
                  className={`p-2 transition cursor-pointer rounded-lg hover:bg-white/5 ${
                    theme === "dark" ? "text-white" : "text-slate-800"
                  }`}
                  title="Toggle theme"
                >
                  {theme === "dark" ? "🌙" : "☀️"}
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
                  className={`p-2 border rounded-xl mr-2 cursor-pointer transition-colors ${
                    theme === "dark"
                      ? "bg-white/5 border-white/5 text-white hover:bg-white/10"
                      : "bg-slate-100 border-slate-200 text-[#1E293B] hover:bg-slate-200"
                  }`}
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
          /* MOBILE REDESIGNED CHAT VIEWPORT */
          <div className="flex-1 overflow-hidden flex flex-col bg-transparent relative pb-[72px]">
            
            {/* If no conversation is active and no messages: show Welcome Screen inside main chat container */}
            {!currentConversationId && messages.length === 0 ? (
              <div className="flex-1 overflow-y-auto">
                <ChatWindow
                  messages={messages}
                  isTyping={isTyping}
                  onEditMessage={() => {}}
                  onSendSuggestion={sendMessage}
                />
              </div>
            ) : (
              /* If conversation is active or starting: show premium top selector card, messages, and input */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Premium Mobile Conversation Selector Card */}
                <div className="p-3.5 flex-shrink-0">
                  <div className={`p-3 rounded-2xl border flex items-center justify-between shadow-md ${
                    theme === "dark" ? "bg-[#0F172A]/85 border-white/10 text-white" : "bg-white border-slate-200 text-slate-800"
                  }`}>
                    <div 
                      className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                      onClick={() => setIsMobileSidebarOpen(true)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center flex-shrink-0 font-black text-xs select-none">
                        📄
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate flex items-center gap-1.5">
                          <span>{currentChatTitle || "Conversation"}</span>
                          <FaChevronDown size={8} className="text-gray-400 flex-shrink-0" />
                        </p>
                        <p className="text-[8px] text-gray-500 font-extrabold uppercase tracking-widest mt-0.5">
                          Tap to open drawer
                        </p>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowSelectorMenu(!showSelectorMenu);
                        }}
                        className="p-2 text-gray-400 hover:text-white transition cursor-pointer"
                      >
                        <FaEllipsisH size={12} />
                      </button>

                      {showSelectorMenu && (
                        <div
                          className={`absolute right-0 top-8 rounded-xl border shadow-xl z-50 p-1 flex flex-col w-36 ${
                            theme === "dark"
                              ? "bg-[#0F172A] border-white/10 text-white animate-fade-in"
                              : "bg-white border-slate-200 text-slate-800 animate-fade-in"
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setShowSelectorMenu(false);
                              setCurrentConversationId(null);
                            }}
                            className="text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/5 transition cursor-pointer"
                          >
                            ← Back to Chats
                          </button>
                          <button
                            onClick={() => {
                              setShowSelectorMenu(false);
                              handleRenameCurrent();
                            }}
                            className="text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/5 transition cursor-pointer"
                          >
                            Rename Chat
                          </button>
                          <button
                            onClick={() => {
                              setShowSelectorMenu(false);
                              handleTogglePinCurrent();
                            }}
                            className="text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/5 transition cursor-pointer"
                          >
                            {isCurrentChatPinned ? "Unpin Chat" : "Pin Chat"}
                          </button>
                          <button
                            onClick={() => {
                              setShowSelectorMenu(false);
                              archiveConversation(currentConversationId);
                              setCurrentConversationId(null);
                            }}
                            className="text-left px-2.5 py-1.5 text-[10px] font-bold rounded-lg hover:bg-white/5 transition cursor-pointer"
                          >
                            Archive Chat
                          </button>
                          <button
                            onClick={() => {
                              setShowSelectorMenu(false);
                              deleteCurrentConversation();
                            }}
                            className="text-left px-2.5 py-1.5 text-[10px] font-bold text-red-400 rounded-lg hover:bg-red-500/10 transition cursor-pointer"
                          >
                            Delete Chat
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Message display area */}
                <div className="flex-1 overflow-hidden flex flex-col">
                  <ChatWindow
                    messages={messages}
                    isTyping={isTyping}
                    onEditMessage={editMessage}
                    onSendSuggestion={sendMessage}
                    onDeleteMessage={deleteMessage}
                    onRegenerateMessage={regenerateMessage}
                  />
                </div>
              </div>
            )}

            {/* ChatInput: rendered ALWAYS at bottom for mobile view when conversation is active or welcome suggestion is selected */}
            <ChatInput onSend={sendMessage} />

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
                 onRenameConversation={renameConversation}
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
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="w-full h-full flex flex-col items-center">
              <div className="w-full max-w-5xl h-full flex flex-col">
                <ChatWindow
                  messages={messages}
                  isTyping={isTyping}
                  onEditMessage={editMessage}
                  onSendSuggestion={sendMessage}
                  onDeleteMessage={deleteMessage}
                  onRegenerateMessage={regenerateMessage}
                />
                <ChatInput onSend={sendMessage} />
              </div>
            </div>
          </div>
        )}

      </div>
      
    </div>
  );
}
