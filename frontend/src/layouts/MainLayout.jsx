import { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { getUser, getRole, logout } from '../services/authService';
import { useTournament } from '../context/TournamentContext';

/* ─── Minimal SVG Icons ────────────────────────────────────────────── */
const ICONS = {
  Home: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      <polyline points="9 22 9 12 15 12 15 22"></polyline>
    </svg>
  ),
  Trophy: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
      <path d="M4 22h16"></path>
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
    </svg>
  ),
  Check: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4"></polyline>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
    </svg>
  ),
  Zap: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
    </svg>
  ),
  BarChart: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"></line>
      <line x1="12" y1="20" x2="12" y2="4"></line>
      <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
  ),
  Users: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
      <circle cx="9" cy="7" r="4"></circle>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
    </svg>
  ),
  FileText: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
      <polyline points="14 2 14 8 20 8"></polyline>
      <line x1="16" y1="13" x2="8" y2="13"></line>
      <line x1="16" y1="17" x2="8" y2="17"></line>
      <polyline points="10 9 9 9 8 9"></polyline>
    </svg>
  )
};

/* ─── Role config ──────────────────────────────────────────────────── */
const NAV_LINKS = {
  admin: [
    { to: '/',            label: 'Dashboard',     icon: ICONS.Home },
    { to: '/command-center', label: 'Command Center', icon: ICONS.Zap },
    { to: '/tournaments', label: 'Tournaments',   icon: ICONS.Trophy },
    { to: '/admin',       label: 'Approve Teams', icon: ICONS.Check },
    { to: '/matches',     label: 'Matches',       icon: ICONS.Zap },
    { to: '/leaderboard', label: 'Leaderboard',   icon: ICONS.BarChart },
  ],
  captain: [
    { to: '/teams',       label: 'My Team',       icon: ICONS.Users },
    { to: '/tournaments', label: 'Apply',         icon: ICONS.FileText },
    { to: '/matches',     label: 'My Matches',    icon: ICONS.Zap },
    { to: '/leaderboard', label: 'Leaderboard',   icon: ICONS.BarChart },
  ],
};

/* ─── Tournament Selector Dropdown ────────────────────────────────── */
const TournamentSelector = () => {
  const { tournaments, selected, selectTournament, loading } = useTournament();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = tournaments.filter((t) =>
    (t?.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const STATUS_DOT = {
    upcoming:  'bg-sky-400',
    ongoing:   'bg-emerald-400',
    completed: 'bg-sports-muted',
  };

  return (
    <div ref={ref} className="relative px-4 pb-4">
      {/* Trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm
          border transition-all duration-200 text-left
          ${open
            ? 'bg-sports-accent/10 border-sports-accent/30 text-white'
            : 'bg-sports-card border-sports-border text-sports-muted hover:bg-sports-border hover:text-white'}`}
      >
        {loading ? (
          <svg className="w-3.5 h-3.5 animate-spin text-sports-muted shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <span className="shrink-0 text-sports-muted">{ICONS.Trophy}</span>
        )}
        <span className="flex-1 truncate text-xs font-bold tracking-wide uppercase">
          {selected ? selected.name : 'Select Tournament'}
        </span>
        <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute left-4 right-4 top-full mt-1 z-50
          bg-sports-card border border-sports-border rounded-md shadow-xl overflow-hidden">

          {/* Search */}
          <div className="p-2 border-b border-sports-border">
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full px-3 py-1.5 rounded-md bg-sports-bg border border-transparent
                text-white text-xs placeholder-sports-muted outline-none
                focus:border-sports-accent transition-all font-medium"
            />
          </div>

          {/* Options list */}
          <ul className="max-h-52 overflow-y-auto">
            {/* Clear option */}
            <li>
              <button
                onClick={() => { selectTournament(null); setOpen(false); setSearch(''); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium
                  transition-colors text-sports-muted hover:bg-sports-border hover:text-white`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"></path></svg> Clear selection
              </button>
            </li>

            {filtered.length === 0 && (
              <li className="px-3 py-4 text-xs text-sports-muted font-medium text-center">
                No tournaments found
              </li>
            )}

            {filtered.map((t) => (
              <li key={t._id}>
                <button
                  onClick={() => { selectTournament(t); setOpen(false); setSearch(''); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left
                    transition-colors text-sm font-medium
                    ${selected?._id === t._id
                      ? 'bg-sports-accent/10 text-white'
                      : 'text-sports-muted hover:bg-sports-border hover:text-white'}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[t.status] ?? 'bg-sports-muted'}`} />
                  <span className="flex-1 truncate text-xs">{t.name}</span>
                  {selected?._id === t._id && (
                    <svg className="w-3.5 h-3.5 text-sports-accent shrink-0" fill="none" viewBox="0 0 24 24"
                      stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ─── Nav item ─────────────────────────────────────────────────────── */
const NavItem = ({ to, label, icon, isExact }) => (
  <NavLink
    to={to}
    end={isExact}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-md text-sm transition-all duration-150 border-l-4 font-semibold ${
         isActive
           ? 'bg-sports-accent/10 text-white border-sports-accent'
           : 'text-sports-muted hover:text-white hover:bg-sports-card border-transparent'
       }`
    }
  >
    <span className="shrink-0">{icon}</span>
    <span>{label}</span>
  </NavLink>
);

/* ═══════════════════════════════════════════════════════════════════ */
const MainLayout = () => {
  const navigate = useNavigate();
  const { selected } = useTournament();
  const user  = getUser();
  const role  = getRole() ?? 'guest';
  const links = NAV_LINKS[role] ?? [];

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  return (
    <div className="flex min-h-screen bg-sports-bg text-sports-text pl-64">

      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="w-64 bg-sports-card border-r border-sports-border h-screen fixed left-0 top-0 flex flex-col text-sm z-40">

        {/* Brand */}
        <div className="px-6 pt-6 mb-8 flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-sports-accent flex items-center justify-center shrink-0">
            <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="3" className="text-white">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white uppercase">
            SportsSys
          </h2>
        </div>

        {/* Tournament selector */}
        <TournamentSelector />
        
        {selected && (
          <div className="mx-4 mb-4 px-3 py-2 rounded-md bg-sports-bg border border-sports-border">
            <p className="text-[10px] text-sports-muted uppercase tracking-wider font-bold">
              {selected.sport} · <span className="capitalize">{selected.format}</span>
            </p>
          </div>
        )}

        {/* Nav */}
        <div className="flex flex-col flex-1 px-4 overflow-y-auto mt-2">
          <p className="text-[10px] uppercase text-sports-muted tracking-widest mb-3 px-1 font-bold">
            {role === 'admin' ? 'Administration' : 'Captain Tools'}
          </p>
          <nav className="flex flex-col gap-1">
            {links.map(({ to, label, icon }) => (
              <NavItem key={to} to={to} label={label} icon={icon} isExact={to === '/'} />
            ))}
          </nav>
        </div>

        {/* User panel */}
        <div className="p-4 border-t border-sports-border mt-auto relative">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="min-w-0 pr-2">
              <p className="text-sm font-bold text-white truncate">
                {user?.name ?? user?.email ?? 'Unknown'}
              </p>
            </div>
            <span className="px-2 py-1 rounded bg-sports-border text-sports-text text-[10px] uppercase tracking-widest font-bold shrink-0">
              {role}
            </span>
          </div>
          <button
            id="logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-md text-sm font-bold uppercase tracking-wide
              text-sports-muted hover:bg-sports-border hover:text-white transition-all duration-200"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
            </svg>
            Log out
          </button>
        </div>
      </aside>

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-10 bg-sports-bg text-sports-text">
        <div className="max-w-[1600px] mx-auto h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
