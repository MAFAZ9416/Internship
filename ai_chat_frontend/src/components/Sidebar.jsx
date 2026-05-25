import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api, { apiMethods } from "../services/api";

import {
  FaEdit,
  FaTrash,
  FaArchive,
  FaUndo,
  FaSearch,
  FaStar,
  FaBars,
  FaTimes
} from "react-icons/fa";

export default function Sidebar({
  conversations = [],
  archivedConversations = [],

  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onArchiveConversation,
  onRestoreConversation,
  onPinConversation,
  onUnpinConversation,

  activeConversationId,

  sidebarWidth = 280,
  onSidebarWidthChange,

  isCollapsed = false,
  onToggleCollapsed,

  showArchivedChats = false,
  onToggleShowArchivedChats

}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isResizing, setIsResizing] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const sidebarRef = useRef(null);
  const { user, logout } = useAuth();

  // Check if mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const newWidth = e.clientX;

      if (newWidth > 200 && newWidth < 600) {
        onSidebarWidthChange?.(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, onSidebarWidthChange]);

  // Close mobile sidebar on conversation select
  const handleSelectConversation = (id) => {
    onSelectConversation(id);
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  const renameConversation = async (id) => {
    const newName = prompt("Enter new chat name");

    if (!newName?.trim()) return;

    try {
      await api.patch(`history/${id}/rename/`, {
        title: newName
      });

      window.location.reload();
    } catch (error) {
      console.log(error);
    }
  };

  const handlePin = async (e, id) => {
    e.stopPropagation();
    try {
      await apiMethods.pin(id);
      onPinConversation?.(id);
    } catch (error) {
      console.log("Pin error:", error);
    }
  };

  const handleUnpin = async (e, id) => {
    e.stopPropagation();
    try {
      await apiMethods.unpin(id);
      onUnpinConversation?.(id);
    } catch (error) {
      console.log("Unpin error:", error);
    }
  };

  // Separate pinned and recent conversations
  const pinnedConversations = useMemo(() => {
    return conversations.filter(c => c.is_pinned).sort((a, b) =>
      new Date(b.pinned_at) - new Date(a.pinned_at)
    );
  }, [conversations]);

  const recentConversations = useMemo(() => {
    return conversations.filter(c => !c.is_pinned).sort((a, b) =>
      new Date(b.updated_at) - new Date(a.updated_at)
    );
  }, [conversations]);

  const filteredRecent = useMemo(() => {
    return recentConversations.filter((conversation) => {
      const title = conversation.title || "New Chat";
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [recentConversations, searchQuery]);

  const filteredPinned = useMemo(() => {
    return pinnedConversations.filter((conversation) => {
      const title = conversation.title || "New Chat";
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [pinnedConversations, searchQuery]);

    const filteredArchived=
useMemo(()=>{

return archivedConversations;

},[
archivedConversations
]);

  // Render conversation item
  const renderConversationItem = (conversation, isPinned = false) => {
    const id = conversation.id;
    const title = conversation.title;
    const active = id === activeConversationId;

    return (
      <div
        key={id}
        onClick={() => handleSelectConversation(id)}
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
          ${active ? "bg-blue-700" : "hover:bg-[#1E293B]"}
        `}
      >
        <span className="truncate text-sm text-white flex-1">
          {title}
        </span>

        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition flex-shrink-0">
          {!isPinned ? (
            <button
              onClick={(e) => handlePin(e, id)}
              className="text-yellow-400 hover:text-yellow-300"
              title="Pin chat"
            >
              <FaStar size={13} />
            </button>
          ) : (
            <button
              onClick={(e) => handleUnpin(e, id)}
              className="text-yellow-400"
              title="Unpin chat"
            >
              <FaStar size={13} />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              renameConversation(id);
            }}
            className="text-blue-400 hover:text-blue-300"
            title="Rename chat"
          >
            <FaEdit size={13} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchiveConversation(id);
            }}
            className="text-yellow-500 hover:text-yellow-400"
            title="Archive chat"
          >
            <FaArchive size={13} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConversation(id);
            }}
            className="text-red-400 hover:text-red-300"
            title="Delete chat"
          >
            <FaTrash size={13} />
          </button>
        </div>
      </div>
    );
  };

  // Mobile hamburger button
  if (isMobile && isCollapsed) {
    return (
      <button
        onClick={() => setIsMobileSidebarOpen(true)}
        className="
          fixed
          top-4
          left-4
          z-50
          bg-blue-600
          hover:bg-blue-700
          text-white
          p-3
          rounded-lg
          md:hidden
        "
        title="Open menu"
      >
        <FaBars size={20} />
      </button>
    );
  }

  // Mobile overlay sidebar
  if (isMobile && isMobileSidebarOpen) {
    return (
      <div className="fixed inset-0 z-40 md:hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        {/* Sidebar */}
        <div
          className="
            absolute
            left-0
            top-0
            bottom-0
            w-64
            bg-[#0B1120]
            border-r
            border-gray-800
            flex
            flex-col
            overflow-y-auto
          "
        >
          {/* Close button */}
          <button
            onClick={() => setIsMobileSidebarOpen(false)}
            className="
              absolute
              top-4
              right-4
              text-gray-400
              hover:text-white
              z-50
            "
          >
            <FaTimes size={20} />
          </button>

          {/* Header */}
          <div className="p-4 border-b border-gray-800 mt-8">
            <h1 className="text-2xl font-bold text-blue-400 text-center">
              AI Chat
            </h1>

            <button
              onClick={() => {
                onNewChat();
                setIsMobileSidebarOpen(false);
              }}
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
          </div>

          {/* Content - scrollable */}
          <div className="flex-1 overflow-y-auto p-2">
            {/* Search */}
            <div className="px-2 py-3">
              <div className="relative">
                <FaSearch
                  className="absolute left-3 top-3 text-gray-500"
                  size={14}
                />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                    text-sm
                  "
                />
              </div>
            </div>

            {/* Pinned section */}
            {filteredPinned.length > 0 && (
              <div className="px-2 py-3">
                <h3 className="text-xs text-gray-400 px-3 py-2 font-semibold">
                  📌 PINNED
                </h3>
                {filteredPinned.map((c) => renderConversationItem(c, true))}
              </div>
            )}

            {/* Recent section */}
            <div className="px-2 py-3">
              <h3 className="text-xs text-gray-400 px-3 py-2 font-semibold">
                RECENT CHATS
              </h3>
              {filteredRecent.length > 0 ? (
                filteredRecent.map((c) => renderConversationItem(c, false))
              ) : (
                <p className="text-xs text-gray-500 px-3 py-2">No chats yet</p>
              )}
            </div>

            {/* Archived section */}

{archivedConversations.length > 0 && (
  <div className="px-2 py-3 border-t border-gray-700">

    <h3
      className="
      text-xs
      text-gray-400
      px-3
      py-2
      font-semibold
      "
    >
      📦 ARCHIVED ({archivedConversations.length})
    </h3>

    {filteredArchived.map((conversation) => {

      const id = conversation.id;
      const title = conversation.title;
      const active = id === activeConversationId;

      return(

        <div
          key={id}
          onClick={() =>
            handleSelectConversation(id)
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
            text-gray-300
            flex-1
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
            transition
            "
          >

            <button
              onClick={(e)=>{

                e.stopPropagation();

                onRestoreConversation(id);

              }}
              className="
              text-green-400
              hover:text-green-300
              "
              title="Restore"
            >
              <FaUndo size={13}/>
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
              title="Delete permanently"
            >
              <FaTrash size={13}/>
            </button>

          </div>

        </div>

      );

    })}

  </div>
)}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-800">
            <button
              onClick={logout}
              className="
                w-full
                bg-red-600
                hover:bg-red-700
                text-white
                rounded-lg
                py-2
                text-sm
              "
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isCollapsed) {
    return null;
  }

  return (
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
        hidden
        md:flex
      "
      style={{
        width: `${sidebarWidth}px`
      }}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-blue-400 text-center">
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
            className="absolute left-3 top-3 text-gray-500"
            size={14}
          />

          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
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
              text-sm
            "
          />
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Pinned section */}
        {filteredPinned.length > 0 && (
          <div>
            <h3 className="text-xs text-gray-400 px-3 py-2 font-semibold">
              📌 PINNED CHATS
            </h3>

            {filteredPinned.map((c) => renderConversationItem(c, true))}

            <hr className="my-2 border-gray-700" />
          </div>
        )}

        {/* ARCHIVED */}

{archivedConversations.length > 0 && (

<div className="mt-4">

<hr className="my-2 border-gray-700"/>

<button
onClick={() =>
onToggleShowArchivedChats?.(
!showArchivedChats
)
}
className="
w-full
text-left
text-xs
text-gray-400
px-3
py-2
font-semibold
hover:text-gray-300
transition
"
>

📦 ARCHIVED
({archivedConversations.length})

</button>


{showArchivedChats && (

<div className="mt-2">

{filteredArchived.map((conversation)=>{

const id=conversation.id;
const title=conversation.title;
const active=id===activeConversationId;

return(

<div
key={id}
onClick={() =>
handleSelectConversation(id)
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
${active
? "bg-blue-700"
: "hover:bg-[#1E293B]"
}
`}
>

<span
className="
truncate
text-sm
text-gray-300
flex-1
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
transition
"
>

<button
onClick={(e)=>{
e.stopPropagation();
onRestoreConversation(id);
}}
className="
text-green-400
hover:text-green-300
"
>
<FaUndo size={13}/>
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

)

})}

</div>

)}

</div>

)}

        <h3 className="text-xs text-gray-400 px-3 py-2 font-semibold">
          RECENT CHATS
        </h3>
        {filteredRecent.length > 0 ? (
          filteredRecent.map((c) => renderConversationItem(c, false))
        ) : (
          <p className="text-xs text-gray-500 px-3 py-2">No chats yet</p>
        )}
      </div>
      
      

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
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

      {/* Resize handle (desktop only) */}
      <div
        onMouseDown={() => setIsResizing(true)}
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
