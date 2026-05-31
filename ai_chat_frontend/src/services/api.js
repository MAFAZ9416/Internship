import axios from "axios";

const api = axios.create({
    baseURL: "http://127.0.0.1:8000/api",
});



api.interceptors.request.use(

(config)=>{

const token=
localStorage.getItem(
"access"
);

if(token){

config.headers.Authorization=
`Bearer ${token}`;

}

return config;

},

(error)=>Promise.reject(error)

);




api.interceptors.response.use(

(response)=>response,

async(error)=>{

const originalRequest=
error.config;

if(

error.response?.status===401 &&
!originalRequest._retry

){

originalRequest._retry=true;

try{

const refreshToken=
localStorage.getItem(
"refresh"
);

if(!refreshToken){

throw new Error(
"No refresh token"
);

}

const response=
await axios.post(

"http://127.0.0.1:8000/api/auth/token/refresh/",

{
refresh:refreshToken
}

);

const newAccess=
response.data.access;

localStorage.setItem(

"access",

newAccess

);

originalRequest.headers.Authorization=
`Bearer ${newAccess}`;

return api(
originalRequest
);

}

catch(err){

console.log(
"Session expired"
);

localStorage.clear();

window.location.href=
"/login";

return Promise.reject(err);

}

}

return Promise.reject(error);

}

);

export default api;


// ==========================
// API ENDPOINTS HELPER
// ==========================

export const apiEndpoints = {
  // Chat
  sendMessage: () => "/",
  editMessage: (id) => `/message/${id}/edit/`,

  // Conversations
  getHistory: () => "/history/",
  getConversation: (id) => `/history/${id}/`,
  deleteConversation: (id) => `/history/${id}/delete/`,
  renameConversation: (id) => `/history/${id}/rename/`,
  archiveConversation: (id) => `/history/${id}/archive/`,
  restoreConversation: (id) => `/history/${id}/restore/`,

  // Pinned Chats
  pinConversation: (id) => `/history/${id}/pin/`,
  unpinConversation: (id) => `/history/${id}/unpin/`,

  // Search
  searchArchived: () => "/history/archived/search/",

  // File Upload
  uploadFiles: () => "/upload/",
  transcribeAudio: () => "/upload/audio/transcribe/",
  processVideo: () => "/upload/video/process/",

  // Models
  getModels: () => "/models/",

  // Auth
  login: () => "/auth/login/",
  register: () => "/auth/register/",
  tokenRefresh: () => "/auth/token/refresh/",
  logout: () => "/auth/logout/",
};


// ==========================
// API METHODS HELPER
// ==========================

export const apiMethods = {
  // Pinned chats
  pin: async (conversationId) => {
    return api.post(apiEndpoints.pinConversation(conversationId));
  },

  unpin: async (conversationId) => {
    return api.post(apiEndpoints.unpinConversation(conversationId));
  },

  // Search archived
  searchArchived: async (query) => {
    return api.get(apiEndpoints.searchArchived(), {
      params: { q: query }
    });
  },

  // Audio transcription
  transcribeAudio: async (audioFile, conversationId, message = "") => {
    const formData = new FormData();
    formData.append("audio_file", audioFile);
    formData.append("conversation_id", conversationId);
    if (message) {
      formData.append("message", message);
    }

    return api.post(apiEndpoints.transcribeAudio(), formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  },

  // Video processing
  processVideo: async (videoFile, conversationId, message = "", extractAudio = true) => {
    const formData = new FormData();
    formData.append("video_file", videoFile);
    formData.append("conversation_id", conversationId);
    formData.append("extract_audio", extractAudio);
    if (message) {
      formData.append("message", message);
    }

    return api.post(apiEndpoints.processVideo(), formData, {
      headers: {
        "Content-Type": "multipart/form-data"
      }
    });
  },

  // Delete conversation
  delete: async (conversationId) => {
    return api.delete(apiEndpoints.deleteConversation(conversationId));
  },

  // Archive conversation
  archive: async (conversationId) => {
    return api.post(apiEndpoints.archiveConversation(conversationId));
  },

  // Restore conversation
  restore: async (conversationId) => {
    return api.post(apiEndpoints.restoreConversation(conversationId));
  }
};