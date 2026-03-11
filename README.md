# 💬 NexChat — Realtime Chat Application

A full-stack realtime chat application built with React, Node.js, Socket.io, and MongoDB. Features a sleek Discord/Messenger-inspired dark UI.

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔐 Authentication | JWT-based register & login |
| 🔍 User Search | Find users by username or email |
| 💬 Direct Messages | One-on-one private conversations |
| 🏠 Group Rooms | Create and join group chat rooms |
| ⚡ Realtime | WebSocket powered messaging via Socket.io |
| 😊 Emoji Picker | Full emoji keyboard built-in |
| 🖼️ Image Sharing | Upload & send images (drag & drop supported) |
| 👁️ Online Status | Live online/offline indicators |
| ⌨️ Typing Indicator | See when others are typing |
| 🔥 Reactions | React to messages with emoji |
| 🗑️ Delete Messages | Remove your own messages |

---

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- Zustand (state management)
- Socket.io Client
- React Router DOM
- React Hot Toast
- Emoji Picker React
- date-fns

**Backend:**
- Node.js + Express
- Socket.io
- MongoDB + Mongoose
- JWT Authentication
- Multer (file uploads)
- bcryptjs

---

## 📁 Project Structure

```
chatapp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js              # MongoDB connection
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT middleware
│   │   ├── models/
│   │   │   ├── User.js            # User schema
│   │   │   ├── Room.js            # Room schema
│   │   │   └── Message.js         # Message schema
│   │   ├── routes/
│   │   │   ├── auth.js            # Register, login, logout
│   │   │   ├── users.js           # User search & profile
│   │   │   ├── rooms.js           # Room CRUD & messages
│   │   │   └── messages.js        # Message actions & uploads
│   │   ├── socket/
│   │   │   └── socketHandler.js   # All Socket.io events
│   │   └── server.js              # Express + Socket.io setup
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Auth/
    │   │   │   └── AuthPages.jsx  # Login & Register UI
    │   │   ├── Chat/
    │   │   │   ├── ChatView.jsx   # Main chat area
    │   │   │   ├── ChatInput.jsx  # Message input bar
    │   │   │   └── MessageBubble.jsx # Individual message
    │   │   └── Sidebar/
    │   │       └── Sidebar.jsx    # Room list & user footer
    │   ├── contexts/
    │   │   ├── authStore.js       # Auth state (Zustand)
    │   │   ├── chatStore.js       # Chat state (Zustand)
    │   │   └── SocketContext.jsx  # Socket.io provider
    │   ├── pages/
    │   │   └── ChatPage.jsx       # Main layout
    │   ├── services/
    │   │   └── api.js             # Axios API calls
    │   ├── App.jsx                # Router + guards
    │   ├── main.jsx               # Entry point
    │   └── styles.css             # Global CSS variables
    ├── index.html
    ├── vite.config.js
    └── package.json
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** v18 or higher
- **MongoDB** (local) or a MongoDB Atlas connection string
- **npm** or **yarn**

---

### 1. Clone / Download the project

```bash
# If using git
git clone <repo-url>
cd chatapp
```

---

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_super_secret_key_here_change_me
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:5173
```

Start the backend:
```bash
# Development (with hot reload)
npm run dev

# Production
npm start
```

Backend will run on: `http://localhost:5000`

---

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run on: `http://localhost:5173`

---

### 4. Open the App

Navigate to `http://localhost:5173` in your browser.

1. Click **Sign up** to create an account
2. Use the 🔍 search button to find other users
3. Click a user to start a **Direct Message**
4. Click **+ New** under Rooms to create a **Group Room**
5. Enjoy realtime chatting! 🎉

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/search?q=query` | Search users |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/profile` | Update profile |

### Rooms
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rooms` | Get user's rooms |
| POST | `/api/rooms` | Create group room |
| POST | `/api/rooms/direct` | Get or create DM |
| GET | `/api/rooms/:id` | Get room details |
| GET | `/api/rooms/:id/messages` | Get messages |
| DELETE | `/api/rooms/:id/leave` | Leave room |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/messages/upload` | Upload image |
| DELETE | `/api/messages/:id` | Delete message |
| POST | `/api/messages/:id/react` | Add/remove reaction |

---

## ⚡ Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `room:join` | `roomId` | Join a room |
| `message:send` | `{roomId, content, type, imageUrl}` | Send message |
| `typing:start` | `{roomId}` | Start typing |
| `typing:stop` | `{roomId}` | Stop typing |
| `message:react` | `{messageId, emoji, roomId}` | React to message |
| `message:delete` | `{messageId, roomId}` | Delete message |
| `room:created` | `{room}` | Notify room creation |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `{message, roomId}` | New message received |
| `typing:update` | `{userId, username, roomId, isTyping}` | Typing indicator |
| `user:status` | `{userId, isOnline}` | Online status change |
| `message:reacted` | `{messageId, reactions}` | Reaction updated |
| `message:deleted` | `{messageId, roomId}` | Message deleted |
| `room:new` | `{room}` | New room created |

---

## 🔒 Security Notes

- Passwords are hashed with **bcryptjs** (salt rounds: 12)
- All API routes (except auth) require a valid **JWT token**
- Socket connections are authenticated via JWT
- File uploads are validated for type and size (max 5MB)
- Input validation on all models

---

## 📝 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `5000` | Server port |
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | JWT signing secret (use a strong random string) |
| `JWT_EXPIRE` | No | `7d` | JWT expiry duration |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend URL for CORS |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — free to use and modify.

---

Built with ❤️ using React, Node.js, Socket.io & MongoDB
