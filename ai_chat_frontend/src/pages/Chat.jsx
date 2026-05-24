import { useState,useEffect,useCallback } from "react";
import api from "../services/api";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";

export default function Chat(){

const [messages,setMessages]=useState([]);
const [conversations,setConversations]=useState([]);
const [archivedConversations,setArchivedConversations]=useState([]);

const [currentConversationId,setCurrentConversationId]=useState(null);

const [isTyping,setIsTyping]=useState(false);
const [isCollapsed,setIsCollapsed]=useState(false);

const [sidebarWidth,setSidebarWidth]=useState(280);

const [showArchivedChats,setShowArchivedChats]=useState(false);



useEffect(()=>{

fetchConversations();

},[]);



const fetchConversations=
useCallback(async()=>{

try{

const response=
await api.get("/history/");

const history=
Array.isArray(response.data)
?
response.data
:
response.data.results || [];

setConversations(

history.filter(
chat=>!chat.is_archived
)

);

setArchivedConversations(

history.filter(
chat=>chat.is_archived
)

);

}

catch(error){

console.log(
"History error:",
error
);

}

},[]);





const sendMessage=async(data)=>{

const message=
data.message || "";

const files=
data.files || [];


if(
!message.trim() &&
files.length===0
)
return;



const userMessage={

id:Date.now(),

role:"user",

content:

message ||

(files.length>0
?
`📎 ${files.length} file(s) attached`
:
""),

files:

files.map(file=>({

name:file.name,

type:file.type,

preview:

file.type.startsWith(
"image/"
)
?
URL.createObjectURL(file)
:
null

})),

timestamp:new Date()

};


setMessages(prev=>[
...prev,
userMessage
]);


setIsTyping(true);


try{

let conversationId=
currentConversationId;


const payload={
message
};


if(conversationId){

payload.conversation_id=
conversationId;

}


const response=
await api.post(
"/",
payload
);


conversationId=
response.data.conversation_id;


if(conversationId){

setCurrentConversationId(
conversationId
);

}



/* upload files */

if(files.length>0){

const formData=
new FormData();

files.forEach(file=>{

formData.append(
"files",
file
);

});


formData.append(
"conversation_id",
conversationId
);


await api.post(

"/upload/",

formData,

{

headers:{

"Content-Type":
"multipart/form-data"

}

}

);

}



/* AI message */

const aiMessage={

id:
response.data.message_id
||
Date.now()+1,

role:"assistant",

content:
response.data.response
||
"No response",

timestamp:new Date()

};


setMessages(prev=>[
...prev,
aiMessage
]);


fetchConversations();

}

catch(error){

console.log(
"Send error:",
error
);

}

finally{

setIsTyping(false);

}

};






const editMessage=
async(messageId,newContent)=>{

try{

setIsTyping(true);

const response=
await api.patch(

`/message/${messageId}/edit/`,
{
content:newContent
}

);


const updatedMessage=

response.data.message
||
response.data;


/* update UI instantly */

setMessages(prev=>

prev.map(msg=>{

if(msg.id===messageId){

return{

...msg,

content:
updatedMessage.content
||
newContent,

edited_at:
updatedMessage.edited_at
||
new Date()

};

}

return msg;

})

);


/* refresh AI response */

if(currentConversationId){

const refreshed=
await api.get(

`/history/${currentConversationId}/`

);

setMessages(
refreshed.data.messages || []
);

}

}

catch(error){

console.log(
"Edit error:",
error
);

}

finally{

setIsTyping(false);

}

};






const newChat=()=>{

setMessages([]);
setCurrentConversationId(null);

};






const selectConversation=
async(id)=>{

try{

const response=
await api.get(
`/history/${id}/`
);

setCurrentConversationId(id);

setMessages(
response.data.messages || []
);

}

catch(error){

console.log(error);

}

};







const deleteConversation=
async(id)=>{

try{

await api.delete(
`/history/${id}/delete/`
);

fetchConversations();

}

catch(error){

console.log(error);

}

};






const archiveConversation=
async(id)=>{

try{

await api.post(
`/history/${id}/archive/`
);

fetchConversations();

if(currentConversationId===id){

setMessages([]);
setCurrentConversationId(null);

}

}

catch(error){

console.log(
"Archive error:",
error
);

}

};






const restoreConversation=
async(id)=>{

try{

await api.post(
`/history/${id}/restore/`
);

fetchConversations();

}

catch(error){

console.log(
"Restore error:",
error
);

}

};






return(

<div className="flex h-screen bg-[#020c1b] overflow-hidden">

<div
className={`
transition-all
duration-300
${isCollapsed ? "w-0 overflow-hidden" : ""}
`}
>

<Sidebar

conversations={conversations}

archivedConversations={
archivedConversations
}

onSelectConversation={
selectConversation
}

onNewChat={
newChat
}

onDeleteConversation={
deleteConversation
}

onArchiveConversation={
archiveConversation
}

onRestoreConversation={
restoreConversation
}

activeConversationId={
currentConversationId
}

sidebarWidth={
sidebarWidth
}

onSidebarWidthChange={
setSidebarWidth
}

isCollapsed={
isCollapsed
}

showArchivedChats={
showArchivedChats
}

onToggleShowArchivedChats={()=>

setShowArchivedChats(

!showArchivedChats

)

}

/>

</div>


<div className="flex flex-col flex-1 relative">

<button

onClick={()=>

setIsCollapsed(

!isCollapsed

)

}

className="
absolute
top-4
left-4
z-50
text-white
text-2xl
bg-[#111827]
px-3
py-1
rounded-lg
hover:bg-[#1E293B]
"

>

☰

</button>


<ChatWindow

messages={messages}

isTyping={isTyping}

onEditMessage={editMessage}

/>


<ChatInput
onSend={sendMessage}
/>

</div>

</div>

);

}