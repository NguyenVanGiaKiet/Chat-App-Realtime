import { useEffect, useRef } from 'react';
import useAuthStore from '../../contexts/authStore';
import useChatStore from '../../contexts/chatStore';
import { Avatar } from '../Sidebar/Sidebar';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

const TypingIndicator = ({ typingUsers }) => {
  const usernames = Object.values(typingUsers || {});
  if (usernames.length === 0) return null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '8px 16px',
      color: 'var(--text-muted)', fontSize: '13px',
      fontStyle: 'italic',
    }}>
      <div style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent-primary)',
            animation: `blink 1.4s infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
      <span>
        {usernames.join(', ')} {usernames.length === 1 ? 'is' : 'are'} typing...
      </span>
    </div>
  );
};

const WelcomeScreen = () => (
  <div style={{
    flex: 1,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    color: 'var(--text-muted)',
    background: 'var(--bg-primary)',
    gap: '16px',
  }}>
    <div style={{
      width: '80px', height: '80px',
      background: 'linear-gradient(135deg, var(--accent-primary)22, var(--accent-pink)22)',
      borderRadius: '24px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '36px',
    }}>💬</div>
    <div style={{ textAlign: 'center' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '22px', fontWeight: '700',
        color: 'var(--text-secondary)',
        marginBottom: '6px',
      }}>NexChat</h2>
      <p style={{ fontSize: '14px' }}>
        Select a conversation or search for users to start chatting
      </p>
    </div>
  </div>
);

const ChatHeader = ({ room }) => {
  const { user } = useAuthStore();
  const { onlineUsers } = useChatStore();

  const isDirect = room.type === 'direct';
  const otherMember = isDirect
    ? room.members?.find((m) => {
        const memberId = m.user?._id || m.user;
        return memberId !== user?._id && memberId?.toString() !== user?._id?.toString();
      })?.user
    : null;

  const displayName = isDirect ? (otherMember?.username || 'Unknown') : room.name;
  const memberCount = room.members?.length || 0;
  const isOnline = isDirect && onlineUsers.has(otherMember?._id || otherMember?.toString?.());

  return (
    <div style={{
      padding: '12px 20px',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex', alignItems: 'center', gap: '12px',
      background: 'var(--bg-secondary)',
      backdropFilter: 'blur(10px)',
    }}>
      {isDirect && otherMember ? (
        <Avatar user={otherMember} size={36} />
      ) : (
        <div style={{
          width: 36, height: 36, borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--accent-primary)44, var(--accent-primary)22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: '700', color: 'var(--accent-secondary)',
          fontFamily: 'var(--font-display)',
        }}>#</div>
      )}
      <div style={{ flex: 1 }}>
        <div style={{
          fontWeight: '700', fontSize: '15px',
          fontFamily: 'var(--font-display)',
        }}>{displayName}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {isDirect
            ? (isOnline ? '🟢 Online' : '⚫ Offline')
            : `${memberCount} members`}
        </div>
      </div>
      {!isDirect && (
        <div style={{ display: 'flex', gap: '-8px' }}>
          {room.members?.slice(0, 4).map((m, i) => (
            <div key={i} style={{ marginLeft: i > 0 ? '-8px' : 0, zIndex: 4 - i }}>
              <Avatar user={m.user} size={28} showStatus={false} />
            </div>
          ))}
          {memberCount > 4 && (
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', color: 'var(--text-muted)',
              marginLeft: '-8px', border: '2px solid var(--bg-secondary)',
            }}>+{memberCount - 4}</div>
          )}
        </div>
      )}
    </div>
  );
};

const DateDivider = ({ date }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '16px 0 8px',
  }}>
    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
    <span style={{
      fontSize: '11px', color: 'var(--text-muted)',
      fontWeight: '600', textTransform: 'uppercase',
      letterSpacing: '0.06em', whiteSpace: 'nowrap',
    }}>
      {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
    </span>
    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
  </div>
);

const ChatView = () => {
  const { user } = useAuthStore();
  const { activeRoom, messages, typingUsers, isLoadingMessages } = useChatStore();
  const messagesEndRef = useRef(null);

  const roomMessages = activeRoom ? (messages[activeRoom._id] || []) : [];
  const roomTyping = activeRoom ? (typingUsers[activeRoom._id] || {}) : {};

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [roomMessages.length]);

  if (!activeRoom) return <WelcomeScreen />;

  // Group messages by date
  const groupedMessages = [];
  let currentDate = null;
  roomMessages.forEach((msg, i) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ type: 'date', date: msg.createdAt, id: `date-${i}` });
    }
    groupedMessages.push({ type: 'message', message: msg, prev: i > 0 ? roomMessages[i - 1] : null });
  });

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'var(--bg-primary)',
      overflow: 'hidden',
    }}>
      <ChatHeader room={activeRoom} />

      {/* Messages area */}
      <div style={{
        flex: 1, overflowY: 'auto',
        padding: '16px 20px',
        display: 'flex', flexDirection: 'column',
      }}>
        {isLoadingMessages ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              width: 32, height: 32, border: '3px solid var(--bg-tertiary)',
              borderTopColor: 'var(--accent-primary)',
              borderRadius: '50%', animation: 'spin 0.8s linear infinite',
            }} />
          </div>
        ) : roomMessages.length === 0 ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px',
            color: 'var(--text-muted)', fontSize: '14px',
          }}>
            <span style={{ fontSize: '40px' }}>👋</span>
            <span>Be the first to say something!</span>
          </div>
        ) : (
          <>
            {groupedMessages.map((item) => {
              if (item.type === 'date') {
                return <DateDivider key={item.id} date={item.date} />;
              }
              const { message, prev } = item;
              const isOwn = message.sender?._id === user?._id ||
                            message.sender?.toString() === user?._id;
              return (
                <MessageBubble
                  key={message._id}
                  message={message}
                  isOwn={isOwn}
                  prevMessage={prev}
                />
              );
            })}
            <TypingIndicator typingUsers={roomTyping} />
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <ChatInput roomId={activeRoom._id} />
    </div>
  );
};

export default ChatView;
