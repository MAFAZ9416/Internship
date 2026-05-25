import React, { useState } from "react";
import Toast from "./Toast";

// Inline Bot Avatar
const BotAvatar = () => (
  <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 select-none animate-pulse flex-shrink-0">
    🤖
  </div>
);

// Inline User Avatar
const UserAvatar = () => (
  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md flex-shrink-0 select-none">
    👤
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

  const theme = localStorage.getItem("theme") || "dark";
  const content = message.content || "";

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

  if(!dateVal){
    return "";
  }

  const d = new Date(dateVal);

  if(isNaN(d.getTime())){
    return "";
  }

  return d.toLocaleTimeString(
    [],
    {
      hour:"2-digit",
      minute:"2-digit"
    }
  );

};

  return (
    <div className={`flex gap-3 mb-6 items-start w-full transition-all duration-300 ${
      isUser ? "justify-end" : "justify-start"
    }`}>
      
      {/* Bot Avatar on the Left (for AI Message) */}
      {!isUser && <BotAvatar />}

      {/* Message Bubble box wrapper */}
      <div className={`max-w-[75%] flex flex-col group`}>
        
        {/* The main card shape */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-md relative transition-all duration-300 ${
            isEditing 
              ? "bg-[#0b0e24] border border-gray-800" 
              : isUser
                ? "bg-gradient-to-br from-blue-600 to-[#7c5cff] text-white rounded-tr-none border border-blue-500/20"
                : theme === "dark"
                  ? "bg-[#0d1a2f]/80 border-l-4 border-l-cyan-400 border border-cyan-400/10 text-gray-200 drop-shadow-[0_0_8px_rgba(34,211,238,0.03)]"
                  : "bg-white border-l-4 border-l-cyan-500 border border-slate-200 text-slate-800 shadow-sm"
          }`}
        >
          {isEditing ? (
            <div className="space-y-3 min-w-[240px]">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className={`w-full p-2.5 rounded-xl text-sm border outline-none text-white bg-[#030514] border-gray-800 focus:border-purple-500`}
                rows={3}
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-800/80 hover:bg-gray-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Render Attached Files if present */}
              {message.files && message.files.length > 0 && (
                <div className="flex flex-col gap-3 mb-3.5">
                  {message.files.map((file, idx) => {
                    const fileType = (file.type || file.file_type || "").toLowerCase();
                    const fileUrl = file.preview || file.url || file.file;
                    const fileName = file.name || file.file_name || "Attachment";

                    // IMAGE PREVIEW
                    if (["png", "jpg", "jpeg", "webp", "gif"].includes(fileType) || fileType.startsWith("image/")) {
                      return (
                        <div key={idx} className="relative group overflow-hidden rounded-xl border border-gray-700/50 bg-black/10 max-w-sm">
                          <img
                            src={fileUrl}
                            alt={fileName}
                            className="rounded-lg max-w-full max-h-[220px] object-cover transition-transform duration-200 group-hover:scale-102"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition duration-150 flex items-center justify-center">
                            <a href={fileUrl} target="_blank" rel="noreferrer" className="bg-white/20 backdrop-blur px-3 py-1 text-[10px] font-bold rounded-lg text-white">
                              🔍 Open Image
                            </a>
                          </div>
                        </div>
                      );
                    }

                    // PDF CARD
                    if (fileType === "pdf" || fileType === "application/pdf") {
                      return (
                        <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition max-w-xs ${
                          isUser 
                            ? "bg-white/10 border-white/20" 
                            : "bg-gradient-to-r from-red-500/10 to-pink-500/10 border-red-500/20"
                        }`}>
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-red-500 flex items-center justify-center text-white text-[10px] font-black shadow-md flex-shrink-0 select-none">
                            PDF
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${isUser ? "text-white" : "text-gray-200"}`}>{fileName}</p>
                            <p className="text-[9px] opacity-70 mt-0.5">PDF Document • Attachment</p>
                          </div>
                          <a href={fileUrl} download={fileName} className="p-1.5 bg-gray-900/60 hover:bg-gray-800 rounded-lg text-xs text-white" title="Download file">
                            📥
                          </a>
                        </div>
                      );
                    }

                    // AUDIO PREVIEW CARD
                    if (["mp3", "wav", "audio/mpeg", "audio/wav", "audio/x-wav"].includes(fileType)) {
                      return (
                        <div key={idx} className={`flex flex-col gap-2 p-3 rounded-xl border max-w-xs ${
                          isUser ? "bg-white/10 border-white/20" : "bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-yellow-500/20"
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
                          <audio controls className="w-full h-8 text-xs mt-1 bg-gray-900/40 rounded-xl border border-gray-700/30">
                            <source src={fileUrl} type="audio/mpeg" />
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                      );
                    }

                    // VIDEO CARD PLAYER
                    if (["mp4", "mov", "video/mp4", "video/quicktime"].includes(fileType)) {
                      return (
                        <div key={idx} className={`flex flex-col gap-2 p-3 rounded-xl border max-w-sm ${
                          isUser ? "bg-white/10 border-white/20" : "bg-gradient-to-r from-red-500/10 to-indigo-500/10 border-red-500/20"
                        }`}>
                          <div className="flex items-center gap-2.5 mb-0.5">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center text-white text-sm flex-shrink-0">
                              🎬
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold truncate text-gray-200">{fileName}</p>
                              <p className="text-[9px] text-gray-400">Video Capture</p>
                            </div>
                          </div>
                          <video controls className="w-full rounded-lg bg-black border border-gray-800 max-h-[220px]">
                            <source src={fileUrl} type="video/mp4" />
                            Your browser does not support the video element.
                          </video>
                        </div>
                      );
                    }

                    // DEFAULT CARD PREVIEW (TEXT, DOCX, ETC)
                    return (
                      <div key={idx} className={`flex items-center gap-3.5 p-3 rounded-xl border max-w-xs ${
                        isUser ? "bg-white/10 border-white/20" : "bg-gray-800/40 border-gray-700/80"
                      }`}>
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm flex-shrink-0">
                          📄
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold truncate text-gray-200">{fileName}</p>
                          <p className="text-[9px] text-gray-400">{fileType === "docx" ? "Word Document" : "Attachment"}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Text content rendered with rich breaks */}
              {content && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed tracking-wide select-text">
                  {content}
                </p>
              )}
            </>
          )}
        </div>

        {/* Small details footer below bubble card */}
        <div className={`flex items-center gap-2 mt-1.5 text-[10px] text-gray-500 select-none ${
          isUser ? "justify-end pr-1" : "justify-start pl-1"
        }`}>
          {/* Timestamp */}
          <span>
{
formatTime(
message.created_at
)
}
</span>
          
          {/* Micro Edit + Copy options displayed beautifully on hover or inline */}
          {!isEditing && (
            <div className="flex gap-2.5 items-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 ml-2">
              {isUser && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-purple-400 hover:text-purple-300 font-medium cursor-pointer"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => copyToClipboard(content)}
                className="text-gray-400 hover:text-white font-medium cursor-pointer"
              >
                Copy
              </button>
            </div>
          )}
          
          {/* Double Checkmark indicators for User messages */}
          {isUser && (
            <span className="text-purple-400 font-bold ml-1" title="Sent ✓">✓✓</span>
          )}
        </div>

      </div>

      {/* User Avatar on the Right (for User Message) */}
      {isUser && <UserAvatar />}

      {/* Toast feedback alerts */}
      <Toast
        isVisible={showToast}
        message={toastMessage}
        duration={1500}
      />

    </div>
  );
}