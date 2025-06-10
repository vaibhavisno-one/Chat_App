// Frontend/src/pages/HomePage.jsx
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore"; // Import useAuthStore

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected"; // Used if no team and no selected user
import ChatContainer from "../components/ChatContainer"; // For direct messages
import TeamChatContainer from "../components/TeamChatContainer"; // For team messages
import { useEffect } from "react";

const HomePage = () => {
  const { selectedUser, clearSelectedUser } = useChatStore();
  const { currentTeam } = useAuthStore(); // Get currentTeam

  // Effect to clear selected user if current team changes or becomes null
  // This prevents showing a DM from a previous team context.
  useEffect(() => {
    if (!currentTeam) {
      clearSelectedUser();
    }
    // Also, if selectedUser exists but is not in currentTeam (e.g. after leaving/joining new team), clear it.
    // This logic could be more robust in setSelectedUser in store, but this is a safeguard.
    if (selectedUser && currentTeam && selectedUser.team !== currentTeam._id) {
        clearSelectedUser();
    }

  }, [currentTeam, selectedUser, clearSelectedUser]);


  let mainContent;

  if (currentTeam) {
    if (selectedUser) {
      mainContent = <ChatContainer />;
    } else {
      // If in a team but no specific user is selected for DM, show team chat
      mainContent = <TeamChatContainer />;
    }
  } else {
    // Not in a team, Sidebar will show prompt to join/create.
    // NoChatSelected can show a generic message here.
    mainContent = <NoChatSelected message="Join or create a team to start chatting with your colleagues!" />;
  }

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4"> {/* Ensure navbar height is accounted for */}
        <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-6xl h-[calc(100vh-6rem)]"> {/* Adjusted shadow and height */}
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />
            {mainContent}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;