import { useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import useAuthStore from '../../contexts/authStore';
import { useSocket } from '../../contexts/SocketContext';
import useChatStore from '../../contexts/chatStore';
import { Avatar } from '../Sidebar/Sidebar';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

const formatTime = (date) => {
  const d = new Date(date);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`;
  return format(d, 'MMM d, HH:mm');
};

const MessageBubble = ({ message, isOwn, showAvatar, prevMessage }) => {
  const { user } = useAuthStore();
  const socket = useSocket();
  const { activeRoom } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const isDeleted = message.isDeleted;

  const handleReact = (emoji) => {
    if (!socket || !activeRoom) return;
    socket.emit('message:react', {
      messageId: message._id,
      emoji,
      roomId: activeRoom._id,
    });
    setShowReactions(false);
  };

  const handleDelete = () => {
    if (!socket || !activeRoom) return;
    socket.emit('message:delete', {
      messageId: message._id,
      roomId: activeRoom._id,
    });
    setShowActions(false);
  };

  const grouped = prevMessage &&
    prevMessage.sender?._id === message.sender?._id &&
    new Date(message.createdAt) - new Date(prevMessage.createdAt) < 5 * 60 * 1000;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        gap: '8px',
        alignItems: 'flex-end',
        marginTop: grouped ? '2px' : '14px',
        animation: 'fadeIn 0.25s ease',
        position: 'relative',
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowReactions(false); }}
    >
      {/* Avatar */}
      <div style={{ width: 32, flexShrink: 0 }}>
        {!isOwn && !grouped && (
          <Avatar user={message.sender} size={32} showStatus={false} />
        )}
      </div>

      <div style={{ maxWidth: '60%', display: 'flex', flexDirection: 'column', alignItems: isOwn ? 'flex-end' : 'flex-start' }}>
        {/* Sender name + time */}
        {!grouped && !isOwn && (
          <div style={{
            display: 'flex', alignItems: 'baseline', gap: '8px',
            marginBottom: '4px',
          }}>
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)' }}>
              {message.sender?.username}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {formatTime(message.createdAt)}
            </span>
          </div>
        )}

        {/* Bubble */}
        <div style={{
          padding: message.type === 'image' ? '4px' : '10px 14px',
          background: isOwn
            ? 'linear-gradient(135deg, var(--accent-primary), #8b58ff)'
            : 'var(--bg-tertiary)',
          borderRadius: isOwn
            ? '18px 18px 4px 18px'
            : '18px 18px 18px 4px',
          boxShadow: 'var(--shadow-sm)',
          opacity: isDeleted ? 0.5 : 1,
          position: 'relative',
        }}>
          {message.type === 'image' && message.imageUrl ? (
            <img
              src={message.imageUrl}
              alt="shared image"
              style={{
                maxWidth: '280px', maxHeight: '280px',
                borderRadius: '14px', display: 'block',
                objectFit: 'cover',
              }}
            />
          ) : (
            <p style={{
              fontSize: '14px',
              color: isOwn ? 'white' : 'var(--text-primary)',
              lineHeight: '1.5',
              wordBreak: 'break-word',
              fontStyle: isDeleted ? 'italic' : 'normal',
              opacity: isDeleted ? 0.6 : 1,
            }}>
              {message.content}
            </p>
          )}
        </div>

        {/* Reactions display */}
        {message.reactions && message.reactions.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
            {message.reactions.map((reaction) => (
              <button
                key={reaction.emoji}
                onClick={() => handleReact(reaction.emoji)}
                style={{
                  padding: '2px 7px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '99px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '3px',
                  color: 'var(--text-secondary)',
                }}
              >
                {reaction.emoji} <span>{reaction.users?.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Time for own messages */}
        {isOwn && !grouped && (
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
            {formatTime(message.createdAt)}
          </span>
        )}
      </div>

      {/* Action buttons */}
      {showActions && !isDeleted && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          [isOwn ? 'left' : 'right']: '44px',
          display: 'flex', gap: '4px',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '4px',
          boxShadow: 'var(--shadow-md)',
          zIndex: 10,
        }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowReactions(!showReactions)}
              style={{
                padding: '4px 8px', borderRadius: '6px', fontSize: '14px',
                transition: 'background 0.15s', cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >😊</button>
            {showReactions && (
              <div style={{
                position: 'absolute', top: '100%', left: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '12px', padding: '6px',
                display: 'flex', gap: '4px',
                boxShadow: 'var(--shadow-md)',
                zIndex: 20, marginTop: '4px',
              }}>
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    style={{
                      fontSize: '18px', padding: '4px', borderRadius: '6px',
                      cursor: 'pointer', transition: 'transform 0.1s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >{emoji}</button>
                ))}
              </div>
            )}
          </div>
          {isOwn && (
            <button
              onClick={handleDelete}
              style={{
                padding: '4px 8px', borderRadius: '6px', fontSize: '13px',
                color: 'var(--danger)', transition: 'background 0.15s', cursor: 'pointer',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,71,87,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >🗑</button>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;
