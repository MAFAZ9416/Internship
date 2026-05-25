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

  /* Speech Recognition */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.log("Speech not supported");
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
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB for regular files
  const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB for audio
  const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB for video

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
      }, 200);
    });
  };

  const validateFiles = (files) => {
    const valid = [];

    setFileError("");

    for (const file of files) {
      // Check file type first
      if (!allowedTypes.includes(file.type)) {
        setFileError(`${file.name} not supported`);
        continue;
      }

      // Check file size based on type
      if (file.type.startsWith("audio/")) {
        if (file.size > MAX_AUDIO_SIZE) {
          setFileError(`${file.name} exceeds 25MB audio limit`);
          continue;
        }
      } else if (file.type.startsWith("video/")) {
        if (file.size > MAX_VIDEO_SIZE) {
          setFileError(`${file.name} exceeds 100MB video limit`);
          continue;
        }
      } else {
        if (file.size > MAX_FILE_SIZE) {
          setFileError(`${file.name} exceeds 10MB limit`);
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
      // Separate audio and video from regular files
      const audio = validFiles.find((f) => f.type.startsWith("audio/"));
      const video = validFiles.find((f) => f.type.startsWith("video/"));
      const regular = validFiles.filter(
        (f) => !f.type.startsWith("audio/") && !f.type.startsWith("video/")
      );

      if (audio) {
        setAudioFile(audio);
        setMessage(""); // Clear message for audio
      } else if (video) {
        setVideoFile(video);
        setMessage(""); // Clear message for video
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
      // Separate audio and video
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

  const handleRemoveAudio = () => {
    setAudioFile(null);
  };

  const handleRemoveVideo = () => {
    setVideoFile(null);
  };

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
        accept =
          "image/*,application/pdf,.docx,text/plain,audio/mpeg,audio/wav,audio/x-wav,video/mp4,video/quicktime,.mp3,.wav,.mp4,.mov";
        break;
    }

    fileInputRef.current.accept = accept;
    fileInputRef.current.click();
    setShowUploadMenu(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !message.trim() &&
      selectedFiles.length === 0 &&
      !audioFile &&
      !videoFile
    )
      return;

    if (audioFile) {
      onSend({
        message,
        audioFile
      });
      setMessage("");
      setAudioFile(null);
    } else if (videoFile) {
      onSend({
        message,
        videoFile
      });
      setMessage("");
      setVideoFile(null);
    } else {
      onSend({
        message,
        files: selectedFiles
      });
      setMessage("");
      setSelectedFiles([]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="p-4 bg-[#0A0E27] border-t border-gray-800"
    >
      {/* File preview */}
      {selectedFiles.length > 0 && (
        <FileUploadPreview
          files={selectedFiles}
          uploadProgress={uploadProgress}
          onRemove={handleRemoveFile}
        />
      )}

      {/* Audio preview */}
      {audioFile && (
        <div className="mb-3 p-3 bg-[#111827] rounded-lg border border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaMusic size={18} className="text-yellow-400" />
            <div>
              <p className="text-sm text-white font-semibold">🎵 Audio File</p>
              <p className="text-xs text-gray-400">{audioFile.name}</p>
            </div>
          </div>
          <button
            onClick={handleRemoveAudio}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Video preview */}
      {videoFile && (
        <div className="mb-3 p-3 bg-[#111827] rounded-lg border border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FaFilm size={18} className="text-red-400" />
            <div>
              <p className="text-sm text-white font-semibold">🎬 Video File</p>
              <p className="text-xs text-gray-400">{videoFile.name}</p>
            </div>
          </div>
          <button
            onClick={handleRemoveVideo}
            className="text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error message */}
      {fileError && (
        <div className="mb-3 p-3 bg-red-900 bg-opacity-30 rounded-lg border border-red-700 text-red-400 text-sm">
          {fileError}
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        {/* Upload menu button */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowUploadMenu(!showUploadMenu)}
            className="
              w-10
              h-10
              rounded-full
              bg-gray-700
              text-white
              flex
              items-center
              justify-center
              hover:bg-gray-600
              relative
            "
            title="Upload file"
          >
            📎
          </button>

          {showUploadMenu && (
            <div
              className="
                absolute
                bottom-12
                left-0
                bg-[#111827]
                rounded-lg
                border
                border-gray-700
                overflow-hidden
                w-48
              "
            >
              <button
                type="button"
                onClick={() => handleUploadType("image")}
                className="w-full text-left px-3 py-2 hover:bg-[#1E293B] rounded-lg text-white"
              >
                🖼️ Image
              </button>

              <button
                type="button"
                onClick={() => handleUploadType("document")}
                className="w-full text-left px-3 py-2 hover:bg-[#1E293B] rounded-lg text-white"
              >
                📄 Document
              </button>

              <button
                type="button"
                onClick={() => handleUploadType("audio")}
                className="w-full text-left px-3 py-2 hover:bg-[#1E293B] rounded-lg text-white"
              >
                🎵 Audio (mp3, wav)
              </button>

              <button
                type="button"
                onClick={() => handleUploadType("video")}
                className="w-full text-left px-3 py-2 hover:bg-[#1E293B] rounded-lg text-white"
              >
                🎬 Video (mp4, mov)
              </button>

              <button
                type="button"
                onClick={() => handleUploadType("all")}
                className="w-full text-left px-3 py-2 hover:bg-[#1E293B] rounded-lg text-white"
              >
                📁 All Files
              </button>
            </div>
          )}
        </div>

        {/* Mic button */}
        <button
          type="button"
          onClick={toggleSpeech}
          className={`
            w-10
            h-10
            rounded-full
            text-white
            flex
            items-center
            justify-center
            transition
            ${
              isListening ? "bg-red-500 animate-pulse" : "bg-gray-700"
            }
          `}
          title="Voice input"
        >
          <FaMicrophone size={16} />
        </button>

        {/* Message input */}
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isListening ? "Listening..." : "Type message..."}
          className="
            flex-1
            bg-[#111827]
            border
            border-gray-700
            rounded-full
            px-5
            py-3
            text-white
            focus:outline-none
            focus:border-blue-500
          "
          disabled={audioFile || videoFile}
        />

        {/* Send button */}
        <button
          type="submit"
          className="
            w-12
            h-12
            rounded-full
            bg-blue-600
            text-white
            hover:bg-blue-700
            flex
            items-center
            justify-center
            transition
          "
          title="Send message"
        >
          ➤
        </button>
      </form>

      {/* Hidden file input */}
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
