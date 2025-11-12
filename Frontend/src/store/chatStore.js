import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { authStore } from "./authStore";

export const chatStore = create((set, get) => ({
  users: [],
  messages: [],
  selectedUser: null,

  getUsers: async () => {
    try {
      const res = await axiosInstance.get("/message/users");
      set({ users: res.data });
    } catch (error) {
      toast.error("Failed to fetch users.");
      set({ users: [] });
    }
  },

  getMessages: async () => {
    const { selectedUser } = get();
    if (!selectedUser) return;
    try {
      const res = await axiosInstance.get(
        `/message/getmessages/${selectedUser._id}`
      );
      set({ messages: res.data });
    } catch (error) {
      toast.error("Failed to fetch messages.");
      set({ messages: [] });
    }
  },

  sendMessage: async (data) => {
    const { selectedUser, messages } = get();
    try {
      console.log("Sending message to:", selectedUser._id);
      console.log("Message data:", { text: data.text ? "exists" : "empty", image: data.image ? "exists" : "empty" });
      const res = await axiosInstance.post(
        `/message/sendmessage/${selectedUser._id}`,
        data
      );
      set({ messages: [...messages, res.data] });
      toast.success("Message sent successfully.");
    } catch (error) {
      console.error("Error sending message:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/message/deletemessage/${messageId}`);
      const { messages } = get();
      set({ messages: messages.filter((msg) => msg._id !== messageId) });
      toast.success("Message deleted successfully.");
    } catch (error) {
      console.error("Error deleting message:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
  },

  setSelectedUser: (user) => set({ selectedUser: user }),

  listenForNewMessage: () => {
    const socket = authStore.getState().socket;
    if (socket) {
      socket.on("newMessage", (newMessage) => {
        // Security: Only add message if it's for the current conversation
        const { loggedUser } = authStore.getState();
        const { selectedUser, messages } = get();
        
        if (!loggedUser || !selectedUser) return;
        
        // Only add if message is between logged user and selected user
        const isForCurrentConversation =
          (newMessage.senderId === loggedUser._id &&
            newMessage.receiverId === selectedUser._id) ||
          (newMessage.senderId === selectedUser._id &&
            newMessage.receiverId === loggedUser._id);
        
        if (isForCurrentConversation) {
          // Check if message already exists to prevent duplicates
          const messageExists = messages.some((msg) => msg._id === newMessage._id);
          if (!messageExists) {
            set({ messages: [...messages, newMessage] });
          }
        }
      });
      
      socket.on("messageDeleted", ({ messageId }) => {
        // Security: Only remove message if it exists in current conversation
        const { messages } = get();
        const messageExists = messages.some((msg) => msg._id === messageId);
        if (messageExists) {
          set({ messages: messages.filter((msg) => msg._id !== messageId) });
        }
      });
    }
  },

  stopListeningForMessages: () => {
    const socket = authStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("messageDeleted");
    }
  },
}));