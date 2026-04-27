import { getUser, getRole } from '../services/authService';

/* ─── Minimal SVG Icons ────────────────────────────────────────────── */
const ICONS = {
  Trophy: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>,

  Users: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,

  Zap: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>,

  Check: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>,

  BarChart: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
  
  FileText: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
};

/* ─── Stat card ───────────────────────────────────────────────────── */
const StatCard = ({ icon, label, value }) => (
  <div className="rounded-xl border bg-[#111827] p-6 border-[#1F2937] 
    hover:border-purple-500/40 transition duration-200 hover:scale-[1.01] text-left">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      </div>
      <div className="text-gray-400">
        {icon}
      </div>
    </div>
  </div>
);

/* ─── Quick action card ───────────────────────────────────────────── */
const ActionCard = ({ icon, title, desc, to }) => (
  <a href={to}
    className="flex items-start justify-between p-6 rounded-xl border border-[#1F2937]
      bg-[#111827] hover:border-purple-500/40 hover:bg-[#0F172A] hover:scale-[1.01]
      transition duration-200 cursor-pointer no-underline text-left group">
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-lg bg-[#0F172A] border border-[#1F2937]
        flex items-center justify-center text-gray-400 shrink-0">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="font-medium text-white text-base">{title}</p>
        <p className="text-sm text-gray-400 mt-1">{desc}</p>
      </div>
    </div>
    <svg className="w-5 h-5 text-gray-600 group-hover:text-purple-400 shrink-0 transition-colors mt-2.5 ml-4"
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  </a>
);

/* ═══════════════════════════════════════════════════════════════════ */
const Dashboard = () => {
  const user = getUser();
  const role = getRole();
  const isAdmin = role === 'admin';

  const adminActions = [
    { icon: ICONS.Trophy, title: 'Manage Tournaments', desc: 'Create & oversee tournaments', to: '/tournaments' },
    { icon: ICONS.Check, title: 'Approve Teams', desc: 'Review team applications', to: '/admin' },
    { icon: ICONS.Zap, title: 'Manage Matches', desc: 'Schedule & update scores', to: '/matches' },
    { icon: ICONS.BarChart, title: 'Leaderboard', desc: 'View tournament standings', to: '/leaderboard' },
  ];

  const captainActions = [
    { icon: ICONS.Users, title: 'My Team', desc: 'Manage your team roster', to: '/teams' },
    { icon: ICONS.FileText, title: 'Apply Tournament', desc: 'Enter your team in a tournament', to: '/tournaments' },
    { icon: ICONS.Zap, title: 'My Matches', desc: 'View upcoming fixtures', to: '/matches' },
    { icon: ICONS.BarChart, title: 'Leaderboard', desc: 'See current standings', to: '/leaderboard' },
  ];

  const actions = isAdmin ? adminActions : captainActions;

  return (
    <div className="text-white pb-10 text-left">

      {/* ── Welcome hero ────────────────────────────────────────── */}
      <div className="mb-10 border-b border-[#1F2937] pb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
          {isAdmin ? 'Admin Dashboard' : 'Captain Dashboard'}
        </p>
        <h1 className="text-xl font-semibold tracking-tight text-white mb-2">
          Welcome back, {user?.name?.split(' ')[0] ?? 'User'}
        </h1>
        <p className="text-sm text-gray-400 max-w-xl">
          {isAdmin
            ? 'Manage tournaments, approve teams, and monitor match progress across the platform.'
            : 'Manage your team roster, apply to open tournaments, and track your performance.'}
        </p>
      </div>

      {/* ── Stat cards (admin only) ── */}
      {isAdmin && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard icon={ICONS.Trophy} label="Tournaments" value="—" />
          <StatCard icon={ICONS.Users} label="Teams Applied" value="—" />
          <StatCard icon={ICONS.Zap} label="Matches" value="—" />
          <StatCard icon={ICONS.Check} label="Pending" value="—" />
        </div>
      )}

      {/* ── Quick actions ─────────────────────────────────────────── */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {actions.map((a) => (
            <ActionCard key={a.to} {...a} />
          ))}
        </div>
      </div>

      {/* ── Captain info box ─────────────────────────────────────── */}
      {!isAdmin && (
        <div className="mt-10 p-6 rounded-xl border border-[#1F2937] bg-[#111827]">
          <p className="text-sm font-semibold text-white mb-3">Getting started as Captain</p>
          <ol className="text-sm text-gray-400 space-y-2 list-decimal list-inside">
            <li>Go to <strong className="text-gray-200">My Team</strong> and create your team profile</li>
            <li>Add players to your squad roster</li>
            <li>Browse <strong className="text-gray-200">Apply Tournament</strong> and register</li>
            <li>Wait for admin approval, then track your match standings locally</li>
          </ol>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
