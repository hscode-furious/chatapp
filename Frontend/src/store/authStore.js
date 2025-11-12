import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

export const authStore = create((set, get) => ({
  loggedUser: null,
  onlineUsers: [],
  socket: null,

  signup: async (data) => {
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ loggedUser: res.data });
      toast.success("Signup successfull");
      get().connectSocket();
    } catch (error) {
      toast.error("Signup failed. Please try again.");
      set({ loggedUser: null });
    }
  },

  login: async (data) => {
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ loggedUser: res.data });
      toast.success("Login successfull");
      get().connectSocket();
    } catch (error) {
      toast.error("Login failed. please try again");
      set({ loggedUser: null });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.get("/auth/logout");
      set({ loggedUser: null });
      toast.success("Logout successful");
      get().disconnectSocket();
    } catch (error) {
      toast.error("Logout failed. please try again");
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ loggedUser: res.data });
      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Updating Profile failed.");
    }
  },

  connectSocket: () => {
    const { loggedUser } = get();
    const socket = io("http://localhost:5000", {
      query: { userId: loggedUser._id },
    });
    socket.connect();
    set({ socket: socket });
    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
      console.log(userIds);
    });
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },
}));