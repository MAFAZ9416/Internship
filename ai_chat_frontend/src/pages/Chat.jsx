import { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ChatInput from "../components/ChatInput";

export default function Chat() {

    const [messages,setMessages]=useState([]);
    const [conversations,setConversations]=useState([]);
    const [currentConversationId,setCurrentConversationId]=useState(null);
    const [isLoadingHistory,setIsLoadingHistory]=useState(false);
    const [isTyping,setIsTyping]=useState(false);


    const fetchConversations=useCallback(async()=>{

        try{

            setIsLoadingHistory(true);

            const response=
            await api.get("/history/");

            const history=
            Array.isArray(response.data)
            ? response.data
            : response.data.results || [];

            setConversations(history);

        }

        catch(error){

            console.log(
                "History Error:",
                error.response?.data || error
            );

        }

        finally{

            setIsLoadingHistory(false);

        }

    },[]);



    useEffect(()=>{

        fetchConversations();

    },[fetchConversations]);



    const sendMessage=async(message)=>{

        if(!message.trim()) return;


        const userMessage={

            role:"user",
            content:message,
            timestamp:new Date()

        };


        setMessages((prev)=>[
            ...prev,
            userMessage
        ]);


        setIsTyping(true);


        try{

            const payload={

                message:message

            };


            if(currentConversationId){

                payload.conversation_id=
                currentConversationId;

            }


            console.log(
                "Sending:",
                payload
            );


            const response=
            await api.post(
                "/",   // FIXED HERE
                payload
            );


            console.log(
                "Response:",
                response.data
            );


            const aiMessage={

                role:"assistant",

                content:
                response.data.response ||
                response.data.message ||
                "No response",

                timestamp:new Date()

            };


            setMessages((prev)=>[
                ...prev,
                aiMessage
            ]);


            if(response.data.conversation_id){

                setCurrentConversationId(
                    response.data.conversation_id
                );

            }


            fetchConversations();

        }

        catch(error){

            console.log(
                "Chat Error:",
                error.response?.data || error
            );

            setMessages((prev)=>[
                ...prev,
                {

                    role:"assistant",

                    content:
                    "Error generating response"

                }

            ]);

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

            if(
                currentConversationId===id
            ){

                newChat();

            }

        }

        catch(error){

            console.log(error);

        }

    };



    return(

<div className="flex h-screen bg-[#020c1b]">

<Sidebar
conversations={conversations}
onSelectConversation={selectConversation}
onNewChat={newChat}
onDeleteConversation={deleteConversation}
activeConversationId={currentConversationId}
isLoadingHistory={isLoadingHistory}
/>

<div className="flex flex-col flex-1">

<ChatWindow
messages={messages}
isTyping={isTyping}
/>

<ChatInput
onSend={sendMessage}
/>

</div>

</div>

);

}