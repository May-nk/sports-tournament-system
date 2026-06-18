import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, saveSession } from '../services/authService';

/* ─── Field component ─────────────────────────────────────────────── */
const Field = ({ id, label, type = 'text', value, onChange, placeholder, autoComplete }) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="text-[10px] font-black uppercase tracking-widest text-sports-muted">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="px-4 py-3 rounded-none bg-sports-bg border border-sports-border
        text-white placeholder-sports-muted/50 text-sm font-bold uppercase tracking-wide
        outline-none focus:border-sports-accent
        transition duration-200"
    />
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════════════════════════════════ */
const Login = () => {
  const navigate = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await login(email.trim(), password);

      const data  = res.data;
      const token = data.token;

      if (!token) {
        setError('Server did not return a token. Please try again.');
        return;
      }

      const user = data.user ?? {
        id:    data._id,
        name:  data.name,
        email: data.email,
        role:  data.role,
      };

      saveSession(token, user);

      const role = String(user.role ?? '').toLowerCase();
      navigate(role === 'admin' ? '/admin' : '/teams', { replace: true });

    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sports-bg flex items-center justify-center p-4 relative text-left font-sans">
      <div className="relative w-full max-w-md">
        {/* Logo / brand */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-none bg-sports-accent/20 border border-sports-accent/30 flex items-center justify-center mb-6">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-sports-accent">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <h1 className="text-4xl font-black uppercase text-white tracking-tight">SportsSys</h1>
          <p className="text-sports-muted text-xs font-bold uppercase tracking-widest mt-2">Tournament Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-sports-card border border-sports-border rounded-none p-8 shadow-sm">
          <div className="mb-8 border-b border-sports-border pb-6">
            <h2 className="text-2xl font-black uppercase text-white mb-2 tracking-wide">Welcome back</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-sports-muted">Sign in to your account to continue</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
            <Field
              id="login-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Field
              id="login-password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            {/* Error */}
            {error && (
              <div className="px-5 py-4 rounded-none border border-red-900 bg-red-900/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full px-6 py-4 mt-4 rounded-none bg-sports-accent hover:bg-sports-accentHover 
                text-white text-[10px] font-black uppercase tracking-widest transition duration-200
                disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Register link */}
        <p className="text-center text-sports-muted text-[10px] font-bold uppercase tracking-widest mt-8">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-white font-black hover:text-sports-accent transition-colors"
          >
            Register as Captain
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
