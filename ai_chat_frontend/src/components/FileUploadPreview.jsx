import React from "react";

export default function FileUploadPreview({

files=[],
onRemoveFile,
uploadProgress={}

}){

const getFileIcon=(fileName)=>{

const extension=
fileName
.split(".")
.pop()
.toLowerCase();

const iconMap={

pdf:"📄",
docx:"📝",
doc:"📝",
txt:"📋",

png:"🖼️",
jpg:"🖼️",
jpeg:"🖼️",
webp:"🖼️",

mp3:"🎵",
wav:"🎵",

mp4:"🎬",
mov:"🎬"

};

return iconMap[
extension
] || "📎";

};



const formatFileSize=(bytes)=>{

if(bytes===0)
return "0 Bytes";

const k=1024;

const sizes=[

"Bytes",
"KB",
"MB",
"GB"

];

const i=
Math.floor(
Math.log(bytes)/
Math.log(k)
);

return (

Math.round(

(bytes/
Math.pow(k,i))

*100

)/100

+" "+sizes[i]

);

};



if(files.length===0){

return null;

}



return(

<div
className="
bg-[#111827]
border
border-gray-700
rounded-lg
p-3
mb-3
max-h-52
overflow-y-auto
"
>

<div
className="
text-xs
text-gray-400
mb-2
font-semibold
"
>

Attached Files
(
{files.length}
)

</div>


<div className="space-y-2">

{

files.map(
(file,index)=>{

const progress=

uploadProgress[
file.name
] || 0;

return(

<div

key={index}

className="
flex
items-center
justify-between
bg-[#0B1120]
p-3
rounded-lg
hover:bg-[#1E293B]
transition
"

>

<div
className="
flex
items-center
gap-2
flex-1
min-w-0
"
>

<span className="text-lg">

{
getFileIcon(
file.name
)
}

</span>


<div
className="
flex-1
min-w-0
"
>

<div
className="
text-sm
text-white
truncate
"
>

{file.name}

</div>


<div
className="
text-xs
text-gray-500
"
>

{
formatFileSize(
file.size
)
}

</div>


{/* Progress */}

<div
className="
w-full
h-2
bg-gray-700
rounded-full
mt-2
overflow-hidden
"
>

<div

className="
h-full
bg-blue-500
transition-all
duration-300
"

style={{

width:
`${progress}%`

}}

></div>

</div>


<div
className="
text-[10px]
text-gray-400
mt-1
"
>

{progress}%

</div>

</div>

</div>


<button

onClick={()=>
onRemoveFile(
index
)
}

className="
ml-2
w-6
h-6
rounded
hover:bg-red-600
text-gray-400
hover:text-white
flex
items-center
justify-center
"

>

✕

</button>

</div>

);

})

}

</div>

</div>

);

}