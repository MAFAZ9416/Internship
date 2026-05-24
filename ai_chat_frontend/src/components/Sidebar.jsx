import { useState,useMemo,useRef,useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

import{
FaEdit,
FaTrash,
FaArchive,
FaUndo,
FaSearch
}
from "react-icons/fa";

export default function Sidebar({

conversations=[],
archivedConversations=[],

onSelectConversation,
onNewChat,
onDeleteConversation,
onArchiveConversation,
onRestoreConversation,

activeConversationId,

sidebarWidth=280,
onSidebarWidthChange,

isCollapsed=false,

showArchivedChats=false,
onToggleShowArchivedChats

}){

const [searchQuery,setSearchQuery]=useState("");
const [isResizing,setIsResizing]=useState(false);

const sidebarRef=useRef(null);

const {user,logout}=useAuth();



useEffect(()=>{

const handleMouseMove=(e)=>{

if(!isResizing)return;

const newWidth=e.clientX;

if(
newWidth>200 &&
newWidth<600
){

onSidebarWidthChange?.(
newWidth
);

}

};


const handleMouseUp=()=>{

setIsResizing(false);

};


if(isResizing){

document.addEventListener(
"mousemove",
handleMouseMove
);

document.addEventListener(
"mouseup",
handleMouseUp
);

return()=>{

document.removeEventListener(
"mousemove",
handleMouseMove
);

document.removeEventListener(
"mouseup",
handleMouseUp
);

};

}

},[
isResizing,
onSidebarWidthChange
]);



const renameConversation=
async(id)=>{

const newName=
prompt(
"Enter new chat name"
);

if(!newName?.trim())
return;

try{

await api.patch(

`history/${id}/rename/`,
{
title:newName
}

);

window.location.reload();

}
catch(error){

console.log(error);

}

};



const filteredConversations=
useMemo(()=>{

return conversations.filter(

conversation=>{

const title=

conversation.title
||
"New Chat";

return title
.toLowerCase()
.includes(
searchQuery.toLowerCase()
);

}

);

},[
conversations,
searchQuery
]);




const filteredArchived=
useMemo(()=>{

return archivedConversations.filter(

conversation=>{

const title=

conversation.title
||
"New Chat";

return title
.toLowerCase()
.includes(
searchQuery.toLowerCase()
);

}

);

},[
archivedConversations,
searchQuery
]);



if(isCollapsed){

return null;

}



return(

<div

ref={sidebarRef}

className="
h-screen
bg-[#0B1120]
border-r
border-gray-800
flex
flex-col
relative
transition-all
duration-300
"

style={{

width:`${sidebarWidth}px`

}}

>

{/* Header */}

<div
className="
p-4
border-b
border-gray-800
"
>

<h1
className="
text-2xl
font-bold
text-blue-400
text-center
"
>

AI Chat

</h1>


<button

onClick={onNewChat}

className="
w-full
mt-4
bg-blue-600
hover:bg-blue-700
text-white
rounded-lg
py-2
"

>

+ New Chat

</button>



<div className="relative mt-3">

<FaSearch
className="
absolute
left-3
top-3
text-gray-500
"
/>

<input

type="text"

placeholder="Search..."

value={searchQuery}

onChange={(e)=>{

setSearchQuery(
e.target.value
)

}}

className="
w-full
pl-10
p-2
rounded-lg
bg-[#111827]
border
border-gray-700
text-white
outline-none
"

/>

</div>

</div>



{/* Chat List */}

<div
className="
flex-1
overflow-y-auto
p-2
"
>

<h3
className="
text-xs
text-gray-400
px-3
py-2
font-semibold
"
>

ACTIVE CHATS

</h3>


{

filteredConversations.map(

conversation=>{

const id=
conversation.id;

const title=
conversation.title;

const active=
id===activeConversationId;


return(

<div

key={id}

onClick={()=>
onSelectConversation(id)
}

className={`

group
flex
justify-between
items-center
p-3
rounded-lg
cursor-pointer
mb-2

${

active
?
"bg-blue-700"
:
"hover:bg-[#1E293B]"

}

`}

>

<span
className="
truncate
text-sm
text-white
"
>

{title}

</span>


<div
className="
flex
gap-3
opacity-0
group-hover:opacity-100
transition
"
>

<button

onClick={(e)=>{

e.stopPropagation();

renameConversation(id);

}}

className="
text-blue-400
hover:text-blue-300
"
>

<FaEdit size={13}/>

</button>


<button

onClick={(e)=>{

e.stopPropagation();

onArchiveConversation(id);

}}

className="
text-yellow-400
hover:text-yellow-300
"
>

<FaArchive size={13}/>

</button>


<button

onClick={(e)=>{

e.stopPropagation();

onDeleteConversation(id);

}}

className="
text-red-400
hover:text-red-300
"
>

<FaTrash size={13}/>

</button>

</div>

</div>

);

})

}



{/* Archived Chats */}

<div className="mt-4">

<button

onClick={
onToggleShowArchivedChats
}

className="
w-full
flex
items-center
gap-2
px-3
py-2
text-gray-400
font-semibold
hover:text-white
"

>

<FaArchive size={13}/>

Archived Chats

(
{archivedConversations.length}
)

</button>



{

showArchivedChats &&

filteredArchived.map(

conversation=>{

const id=
conversation.id;

return(

<div

key={id}

className="
flex
justify-between
items-center
p-3
rounded-lg
hover:bg-[#1E293B]
mb-2
"

>

<span
className="
truncate
text-sm
text-gray-300
"
>

{conversation.title}

</span>


<button

onClick={()=>{

onRestoreConversation(id)

}}

className="
text-green-400
hover:text-green-300
"

>

<FaUndo size={13}/>

</button>

</div>

);

})

}

</div>

</div>



{/* User */}

<div
className="
border-t
border-gray-800
p-4
"
>

<div
className="
flex
items-center
gap-3
mb-4
"
>

<div
className="
w-10
h-10
rounded-full
bg-blue-500
flex
items-center
justify-center
text-white
font-bold
"
>

{
user?.username
?.charAt(0)
?.toUpperCase()
||
"U"
}

</div>

<div>

<p className="text-white">

{user?.username}

</p>

<p
className="
text-xs
text-gray-400
"
>

{user?.email}

</p>

</div>

</div>


<button

onClick={logout}

className="
w-full
bg-red-600
hover:bg-red-700
text-white
rounded-lg
py-2
"

>

Logout

</button>

</div>



<div

onMouseDown={()=>
setIsResizing(true)
}

className="
absolute
right-0
top-0
w-1
h-full
cursor-col-resize
hover:bg-blue-500
"

></div>

</div>

);

}