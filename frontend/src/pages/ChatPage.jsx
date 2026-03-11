import Sidebar from '../components/Sidebar/Sidebar';
import ChatView from '../components/Chat/ChatView';

const ChatPage = () => {
  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <Sidebar />
      <ChatView />
    </div>
  );
};

export default ChatPage;
