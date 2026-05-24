import React, { useState } from "react";
import Toast from "./Toast";

export default function MessageBubble({
  message,
  isUser,
  onEditMessage
}) {

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(
    message.content || message.message || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const content = message.content || message.message || "No message";

  const hasCodeBlock = /```[\s\S]*?```/g.test(content);

  const extractCodeBlock = () => {
    const match = content.match(/```([\s\S]*?)```/);
    return match ? match[1].trim() : "";
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setToastMessage("Copied ✓");
      setShowToast(true);
    } catch (error) {
      console.log(error);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedText(content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText(content);
  };

  const handleSaveEdit = async () => {
    if (!editedText.trim()) return;
    if (editedText === content) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onEditMessage(message.id, editedText);
      setIsEditing(false);
      setToastMessage("Message edited & regenerated ✓");
      setShowToast(true);
    } catch (error) {
      console.log("Edit error:", error);
      setToastMessage("Failed to edit message");
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`
        flex
        ${isUser ? "justify-end" : "justify-start"}
        mb-4
        animate-fadeIn
      `}
    >
      <div
        className={`
          flex
          gap-3
          max-w-[80%]
          ${isUser ? "flex-row-reverse" : "flex-row"}
        `}
      >
        {/* Avatar */}
        <div
          className="
            flex-shrink-0
            w-8
            h-8
            rounded-full
            flex
            items-center
            justify-center
            text-xs
            font-bold
            mt-1
          "
          style={{
            background: isUser
              ? "linear-gradient(135deg,#4F7CFF,#7C3AED)"
              : "linear-gradient(135deg,#7C3AED,#06B6D4)"
          }}
        >
          {isUser ? "U" : "AI"}
        </div>

        {/* Bubble */}
        <div
          className="
            rounded-2xl
            px-4
            py-3
            text-sm
            leading-relaxed
            break-words
            overflow-hidden
            max-w-full
            relative
            group
          "
          style={{
            background: isUser ? "#1E3A8A" : "#111827",
            border: isUser
              ? "1px solid rgba(79,124,255,0.2)"
              : "1px solid rgba(255,255,255,0.08)",
            borderTopRightRadius: isUser ? "4px" : "16px",
            borderTopLeftRadius: isUser ? "16px" : "4px",
            color: "#ffffff"
          }}
        >
          {/* Edit Mode */}
          {isEditing && isUser ? (
            <div className="flex flex-col gap-2">
              <textarea
                value={editedText}
                onChange={(e) => setEditedText(e.target.value)}
                className="
                  bg-[#0B1120]
                  border
                  border-blue-500
                  rounded
                  p-2
                  text-white
                  text-sm
                  resize-none
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-400
                "
                rows="3"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="
                    px-3
                    py-1
                    text-xs
                    rounded
                    bg-gray-600
                    hover:bg-gray-700
                    disabled:opacity-50
                    transition
                  "
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="
                    px-3
                    py-1
                    text-xs
                    rounded
                    bg-blue-600
                    hover:bg-blue-700
                    disabled:opacity-50
                    transition
                  "
                >
                  {isSaving ? "Saving..." : "Save & Regenerate"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Text */}
              <p className="whitespace-pre-wrap break-words mb-2">
                {content}
              </p>

              {/* Edited Label */}
              {message.edited_at && (
                <div className="text-xs text-gray-400 italic mb-2">
                  (edited)
                </div>
              )}

              {/* Files */}
              {message.files?.length > 0 && (
                <div className="flex flex-col gap-3 mt-2">
                  {message.files.map((file, index) => (
                    <div
                      key={index}
                      className="
                        bg-[#1E293B]
                        rounded-lg
                        p-3
                        border
                        border-gray-700
                      "
                    >
                      {/* Image */}
                      {file.preview && file.type.startsWith("image/") && (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="
                            rounded-lg
                            max-w-[250px]
                            max-h-[250px]
                            object-cover
                            mb-2
                          "
                        />
                      )}

                      {/* Video */}
                      {file.type.startsWith("video/") && (
                        <div>🎬 {file.name}</div>
                      )}

                      {/* Audio */}
                      {file.type.startsWith("audio/") && (
                        <div>🎵 {file.name}</div>
                      )}

                      {/* Document */}
                      {!file.type.startsWith("image/") &&
                        !file.type.startsWith("audio/") &&
                        !file.type.startsWith("video/") && (
                          <div>📄 {file.name}</div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {/* Time */}
              <span
                className="
                  block
                  text-xs
                  mt-2
                  opacity-50
                "
              >
                {message.timestamp
                  ? new Date(message.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit"
                    })
                  : ""}
              </span>

              {/* Action Buttons */}
              <div
                className="
                  flex
                  gap-2
                  mt-2
                  opacity-0
                  group-hover:opacity-100
                  transition
                  flex-wrap
                "
              >
                {/* Edit Button - Only for User Messages */}
                {isUser && (
                  <button
                    onClick={handleEditClick}
                    className="
                      text-xs
                      bg-purple-600
                      hover:bg-purple-700
                      text-white
                      px-2
                      py-1
                      rounded
                      transition
                    "
                    title="Edit message"
                  >
                    ✏️ Edit
                  </button>
                )}

                {/* Copy Code Button */}
                {hasCodeBlock && (
                  <button
                    onClick={() => copyToClipboard(extractCodeBlock())}
                    className="
                      text-xs
                      bg-blue-600
                      hover:bg-blue-700
                      text-white
                      px-2
                      py-1
                      rounded
                      transition
                    "
                  >
                    📋 Copy Code
                  </button>
                )}

                {/* Copy Button */}
                <button
                  onClick={() => copyToClipboard(content)}
                  className="
                    text-xs
                    bg-gray-600
                    hover:bg-gray-700
                    text-white
                    px-2
                    py-1
                    rounded
                    transition
                  "
                >
                  📋 Copy
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <Toast isVisible={showToast} message={toastMessage} duration={1500} />
    </div>
  );
}