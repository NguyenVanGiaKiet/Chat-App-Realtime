import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../../contexts/authStore';

const AuthLayout = ({ children, title, subtitle }) => (
  <div style={{
    minHeight: '100vh',
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    position: 'relative',
    overflow: 'hidden',
  }}>
    {/* Background orbs */}
    <div style={{
      position: 'absolute', top: '-20%', left: '-10%',
      width: '500px', height: '500px',
      background: 'radial-gradient(circle, rgba(108,99,255,0.12) 0%, transparent 70%)',
      borderRadius: '50%', pointerEvents: 'none',
    }} />
    <div style={{
      position: 'absolute', bottom: '-20%', right: '-10%',
      width: '400px', height: '400px',
      background: 'radial-gradient(circle, rgba(255,107,157,0.08) 0%, transparent 70%)',
      borderRadius: '50%', pointerEvents: 'none',
    }} />

    <div style={{
      width: '100%', maxWidth: '420px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-xl)',
      padding: '40px',
      boxShadow: 'var(--shadow-lg)',
      animation: 'fadeIn 0.4s ease',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '12px',
        }}>
          <div style={{
            width: '40px', height: '40px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-pink))',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '20px',
          }}>💬</div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-pink))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>NexChat</span>
        </div>
        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '22px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '6px',
        }}>{title}</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>{subtitle}</p>
      </div>
      {children}
    </div>
  </div>
);

const InputField = ({ label, type, value, onChange, placeholder, required }) => (
  <div style={{ marginBottom: '16px' }}>
    <label style={{
      display: 'block',
      fontSize: '13px',
      fontWeight: '500',
      color: 'var(--text-secondary)',
      marginBottom: '6px',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      style={{
        width: '100%',
        padding: '12px 16px',
        background: 'var(--bg-tertiary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--text-primary)',
        fontSize: '15px',
        outline: 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
      onFocus={(e) => {
        e.target.style.borderColor = 'var(--accent-primary)';
        e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--border-subtle)';
        e.target.style.boxShadow = 'none';
      }}
    />
  </div>
);

const SubmitButton = ({ isLoading, children }) => (
  <button
    type="submit"
    disabled={isLoading}
    style={{
      width: '100%',
      padding: '13px',
      background: isLoading
        ? 'var(--bg-hover)'
        : 'linear-gradient(135deg, var(--accent-primary), #8b58ff)',
      color: 'white',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      fontSize: '15px',
      fontWeight: '600',
      cursor: isLoading ? 'not-allowed' : 'pointer',
      transition: 'opacity 0.2s, transform 0.1s',
      boxShadow: isLoading ? 'none' : 'var(--shadow-accent)',
      fontFamily: 'var(--font-display)',
      letterSpacing: '0.02em',
    }}
    onMouseEnter={(e) => { if (!isLoading) e.target.style.opacity = '0.9'; }}
    onMouseLeave={(e) => { e.target.style.opacity = '1'; }}
  >
    {isLoading ? '⏳ Please wait...' : children}
  </button>
);

export const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(form);
      toast.success('Welcome back! 👋');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to continue to NexChat">
      <form onSubmit={handleSubmit}>
        <InputField
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
          required
        />
        <InputField
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="••••••••"
          required
        />
        <div style={{ marginTop: '24px' }}>
          <SubmitButton isLoading={isLoading}>Sign In →</SubmitButton>
        </div>
      </form>
      <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: 'var(--accent-secondary)', fontWeight: '500' }}>
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
};

export const RegisterPage = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsLoading(true);
    try {
      await register(form);
      toast.success('Account created! 🎉');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Create account" subtitle="Join NexChat and start chatting">
      <form onSubmit={handleSubmit}>
        <InputField
          label="Username"
          type="text"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          placeholder="cooluser123"
          required
        />
        <InputField
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="you@example.com"
          required
        />
        <InputField
          label="Password"
          type="password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Min. 6 characters"
          required
        />
        <div style={{ marginTop: '24px' }}>
          <SubmitButton isLoading={isLoading}>Create Account →</SubmitButton>
        </div>
      </form>
      <p style={{ textAlign: 'center', marginTop: '24px', color: 'var(--text-muted)', fontSize: '14px' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--accent-secondary)', fontWeight: '500' }}>
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};
