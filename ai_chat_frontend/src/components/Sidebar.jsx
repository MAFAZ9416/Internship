import { useState, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

export default function Sidebar({
  conversations = [],
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  activeConversationId,
}) {

const [searchQuery,setSearchQuery]=useState("");

const {
user,
logout
}=useAuth();



const renameConversation=async(id)=>{

const newName=
prompt("Enter new chat name");

if(!newName?.trim()) return;

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

console.log(
"Rename Error:",
error.response?.data || error
);

}

};




const filteredConversations=useMemo(()=>{

return conversations.filter((conversation)=>{

const title=
conversation.title ||
conversation.first_message ||
"New Chat";

return title
.toLowerCase()
.includes(
searchQuery.toLowerCase()
);

});

},
[
conversations,
searchQuery
]
);




return(

<div
className="
w-[280px]
h-screen
bg-[#0B1120]
border-r
border-gray-800
flex
flex-col
"
>

{/* Header */}

<div className="p-4 border-b border-gray-800">

<h1
className="
text-2xl
font-bold
text-blue-400
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
transition
"
>

+ New Chat

</button>


<input
type="text"
placeholder="Search..."
value={searchQuery}
onChange={(e)=>
setSearchQuery(
e.target.value
)
}
className="
w-full
mt-3
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



{/* Conversations */}

<div
className="
flex-1
overflow-y-auto
p-2
"
>

{

filteredConversations.length===0

?

<div
className="
text-center
text-gray-500
mt-8
"
>

No conversations yet

</div>

:

filteredConversations.map(
(conversation)=>{

const title=
conversation.title ||
conversation.first_message ||
"New Chat";

const id=
conversation.conversation_id ||
conversation.id;

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
transition
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
gap-2
opacity-0
group-hover:opacity-100
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

✏️

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

🗑

</button>

</div>

</div>

)

})

}

</div>



{/* User section */}

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

{user?.username || "User"}

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
transition
"
>

Logout

</button>

</div>

</div>

)

}