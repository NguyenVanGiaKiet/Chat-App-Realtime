const express = require('express');
const Room = require('../models/Room');
const Message = require('../models/Message');
const { protect } = require('../middleware/auth');

const router = express.Router();

// GET /api/rooms - Get rooms for current user
router.get('/', protect, async (req, res) => {
  try {
    const rooms = await Room.find({
      'members.user': req.user._id,
    })
      .populate('members.user', 'username avatar isOnline lastSeen')
      .populate('lastMessage')
      .populate('createdBy', 'username avatar')
      .sort({ lastActivity: -1 });

    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/rooms - Create a room
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, memberIds, type, isPrivate } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Room name is required' });
    }

    const members = [
      { user: req.user._id, role: 'admin' },
      ...(memberIds || []).map((id) => ({ user: id, role: 'member' })),
    ];

    const room = await Room.create({
      name,
      description: description || '',
      type: type || 'group',
      members,
      createdBy: req.user._id,
      isPrivate: isPrivate || false,
    });

    await room.populate('members.user', 'username avatar isOnline');
    await room.populate('createdBy', 'username avatar');

    res.status(201).json({ room });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// POST /api/rooms/direct - Create or get a direct message room
router.post('/direct', protect, async (req, res) => {
  try {
    const { targetUserId } = req.body;

    // Check if direct room already exists
    let room = await Room.findOne({
      type: 'direct',
      'members.user': { $all: [req.user._id, targetUserId] },
      $expr: { $eq: [{ $size: '$members' }, 2] },
    })
      .populate('members.user', 'username avatar isOnline lastSeen')
      .populate('lastMessage');

    if (room) {
      return res.json({ room });
    }

    // Create new direct room
    room = await Room.create({
      name: 'Direct Message',
      type: 'direct',
      members: [
        { user: req.user._id, role: 'member' },
        { user: targetUserId, role: 'member' },
      ],
      createdBy: req.user._id,
    });

    await room.populate('members.user', 'username avatar isOnline lastSeen');

    res.status(201).json({ room });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// GET /api/rooms/:id - Get a specific room
router.get('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('members.user', 'username avatar isOnline lastSeen bio')
      .populate('createdBy', 'username avatar');

    if (!room) return res.status(404).json({ message: 'Room not found' });

    const isMember = room.members.some(
      (m) => m.user._id.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: 'Not a member of this room' });

    res.json({ room });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/rooms/:id/messages - Get messages in a room
router.get('/:id/messages', protect, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const isMember = room.members.some(
      (m) => m.user.toString() === req.user._id.toString()
    );
    if (!isMember) return res.status(403).json({ message: 'Not a member' });

    const messages = await Message.find({
      room: req.params.id,
      isDeleted: false,
    })
      .populate('sender', 'username avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ messages: messages.reverse() });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/rooms/:id/leave - Leave a room
router.delete('/:id/leave', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.members = room.members.filter(
      (m) => m.user.toString() !== req.user._id.toString()
    );
    await room.save();

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
