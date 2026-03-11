import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from './authStore';
import useChatStore from './chatStore';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null);
  const { token, isAuthenticated } = useAuthStore();
  const { addMessage, setTyping, setUserOnline, updateMessage, addRoom } = useChatStore();

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => console.log('🔌 Socket connected'));
    socket.on('disconnect', () => console.log('🔌 Socket disconnected'));

    socket.on('message:new', ({ message, roomId }) => {
      addMessage(message, roomId);
    });

    socket.on('typing:update', ({ userId, username, roomId, isTyping }) => {
      setTyping(userId, username, roomId, isTyping);
    });

    socket.on('user:status', ({ userId, isOnline }) => {
      setUserOnline(userId, isOnline);
    });

    socket.on('message:reacted', ({ messageId, reactions }) => {
      // Find which room this message belongs to - update all rooms
      const { messages } = useChatStore.getState();
      Object.keys(messages).forEach((roomId) => {
        const found = messages[roomId]?.find((m) => m._id === messageId);
        if (found) {
          updateMessage(messageId, { reactions }, roomId);
        }
      });
    });

    socket.on('message:deleted', ({ messageId, roomId }) => {
      updateMessage(messageId, { isDeleted: true, content: 'This message was deleted' }, roomId);
    });

    socket.on('room:new', ({ room }) => {
      addRoom(room);
    });

    socket.on('error', (err) => console.error('Socket error:', err));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token]);

  return (
    <SocketContext.Provider value={socketRef}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const socketRef = useContext(SocketContext);
  return socketRef?.current;
};

export default SocketContext;
