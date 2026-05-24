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