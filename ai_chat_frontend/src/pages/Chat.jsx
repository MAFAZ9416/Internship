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
  FaFileAlt,
  FaMusic,
  FaFilm
} from "react-icons/fa";

export default function Chat() {
  const [messages, setMessages] = useState([]);
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
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Voice tab dictation state
  const [transcribedVoiceMsg, setTranscribedVoiceMsg] = useState("");
  const [isVoiceListening, setIsVoiceListening] = useState(false);

  const { user, logout } = useAuth();
  const theme = localStorage.getItem("theme") || "dark";
  const voiceRecognitionRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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
    fetchConversations();
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
        content: `🎵 Transcript:\n\n${response.data.transcript}`,
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
    try {
      setIsTyping(true);
      const response = await api.patch(`/message/${messageId}/edit/`, {
        content: newContent
      });

      const updatedMessage = response.data.message || response.data;

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
    } finally {
      setIsTyping(false);
    }
  };

  const selectConversation = async (id) => {
    setCurrentConversationId(id);
    try {
      const response = await api.get(`/history/${id}/`);
      const formattedMessages = (response.data.messages || []).map((msg) => ({
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
      }));
      setMessages(formattedMessages);
      
      // Automatically focus Chat on mobile
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
        setMessages([]);
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
        setMessages([]);
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
    setMessages([]);
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

    await navigator.clipboard.writeText(
      window.location.href
    );

    alert("Conversation link copied ✓");

  } 
  catch(error){

    console.log(
      "Share error:",
      error
    );

  }

};


// Delete current conversation
const deleteCurrentConversation = async () => {

  if (!currentConversationId) return;

  const confirmDelete =
    window.confirm(
      "Delete this conversation permanently?"
    );

  if(!confirmDelete) return;

  try {

    await deleteConversation(
      currentConversationId
    );

  }
  catch(error){

    console.log(
      "Delete current conversation error:",
      error
    );

  }

};

  // Mobile Files Gallery Extractor
  const mobileUploadedFiles = useMemo(() => {
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
  }, [messages]);

  // Mobile Send Dictation function
  const handleSendMobileVoice = () => {
    if (!transcribedVoiceMsg.trim()) return;
    sendMessage({ message: transcribedVoiceMsg });
    setTranscribedVoiceMsg("");
    setActiveMobileTab("chats");
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
      theme === "dark" ? "bg-[#0A0E27]" : "bg-[#f8fafc]"
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

      {/* Main Chat viewport */}
      <div className="flex-1 flex flex-col relative h-full overflow-hidden">
        
        {/* ================= HEADER BARS (Desktop vs Mobile) ================= */}
        {isMobile ? (
          /* Mobile-only header */
          <header className={`h-14 flex items-center justify-between px-4 border-b select-none ${
            theme === "dark" ? "bg-[#0B1120] border-gray-800/80" : "bg-white border-slate-200 shadow-sm"
          }`}>
            <button
              onClick={() => setIsMobileSidebarOpen(true)}
              className="p-2 text-gray-400 hover:text-white"
            >
              <FaBars size={18} />
            </button>
            <h2 className={`text-sm font-bold truncate max-w-[200px] ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}>
              {activeMobileTab === "chats" ? currentChatTitle : activeMobileTab.toUpperCase()}
            </h2>
            <button
              onClick={newChat}
              className="p-2 text-blue-500 font-black hover:text-blue-400"
              title="New Chat"
            >
              📝
            </button>
          </header>
        ) : (
          /* Desktop-only Glassmorphic Header */
          <header className={`h-16 flex items-center justify-between px-6 border-b z-30 select-none ${
            theme === "dark" ? "bg-[#0B1120]/80 border-gray-800/80 backdrop-blur" : "bg-white/80 border-slate-200/80 backdrop-blur shadow-sm"
          }`}>
            {/* Left elements: title + pin */}
            <div className="flex items-center gap-3">
              {isCollapsed && (
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="p-2 bg-gray-800 text-white rounded-xl hover:bg-gray-700 mr-2 cursor-pointer"
                  title="Show Sidebar"
                >
                  ☰
                </button>
              )}
              <h2 className={`text-base font-bold ${
                theme === "dark" ? "text-white" : "text-slate-950"
              }`}>
                {currentChatTitle}
              </h2>
              {currentConversationId && (
                <button
                  onClick={handleTogglePinCurrent}
                  className={`text-xs ml-1 cursor-pointer transition ${
                    isCurrentChatPinned ? "text-yellow-400" : "text-gray-500 hover:text-gray-300"
                  }`}
                  title={isCurrentChatPinned ? "Unpin chat" : "Pin chat"}
                >
                  <FaStar size={13} />
                </button>
              )}
            </div>

            {/* Right elements: rename, share, delete, ellipsis */}
            {currentConversationId && (
              <div className="flex items-center gap-4 text-gray-400">
                <button
                  onClick={handleRenameCurrent}
                  className="p-2 hover:text-white hover:bg-gray-800/30 rounded-xl transition cursor-pointer"
                  title="Rename Conversation"
                >
                  <FaEdit size={14} />
                </button>
                <button
                  onClick={shareCurrentConversation}
                  className="p-2 hover:text-white hover:bg-gray-800/30 rounded-xl transition cursor-pointer"
                  title="Share Conversation"
                >
                  <FaShareAlt size={14} />
                </button>
                <button
                  onClick={deleteCurrentConversation}
                  className="p-2 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition cursor-pointer"
                  title="Delete Conversation"
                >
                  <FaTrash size={14} />
                </button>
                <button
                  onClick={() => alert("Settings/History configurations.")}
                  className="p-2 hover:text-white hover:bg-gray-800/30 rounded-xl transition cursor-pointer"
                  title="More Options"
                >
                  <FaEllipsisH size={14} />
                </button>
              </div>
            )}
          </header>
        )}

        {/* ================= VIEWPORT BODY (Desktop vs Mobile Tab Switcher) ================= */}
        {isMobile ? (
          /* MOBILE SCENARIOS */
          <div className="flex-1 overflow-hidden flex flex-col bg-transparent">
            {activeMobileTab === "chats" && (
              <>
                <ChatWindow
                  messages={messages}
                  isTyping={isTyping}
                  onEditMessage={editMessage}
                />
                <ChatInput onSend={sendMessage} />
              </>
            )}

            {activeMobileTab === "files" && (
              /* Dedicated Files Browser Tab */
              <div className="flex-1 overflow-y-auto p-4 select-none">
                <h3 className={`text-sm font-bold mb-4 ${theme === "dark" ? "text-gray-300" : "text-slate-800"}`}>
                  Conversation Attachments ({mobileUploadedFiles.length})
                </h3>
                {mobileUploadedFiles.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {mobileUploadedFiles.map((file, index) => (
                      <div key={index} className={`p-3 rounded-xl border flex flex-col justify-between h-28 ${
                        theme === "dark" ? "bg-gray-900/50 border-gray-800 text-white" : "bg-white border-slate-200 text-slate-800 shadow-sm"
                      }`}>
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-500 truncate">{file.sender === "user" ? "Sent by You" : "AI Attachment"}</p>
                          <p className="text-xs font-bold mt-1.5 truncate leading-tight pr-1">{file.name || "Attachment"}</p>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-800/20">
                          <span className="text-[9px] uppercase font-bold text-gray-500">{file.type || file.file_type || "File"}</span>
                          <a
                            href={file.preview || file.url || file.file}
                            download={file.name}
                            className="text-xs text-blue-500 font-bold hover:underline"
                          >
                            Download
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center py-20">
                    <span className="text-4xl mb-3">📁</span>
                    <h4 className="text-sm font-bold text-gray-400">No media attached</h4>
                    <p className="text-xs text-gray-500 mt-1">Upload images, PDFs, or audio to view them here.</p>
                  </div>
                )}
              </div>
            )}

            {activeMobileTab === "voice" && (
              /* Dedicated Voice Input Tab */
              <div className="flex-1 flex flex-col justify-between p-6 select-none">
                <div className="text-center pt-8">
                  <h3 className={`text-lg font-extrabold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                    Speech to Text Transcription
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">Dictate your query in hands-free mode</p>
                </div>

                {/* Glowing mic circle button */}
                <div className="flex justify-center my-8">
                  <button
                    type="button"
                    onClick={toggleMobileVoice}
                    className={`w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-lg ${
                      isVoiceListening 
                        ? "bg-red-500/20 text-red-500 border-2 border-red-500 animate-pulse shadow-red-500/30" 
                        : "bg-blue-600/10 text-blue-500 border-2 border-blue-500/30 hover:border-blue-500 shadow-blue-500/5"
                    }`}
                  >
                    <FaMicrophone size={36} className={isVoiceListening ? "animate-bounce" : ""} />
                    <span className="text-[10px] uppercase tracking-wider font-bold mt-2.5">
                      {isVoiceListening ? "Listening..." : "Tap to Speak"}
                    </span>
                  </button>
                </div>

                {/* Textbox showing results */}
                <div className="flex-1 flex flex-col">
                  <label className="block text-[10px] font-bold text-gray-500 mb-2 uppercase">Transcription Output</label>
                  <textarea
                    value={transcribedVoiceMsg}
                    onChange={(e) => setTranscribedVoiceMsg(e.target.value)}
                    placeholder="Transcribed voice messages appear here..."
                    className={`w-full flex-1 p-4 rounded-2xl border text-sm outline-none resize-none transition ${
                      theme === "dark" 
                        ? "bg-[#111827]/40 border-gray-800 text-white placeholder-gray-600" 
                        : "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 shadow-inner"
                    }`}
                  />
                  
                  <button
                    onClick={handleSendMobileVoice}
                    disabled={!transcribedVoiceMsg.trim()}
                    className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-95 shadow-md shadow-blue-500/10 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Send to AI Assistant
                  </button>
                </div>
              </div>
            )}

            {activeMobileTab === "profile" && (
              /* Dedicated Mobile Profile View */
              <div className="flex-1 overflow-y-auto p-6 select-none flex flex-col justify-between">
                <div className="space-y-6">
                  {/* Avatar & general detail */}
                  <div className="flex flex-col items-center text-center pt-6">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-xl shadow-blue-500/25 mb-4 select-none">
                      {user?.username?.substring(0, 2).toUpperCase() || "AI"}
                    </div>
                    <h3 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      {user?.username || "AI Chat User"}
                    </h3>
                    <p className="text-xs text-gray-500">{user?.email || `${user?.username || "user"}@example.com`}</p>
                  </div>

                  {/* General Mock stats */}
                  <div className={`p-4 rounded-2xl border ${
                    theme === "dark" ? "bg-gray-900/40 border-gray-800/80" : "bg-slate-50 border-slate-200 shadow-sm"
                  }`}>
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-3">Usage Statistics</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-gray-500 block">Total Chats</span>
                        <span className={`text-base font-bold ${theme === "dark" ? "text-white" : "text-slate-800"}`}>
                          {conversations.length}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 block">Archived Chats</span>
                        <span className={`text-base font-bold ${theme === "dark" ? "text-white" : "text-slate-800"}`}>
                          {archivedConversations.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Logout Button */}
                <button
                  onClick={logout}
                  className="w-full mt-8 py-3.5 rounded-xl border border-red-500/20 hover:border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md select-none active:scale-[0.98] duration-100"
                >
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}

            {/* Mobile Bottom Tabs Navigation Bar */}
            <nav className={`h-16 border-t flex items-center justify-around select-none z-40 ${
              theme === "dark" ? "bg-[#0B1120] border-gray-800/80 text-gray-400" : "bg-white border-slate-200 shadow-md text-slate-500"
            }`}>
              <button
                onClick={() => setActiveMobileTab("chats")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
                  activeMobileTab === "chats" ? "text-blue-500 font-bold" : "hover:text-white"
                }`}
              >
                <span className="text-lg">💬</span>
                <span className="text-[9px]">Chats</span>
              </button>
              <button
                onClick={() => setActiveMobileTab("files")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
                  activeMobileTab === "files" ? "text-blue-500 font-bold" : "hover:text-white"
                }`}
              >
                <span className="text-lg">📁</span>
                <span className="text-[9px]">Files</span>
              </button>
              <button
                onClick={() => setActiveMobileTab("voice")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
                  activeMobileTab === "voice" ? "text-blue-500 font-bold" : "hover:text-white"
                }`}
              >
                <span className="text-lg">🎤</span>
                <span className="text-[9px]">Voice</span>
              </button>
              <button
                onClick={() => setActiveMobileTab("profile")}
                className={`flex flex-col items-center gap-1 cursor-pointer transition select-none ${
                  activeMobileTab === "profile" ? "text-blue-500 font-bold" : "hover:text-white"
                }`}
              >
                <span className="text-lg">👤</span>
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
            />
            <ChatInput onSend={sendMessage} />
          </>
        )}

      </div>
      
    </div>
  );
}
