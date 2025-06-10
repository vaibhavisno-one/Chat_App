// Frontend/src/store/useChatStore.js
import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore"; // Import useAuthStore

export const useChatStore = create((set, get) => ({
  // ... (state variables as before) ...
  messages: [],
  teamMessages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  isTeamMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get users");
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true, messages: [] });
    try {
      const res = await axiosInstance.get(`/messages/direct/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get direct messages");
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  getTeamMessages: async (teamId) => {
    set({ isTeamMessagesLoading: true, teamMessages: [] });
    try {
      const res = await axiosInstance.get(`/messages/team/${teamId}`);
      set({ teamMessages: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to get team messages");
    } finally {
      set({ isTeamMessagesLoading: false });
    }
  },

  sendMessage: async ({ chatId, messageType, text, image }) => {
    if (!chatId || !messageType) {
        const errMessage = "Chat ID or Message Type is missing.";
        toast.error(errMessage);
        throw new Error(errMessage);
    }
    try {
      const payload = { messageType, text, image };
      const res = await axiosInstance.post(`/messages/send/${chatId}`, payload);
      return res.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
      throw error;
    }
  },

  addMessageToStore: (newMessage) => {
    const authUser = useAuthStore.getState().authUser; // Get authUser here
    const currentTeamFromAuthStore = useAuthStore.getState().currentTeam;


    if (newMessage.type === 'direct') {
      const { selectedUser } = get();
      if (selectedUser && authUser && currentTeamFromAuthStore &&
          newMessage.teamId === currentTeamFromAuthStore._id && // Message must be in current team context
          ((newMessage.senderId?._id === selectedUser._id && newMessage.receiverId?._id === authUser._id) ||
           (newMessage.senderId?._id === authUser._id && newMessage.receiverId?._id === selectedUser._id))
         ) {
         set((state) => ({ messages: [...state.messages, newMessage] }));
      }
    } else if (newMessage.type === 'team') {
       // TeamChatContainer's socket listener already checks if (newMessage.teamId === currentTeam._id)
       // So, if addMessageToStore is called for a 'team' message, it's assumed to be for the current team.
       set((state) => ({ teamMessages: [...state.teamMessages, newMessage] }));
    }
  },

  setSelectedUser: (selectedUser) => {
    // When a new user is selected for DM, also ensure currentTeam context is accurate
    // This is more of a sanity check; selectedUser should always be from currentTeam.
    const currentTeamId = useAuthStore.getState().currentTeam?._id;
    if (selectedUser && selectedUser.team && selectedUser.team !== currentTeamId) {
        toast.error("Error: Selected user is not in your current team.");
        set({ selectedUser: null, messages: [] }); // Clear selection
        return;
    }
    set({ selectedUser, messages: [] });
  },
  clearSelectedUser: () => set({ selectedUser: null, messages: []}),
}));
