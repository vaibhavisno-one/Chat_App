// Frontend/src/components/ChatContainer.jsx
import { useChatStore } from "../store/useChatStore";
import { useEffect, useRef }
from "react";

import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput"; // Will be adapted in next step
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";

const ChatContainer = () => {
  const {
    messages,
    getMessages,
    isMessagesLoading,
    selectedUser,
    addMessageToStore, // Use generic addMessageToStore
  } = useChatStore();
  const { authUser, socket, currentTeam } = useAuthStore(); // Get socket and currentTeam
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (selectedUser?._id) {
      getMessages(selectedUser._id);
    }
    // Cleanup messages if selectedUser is null (handled by setSelectedUser in store)
  }, [selectedUser?._id, getMessages]);

  useEffect(() => {
    if (messageEndRef.current && messages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    if (!socket || !selectedUser || !currentTeam) return;

    const handleNewDirectMessage = (newMessage) => {
      if (
        newMessage.type === 'direct' &&
        newMessage.teamId === currentTeam._id &&
        ((newMessage.senderId?._id === selectedUser._id && newMessage.receiverId?._id === authUser._id) ||
         (newMessage.senderId?._id === authUser._id && newMessage.receiverId?._id === selectedUser._id))
      ) {
        addMessageToStore(newMessage);
      }
    };

    socket.on("newMessage", handleNewDirectMessage);
    return () => {
      socket.off("newMessage", handleNewDirectMessage);
    };
  }, [socket, selectedUser, authUser, currentTeam, addMessageToStore]);


  if (isMessagesLoading && selectedUser) { // Only show skeleton if a user is selected and loading
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader /> {/* ChatHeader might need selectedUser */}
        <MessageSkeleton />
        {/* MessageInput will be part of non-loading state */}
      </div>
    );
  }

  if (!selectedUser) {
      // This case should be handled by HomePage which shows NoChatSelected.
      // If ChatContainer is rendered without a selectedUser, it's an issue.
      // For robustness, can add a placeholder, but HomePage logic should prevent this.
      return <div className="flex-1 flex items-center justify-center"><p>Select a user to chat.</p></div>;
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader /> {/* ChatHeader uses selectedUser from store */}

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`chat ${message.senderId._id === authUser._id ? "chat-end" : "chat-start"}`} // Assuming senderId is populated
            ref={messageEndRef}
          >
            <div className="chat-image avatar">
              <div className="w-10 rounded-full border">
                <img
                  src={
                    message.senderId._id === authUser._id
                      ? authUser.profilePic || "/avatar.png"
                      : selectedUser.profilePic || "/avatar.png"
                  }
                  alt="profile pic"
                />
              </div>
            </div>
            <div className="chat-header mb-1 flex items-center gap-2">
               {/* For direct messages, sender name is not needed if it's just "You" or selectedUser.name */}
               {/* <span className="text-sm font-medium">{message.senderId._id === authUser._id ? "You" : selectedUser.fullName}</span> */}
              <time className="text-xs opacity-50">
                {formatMessageTime(message.createdAt)}
              </time>
            </div>
            <div className={`chat-bubble flex flex-col ${message.senderId._id === authUser._id ? "bg-primary text-primary-content" : ""}`}>
              {message.image && (
                <img
                  src={message.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2 object-cover"
                />
              )}
              {message.text && <p>{message.text}</p>}
            </div>
          </div>
        ))}
         {messages.length === 0 && !isMessagesLoading && (
            <div className="text-center text-zinc-500 mt-10">
                No messages yet with {selectedUser.fullName}. Say hi!
            </div>
        )}
      </div>

      {/* MessageInput will be passed chatId={selectedUser._id} and messageType="direct" */}
      <MessageInput chatId={selectedUser._id} messageType="direct" />
    </div>
  );
};
export default ChatContainer;