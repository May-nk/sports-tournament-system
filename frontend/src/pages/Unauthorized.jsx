import { useNavigate } from 'react-router-dom';
import { getRole } from '../services/authService';

const Unauthorized = () => {
  const navigate  = useNavigate();
  const role      = getRole();

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-rose-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative text-center max-w-md">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl
          bg-rose-500/10 border border-rose-500/20 mb-6 shadow-xl shadow-rose-900/20">
          <svg className="w-9 h-9 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Access Denied</h1>
        <p className="text-slate-400 text-sm leading-relaxed mb-2">
          You do not have permission to view this page.
        </p>
        {role && (
          <p className="text-slate-600 text-xs mb-8">
            Your current role is{' '}
            <span className="font-bold text-slate-400 uppercase tracking-wider">{role}</span>
            , which does not allow access here.
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-slate-700 text-slate-300
              hover:bg-slate-800 text-sm font-semibold transition-all"
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white
              text-sm font-semibold transition-all shadow-lg shadow-indigo-900/40"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
