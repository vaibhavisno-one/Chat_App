// Frontend/src/store/useAuthStore.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  currentTeam: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data, currentTeam: res.data.team || null });
      if (res.data) { // Connect socket only if authUser is successfully fetched
        get().connectSocket();
      }
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null, currentTeam: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data, currentTeam: res.data.team || null });
      toast.success("Account created successfully");
      get().connectSocket(); // Connect socket after signup
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data, currentTeam: res.data.team || null });
      toast.success("Logged in successfully");
      get().connectSocket(); // Connect socket after login
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      // Emit leaveTeamRoom before actual logout and socket disconnect
      const { socket, currentTeam } = get();
      if (socket?.connected && currentTeam?._id) {
        socket.emit("leaveTeamRoom", currentTeam._id);
      }
      await axiosInstance.post("/auth/logout");
      set({ authUser: null, currentTeam: null });
      toast.success("Logged out successfully");
      get().disconnectSocket(); // Disconnect socket after logout
    } catch (error) {
      toast.error(error.response?.data?.message || "Logout failed");
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response?.data?.message || "Profile update failed");
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  setCurrentTeam: (team) => {
    const { socket, currentTeam: oldTeam } = get();
    // If changing teams, leave old room and join new one
    if (socket?.connected) {
      if (oldTeam?._id && oldTeam._id !== team?._id) {
        socket.emit("leaveTeamRoom", oldTeam._id);
      }
      if (team?._id) {
        socket.emit("joinTeamRoom", team._id);
      }
    }
    set({ currentTeam: team });
    const authUser = get().authUser;
    if (authUser) {
        // Update authUser.team to be the full team object or null
        set({ authUser: {...authUser, team: team }});
    }
  },

  connectSocket: () => {
    const { authUser } = get(); // Get authUser, currentTeam will be fetched inside connect handler
    if (!authUser || get().socket?.connected) return;

    // Pass userId in query for backend to identify user
    const newSocket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
      set({ socket: newSocket }); // Set socket in store once connected

      // If user is part of a team, emit event to join team room
      const currentTeamFromStore = get().currentTeam; // Re-fetch currentTeam from store
      if (currentTeamFromStore?._id) {
        newSocket.emit("joinTeamRoom", currentTeamFromStore._id);
        console.log(`Emitted joinTeamRoom for team ${currentTeamFromStore._id}`);
      }

      newSocket.on("getOnlineUsers", (userIds) => {
        set({ onlineUsers: userIds });
      });
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      // No need to set socket to null here, as disconnectSocket handles cleanup
    });

    newSocket.on("connect_error", (err) => {
      console.error("Socket connection error:", err.message);
      // Potentially set socket to null or attempt reconnect with backoff later
    });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket?.connected) {
        socket.disconnect();
    }
    set({ socket: null, onlineUsers: [] });
  },
}));
