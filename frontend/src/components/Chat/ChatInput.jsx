import { useState, useRef, useCallback } from 'react';
import EmojiPicker from 'emoji-picker-react';
import toast from 'react-hot-toast';
import { useSocket } from '../../contexts/SocketContext';
import { messagesAPI } from '../../services/api';
import useChatStore from '../../contexts/chatStore';

const ChatInput = ({ roomId }) => {
  const [content, setContent] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const socket = useSocket();
  const fileInputRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingRef = useRef(false);

  const sendMessage = useCallback((msgContent, type = 'text', imageUrl = '') => {
    if (!socket || !roomId) return;
    socket.emit('message:send', {
      roomId,
      content: msgContent,
      type,
      imageUrl,
    });
  }, [socket, roomId]);

  const handleSend = () => {
    if (!content.trim()) return;
    sendMessage(content.trim(), 'text');
    setContent('');
    stopTyping();
  };

  const startTyping = () => {
    if (!socket || !roomId) return;
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      socket.emit('typing:start', { roomId });
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 2000);
  };

  const stopTyping = () => {
    if (!socket || !roomId) return;
    clearTimeout(typingTimerRef.current);
    if (isTypingRef.current) {
      isTypingRef.current = false;
      socket.emit('typing:stop', { roomId });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setContent(e.target.value);
    startTyping();
  };

  const handleEmojiClick = (emojiData) => {
    setContent((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleImageUpload = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const { data } = await messagesAPI.uploadImage(formData);
      sendMessage('', 'image', data.imageUrl);
      toast.success('Image sent!');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  return (
    <div
      style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-secondary)',
      }}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(108,99,255,0.1)',
          border: '2px dashed var(--accent-primary)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '24px', zIndex: 10,
        }}>
          📤 Drop image to send
        </div>
      )}

      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: '8px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '14px',
        padding: '6px 6px 6px 14px',
        position: 'relative',
        transition: 'border-color 0.2s',
      }}>
        {/* Emoji button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            style={{
              width: 36, height: 36, borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px', transition: 'background 0.15s', cursor: 'pointer',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >😊</button>
          {showEmoji && (
            <div style={{
              position: 'absolute', bottom: '48px', left: 0, zIndex: 100,
              boxShadow: 'var(--shadow-lg)',
            }}>
              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="dark"
                height={350}
                width={320}
                searchPlaceHolder="Search emoji..."
              />
            </div>
          )}
        </div>

        {/* Text input */}
        <textarea
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          style={{
            flex: 1,
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--text-primary)', fontSize: '14px',
            resize: 'none', lineHeight: '1.5',
            maxHeight: '120px', overflowY: 'auto',
            padding: '6px 0', alignSelf: 'center',
          }}
        />

        {/* Image upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => handleImageUpload(e.target.files[0])}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            width: 36, height: 36, borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', transition: 'background 0.15s', cursor: 'pointer',
            flexShrink: 0, opacity: isUploading ? 0.5 : 1,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >{isUploading ? '⏳' : '📎'}</button>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!content.trim()}
          style={{
            width: 36, height: 36, borderRadius: '10px',
            background: content.trim()
              ? 'linear-gradient(135deg, var(--accent-primary), #8b58ff)'
              : 'var(--bg-hover)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '16px', transition: 'all 0.15s', cursor: content.trim() ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            boxShadow: content.trim() ? 'var(--shadow-accent)' : 'none',
          }}
        >↑</button>
      </div>

      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', paddingLeft: '4px' }}>
        Enter to send · Shift+Enter for new line · Drag & drop images
      </div>
    </div>
  );
};

export default ChatInput;
