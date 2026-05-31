import React, { useState } from "react";
import Toast from "./Toast";
import { FaCopy, FaEdit, FaThumbsUp, FaThumbsDown } from "react-icons/fa";

// Bot Avatar
const BotAvatar = () => (
  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white shadow-lg flex-shrink-0 border border-purple-500/20 select-none">
    🤖
  </div>
);

export default function MessageBubble({
  message,
  isUser,
  onEditMessage
}) {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(message.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'like' | 'dislike' | null

  const theme = localStorage.getItem("theme") || "dark";
  const content = message.content || "";

  React.useEffect(() => {
    setEditedText(content);
  }, [content]);

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage("Copied to clipboard ✓");
      setShowToast(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editedText.trim()) return;
    setIsSaving(true);
    try {
      await onEditMessage(message.id, editedText);
      setIsEditing(false);
      setToastMessage("Message updated ✓");
      setShowToast(true);
    } catch (error) {
      console.log(error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (dateVal) => {
    if (!dateVal) return "";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className={`flex gap-3 mb-6 items-start w-full transition-all duration-300 ${
      isUser ? "justify-end" : "justify-start"
    }`}>
      
      {/* Bot Avatar on the Left (for AI Message only) */}
      {!isUser && <BotAvatar />}

      {/* Message Content Bubble wrapper */}
      <div className={`max-w-[70%] flex flex-col group relative ${isUser ? "items-end" : "items-start"}`}>
        
        {/* The main bubble container */}
        <div
          className={`rounded-2xl px-4.5 py-3.5 shadow-md relative transition-all duration-300 ${
            isEditing 
              ? "bg-[#070B14] border border-white/10" 
              : isUser
                ? "bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-white rounded-tr-none shadow-purple-500/5 select-text"
                : theme === "dark"
                  ? "bg-[#0F172A]/50 border border-white/5 text-gray-200 rounded-tl-none select-text"
                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm select-text"
          }`}
        >
          {isEditing ? (
            <div className="space-y-3 min-w-[240px]">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="w-full p-3 rounded-xl text-xs border outline-none text-white bg-[#070B14] border-white/5 focus:border-[#7C3AED] resize-none"
                rows={3}
              />
              <div className="flex gap-2 justify-end select-none">
                <button
                  onClick={() => { setIsEditing(false); setEditedText(content); }}
                  className="bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-white text-[10px] font-bold px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Render Attached Files inside Glass Containers */}
              {message.files && message.files.length > 0 && (
                <div className="flex flex-col gap-3 mb-3">
                  {message.files.map((file, idx) => {
                    const fileType = (file.type || file.file_type || "").toLowerCase();
                    const fileUrl = file.preview || file.url || file.file;
                    const fileName = file.name || file.file_name || "Attachment";

                    console.log("Attachment", file);

                    // IMAGE PREVIEW
                    if (fileType.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif"].includes(fileType) || fileType.includes("image")) {
                      return (
                        <div key={idx} className="flex flex-col gap-1.5 select-none max-w-xs">
                          <div className="relative group overflow-hidden rounded-xl border border-white/5 bg-black/10">
                            <img
                              src={file.url || file.file || file.preview}
                              alt={file.name}
                              className="rounded-xl max-w-xs object-cover border border-white/10"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center">
                              <a href={file.url || file.file || file.preview} target="_blank" rel="noreferrer" className="bg-white/20 backdrop-blur px-3 py-1 text-[10px] font-bold rounded-lg text-white">
                                🔍 Open Image
                              </a>
                            </div>
                          </div>
                          <p className="text-xs text-gray-400 mt-2">
                            {file.name}
                          </p>
                        </div>
                      );
                    }

                    // PDF BADGE CARD
                    if (fileType === "pdf" || fileType === "application/pdf") {
                      return (
                        <div key={idx} className={`flex items-center gap-3.5 p-3 rounded-xl border transition max-w-xs select-none ${
                          isUser 
                            ? "bg-white/10 border-white/10" 
                            : "bg-[#070B14]/40 border-white/5"
                        }`}>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-white text-[10px] font-black shadow-md flex-shrink-0">
                            PDF
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${isUser ? "text-white" : "text-gray-200"}`}>{fileName}</p>
                            <p className="text-[9px] opacity-70 mt-0.5">PDF Document</p>
                          </div>
                          <a href={fileUrl} download={fileName} className="p-1.5 bg-black/40 hover:bg-black/60 rounded-lg text-xs text-white" title="Download">
                            📥
                          </a>
                        </div>
                      );
                    }

                    // AUDIO PREVIEW
                    if (["mp3", "wav", "audio/mpeg", "audio/wav", "audio/x-wav"].includes(fileType)) {
                      return (
                        <div key={idx} className={`flex flex-col gap-2 p-3 rounded-xl border max-w-xs select-none ${
                          isUser ? "bg-white/10 border-white/10" : "bg-[#070B14]/40 border-white/5"
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white text-sm flex-shrink-0">
                              🎵
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate text-gray-200">{fileName}</p>
                              <p className="text-[9px] text-gray-400 mt-0.5">Audio Recording</p>
                            </div>
                          </div>
                          <audio controls className="w-full h-8 text-xs mt-1 bg-black/20 rounded-xl border border-white/5">
                            <source src={fileUrl} type="audio/mpeg" />
                          </audio>
                        </div>
                      );
                    }

                    // VIDEO CARD
                    if (["mp4", "mov", "video/mp4", "video/quicktime"].includes(fileType)) {
                      return (
                        <div key={idx} className={`flex flex-col gap-2 p-3 rounded-xl border max-w-sm select-none ${
                          isUser ? "bg-white/10 border-white/10" : "bg-[#070B14]/40 border-white/5"
                        }`}>
                          <div className="flex items-center gap-2.5 mb-0.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-sm flex-shrink-0">
                              🎬
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate text-gray-200">{fileName}</p>
                              <p className="text-[9px] text-gray-400">Video Capture</p>
                            </div>
                          </div>
                          <video controls className="w-full rounded-lg bg-black border border-white/5 max-h-[220px]">
                            <source src={fileUrl} type="video/mp4" />
                          </video>
                        </div>
                      );
                    }

                    // DEFAULT FILE BADGE
                    return (
                      <div key={idx} className={`flex items-center gap-3.5 p-3 rounded-xl border max-w-xs select-none ${
                        isUser ? "bg-white/10 border-white/10" : "bg-[#070B14]/40 border-white/5"
                      }`}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs flex-shrink-0">
                          📄
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate text-gray-200">{fileName}</p>
                          <p className="text-[9px] text-gray-400">Word/Text Document</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Message text */}
              {content && (
                <p className="text-xs font-semibold whitespace-pre-wrap leading-relaxed tracking-wide">
                  {content}
                </p>
              )}
            </>
          )}
        </div>

        {/* Small footer wrapper containing timestamp and actions */}
        <div className={`flex items-center gap-2.5 mt-1.5 text-[9px] text-gray-500 select-none ${
          isUser ? "justify-end pr-1" : "justify-start pl-1"
        }`}>
          {/* Timestamp */}
          <span className="font-bold">{formatTime(message.created_at || message.timestamp)}</span>
          
          {/* Double Checkmark for User bubble */}
          {isUser && (
            <span className="text-[#A855F7] font-extrabold ml-0.5" title="Sent ✓">✓✓</span>
          )}

          {/* Action pills displayed on card hover */}
          {!isEditing && (
            <div className="flex gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
              {isUser && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-[#A855F7] hover:text-[#7C3AED] transition cursor-pointer flex items-center gap-1 font-bold"
                >
                  <FaEdit size={8} />
                  <span>Edit</span>
                </button>
              )}
              <button
                onClick={() => copyToClipboard(content)}
                className="text-gray-400 hover:text-white transition cursor-pointer flex items-center gap-1 font-bold"
              >
                <FaCopy size={8} />
                <span>Copy</span>
              </button>
              
              {/* Thumbs Up / Thumbs Down Actions for AI bubble */}
              {!isUser && (
                <>
                  <button
                    onClick={() => { setFeedback("like"); setToastMessage("Thank you for your feedback! 👍"); setShowToast(true); }}
                    className={`transition cursor-pointer ${feedback === "like" ? "text-purple-400" : "text-gray-400 hover:text-white"}`}
                    title="Helpful response"
                  >
                    <FaThumbsUp size={8} />
                  </button>
                  <button
                    onClick={() => { setFeedback("dislike"); setToastMessage("Logged down detailed response check. 👎"); setShowToast(true); }}
                    className={`transition cursor-pointer ${feedback === "dislike" ? "text-red-400" : "text-gray-400 hover:text-white"}`}
                    title="Not helpful response"
                  >
                    <FaThumbsDown size={8} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      <Toast
        isVisible={showToast}
        message={toastMessage}
        duration={1500}
      />

    </div>
  );
}