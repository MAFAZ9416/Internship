import { useState, useRef, useEffect } from "react";
import FileUploadPreview from "./FileUploadPreview";
import { FaMicrophone, FaMusic, FaFilm } from "react-icons/fa";

export default function ChatInput({ onSend }) {
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [audioFile, setAudioFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [fileError, setFileError] = useState("");
  const [isListening, setIsListening] = useState(false);

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const theme = localStorage.getItem("theme") || "dark";

  /* Speech Recognition Setup */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setMessage(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleSpeech = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in your current browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB

  const allowedTypes = [
    "application/pdf",
    "text/plain",
    "image/png",
    "image/jpeg",
    "image/webp",
    "audio/mpeg",
    "audio/wav",
    "audio/x-wav",
    "video/mp4",
    "video/quicktime"
  ];

  const simulateProgress = (files) => {
    files.forEach((file) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress((prev) => ({
          ...prev,
          [file.name]: progress
        }));
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 150);
    });
  };

  const validateFiles = (files) => {
    const valid = [];
    setFileError("");

    for (const file of files) {
      if (!allowedTypes.includes(file.type) && !file.name.endsWith(".docx")) {
        setFileError(`${file.name} is not supported.`);
        continue;
      }

      if (file.type.startsWith("audio/")) {
        if (file.size > MAX_AUDIO_SIZE) {
          setFileError(`${file.name} exceeds the 25MB audio limit.`);
          continue;
        }
      } else if (file.type.startsWith("video/")) {
        if (file.size > MAX_VIDEO_SIZE) {
          setFileError(`${file.name} exceeds the 100MB video limit.`);
          continue;
        }
      } else {
        if (file.size > MAX_FILE_SIZE) {
          setFileError(`${file.name} exceeds the 10MB file limit.`);
          continue;
        }
      }
      valid.push(file);
    }
    return valid;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = validateFiles(files);

    if (validFiles.length) {
      const audio = validFiles.find((f) => f.type.startsWith("audio/"));
      const video = validFiles.find((f) => f.type.startsWith("video/"));
      const regular = validFiles.filter(
        (f) => !f.type.startsWith("audio/") && !f.type.startsWith("video/")
      );

      if (audio) {
        setAudioFile(audio);
        setMessage("");
      } else if (video) {
        setVideoFile(video);
        setMessage("");
      } else {
        setSelectedFiles((prev) => [...prev, ...regular]);
        simulateProgress(regular);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const files = validateFiles(Array.from(e.dataTransfer.files));
    if (files.length) {
      const audio = files.find((f) => f.type.startsWith("audio/"));
      const video = files.find((f) => f.type.startsWith("video/"));
      const regular = files.filter(
        (f) => !f.type.startsWith("audio/") && !f.type.startsWith("video/")
      );

      if (audio) {
        setAudioFile(audio);
        setMessage("");
      } else if (video) {
        setVideoFile(video);
        setMessage("");
      } else {
        setSelectedFiles((prev) => [...prev, ...regular]);
        simulateProgress(regular);
      }
    }
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAudio = () => setAudioFile(null);
  const handleRemoveVideo = () => setVideoFile(null);

  const handleUploadType = (type) => {
    let accept = "*";
    switch (type) {
      case "image":
        accept = "image/*";
        break;
      case "document":
        accept = "application/pdf,.docx,text/plain";
        break;
      case "audio":
        accept = "audio/mpeg,audio/wav,audio/x-wav,.mp3,.wav";
        break;
      case "video":
        accept = "video/mp4,video/quicktime,.mp4,.mov";
        break;
      case "all":
        accept = "image/*,application/pdf,.docx,text/plain,audio/mpeg,audio/wav,audio/x-wav,video/mp4,video/quicktime,.mp3,.wav,.mp4,.mov";
        break;
    }
    fileInputRef.current.accept = accept;
    fileInputRef.current.click();
    setShowUploadMenu(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() && selectedFiles.length === 0 && !audioFile && !videoFile)
      return;

    if (audioFile) {
      onSend({ message, audioFile });
      setMessage("");
      setAudioFile(null);
    } else if (videoFile) {
      onSend({ message, videoFile });
      setMessage("");
      setVideoFile(null);
    } else {
      onSend({ message, files: selectedFiles });
      setMessage("");
      setSelectedFiles([]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="w-full"
    >
      <div className="w-full p-4 md:p-6">
        {/* Drag & drop overlay */}
        {isDragging && (
          <div className="absolute inset-0 rounded-3xl bg-[#7C3AED]/10 backdrop-blur-xs flex items-center justify-center text-[#A855F7] font-bold border-2 border-dashed border-[#7C3AED] z-50">
            📥 Drop files to upload
          </div>
        )}

        {/* Upload File Progress & Previews */}
        {/* Upload File Progress & Previews */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 px-2 flex flex-col gap-2">
            {/* Image Previews */}
            {selectedFiles.filter(f => f.type.startsWith("image/")).length > 0 && (
              <div className="flex flex-wrap gap-3 mb-2 p-3 bg-[#0F172A] rounded-xl border border-white/5 shadow-md">
                {selectedFiles.filter(f => f.type.startsWith("image/")).map((file, idx) => {
                  const previewUrl = URL.createObjectURL(file);
                  return (
                    <div key={idx} className="relative group rounded-xl overflow-hidden border border-white/10 bg-[#070B14] w-24 h-24">
                      <img
                        src={previewUrl}
                        alt={file.name}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const realIdx = selectedFiles.indexOf(file);
                          if (realIdx !== -1) handleRemoveFile(realIdx);
                        }}
                        className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center text-xs font-bold transition cursor-pointer"
                        title="Remove image"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Non-Image Files */}
            {selectedFiles.filter(f => !f.type.startsWith("image/")).length > 0 && (
              <FileUploadPreview
                files={selectedFiles.filter(f => !f.type.startsWith("image/"))}
                uploadProgress={uploadProgress}
                onRemoveFile={(idx) => {
                  const nonImageFiles = selectedFiles.filter(f => !f.type.startsWith("image/"));
                  const target = nonImageFiles[idx];
                  const realIdx = selectedFiles.indexOf(target);
                  if (realIdx !== -1) handleRemoveFile(realIdx);
                }}
              />
            )}
          </div>
        )}

        {/* Audio upload preview badge */}
        {audioFile && (
          <div className="mb-3 p-3 bg-[#0F172A] rounded-xl border border-white/5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <FaMusic size={13} className="text-yellow-500" />
              <div className="min-w-0">
                <p className="text-xs text-white font-bold">🎵 Audio Attached</p>
                <p className="text-[10px] text-gray-400 truncate">{audioFile.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveAudio}
              className="text-red-400 hover:text-red-300 text-sm font-semibold p-1 hover:bg-white/5 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Video upload preview badge */}
        {videoFile && (
          <div className="mb-3 p-3 bg-[#0F172A] rounded-xl border border-white/5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <FaFilm size={13} className="text-purple-400" />
              <div className="min-w-0">
                <p className="text-xs text-white font-bold">🎬 Video Attached</p>
                <p className="text-[10px] text-gray-400 truncate">{videoFile.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveVideo}
              className="text-red-400 hover:text-red-300 text-sm font-semibold p-1 hover:bg-white/5 rounded-lg cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Size/Type Error message */}
        {fileError && (
          <div className="mb-3 p-2.5 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2 animate-bounce">
            <span>⚠️</span>
            <span>{fileError}</span>
          </div>
        )}

        {/* The FLOATING Pill Input Tray */}
        <div className={`p-2 rounded-2xl border shadow-xl backdrop-blur-md w-full flex items-center justify-center ${
          theme === "dark" 
            ? "bg-[#0F172A]/70 border-white/5 shadow-purple-500/5" 
            : "bg-white/95 border-slate-200 shadow-slate-200/40"
        }`}>
          <form onSubmit={handleSubmit} className="w-full flex items-center gap-3">
            {/* Attachment Button inside dark circle */}
            <div className="relative flex-shrink-0 w-10 h-10">
              <button
                type="button"
                onClick={() => setShowUploadMenu(!showUploadMenu)}
                className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition cursor-pointer select-none text-base ${
                  theme === "dark" 
                    ? "bg-[#070B14] border border-white/5 text-gray-300 hover:bg-white/5" 
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
                title="Attach media or document files"
              >
                📎
              </button>

              {/* Upload Dropdown Menu */}
              {showUploadMenu && (
                <div
                  className={`absolute bottom-12 left-0 rounded-2xl border overflow-hidden w-48 shadow-xl z-50 p-1 flex flex-col ${
                    theme === "dark"
                      ? "bg-[#0F172A] border-white/5 text-white"
                      : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleUploadType("image")}
                    className="text-left px-3.5 py-2 text-xs font-semibold rounded-xl hover:bg-white/5 transition cursor-pointer"
                  >
                    🖼️ Image Attachment
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUploadType("document")}
                    className="text-left px-3.5 py-2 text-xs font-semibold rounded-xl hover:bg-white/5 transition cursor-pointer"
                  >
                    📄 Document / PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUploadType("audio")}
                    className="text-left px-3.5 py-2 text-xs font-semibold rounded-xl hover:bg-white/5 transition cursor-pointer"
                  >
                    🎵 Audio (mp3, wav)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUploadType("video")}
                    className="text-left px-3.5 py-2 text-xs font-semibold rounded-xl hover:bg-white/5 transition cursor-pointer"
                  >
                    🎬 Video (mp4, mov)
                  </button>
                  <div className="border-t border-white/5 my-1" />
                  <button
                    type="button"
                    onClick={() => handleUploadType("all")}
                    className="text-left px-3.5 py-2 text-xs font-semibold rounded-xl hover:bg-white/5 transition cursor-pointer"
                  >
                    📁 All Files Browser
                  </button>
                </div>
              )}
            </div>

            {/* Main Text Input */}
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={isListening ? "Listening closely... start speaking" : "Message AI assistant..."}
              className={`flex-1 h-12 px-5 rounded-full text-xs font-semibold outline-none transition duration-200 min-w-0 ${
                theme === "dark"
                  ? "bg-[#070B14] border border-white/5 text-white placeholder-gray-500 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10"
                  : "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10"
              }`}
              disabled={audioFile || videoFile}
            />

            {/* Voice Dictation Button inside dark circle */}
            <button
              type="button"
              onClick={toggleSpeech}
              className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition cursor-pointer ${
                isListening 
                  ? "bg-red-500/20 text-red-500 border border-red-500 animate-pulse" 
                  : theme === "dark"
                    ? "bg-[#070B14] border border-white/5 text-gray-300 hover:bg-white/5"
                    : "bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
              title="Voice Input"
            >
              <FaMicrophone size={13} className={isListening ? "text-red-500" : "text-gray-400"} />
            </button>

            {/* Circular Purple Gradient Send Button */}
            <button
              type="submit"
              className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-white hover:scale-105 active:scale-95 transition-all duration-100 flex items-center justify-center cursor-pointer shadow-md shadow-purple-500/20"
              title="Send message"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-none stroke-current" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Hidden file input anchor */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileSelect}
        multiple
        className="hidden"
      />
    </div>
  );
}
