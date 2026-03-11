import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './contexts/authStore';
import { SocketProvider } from './contexts/SocketContext';
import { LoginPage, RegisterPage } from './components/Auth/AuthPages';
import ChatPage from './pages/ChatPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: '800',
        background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-pink))',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>NexChat</div>
      <div style={{
        width: 40, height: 40,
        border: '3px solid var(--bg-tertiary)',
        borderTopColor: 'var(--accent-primary)',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) return null;
  return !isAuthenticated ? children : <Navigate to="/" />;
};

const App = () => {
  const { initialize } = useAuthStore();
  useEffect(() => { initialize(); }, []);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: 'var(--online-green)', secondary: 'var(--bg-primary)' } },
          error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--bg-primary)' } },
        }}
      />
      <SocketProvider>
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
          <Route path="/" element={<ProtectedRoute><ChatPage /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
};

export default App;
