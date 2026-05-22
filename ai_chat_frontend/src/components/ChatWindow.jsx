import MessageBubble from "./MessageBubble";

export default function ChatWindow({
  messages = [],
  isTyping = false
}) {

return (

<div
className="
flex-1
overflow-y-auto
p-6
space-y-4
bg-[#020c1b]
"
>

{
messages.length===0 && (

<div
className="
h-full
flex
items-center
justify-center
text-center
text-gray-400
"
>

<div>

<h2 className="text-4xl mb-3">
💬
</h2>

<h2 className="text-3xl font-bold text-blue-400">
Start a Conversation
</h2>

<p className="mt-2">
Ask me anything! I'm here to help.
</p>

</div>

</div>

)
}

{
messages.map((message,index)=>(

<MessageBubble
key={index}
message={message}
isUser={message.role==="user"}
/>

))
}

{
isTyping && (

<div className="flex gap-3">

<div
className="
w-8
h-8
rounded-full
bg-blue-500
flex
items-center
justify-center
text-white
"
>
AI
</div>

<div
className="
bg-[#111827]
rounded-2xl
px-4
py-3
text-white
"
>

Typing...

</div>

</div>

)
}

</div>

)

}