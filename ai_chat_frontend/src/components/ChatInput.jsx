import { useState } from "react";

export default function ChatInput({ onSend }) {

const [message,setMessage]=useState("");

const handleSubmit=(e)=>{

e.preventDefault();

if(!message.trim()) return;

onSend(message);

setMessage("");

};

return(

<div
className="
border-t
border-gray-800
bg-[#020c1b]
py-4
px-6
flex
justify-center
"
>

<form
onSubmit={handleSubmit}
className="
w-full
max-w-4xl
flex
items-center
gap-3
"
>

<input
type="text"
value={message}
placeholder="Type your message..."
onChange={(e)=>
setMessage(e.target.value)
}
className="
flex-1
bg-[#111827]
border
border-gray-700
rounded-full
px-5
py-3
text-white
outline-none
focus:border-blue-500
"
/>

<button
type="submit"
className="
w-12
h-12
rounded-full
bg-blue-600
hover:bg-blue-700
text-white
text-xl
"
>

➤

</button>

</form>

</div>

);

}