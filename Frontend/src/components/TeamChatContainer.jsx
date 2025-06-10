// Frontend/src/components/TeamChatContainer.jsx
import { useEffect, useRef } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import MessageInput from "./MessageInput"; // Will be adapted later
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";
import { Users } from "lucide-react"; // Icon for header

const TeamChatContainer = () => {
  const {
    teamMessages,
    getTeamMessages,
    isTeamMessagesLoading,
    addMessageToStore, // Will be used by socket listener
  } = useChatStore();
  const { authUser, currentTeam, socket } = useAuthStore();
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (currentTeam?._id) {
      getTeamMessages(currentTeam._id);
    }
  }, [currentTeam?._id, getTeamMessages]);

  useEffect(() => {
    if (messageEndRef.current && teamMessages.length > 0) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [teamMessages]);

  useEffect(() => {
    if (!socket || !currentTeam?._id) return;

    const handleNewTeamMessage = (newMessage) => {
      // Check if the message belongs to the current team and is a team message
      if (newMessage.teamId === currentTeam._id && newMessage.type === 'team') {
        // We need a way to get sender's full info if not already in newMessage
        // For now, the message model on backend sends senderId.
        // The message object in store should ideally have populated sender info.
        // Let's assume addMessageToStore handles this or we adapt.
        addMessageToStore(newMessage);
      }
    };

    socket.on("newMessage", handleNewTeamMessage);
    return () => {
      socket.off("newMessage", handleNewTeamMessage);
    };
  }, [socket, currentTeam?._id, addMessageToStore]);


  if (!currentTeam) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10">
        <Users size={60} className="text-zinc-400 mb-4" />
        <p className="text-xl text-zinc-400">No team selected.</p>
        <p className="text-zinc-500">Join or create a team to start chatting.</p>
      </div>
    );
  }

  if (isTeamMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <div className="p-4 border-b border-base-300 flex items-center gap-3">
          <Users /> <h2 className="font-semibold text-lg">{currentTeam.name} - Team Chat</h2>
        </div>
        <MessageSkeleton />
        {/* MessageInput will be part of the non-loading state */}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-auto">
      {/* Team Chat Header */}
      <div className="p-4 border-b border-base-300 flex items-center gap-3 sticky top-0 bg-base-100 z-10">
        <div className="avatar placeholder">
          <div className="bg-neutral text-neutral-content rounded-full w-10 h-10">
            <Users size={20}/>
          </div>
        </div>
        <div>
          <h2 className="font-semibold text-lg">{currentTeam.name}</h2>
          <span className="text-xs text-zinc-400">Team Group Chat</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {teamMessages.map((message) => {
          // To display sender's name, we need it. Assume message.senderId is an object with fullName, profilePic
          // If not, this part needs adjustment after backend message population or frontend user caching
          const sender = message.senderId; // This should be the populated sender object
          const isOwnMessage = sender?._id === authUser?._id;

          return (
            <div
              key={message._id}
              className={`chat ${isOwnMessage ? "chat-end" : "chat-start"}`}
              ref={messageEndRef}
            >
              <div className="chat-image avatar">
                <div className="w-10 rounded-full border">
                  <img
                    src={sender?.profilePic || "/avatar.png"}
                    alt={sender?.fullName || "User"}
                  />
                </div>
              </div>
              <div className="chat-header mb-1 flex items-center gap-2">
                <span className="text-sm font-medium">{isOwnMessage ? "You" : sender?.fullName || "Team Member"}</span>
                <time className="text-xs opacity-50">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              <div className={`chat-bubble flex flex-col ${isOwnMessage ? "bg-primary text-primary-content" : ""}`}>
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
          );
        })}
        {teamMessages.length === 0 && (
          <div className="text-center text-zinc-500 mt-10">
            No messages in this team yet. Start the conversation!
          </div>
        )}
      </div>

      {/* Message Input - Will pass type='team' and teamId */}
      <MessageInput chatId={currentTeam._id} messageType="team" />
    </div>
  );
};

export default TeamChatContainer;
