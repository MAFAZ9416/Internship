import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback
} from "react";

import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

const [user,setUser]=useState(null);

const [loading,setLoading]=useState(true);



/* Restore user after refresh */

useEffect(()=>{

const storedUser=
localStorage.getItem(
"user"
);

const accessToken=
localStorage.getItem(
"access"
);

if(
storedUser &&
accessToken
){

try{

setUser(
JSON.parse(
storedUser
)
);

}

catch{

localStorage.removeItem(
"user"
);

localStorage.removeItem(
"access"
);

localStorage.removeItem(
"refresh"
);

}

}

setLoading(false);

},[]);




/* Login */

const login=useCallback(

async(
username,
password
)=>{

const response=
await api.post(

"/auth/login/",

{
username,
password
}

);

const {

access,
refresh,
user:userData

}=response.data;



localStorage.setItem(

"access",

access

);

localStorage.setItem(

"refresh",

refresh

);



const userInfo=

userData ||

{
username
};



localStorage.setItem(

"user",

JSON.stringify(
userInfo
)

);



setUser(
userInfo
);

return response.data;

},

[]

);




/* Register */

const register=useCallback(

async(
username,
email,
password
)=>{

const response=
await api.post(

"/auth/register/",

{
username,
email,
password
}

);

return response.data;

},

[]

);




/* Logout FIXED */

const logout=useCallback(()=>{

localStorage.removeItem(
"access"
);

localStorage.removeItem(
"refresh"
);

localStorage.removeItem(
"user"
);

sessionStorage.clear();

setUser(null);


/* Force redirect */

window.location.href="/login";

},[]);




const value={

user,
loading,
login,
register,
logout,

isAuthenticated:
!!user

};



return(

<AuthContext.Provider
value={value}
>

{children}

</AuthContext.Provider>

);

}



export function useAuth(){

const context=
useContext(
AuthContext
);

if(!context){

throw new Error(
"useAuth must be used inside AuthProvider"
);

}

return context;

}


export default AuthContext;