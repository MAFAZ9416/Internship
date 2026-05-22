import React from "react";

export default function MessageBubble({
message,
isUser
}) {

return(

<div
className={`
flex
${isUser ? "justify-end" : "justify-start"}
mb-4
animate-fadeIn
`}
>

<div
className={`
flex
gap-3
max-w-[80%]
${isUser ? "flex-row-reverse" : "flex-row"}
`}
>

{/* Avatar */}

<div
className="
flex-shrink-0
w-8
h-8
rounded-full
flex
items-center
justify-center
text-xs
font-bold
mt-1
"
style={{
background:isUser
? "linear-gradient(135deg,#4F7CFF,#7C3AED)"
: "linear-gradient(135deg,#7C3AED,#06B6D4)"
}}
>

{isUser ? "U" : "AI"}

</div>


{/* Bubble */}

<div
className="
rounded-2xl
px-4
py-3
text-sm
leading-relaxed
break-words
overflow-hidden
max-w-full
"
style={{
background:isUser
? "#1E3A8A"
: "#111827",

border:isUser
? "1px solid rgba(79,124,255,0.2)"
: "1px solid rgba(255,255,255,0.08)",

borderTopRightRadius:
isUser
? "4px"
: "16px",

borderTopLeftRadius:
isUser
? "16px"
: "4px",

color:"#ffffff"
}}
>

<p
className="
whitespace-pre-wrap
break-words
"
>

{
message.content ||
message.message ||
"No message"
}

</p>


<span
className="
block
text-xs
mt-2
opacity-50
"
>

{
message.timestamp
?

new Date(
message.timestamp
).toLocaleTimeString(
[],
{
hour:"2-digit",
minute:"2-digit"
}
)

:

""
}

</span>

</div>

</div>

</div>

)

}