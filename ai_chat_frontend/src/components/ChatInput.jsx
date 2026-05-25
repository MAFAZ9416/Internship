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

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB regular
  const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB audio
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB video

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
        setFileError(`${file.name} is not a supported file type.`);
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
      className={`p-4 transition-all duration-300 relative border-t select-none ${
        theme === "dark" 
          ? "bg-[#0A0E27] border-gray-800/80" 
          : "bg-white border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]"
      }`}
    >
      
      {/* Drag & drop overlay texture */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-xs flex items-center justify-center text-blue-400 font-bold border-2 border-dashed border-blue-500 z-50">
          📥 Drop your media files here to upload
        </div>
      )}

      {/* Upload File Progress & Previews */}
      {selectedFiles.length > 0 && (
        <div className="mb-2 bg-transparent">
          <FileUploadPreview
            files={selectedFiles}
            uploadProgress={uploadProgress}
            onRemove={handleRemoveFile}
          />
        </div>
      )}

      {/* Audio upload preview badge */}
      {audioFile && (
        <div className="mb-3 p-3 bg-[#111827] rounded-xl border border-gray-800 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <FaMusic size={15} className="text-yellow-400" />
            <div className="min-w-0">
              <p className="text-xs text-white font-bold">🎵 Audio Clip Attached</p>
              <p className="text-[10px] text-gray-400 truncate">{audioFile.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveAudio}
            className="text-red-400 hover:text-red-300 text-sm font-semibold p-1 hover:bg-gray-800 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Video upload preview badge */}
      {videoFile && (
        <div className="mb-3 p-3 bg-[#111827] rounded-xl border border-gray-800 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <FaFilm size={15} className="text-red-400" />
            <div className="min-w-0">
              <p className="text-xs text-white font-bold">🎬 Video Attached</p>
              <p className="text-[10px] text-gray-400 truncate">{videoFile.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveVideo}
            className="text-red-400 hover:text-red-300 text-sm font-semibold p-1 hover:bg-gray-800 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Size/Type Error message alerts */}
      {fileError && (
        <div className="mb-3 p-2.5 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2 animate-bounce">
          <span>⚠️</span>
          <span>{fileError}</span>
        </div>
      )}

      {/* Sleek bottom fixed input tray */}
      <form onSubmit={handleSubmit} className="flex gap-3.5 items-center">
        
        {/* Upload menu button */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowUploadMenu(!showUploadMenu)}
            className={`w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 duration-100 transition cursor-pointer select-none text-lg ${
              theme === "dark" 
                ? "bg-gray-900/60 border border-gray-800 text-gray-300 hover:bg-gray-800" 
                : "bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200"
            }`}
            title="Attach media or document files"
          >
            📎
          </button>

          {/* Upload Popover Menu */}
          {showUploadMenu && (
            <div
              className={`absolute bottom-12 left-0 rounded-2xl border overflow-hidden w-48 shadow-xl z-50 p-1 flex flex-col ${
                theme === "dark"
                  ? "bg-[#111827] border-gray-800/80 text-white"
                  : "bg-white border-slate-200 text-slate-800 shadow-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => handleUploadType("image")}
                className="text-left px-3.5 py-2 text-xs font-semibold rounded-xl hover:bg-[#1E293B] transition"
              >
                🖼️ Image Attachment
              </button>
              <button
                type="button"
                onClick={() => handleUploadType("document")}
                className="text-left px-3.5 py-2 text-xs font-semibold rounded-xl hover:bg-[#1E293B] transition"
              >
                📄 Document / PDF
              </button>
              <button
                type="button"
                onClick={() => handleUploadType("audio")}
                className="text-left px-3.5 py-2 text-xs font-semibold rounded-xl hover:bg-[#1E293B] transition"
              >
                🎵 Audio (mp3, wav)
              </button>
              <button
                type="button"
                onClick={() => handleUploadType("video")}
                className="text-left px-3.5 py-2 text-xs font-semibold rounded-xl hover:bg-[#1E293B] transition"
              >
                🎬 Video (mp4, mov)
              </button>
              <div className="border-t border-gray-800/20 my-1" />
              <button
                type="button"
                onClick={() => handleUploadType("all")}
                className="text-left px-3.5 py-2 text-xs font-semibold rounded-xl hover:bg-[#1E293B] transition"
              >
                📁 All Files Browser
              </button>
            </div>
          )}
        </div>

        {/* Message Input box */}
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isListening ? "Listening closely... start speaking" : "Message AI assistant..."}
          className={`flex-1 pl-5 pr-4 py-3 rounded-full text-sm outline-none transition duration-200 min-w-0 ${
            theme === "dark"
              ? "bg-[#111827]/50 border border-gray-800 text-white placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
              : "bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/10"
          }`}
          disabled={audioFile || videoFile}
        />

        {/* Voice dictation button */}
        <button
          type="button"
          onClick={toggleSpeech}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition hover:scale-105 active:scale-95 duration-100 flex-shrink-0 cursor-pointer ${
            isListening 
              ? "bg-red-500/20 text-red-500 border border-red-500 animate-pulse drop-shadow-[0_0_10px_rgba(239,68,68,0.3)]" 
              : theme === "dark"
                ? "bg-gray-900/60 border border-gray-800 text-gray-300 hover:bg-gray-800"
                : "bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200"
          }`}
          title="Speech-to-Text Voice input"
        >
          <FaMicrophone size={14} className={isListening ? "text-red-500 animate-pulse" : "text-gray-400"} />
        </button>

        {/* Circular Send button with high-fidelity paper airplane SVG */}
        <button
          type="submit"
          className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-white hover:scale-105 active:scale-95 transition-all duration-100 flex items-center justify-center flex-shrink-0 cursor-pointer shadow-md shadow-blue-500/15"
          title="Send message to AI"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>

      </form>

      {/* Hidden file selector node */}
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
