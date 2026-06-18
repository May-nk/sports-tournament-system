import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';

/* ─── Field component ─────────────────────────────────────────────── */
const Field = ({ id, label, type = 'text', value, onChange, placeholder, autoComplete, hint }) => (
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
    {hint && <p className="text-[10px] uppercase font-bold tracking-widest text-sports-muted">{hint}</p>}
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   REGISTER PAGE
   ═══════════════════════════════════════════════════════════════════ */
const Register = () => {
  const navigate = useNavigate();

  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await register(name.trim(), email.trim(), password);
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login', { replace: true }), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sports-bg flex items-center justify-center p-4 relative text-left font-sans">
      <div className="relative w-full max-w-md my-8">
        {/* Logo / brand */}
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-none bg-sports-accent/20 border border-sports-accent/30 flex items-center justify-center mb-6">
            <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-sports-accent">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-white">SportsSys</h1>
          <p className="text-sports-muted text-xs font-bold uppercase tracking-widest mt-2">Tournament Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-sports-card border border-sports-border rounded-none p-8 shadow-sm">
          <div className="mb-8 border-b border-sports-border pb-6">
            <h2 className="text-2xl font-black uppercase text-white mb-2 tracking-wide">Create your account</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-sports-muted">
              Register as a Captain to manage your team
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
            <Field
              id="reg-name"
              label="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rohit Sharma"
              autoComplete="name"
            />
            <Field
              id="reg-email"
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Field
              id="reg-password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters"
              autoComplete="new-password"
            />
            <Field
              id="reg-confirm"
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
            />

            {/* Error */}
            {error && (
              <div className="px-5 py-4 rounded-none border border-red-900 bg-red-900/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="px-5 py-4 rounded-none border border-green-900 bg-green-900/20 text-green-400 text-[10px] font-black uppercase tracking-widest">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading || Boolean(success)}
              className="w-full px-6 py-4 mt-4 rounded-none bg-sports-accent hover:bg-sports-accentHover
                text-white text-[10px] font-black uppercase tracking-widest transition duration-200
                disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-sports-muted text-[10px] font-bold uppercase tracking-widest mt-8 mb-8">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-white font-black hover:text-sports-accent transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
