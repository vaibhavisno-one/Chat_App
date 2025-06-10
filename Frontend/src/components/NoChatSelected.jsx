// Frontend/src/components/NoChatSelected.jsx
import { MessagesSquare } from "lucide-react";

const NoChatSelected = ({ message }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
      <MessagesSquare size={80} className="text-zinc-400 mb-6" />
      <h2 className="text-2xl font-semibold text-zinc-300 mb-2">Welcome!</h2>
      <p className="text-zinc-400">
        {message || "Select a conversation from the sidebar to start messaging."}
      </p>
      {/* Optionally, if no team, guide to team creation/join page */}
    </div>
  );
};

export default NoChatSelected;