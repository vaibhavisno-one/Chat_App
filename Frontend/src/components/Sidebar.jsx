// Frontend/src/components/Sidebar.jsx
import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, LogIn } from "lucide-react"; // Added LogIn for link icon
import { Link } from "react-router-dom"; // For linking to /teams

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();
  const { onlineUsers, currentTeam, authUser } = useAuthStore(); // Added currentTeam
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  useEffect(() => {
    // Only fetch users if the user is part of a team
    if (currentTeam) {
      getUsers();
    }
  }, [getUsers, currentTeam]);

  // Filter users based on online status and ensure they are part of the current team.
  // The `getUsers` endpoint should already only return team members.
  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  // Calculate online team members count for display
  // This assumes `users` are already filtered by team by the `getUsers` call
  const onlineTeamMembersCount = users.filter(user => onlineUsers.includes(user._id) && user._id !== authUser?._id).length;


  if (!currentTeam) {
    return (
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200 p-5 justify-center items-center">
        <div className="text-center">
          <Users size={48} className="text-zinc-500 mb-4 mx-auto" />
          <p className="mb-4 text-zinc-400 hidden lg:block">You are not in a team.</p>
          <Link to="/teams" className="btn btn-primary btn-sm lg:btn-md">
            <LogIn size={18} className="mr-1 hidden lg:inline" />
            Join or Create Team
          </Link>
        </div>
      </aside>
    );
  }

  if (isUsersLoading) return <SidebarSkeleton />;

  return (
    <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
      <div className="border-b border-base-300 w-full p-5">
        <div className="flex items-center gap-2">
          <Users className="size-6" />
          <span className="font-medium hidden lg:block">Team Contacts</span>
        </div>
        <div className="mt-3 hidden lg:flex items-center gap-2">
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          {/* Display count of online team members */}
          <span className="text-xs text-zinc-500">({onlineTeamMembersCount} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => setSelectedUser(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
          >
            <div className="relative mx-auto lg:mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={user.fullName} // Changed from user.name to user.fullName
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-base-100" // Ring color changed for better visibility
                />
              )}
            </div>

            <div className="hidden lg:block text-left min-w-0">
              <div className="font-medium truncate">{user.fullName}</div>
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && !isUsersLoading && (
          <div className="text-center text-zinc-500 py-4 hidden lg:block">No other members in this team.</div>
        )}
         {filteredUsers.length === 0 && !isUsersLoading && users.length > 0 && ( // handles only self in team
          <div className="text-center text-zinc-500 py-4 hidden lg:block">You are the only one here.</div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;