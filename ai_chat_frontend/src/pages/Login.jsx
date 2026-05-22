import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {

const [username,setUsername]=useState("");
const [password,setPassword]=useState("");
const [error,setError]=useState("");
const [isLoading,setIsLoading]=useState(false);
const [showPassword,setShowPassword]=useState(false);

const {login}=useAuth();

const navigate=useNavigate();


const handleSubmit=async(e)=>{

e.preventDefault();

setError("");

if(
!username.trim() ||
!password.trim()
){

setError(
"Please fill all fields"
);

return;

}

setIsLoading(true);

try{

await login(
username,
password
);

navigate("/chat");

}

catch(err){

if(err.response){

const d=err.response.data;

setError(
d.detail ||
d.error ||
d.non_field_errors?.join(", ") ||
"Invalid credentials"
);

}
else{

setError(
"Something went wrong"
);

}

}

finally{

setIsLoading(false);

}

};



return(

<div
className="
min-h-screen
flex
items-center
justify-center
px-4
bg-[#020c1b]
"
>

{/* Background blur */}

<div
className="
fixed
inset-0
overflow-hidden
pointer-events-none
"
>

<div
className="
absolute
w-[600px]
h-[600px]
rounded-full
blur-[120px]
opacity-10
bg-blue-500
top-[-15%]
left-[-10%]
"
/>

<div
className="
absolute
w-[500px]
h-[500px]
rounded-full
blur-[120px]
opacity-10
bg-purple-500
bottom-[-10%]
right-[-10%]
"
/>

</div>



<div
className="
w-full
max-w-[520px]
relative
"
>

{/* Logo */}

<div className="text-center mb-8">

<div
className="
inline-flex
items-center
justify-center
w-20
h-20
rounded-3xl
bg-gradient-to-r
from-blue-600
to-purple-600
shadow-lg
mb-4
"
>

💬

</div>


<h1
className="
text-5xl
font-bold
text-blue-500
"
>

AI Chat

</h1>

<p
className="
text-gray-400
mt-2
"
>

Sign in to your account

</p>

</div>



{/* Card */}

<div
className="
bg-[#0B1120]
border
border-gray-800
rounded-3xl
p-8
shadow-2xl
"
>

<form
onSubmit={handleSubmit}
className="space-y-5"
>

{error && (

<div
className="
bg-red-500/10
border
border-red-500
rounded-xl
p-3
text-red-400
text-sm
"
>

{error}

</div>

)}



{/* Username */}

<div>

<label
className="
block
mb-2
text-gray-300
"
>

Username

</label>


<div className="relative">

<div
className="
absolute
left-4
top-1/2
-transform
-translate-y-1/2
text-gray-400
"
>



</div>


<input
type="text"
value={username}
onChange={(e)=>
setUsername(
e.target.value
)
}
placeholder="Enter username"
className="
w-full
pl-12
pr-4
py-4
rounded-xl
bg-[#111827]
border
border-gray-700
text-white
outline-none
focus:border-blue-500
"
/>

</div>

</div>



{/* Password */}

<div>

<label
className="
block
mb-2
text-gray-300
"
>

Password

</label>


<div className="relative">

<div
className="
absolute
left-4
top-1/2
-transform
-translate-y-1/2
text-gray-400
"
>



</div>


<input
type={
showPassword
?
"text"
:
"password"
}
value={password}
onChange={(e)=>
setPassword(
e.target.value
)
}
placeholder="Enter password"
className="
w-full
pl-12
pr-14
py-4
rounded-xl
bg-[#111827]
border
border-gray-700
text-white
outline-none
focus:border-blue-500
"
/>


<button
type="button"
onClick={()=>
setShowPassword(
!showPassword
)
}
className="
absolute
right-4
top-1/2
-transform
-translate-y-1/2
text-gray-400
"
>

{showPassword ? "🙈" : "👁️"}

</button>

</div>

</div>



<button
type="submit"
disabled={isLoading}
className="
w-full
py-4
rounded-xl
font-bold
text-white
bg-gradient-to-r
from-blue-600
to-purple-600
hover:opacity-90
transition
"
>

{
isLoading
?
"Signing in..."
:
"Sign In"
}

</button>

</form>



<div
className="
flex
items-center
my-6
"
>

<div className="flex-1 h-[1px] bg-gray-700"/>

<span
className="
px-4
text-gray-400
text-sm
"
>

OR

</span>

<div className="flex-1 h-[1px] bg-gray-700"/>

</div>


<p
className="
text-center
text-gray-400
"
>

Don't have an account?

<Link
to="/register"
className="
text-blue-500
font-semibold
ml-2
"
>

Create one

</Link>

</p>

</div>


<p
className="
text-center
text-gray-500
text-sm
mt-6
"
>

Powered by Advanced AI • Secure & Private

</p>

</div>

</div>

)

}