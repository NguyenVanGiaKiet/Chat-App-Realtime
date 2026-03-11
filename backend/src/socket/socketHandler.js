const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');

const connectedUsers = new Map(); // userId -> socketId

const socketHandler = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    connectedUsers.set(userId, socket.id);

    console.log(`🔌 User connected: ${socket.user.username} (${socket.id})`);

    // Update user online status
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Notify friends that user is online
    io.emit('user:status', { userId, isOnline: true });

    // Join all user's rooms
    const userRooms = await Room.find({ 'members.user': userId });
    userRooms.forEach((room) => {
      socket.join(room._id.toString());
    });

    // Handle joining a specific room
    socket.on('room:join', async (roomId) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return;

        const isMember = room.members.some((m) => m.user.toString() === userId);
        if (!isMember) return;

        socket.join(roomId);
        socket.emit('room:joined', { roomId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Handle sending a message
    socket.on('message:send', async (data) => {
      try {
        const { roomId, content, type = 'text', imageUrl, replyTo } = data;

        const room = await Room.findById(roomId);
        if (!room) return socket.emit('error', { message: 'Room not found' });

        const isMember = room.members.some((m) => m.user.toString() === userId);
        if (!isMember) return socket.emit('error', { message: 'Not a member' });

        const message = await Message.create({
          room: roomId,
          sender: userId,
          content: content || '',
          type,
          imageUrl: imageUrl || '',
          replyTo: replyTo || null,
        });

        await message.populate('sender', 'username avatar');
        if (replyTo) await message.populate('replyTo');

        // Update room's last message and activity
        await Room.findByIdAndUpdate(roomId, {
          lastMessage: message._id,
          lastActivity: new Date(),
        });

        // Emit to all members in the room
        io.to(roomId).emit('message:new', { message, roomId });

      } catch (err) {
        console.error('message:send error:', err);
        socket.emit('error', { message: err.message });
      }
    });

    // Handle typing indicator
    socket.on('typing:start', ({ roomId }) => {
      socket.to(roomId).emit('typing:update', {
        userId,
        username: socket.user.username,
        roomId,
        isTyping: true,
      });
    });

    socket.on('typing:stop', ({ roomId }) => {
      socket.to(roomId).emit('typing:update', {
        userId,
        username: socket.user.username,
        roomId,
        isTyping: false,
      });
    });

    // Handle message reaction via socket
    socket.on('message:react', async ({ messageId, emoji, roomId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;

        const existingReaction = message.reactions.find((r) => r.emoji === emoji);
        if (existingReaction) {
          const userIndex = existingReaction.users.findIndex(
            (u) => u.toString() === userId
          );
          if (userIndex > -1) {
            existingReaction.users.splice(userIndex, 1);
            if (existingReaction.users.length === 0) {
              message.reactions = message.reactions.filter((r) => r.emoji !== emoji);
            }
          } else {
            existingReaction.users.push(userId);
          }
        } else {
          message.reactions.push({ emoji, users: [userId] });
        }

        await message.save();
        io.to(roomId).emit('message:reacted', { messageId, reactions: message.reactions });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Handle message delete via socket
    socket.on('message:delete', async ({ messageId, roomId }) => {
      try {
        const message = await Message.findById(messageId);
        if (!message) return;
        if (message.sender.toString() !== userId) return;

        message.isDeleted = true;
        message.content = 'This message was deleted';
        await message.save();

        io.to(roomId).emit('message:deleted', { messageId, roomId });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Handle room creation notification
    socket.on('room:created', async ({ room }) => {
      try {
        // Notify all members to join the room
        room.members.forEach((member) => {
          const memberSocketId = connectedUsers.get(member.user._id?.toString() || member.user?.toString());
          if (memberSocketId) {
            io.to(memberSocketId).emit('room:new', { room });
          }
        });
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 User disconnected: ${socket.user.username}`);
      connectedUsers.delete(userId);

      await User.findByIdAndUpdate(userId, {
        isOnline: false,
        lastSeen: new Date(),
      });

      io.emit('user:status', { userId, isOnline: false });
    });
  });
};

module.exports = socketHandler;
