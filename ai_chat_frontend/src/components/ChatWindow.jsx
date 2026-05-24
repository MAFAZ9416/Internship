import MessageBubble from "./MessageBubble";

export default function ChatWindow({
messages,
isTyping,
onEditMessage
}){

return(

<div
className="
flex-1
overflow-y-auto
p-6
pt-20
"
>

{

messages.length===0

?

<div
className="
h-full
flex
flex-col
justify-center
items-center
text-center
"
>

<div className="text-6xl mb-4">

💬

</div>

<h1
className="
text-4xl
font-bold
text-blue-400
mb-3
"
>

Start a Conversation

</h1>

<p
className="
text-gray-400
text-xl
"
>

Ask me anything! I'm here to help.

</p>

</div>

:

messages.map(

(message,index)=>(

<MessageBubble

key={
message.id || index
}

message={message}

isUser={
message.role==="user"
}

onEditMessage={
onEditMessage
}

/>

)

)

}


{

isTyping && (

<div className="flex gap-2 ml-3">

<div
className="
w-2
h-2
rounded-full
bg-blue-500
animate-bounce
"
/>

<div
className="
w-2
h-2
rounded-full
bg-blue-500
animate-bounce
delay-100
"
/>

<div
className="
w-2
h-2
rounded-full
bg-blue-500
animate-bounce
delay-200
"
/>

</div>

)

}

</div>

);

}