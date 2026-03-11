import { create } from 'zustand';
import { roomsAPI } from '../services/api';

const useChatStore = create((set, get) => ({
  rooms: [],
  activeRoom: null,
  messages: {},
  typingUsers: {},
  onlineUsers: new Set(),
  isLoadingRooms: false,
  isLoadingMessages: false,

  fetchRooms: async () => {
    set({ isLoadingRooms: true });
    try {
      const { data } = await roomsAPI.getAll();
      set({ rooms: data.rooms, isLoadingRooms: false });
    } catch {
      set({ isLoadingRooms: false });
    }
  },

  setActiveRoom: async (room) => {
    set({ activeRoom: room, isLoadingMessages: true });
    try {
      const { data } = await roomsAPI.getMessages(room._id);
      set((state) => ({
        messages: { ...state.messages, [room._id]: data.messages },
        isLoadingMessages: false,
      }));
    } catch {
      set({ isLoadingMessages: false });
    }
  },

  addRoom: (room) => {
    set((state) => {
      const exists = state.rooms.find((r) => r._id === room._id);
      if (exists) return state;
      return { rooms: [room, ...state.rooms] };
    });
  },

  addMessage: (message, roomId) => {
    set((state) => {
      const roomMessages = state.messages[roomId] || [];
      const exists = roomMessages.find((m) => m._id === message._id);
      if (exists) return state;

      const updatedRooms = state.rooms.map((r) => {
        if (r._id === roomId) {
          return { ...r, lastMessage: message, lastActivity: message.createdAt };
        }
        return r;
      }).sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));

      return {
        messages: { ...state.messages, [roomId]: [...roomMessages, message] },
        rooms: updatedRooms,
      };
    });
  },

  updateMessage: (messageId, updates, roomId) => {
    set((state) => {
      const roomMessages = state.messages[roomId] || [];
      return {
        messages: {
          ...state.messages,
          [roomId]: roomMessages.map((m) =>
            m._id === messageId ? { ...m, ...updates } : m
          ),
        },
      };
    });
  },

  setTyping: (userId, username, roomId, isTyping) => {
    set((state) => {
      const roomTyping = state.typingUsers[roomId] || {};
      if (isTyping) {
        return { typingUsers: { ...state.typingUsers, [roomId]: { ...roomTyping, [userId]: username } } };
      } else {
        const { [userId]: _, ...rest } = roomTyping;
        return { typingUsers: { ...state.typingUsers, [roomId]: rest } };
      }
    });
  },

  setUserOnline: (userId, isOnline) => {
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      if (isOnline) newOnlineUsers.add(userId);
      else newOnlineUsers.delete(userId);
      return { onlineUsers: newOnlineUsers };
    });
  },
}));

export default useChatStore;
