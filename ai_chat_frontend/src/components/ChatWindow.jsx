import MessageBubble from "./MessageBubble";

export default function ChatWindow({
  messages,
  isTyping,
  onEditMessage,
  onSendSuggestion
}) {
  const theme = localStorage.getItem("theme") || "dark";

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-2">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col justify-center items-center text-center p-8 select-none">
          <div className="text-6xl mb-4 animate-float drop-shadow-[0_0_20px_rgba(124,58,237,0.5)]">💬</div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gradient mb-3">
            Start a Conversation
          </h1>
          <p className={`text-xs max-w-sm mb-8 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
            Ask me anything! I am here to help you analyze files, answer queries, and spark insights.
          </p>

          {/* Suggestions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg w-full">
            {[
              { text: "Explain this image", icon: "🖼️", desc: "Analyze visual elements and get instant answers" },
              { text: "Summarize PDF", icon: "📄", desc: "Extract key takeaways and core concepts quickly" },
              { text: "Ask backend question", icon: "💻", desc: "Get debugging help, code optimization & advice" },
              { text: "Generate ideas", icon: "💡", desc: "Brainstorm creative concepts, structures, or drafts" }
            ].map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSendSuggestion?.({ message: item.text })}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-[1.02] ${
                  theme === "dark"
                    ? "bg-[#0F172A]/40 border-white/5 hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5 text-gray-200"
                    : "bg-white border-slate-200 hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5 shadow-sm text-slate-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <h3 className="text-xs font-bold">{item.text}</h3>
                    <p className={`text-[9px] mt-0.5 ${theme === "dark" ? "text-gray-400" : "text-slate-500"}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id || index}
              message={message}
              isUser={message.role === "user"}
              onEditMessage={onEditMessage}
            />
          ))}

          {/* Frosted Glass AI Typing Loader Card */}
          {isTyping && (
            <div className="flex gap-3 mb-6 items-center justify-start w-full animate-fade-in">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] flex items-center justify-center text-white shadow-lg flex-shrink-0 border border-purple-500/20 select-none animate-pulse">
                🤖
              </div>
              <div className={`px-4 py-3 rounded-2xl flex gap-1.5 items-center border ${
                theme === "dark" 
                  ? "bg-[#0F172A]/40 border-white/5" 
                  : "bg-white border-slate-200 shadow-sm"
              }`}>
                <div className="w-2 h-2 rounded-full bg-[#A855F7] animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#A855F7] animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#A855F7] animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}