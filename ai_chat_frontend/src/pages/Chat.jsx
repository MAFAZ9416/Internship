import { useState, useEffect, useCallback } from "react";
import api, { apiMethods } from "../services/api";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [archivedConversations, setArchivedConversations] = useState([]);

  const [currentConversationId, setCurrentConversationId] = useState(null);

  const [isTyping, setIsTyping] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [sidebarWidth, setSidebarWidth] = useState(280);

  const [showArchivedChats, setShowArchivedChats] = useState(false);

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
      // Create new conversation first
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

      // Add transcript and AI response
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
      // Create new conversation first
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

      // Add video info and AI response
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

      /* update UI instantly */
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

      /* refresh AI response */
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
    } catch (error) {
      console.log("Fetch conversation error:", error);
    }
  };

  const deleteConversation = async (id) => {
    if (!confirm("Are you sure?")) return;

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

  // Pin conversation
  const pinConversation = async (id) => {
    try {
      await api.post(`/history/${id}/pin/`);
      fetchConversations();
    } catch (error) {
      console.log("Pin error:", error);
    }
  };

  // Unpin conversation
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

  return (
    <div className="flex h-screen bg-[#0A0E27]">
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

      <div className="flex-1 flex flex-col relative">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`
            ${isCollapsed ? "block" : "hidden md:hidden"}
            absolute
            top-4
            left-4
            z-50
            text-white
            text-2xl
            bg-[#111827]
            px-3
            py-1
            rounded-lg
            hover:bg-[#1E293B]
          `}
          title="Toggle sidebar"
        >
          ☰
        </button>

        <ChatWindow
          messages={messages}
          isTyping={isTyping}
          onEditMessage={editMessage}
        />

        <ChatInput onSend={sendMessage} />
      </div>
    </div>
  );
}
