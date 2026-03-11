import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import useAuthStore from '../../contexts/authStore';
import useChatStore from '../../contexts/chatStore';
import { useSocket } from '../../contexts/SocketContext';
import { usersAPI, roomsAPI } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

const Avatar = ({ user, size = 36, showStatus = true }) => {
  const { onlineUsers } = useChatStore();
  const isOnline = onlineUsers.has(user?._id) || user?.isOnline;
  const initial = user?.username?.[0]?.toUpperCase() || '?';
  const colors = ['#6c63ff', '#ff6b9d', '#00d4aa', '#ffa502', '#ff4757', '#2ed573'];
  const color = colors[(user?.username?.charCodeAt(0) || 0) % colors.length];

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {user?.avatar ? (
        <img
          src={user.avatar}
          alt={user.username}
          style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{
          width: size, height: size,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}, ${color}88)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: size * 0.4,
          fontWeight: '700',
          color: 'white',
          fontFamily: 'var(--font-display)',
        }}>{initial}</div>
      )}
      {showStatus && (
        <div style={{
          position: 'absolute', bottom: 0, right: 0,
          width: size * 0.3, height: size * 0.3,
          borderRadius: '50%',
          background: isOnline ? 'var(--online-green)' : '#5c6080',
          border: '2px solid var(--bg-secondary)',
        }} />
      )}
    </div>
  );
};

const SearchModal = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addRoom, setActiveRoom } = useChatStore();
  const socket = useSocket();

  useEffect(() => {
    const search = async () => {
      if (!query.trim()) { setResults([]); return; }
      setLoading(true);
      try {
        const { data } = await usersAPI.search(query);
        setResults(data.users);
      } catch {} finally { setLoading(false); }
    };
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleUserClick = async (user) => {
    try {
      const { data } = await roomsAPI.createDirect(user._id);
      addRoom(data.room);
      setActiveRoom(data.room);
      if (socket) socket.emit('room:join', data.room._id);
      onClose();
    } catch (err) {
      toast.error('Failed to open chat');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, animation: 'fadeIn 0.2s ease',
    }} onClick={onClose}>
      <div style={{
        width: '480px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '18px' }}>🔍</span>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search users by name or email..."
              style={{
                flex: 1, background: 'none', border: 'none',
                color: 'var(--text-primary)', fontSize: '16px', outline: 'none',
              }}
            />
            <button onClick={onClose} style={{ color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1 }}>✕</button>
          </div>
        </div>
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          {loading && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Searching...
            </div>
          )}
          {!loading && results.length === 0 && query && (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No users found
            </div>
          )}
          {results.map((user) => (
            <div
              key={user._id}
              onClick={() => handleUserClick(user)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '12px 20px', cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <Avatar user={user} size={40} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{user.username}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '12px', color: user.isOnline ? 'var(--online-green)' : 'var(--text-muted)' }}>
                {user.isOnline ? '● Online' : 'Offline'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const CreateRoomModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { addRoom, setActiveRoom } = useChatStore();
  const socket = useSocket();

  const handleCreate = async () => {
    if (!name.trim()) { toast.error('Room name is required'); return; }
    setLoading(true);
    try {
      const { data } = await roomsAPI.create({ name, description, type: 'group' });
      addRoom(data.room);
      setActiveRoom(data.room);
      if (socket) {
        socket.emit('room:join', data.room._id);
        socket.emit('room:created', { room: data.room });
      }
      toast.success('Room created! 🎉');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create room');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, animation: 'fadeIn 0.2s ease',
    }} onClick={onClose}>
      <div style={{
        width: '400px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border-subtle)',
        padding: '28px',
        boxShadow: 'var(--shadow-lg)',
      }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
          Create Room
        </h2>
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
            Room Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. general, random..."
            style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; }}
          />
        </div>
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>
            Description (optional)
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this room about?"
            style={{
              width: '100%', padding: '10px 14px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)', fontSize: '14px', outline: 'none',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent-primary)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border-subtle)'; }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '11px',
            background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500',
            transition: 'background 0.15s',
          }}>Cancel</button>
          <button onClick={handleCreate} disabled={loading} style={{
            flex: 2, padding: '11px',
            background: 'linear-gradient(135deg, var(--accent-primary), #8b58ff)',
            borderRadius: 'var(--radius-md)',
            color: 'white', fontSize: '14px', fontWeight: '600',
            opacity: loading ? 0.7 : 1,
            boxShadow: 'var(--shadow-accent)',
            fontFamily: 'var(--font-display)',
          }}>
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
};

const RoomItem = ({ room, isActive, onClick }) => {
  const { user } = useAuthStore();
  const { onlineUsers } = useChatStore();

  const isDirect = room.type === 'direct';
  const otherMember = isDirect
    ? room.members?.find((m) => (m.user?._id || m.user) !== user?._id)?.user
    : null;
  const displayName = isDirect ? (otherMember?.username || 'Unknown') : room.name;
  const isOnline = isDirect && onlineUsers.has(otherMember?._id || otherMember);

  const lastMsg = room.lastMessage;
  const preview = lastMsg
    ? lastMsg.type === 'image' ? '📷 Image'
    : lastMsg.isDeleted ? '🗑️ Deleted'
    : lastMsg.content?.slice(0, 40) || ''
    : room.description || 'No messages yet';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        cursor: 'pointer',
        background: isActive ? 'var(--bg-active)' : 'transparent',
        border: isActive ? '1px solid rgba(108,99,255,0.2)' : '1px solid transparent',
        transition: 'all 0.15s',
        marginBottom: '2px',
      }}
      onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
      onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
    >
      {isDirect && otherMember ? (
        <Avatar user={otherMember} size={38} />
      ) : (
        <div style={{
          width: 38, height: 38, borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent-primary)44, var(--accent-primary)22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '16px', flexShrink: 0,
        }}>
          #
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{
            fontSize: '14px', fontWeight: '600',
            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{displayName}</span>
        </div>
        <div style={{
          fontSize: '12px', color: 'var(--text-muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginTop: '1px',
        }}>{preview}</div>
      </div>
      {isDirect && (
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: isOnline ? 'var(--online-green)' : 'transparent',
        }} />
      )}
    </div>
  );
};

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const { rooms, activeRoom, setActiveRoom, fetchRooms } = useChatStore();
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const socket = useSocket();

  useEffect(() => { fetchRooms(); }, []);

  const directRooms = rooms.filter((r) => r.type === 'direct');
  const groupRooms = rooms.filter((r) => r.type === 'group');

  const handleRoomClick = (room) => {
    setActiveRoom(room);
    if (socket) socket.emit('room:join', room._id);
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {showSearch && <SearchModal onClose={() => setShowSearch(false)} />}
      {showCreateRoom && <CreateRoomModal onClose={() => setShowCreateRoom(false)} />}

      <div style={{
        width: 'var(--sidebar-width)',
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column',
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '18px', fontWeight: '800',
              background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-pink))',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              flex: 1,
            }}>NexChat</div>
            <button
              onClick={() => setShowCreateRoom(true)}
              title="Create Room"
              style={{
                width: 28, height: 28, borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', color: 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-primary)';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >+</button>
          </div>

          {/* Search button */}
          <button
            onClick={() => setShowSearch(true)}
            style={{
              width: '100%', padding: '8px 12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-muted)',
              fontSize: '13px', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: '8px',
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
          >
            🔍 <span>Find people...</span>
          </button>
        </div>

        {/* Rooms List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {/* Direct Messages */}
          {directRooms.length > 0 && (
            <div style={{ marginBottom: '8px' }}>
              <div style={{
                fontSize: '11px', fontWeight: '700',
                color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '6px 8px', marginBottom: '2px',
              }}>Direct Messages</div>
              {directRooms.map((room) => (
                <RoomItem
                  key={room._id}
                  room={room}
                  isActive={activeRoom?._id === room._id}
                  onClick={() => handleRoomClick(room)}
                />
              ))}
            </div>
          )}

          {/* Group Rooms */}
          {groupRooms.length > 0 && (
            <div>
              <div style={{
                fontSize: '11px', fontWeight: '700',
                color: 'var(--text-muted)',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                padding: '6px 8px', marginBottom: '2px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span>Rooms</span>
                <button
                  onClick={() => setShowCreateRoom(true)}
                  style={{ color: 'var(--accent-secondary)', fontSize: '12px', cursor: 'pointer' }}
                >+ New</button>
              </div>
              {groupRooms.map((room) => (
                <RoomItem
                  key={room._id}
                  room={room}
                  isActive={activeRoom?._id === room._id}
                  onClick={() => handleRoomClick(room)}
                />
              ))}
            </div>
          )}

          {rooms.length === 0 && (
            <div style={{
              padding: '32px 16px', textAlign: 'center',
              color: 'var(--text-muted)', fontSize: '13px',
            }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>💬</div>
              <div>No conversations yet</div>
              <div style={{ marginTop: '4px', fontSize: '12px' }}>Search for users to start chatting!</div>
            </div>
          )}
        </div>

        {/* User Footer */}
        <div style={{
          padding: '12px',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: 'var(--bg-primary)',
        }}>
          <Avatar user={user} size={34} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.username}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--online-green)' }}>● Online</div>
          </div>
          <button
            onClick={handleLogout}
            title="Logout"
            style={{
              width: 28, height: 28, borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', color: 'var(--text-muted)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--danger)22';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >⇥</button>
        </div>
      </div>
    </>
  );
};

export { Avatar };
export default Sidebar;
