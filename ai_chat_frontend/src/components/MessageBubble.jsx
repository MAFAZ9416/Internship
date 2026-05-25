import React, { useState } from "react";
import Toast from "./Toast";

export default function MessageBubble({
  message,
  isUser,
  onEditMessage
}) {

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(
    message.content || ""
  );
  const [isSaving, setIsSaving] = useState(false);

  const content = message.content || "No message";

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);

      setToastMessage("Copied ✓");
      setShowToast(true);

    } catch (error) {
      console.log(error);
    }
  };

  const handleSaveEdit = async () => {

    if (!editedText.trim()) return;

    setIsSaving(true);

    try {

      await onEditMessage(
        message.id,
        editedText
      );

      setIsEditing(false);

      setToastMessage("Updated ✓");
      setShowToast(true);

    } catch (error) {

      console.log(error);

    } finally {

      setIsSaving(false);

    }

  };

  return (

    <div
      className={`flex ${
        isUser
          ? "justify-end"
          : "justify-start"
      } mb-4`}
    >

      <div
        className="
        max-w-[80%]
        rounded-2xl
        px-4
        py-3
        text-white
        "
        style={{
          background:
            isUser
              ? "#1E3A8A"
              : "#111827"
        }}
      >

        {isEditing ? (

          <>

            <textarea
              value={editedText}
              onChange={(e)=>
                setEditedText(
                  e.target.value
                )
              }
              className="
              w-full
              bg-[#0B1120]
              p-2
              rounded
              text-white
              "
            />

            <div
              className="
              flex
              gap-2
              mt-2
              "
            >

              <button
                onClick={() =>
                  setIsEditing(false)
                }
                className="
                bg-gray-600
                px-2
                py-1
                rounded
                "
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEdit}
                className="
                bg-blue-600
                px-2
                py-1
                rounded
                "
              >
                {
                  isSaving
                    ? "Saving..."
                    : "Save"
                }
              </button>

            </div>

          </>

        ) : (

          <>

            {message.files?.length > 0 && (

              <div
                className="
                flex
                flex-col
                gap-3
                mb-3
                "
              >

                {message.files.map((file,index)=>{

                  const fileType=
                  file.type ||
                  file.file_type;

                  const fileUrl=
                  file.preview ||
                  file.url ||
                  file.file;

                  const fileName=
                  file.name ||
                  file.file_name;

                  return(

                    <div
                      key={index}
                      className="
                      bg-[#1E293B]
                      rounded-xl
                      p-3
                      border
                      border-gray-700
                      "
                    >

                      {["png","jpg","jpeg","webp"].includes(fileType) && (

                        <img
                          src={fileUrl}
                          alt={fileName}
                          className="
                          rounded-lg
                          max-w-full
                          max-h-[250px]
                          object-cover
                          "
                        />

                      )}

                      {fileType==="pdf" && (

                        <div
                          className="
                          flex
                          items-center
                          gap-3
                          "
                        >

                          <div className="text-3xl">
                            📄
                          </div>

                          <div>

                            <p>
                              {fileName}
                            </p>

                            <p
                              className="
                              text-xs
                              text-gray-400
                              "
                            >
                              PDF Document
                            </p>

                          </div>

                        </div>

                      )}

                      {fileType==="mp3" && (

                        <div className="flex items-center gap-3">

                          <div className="text-3xl">
                            🎵
                          </div>

                          <div>

                            <p>{fileName}</p>

                            <audio 
                              controls 
                              className="
                                text-xs
                                bg-gray-700
                                rounded
                                mt-2
                                w-64
                              "
                            >
                              <source src={fileUrl} type="audio/mpeg" />
                              Your browser does not support the audio element.
                            </audio>

                          </div>

                        </div>

                      )}

                      {fileType==="wav" && (

                        <div className="flex items-center gap-3">

                          <div className="text-3xl">
                            🎵
                          </div>

                          <div>

                            <p>{fileName}</p>

                            <audio 
                              controls 
                              className="
                                text-xs
                                bg-gray-700
                                rounded
                                mt-2
                                w-64
                              "
                            >
                              <source src={fileUrl} type="audio/wav" />
                              Your browser does not support the audio element.
                            </audio>

                          </div>

                        </div>

                      )}

                      {["mp4","mov"].includes(fileType) && (

                        <div className="flex items-center gap-3">

                          <div className="text-3xl">
                            🎬
                          </div>

                          <div>

                            <p className="font-semibold">{fileName}</p>

                            <video 
                              controls 
                              className="
                                rounded-lg
                                max-w-full
                                max-h-[300px]
                                mt-2
                                bg-black
                              "
                            >
                              <source src={fileUrl} type={fileType==="mp4"?"video/mp4":"video/quicktime"} />
                              Your browser does not support the video element.
                            </video>

                          </div>

                        </div>

                      )}

                      {["txt","docx"].includes(fileType) && (

                        <div className="flex items-center gap-3">

                          <div className="text-3xl">
                            📄
                          </div>

                          <div>

                            <p>{fileName}</p>

                            <p className="text-xs text-gray-400">
                              {fileType==="docx"?"Word Document":"Text File"}
                            </p>

                          </div>

                        </div>

                      )}

                    </div>

                  );

                })}

              </div>

            )}

            <p
              className="
              whitespace-pre-wrap
              mb-3
              "
            >
              {content}
            </p>

            <div
              className="
              flex
              gap-2
              mt-2
              "
            >

              {isUser && (

                <button
                  onClick={() =>
                    setIsEditing(true)
                  }
                  className="
                  text-xs
                  bg-purple-600
                  px-2
                  py-1
                  rounded
                  "
                >
                  ✏️ Edit
                </button>

              )}

              <button
                onClick={() =>
                  copyToClipboard(
                    content
                  )
                }
                className="
                text-xs
                bg-gray-600
                px-2
                py-1
                rounded
                "
              >
                📋 Copy
              </button>

            </div>

          </>

        )}

      </div>

      <Toast
        isVisible={showToast}
        message={toastMessage}
        duration={1500}
      />

    </div>

  );

}