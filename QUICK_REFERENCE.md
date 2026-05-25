# ⚡ Quick Reference - New Features API

## 🎯 Quick Start

### 1. Run Migration
```bash
cd ai_chat_backend
python manage.py migrate
```

### 2. Test Endpoints

#### Pin/Unpin Conversation
```bash
# Pin
curl -X POST "http://localhost:8000/api/history/UUID/pin/" \
  -H "Authorization: Bearer TOKEN"

# Unpin
curl -X POST "http://localhost:8000/api/history/UUID/unpin/" \
  -H "Authorization: Bearer TOKEN"
```

#### Search Archived
```bash
curl -X GET "http://localhost:8000/api/history/archived/search/?q=python" \
  -H "Authorization: Bearer TOKEN"
```

#### Transcribe Audio
```bash
curl -X POST "http://localhost:8000/api/upload/audio/transcribe/" \
  -H "Authorization: Bearer TOKEN" \
  -F "audio_file=@audio.mp3" \
  -F "conversation_id=UUID" \
  -F "message=Please analyze this"
```

#### Process Video
```bash
curl -X POST "http://localhost:8000/api/upload/video/process/" \
  -H "Authorization: Bearer TOKEN" \
  -F "video_file=@video.mp4" \
  -F "conversation_id=UUID" \
  -F "extract_audio=true" \
  -F "message=What is this?"
```

---

## 📱 Frontend Components

### Sidebar Props
```javascript
<Sidebar
  conversations={conversations}
  archivedConversations={archivedConversations}
  onSelectConversation={handleSelect}
  onNewChat={handleNewChat}
  onDeleteConversation={handleDelete}
  onArchiveConversation={handleArchive}
  onRestoreConversation={handleRestore}
  onPinConversation={handlePin}           // NEW
  onUnpinConversation={handleUnpin}       // NEW
  activeConversationId={currentId}
  sidebarWidth={280}
  onSidebarWidthChange={setSidebarWidth}
  isCollapsed={isCollapsed}
  onToggleCollapsed={setIsCollapsed}
  showArchivedChats={showArchived}
  onToggleShowArchivedChats={setShowArchived}
/>
```

### ChatInput Props (Data Structure)
```javascript
// Regular message with files
onSend({
  message: "Hello",
  files: [File, File]  // Regular files
})

// Audio transcription
onSend({
  message: "Analyze this",
  audioFile: File     // MP3 or WAV
})

// Video processing
onSend({
  message: "What's in this?",
  videoFile: File     // MP4 or MOV
})
```

---

## 🔌 API Methods

```javascript
import api, { apiMethods } from "../services/api";

// Pin/Unpin
await apiMethods.pin(conversationId);
await apiMethods.unpin(conversationId);

// Search
const results = await apiMethods.searchArchived("python");

// Audio
const response = await apiMethods.transcribeAudio(
  audioFile,
  conversationId,
  optionalMessage
);

// Video
const response = await apiMethods.processVideo(
  videoFile,
  conversationId,
  optionalMessage,
  extractAudio = true
);
```

---

## 📊 Response Structures

### Pin Response
```json
{
  "message": "Conversation pinned",
  "is_pinned": true,
  "pinned_at": "2024-05-24T10:30:00Z"
}
```

### Search Archived Response
```json
[
  {
    "id": "uuid",
    "title": "Python Tutorial",
    "is_archived": true,
    "archived_at": "2024-05-24T09:00:00Z",
    ...
  }
]
```

### Audio Transcribe Response
```json
{
  "transcript": "The audio content transcribed",
  "user_message_id": "msg-id",
  "response": "AI response to transcript",
  "ai_message_id": "ai-msg-id",
  "conversation_id": "conv-id"
}
```

### Video Process Response
```json
{
  "video_info": {
    "filename": "video.mp4",
    "size_bytes": 12345,
    "size_display": "12.34 MB",
    "mime_type": "video/mp4",
    "description": "Video description from AI"
  },
  "transcript": "Audio transcript (if extracted)",
  "user_message_id": "msg-id",
  "response": "AI response",
  "ai_message_id": "ai-msg-id",
  "conversation_id": "conv-id"
}
```

---

## 🎨 UI Components

### Pin Button
```jsx
<button onClick={(e) => handlePin(e, conversationId)}>
  <FaStar size={13} />
</button>
```

### Audio Preview
```jsx
{audioFile && (
  <div className="p-3 bg-[#111827] rounded-lg">
    <FaMusic /> 🎵 {audioFile.name}
  </div>
)}
```

### Video Preview
```jsx
{videoFile && (
  <div className="p-3 bg-[#111827] rounded-lg">
    <FaFilm /> 🎬 {videoFile.name}
  </div>
)}
```

### Audio Player in Message
```jsx
<audio controls>
  <source src={fileUrl} type="audio/mpeg" />
</audio>
```

### Video Player in Message
```jsx
<video controls>
  <source src={fileUrl} type="video/mp4" />
</video>
```

---

## 🔐 File Size Limits

| Type      | Max Size | Format       |
|-----------|----------|--------------|
| Regular   | 10 MB    | PDF, DOCX    |
| Audio     | 25 MB    | MP3, WAV     |
| Video     | 100 MB   | MP4, MOV     |

---

## 📱 Mobile Breakpoints

| Screen    | Width  | Behavior                  |
|-----------|--------|---------------------------|
| Mobile    | < 768px| Sidebar overlay + hamburger|
| Tablet    | 768px+ | Sidebar fixed             |
| Desktop   | 1024px+| Full layout with resize   |

---

## 🧪 Test Data

### Create Test Audio Conversation
1. Click "+" to create chat
2. Click file icon → "Audio"
3. Select MP3 or WAV file
4. Optionally add text message
5. Send - watch transcription process

### Create Test Video Conversation
1. Click "+" to create chat
2. Click file icon → "Video"
3. Select MP4 or MOV file
4. Optionally add text message
5. Send - watch video processing

### Test Pinning
1. Open conversation
2. Hover over title in sidebar
3. Click star icon ⭐
4. Chat moves to "PINNED CHATS" section

### Test Archive Search
1. Archive some conversations
2. Click "ARCHIVED" section in sidebar
3. Use search input to filter
4. Results update in real-time

---

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Audio won't transcribe | Check Gemini API quota, file < 25MB |
| Video won't process | Ensure file < 100MB, format MP4/MOV |
| Pin not working | Verify migration ran: `python manage.py showmigrations` |
| Mobile sidebar stuck | Clear cache, refresh page |
| Search returns nothing | Check archived conversations exist |

---

## 🚀 Deployment Checklist

- [ ] Run `python manage.py migrate`
- [ ] Test pin/unpin endpoint
- [ ] Test audio upload (small file first)
- [ ] Test video upload (small file first)
- [ ] Test archived search
- [ ] Test mobile sidebar on device
- [ ] Verify all existing features still work
- [ ] Check error handling messages

---

## 📚 Key Files Changed

```
Backend:
✏️ chat/models.py                  - Added is_pinned, pinned_at
✏️ chat/serializers.py              - Updated fields
✏️ chat/views.py                    - Added 5 new views (200+ lines)
✏️ chat/urls.py                     - Added 5 new paths
✨ chat/migrations/0005_...py      - New migration

Frontend:
✏️ src/services/api.js              - Added endpoints + methods
✨ src/components/Sidebar.jsx       - Completely rewritten
✨ src/components/ChatInput.jsx      - Completely rewritten
✏️ src/components/MessageBubble.jsx - Enhanced file display
✏️ src/pages/Chat.jsx              - Added handlers
```

---

## 📞 Support

For each feature, check:
1. Backend logs: `python manage.py runserver`
2. Frontend console: Browser DevTools (F12)
3. Network tab: Check API calls
4. Error messages: User-friendly feedback provided

All features include proper error handling and user notifications!
