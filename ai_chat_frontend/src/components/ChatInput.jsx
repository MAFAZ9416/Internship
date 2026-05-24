import { useState, useRef } from "react";
import FileUploadPreview from "./FileUploadPreview";

export default function ChatInput({ onSend }) {

const [message,setMessage]=useState("");
const [selectedFiles,setSelectedFiles]=useState([]);
const [showUploadMenu,setShowUploadMenu]=useState(false);

const fileInputRef=useRef(null);

const handleFileSelect=(e)=>{

const files=
Array.from(
e.target.files || []
);

setSelectedFiles(prev=>[
...prev,
...files
]);

if(fileInputRef.current){

fileInputRef.current.value="";

}

};


const handleRemoveFile=(index)=>{

setSelectedFiles(

prev=>
prev.filter(
(_,i)=>i!==index
)

);

};



const handleUploadType=(type)=>{

let acceptTypes="";

switch(type){

case "image":

acceptTypes=
"image/png,image/jpeg,image/webp";

break;

case "document":

acceptTypes=
"application/pdf,.docx,text/plain";

break;

case "audio":

acceptTypes=
"audio/mpeg,audio/wav";

break;

case "video":

acceptTypes=
"video/mp4,video/quicktime";

break;

default:

acceptTypes="*";

}

fileInputRef.current.accept=
acceptTypes;

fileInputRef.current.click();

setShowUploadMenu(false);

};



const handleSubmit=(e)=>{

e.preventDefault();

if(
!message.trim() &&
selectedFiles.length===0
)
return;

onSend({

message:message,
files:selectedFiles

});

setMessage("");
setSelectedFiles([]);

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
flex-col
justify-center
relative
"
>

<div
className="
w-full
max-w-4xl
mx-auto
mb-3
"
>

<FileUploadPreview
files={selectedFiles}
onRemoveFile={handleRemoveFile}
/>

</div>


<form
onSubmit={handleSubmit}
className="
w-full
max-w-4xl
mx-auto
flex
items-center
gap-3
relative
"
>

<input
ref={fileInputRef}
type="file"
multiple
onChange={handleFileSelect}
className="hidden"
/>


<div className="relative">

<button
type="button"
onClick={()=>
setShowUploadMenu(
!showUploadMenu
)
}
className="
w-10
h-10
rounded-full
bg-gray-700
hover:bg-gray-600
text-white
text-lg
flex
items-center
justify-center
transition
"
>

📎

</button>



{

showUploadMenu && (

<div
className="
absolute
bottom-14
left-0
bg-[#111827]
border
border-gray-700
rounded-xl
shadow-lg
p-2
w-44
z-50
"
>

<button
type="button"
onClick={()=>
handleUploadType(
"image"
)
}
className="
w-full
text-left
px-3
py-2
hover:bg-[#1E293B]
rounded-lg
text-white
"
>

🖼 Image

</button>



<button
type="button"
onClick={()=>
handleUploadType(
"document"
)
}
className="
w-full
text-left
px-3
py-2
hover:bg-[#1E293B]
rounded-lg
text-white
"
>

📄 Document

</button>



<button
type="button"
onClick={()=>
handleUploadType(
"audio"
)
}
className="
w-full
text-left
px-3
py-2
hover:bg-[#1E293B]
rounded-lg
text-white
"
>

🎵 Audio

</button>



<button
type="button"
onClick={()=>
handleUploadType(
"video"
)
}
className="
w-full
text-left
px-3
py-2
hover:bg-[#1E293B]
rounded-lg
text-white
"
>

🎬 Video

</button>



<button
type="button"
onClick={()=>
handleUploadType(
"all"
)
}
className="
w-full
text-left
px-3
py-2
hover:bg-[#1E293B]
rounded-lg
text-white
"
>

📁 File

</button>

</div>

)

}

</div>



<input
type="text"
value={message}
placeholder="Type your message..."
onChange={(e)=>
setMessage(
e.target.value
)
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
flex
items-center
justify-center
transition
"
>

➤

</button>

</form>

</div>

);

}