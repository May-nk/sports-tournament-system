import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register } from '../services/authService';

/* ─── Field component ─────────────────────────────────────────────── */
const Field = ({ id, label, type = 'text', value, onChange, placeholder, autoComplete, hint }) => (
  <div className="flex flex-col gap-2">
    <label htmlFor={id} className="text-xs font-medium text-gray-500">
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      className="px-4 py-2 rounded-md bg-[#0F172A] border border-[#1F2937]
        text-white placeholder-gray-600 text-sm
        outline-none focus:border-purple-500
        transition duration-200"
    />
    {hint && <p className="text-xs text-gray-500">{hint}</p>}
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
    <div className="min-h-screen bg-app-bg flex items-center justify-center p-4 relative text-left">
      <div className="relative w-full max-w-md my-8">
        {/* Logo / brand */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-12 h-12 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-4">
            <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-purple-400">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">SportsSys</h1>
          <p className="text-gray-400 text-sm mt-1">Tournament Management Platform</p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-6 shadow-sm">
          <div className="mb-6 border-b border-[#1F2937] pb-4">
            <h2 className="text-xl font-semibold text-white mb-2">Create your account</h2>
            <p className="text-sm text-gray-400">
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
              <div className="px-4 py-3 rounded-md border border-red-900 bg-red-900/20 text-red-400 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="px-4 py-3 rounded-md border border-green-900 bg-green-900/20 text-green-400 text-sm font-medium">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading || Boolean(success)}
              className="w-full px-4 py-2 mt-2 rounded-md bg-purple-600 hover:bg-purple-500
                text-white text-sm font-medium transition duration-200
                disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center h-10"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        {/* Login link */}
        <p className="text-center text-gray-400 text-sm mt-6 mb-8">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-white font-medium hover:text-purple-400 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
