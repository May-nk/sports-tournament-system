import { useState, useEffect, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { getTeamsOfTournament, approveTeam, rejectTeam } from '../services/teamTournamentService';
import { getMatches, createMatch } from '../services/matchService';
import { getRole, getToken } from '../services/authService';
import { useTournament } from '../context/TournamentContext';

/* ─── Status style map ─────────────────────────────────────────────── */
const STATUS_STYLE = {
  pending:  'bg-sports-border text-sports-muted',
  approved: 'bg-green-600/20 text-green-400',
  rejected: 'bg-red-900/20 text-red-400',
};

/* ─── Helpers ───────────────────────────────────────────────────────── */
const safeStr  = (v, fb = '—') => (v !== null && v !== undefined ? String(v) : fb);
const safeName = (obj, fb)     => (obj && typeof obj === 'object' ? (obj.name ?? fb) : fb);

const formatDate = (raw) => {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    return isNaN(d.getTime()) ? String(raw) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return String(raw); }
};

const isCompleted = (s) => Boolean(s) && String(s).toLowerCase() === 'completed';

const toArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  for (const key of ['matches', 'data', 'results']) if (Array.isArray(data[key])) return data[key];
  const first = Object.values(data).find(Array.isArray);
  return first ?? (typeof data === 'object' ? [data] : []);
};

/* ═══════════════════════════════════════════════════════════════════
   APPROVE TEAMS TAB
   ═══════════════════════════════════════════════════════════════════ */

const AppCard = ({ app, onApprove, onReject }) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(null);
  const isPending = app.status === 'pending';
  const statusCls = STATUS_STYLE[app.status] ?? STATUS_STYLE.pending;

  const handle = (fn, type) => async () => { setBusy(type); await fn(app._id); setBusy(null); };

  return (
    <div className="rounded-none border border-sports-border bg-sports-card p-6
      hover:border-sports-accent/40 transition duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0 text-left">
          <h3 
            className="text-white font-black text-lg uppercase truncate cursor-pointer hover:text-sports-accent transition-colors"
            onClick={() => {
              if (app.team?._id || app.team) {
                navigate(`/team/${app.team?._id || app.team}`);
              }
            }}
          >
            {app.team?.name ?? 'Unknown Team'}
          </h3>
          <p className="text-[10px] font-bold text-sports-muted mt-1 uppercase tracking-widest">{app.team?.players?.length ?? 0} players registered</p>
          <span className={`inline-block mt-4 px-3 py-1 rounded-none text-[10px] font-black uppercase tracking-widest ${statusCls}`}>
            {app.status}
          </span>
        </div>
        {isPending && (
          <div className="flex gap-3 shrink-0">
            <button onClick={handle(onReject, 'reject')} disabled={busy !== null}
              className="border border-sports-border hover:bg-sports-bg text-white
                text-xs font-black uppercase tracking-widest rounded-none px-4 py-2 transition duration-200 disabled:opacity-50">
              {busy === 'reject' ? '...' : 'Reject'}
            </button>
            <button onClick={handle(onApprove, 'approve')} disabled={busy !== null}
              className="bg-sports-accent hover:bg-sports-accentHover text-white
                text-xs font-black uppercase tracking-widest rounded-none px-4 py-2 transition duration-200 disabled:opacity-50">
              {busy === 'approve' ? '...' : 'Approve'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ApproveTeamsTab = ({ tournamentId, token, showToast }) => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading]           = useState(false);
  const [hasLoaded, setHasLoaded]       = useState(false);

  const fetchApplications = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setApplications([]);
    try {
      const res = await getTeamsOfTournament(id);
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load applications.', 'error');
    } finally { setLoading(false); setHasLoaded(true); }
  }, [showToast]);

  useEffect(() => {
    if (tournamentId) fetchApplications(tournamentId);
    else { setApplications([]); setHasLoaded(false); }
  }, [tournamentId, fetchApplications]);

  const handleApprove = async (id) => {
    try {
      await approveTeam(id, token);
      await fetchApplications(tournamentId);
      showToast('Team approved', 'success');
    } catch (err) { showToast(err.response?.data?.message || 'Failed to approve.', 'error'); }
  };

  const handleReject = async (id) => {
    try {
      await rejectTeam(id, token);
      await fetchApplications(tournamentId);
      showToast('Team rejected', 'info');
    } catch (err) { showToast(err.response?.data?.message || 'Failed to reject.', 'error'); }
  };

  const pending  = applications.filter((a) => a.status === 'pending');
  const reviewed = applications.filter((a) => a.status !== 'pending');

  if (loading) return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-none border border-sports-border bg-sports-card p-6 animate-pulse space-y-3">
          <div className="h-5 bg-sports-bg rounded w-1/2" />
          <div className="h-3 bg-sports-bg rounded w-1/4" />
        </div>
      ))}
    </div>
  );

  if (!hasLoaded) return null;

  if (applications.length === 0) return (
    <div className="flex flex-col items-center justify-center gap-2 py-16 text-center bg-sports-card border border-sports-border mt-4">
      <p className="text-white font-bold uppercase tracking-widest text-sm">No applications found</p>
      <p className="text-sports-muted font-medium text-xs">No teams have applied to this tournament yet.</p>
    </div>
  );

  return (
    <>
      {pending.length > 0 && (
        <div className="mb-10">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-sports-muted mb-4 text-left">
            Pending Review ({pending.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pending.map((app) => <AppCard key={app._id} app={app} onApprove={handleApprove} onReject={handleReject} />)}
          </div>
        </div>
      )}
      {reviewed.length > 0 && (
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-sports-muted mb-4 text-left">
            Reviewed ({reviewed.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {reviewed.map((app) => <AppCard key={app._id} app={app} onApprove={handleApprove} onReject={handleReject} />)}
          </div>
        </div>
      )}
    </>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MATCH CARD (compact, for admin view)
   ═══════════════════════════════════════════════════════════════════ */
const MatchStatusBadge = ({ status }) => {
  const done = isCompleted(status);
  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-none text-[10px] font-black uppercase tracking-widest
      ${done ? 'bg-sports-bg border border-green-500/40 text-green-400' : 'bg-sports-bg border border-sports-border text-sports-muted'}`}>
      {done ? 'Completed' : 'Scheduled'}
    </span>
  );
};

const MatchCardCompact = ({ match }) => {
  const nameA = safeName(match.teamA, 'Team A');
  const nameB = safeName(match.teamB, 'Team B');
  return (
    <div className="rounded-none border border-sports-border bg-sports-card p-6
      hover:border-sports-accent/40 transition duration-200">
      {/* Teams */}
      <div className="flex items-center justify-between mb-6 text-left">
        <span className="text-white font-black text-lg uppercase truncate w-[40%]">{nameA}</span>
        <span className="text-sports-muted text-[10px] font-black uppercase tracking-widest px-2">VS</span>
        <span className="text-white font-black text-lg uppercase truncate text-right w-[40%]">{nameB}</span>
      </div>
      {/* Meta */}
      <div className="flex items-center justify-between pt-4 border-t border-sports-border">
        <div className="text-[10px] text-sports-muted font-bold uppercase tracking-widest text-left">
          {formatDate(match.date)} • {safeStr(match.venue, 'TBD')}
        </div>
        <MatchStatusBadge status={match.status} />
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   SCHEDULE MATCH TAB
   ═══════════════════════════════════════════════════════════════════ */
const ScheduleMatchTab = ({ tournamentId, token, showToast }) => {
  const [approvedTeams, setApprovedTeams] = useState([]);
  const [teamsLoading, setTeamsLoading]   = useState(false);

  const [teamA, setTeamA]   = useState('');
  const [teamB, setTeamB]   = useState('');
  const [date, setDate]     = useState('');
  const [venue, setVenue]   = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const [matches, setMatches]     = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(false);

  const fetchApprovedTeams = useCallback(async (id) => {
    if (!id) return;
    setTeamsLoading(true);
    setApprovedTeams([]);
    try {
      const res = await getTeamsOfTournament(id);
      const all = Array.isArray(res.data) ? res.data : [];
      setApprovedTeams(all.filter((t) => t.status === 'approved'));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to load teams.', 'error');
    } finally { setTeamsLoading(false); }
  }, [showToast]);

  const fetchMatches = useCallback(async (id) => {
    if (!id) return;
    setMatchesLoading(true);
    try {
      const res = await getMatches(id);
      setMatches(toArray(res.data));
    } catch { setMatches([]); } 
    finally { setMatchesLoading(false); }
  }, []);

  useEffect(() => {
    if (tournamentId) {
      fetchApprovedTeams(tournamentId);
      fetchMatches(tournamentId);
      setTeamA(''); setTeamB(''); setDate(''); setVenue(''); setFormError('');
    } else {
      setApprovedTeams([]); setMatches([]);
    }
  }, [tournamentId, fetchApprovedTeams, fetchMatches]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!teamA || !teamB || !date || !venue.trim()) {
      setFormError('Please fill in all fields.');
      return;
    }
    if (teamA === teamB) {
      setFormError('Team A and Team B must be different teams.');
      return;
    }

    setCreating(true);
    try {
      await createMatch({ tournamentId, teamA, teamB, date, venue: venue.trim() }, token);
      showToast('Match created', 'success');
      setTeamA(''); setTeamB(''); setDate(''); setVenue('');
      await fetchMatches(tournamentId);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create match.';
      setFormError(msg);
    } finally { setCreating(false); }
  };

  if (!tournamentId) return null;

  return (
    <div className="space-y-10 text-left">

      {/* ── Create Match Form ───────────────────────────────────── */}
      <div className="rounded-none border border-sports-border bg-sports-card p-8">
        <div className="mb-8">
          <h2 className="text-xl font-black uppercase text-white mb-2">New Match</h2>
          <p className="text-[10px] font-bold text-sports-muted uppercase tracking-widest">Select two approved teams and set the schedule</p>
        </div>

        {!teamsLoading && (
          <div className="mb-8">
            <div className="inline-block px-4 py-2 rounded-none bg-sports-bg border border-sports-border text-sports-muted text-[10px] uppercase font-black tracking-widest">
              {approvedTeams.length} approved team{approvedTeams.length !== 1 ? 's' : ''} available
            </div>
          </div>
        )}

        {teamsLoading ? (
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-sports-bg rounded-none border border-sports-border" />)}
          </div>
        ) : (
          <form id="create-match-form" onSubmit={handleCreate} className="space-y-6">
            <div>
              <label htmlFor="teamA-select" className="block text-[10px] font-black uppercase tracking-widest text-sports-muted mb-2">Team A</label>
              <select id="teamA-select" value={teamA} onChange={(e) => { setTeamA(e.target.value); setFormError(''); }} disabled={approvedTeams.length === 0}
                className="w-full px-4 py-3 rounded-none bg-sports-bg border border-sports-border focus:border-sports-accent outline-none
                  text-white font-bold uppercase text-sm transition duration-200 disabled:opacity-50">
                <option value="">Select Team A</option>
                {approvedTeams.map((t) => (
                  <option key={t._id} value={t.team?._id ?? t.team} disabled={t.team?._id === teamB || t.team === teamB}>
                    {t.team?.name ?? t.team}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="teamB-select" className="block text-[10px] font-black uppercase tracking-widest text-sports-muted mb-2">Team B</label>
              <select id="teamB-select" value={teamB} onChange={(e) => { setTeamB(e.target.value); setFormError(''); }} disabled={approvedTeams.length === 0}
                className="w-full px-4 py-3 rounded-none bg-sports-bg border border-sports-border focus:border-sports-accent outline-none
                  text-white font-bold uppercase text-sm transition duration-200 disabled:opacity-50">
                <option value="">Select Team B</option>
                {approvedTeams.map((t) => (
                  <option key={t._id} value={t.team?._id ?? t.team} disabled={t.team?._id === teamA || t.team === teamA}>
                    {t.team?.name ?? t.team}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="match-date" className="block text-[10px] font-black uppercase tracking-widest text-sports-muted mb-2">Match Date</label>
              <input id="match-date" type="datetime-local" value={date} onChange={(e) => { setDate(e.target.value); setFormError(''); }}
                className="w-full px-4 py-3 rounded-none bg-sports-bg border border-sports-border focus:border-sports-accent outline-none
                  text-white font-bold text-sm transition duration-200 [color-scheme:dark]"
              />
            </div>

            <div>
              <label htmlFor="match-venue" className="block text-[10px] font-black uppercase tracking-widest text-sports-muted mb-2">Venue</label>
              <input id="match-venue" type="text" placeholder="e.g. Main Stadium" value={venue} onChange={(e) => { setVenue(e.target.value); setFormError(''); }}
                className="w-full px-4 py-3 rounded-none bg-sports-bg border border-sports-border focus:border-sports-accent outline-none
                  text-white font-bold uppercase text-sm transition duration-200 placeholder-sports-muted/50"
              />
            </div>

            {formError && (
              <div className="px-5 py-4 rounded-none border border-red-900 bg-red-900/20 text-red-400 text-[10px] font-black uppercase tracking-widest">
                {formError}
              </div>
            )}

            <button type="submit" disabled={creating || approvedTeams.length < 2}
              className="w-full bg-sports-accent hover:bg-sports-accentHover text-sm font-black uppercase tracking-widest rounded-none px-6 py-4 text-white
                transition duration-200 disabled:opacity-50 mt-6">
              {creating ? 'Creating...' : 'Create Match'}
            </button>
          </form>
        )}
      </div>

      {/* ── Match List ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-black uppercase text-white">Scheduled Matches</h2>
        </div>

        {matchesLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-none border border-sports-border bg-sports-card p-6 animate-pulse space-y-3">
                <div className="h-4 bg-sports-bg rounded w-3/4" />
                <div className="h-3 bg-sports-bg rounded w-1/2" />
              </div>
            ))}
          </div>
        )}

        {!matchesLoading && matches.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center border border-sports-border bg-sports-card">
            <p className="text-white font-bold uppercase tracking-widest text-sm">No matches scheduled</p>
            <p className="text-sports-muted text-xs font-medium">Use the form to create a match.</p>
          </div>
        )}

        {!matchesLoading && matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((match, idx) => (
              <MatchCardCompact key={match._id ?? `m-${idx}`} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   ADMIN PANEL (root)
   ═══════════════════════════════════════════════════════════════════ */
const AdminPanel = () => {
  const role  = getRole();
  const token = getToken();
  const { selected: selectedTournament } = useTournament();

  if (role !== 'admin') return <Navigate to="/unauthorized" replace />;

  const [activeTab, setActiveTab] = useState('teams');
  const [toast, setToast]         = useState({ msg: '', type: 'info' });

  const showToast = useCallback((msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'info' }), 3500);
  }, []);

  const tabs = [
    { id: 'teams',    label: 'Approve Teams' },
    { id: 'schedule', label: 'Schedule Match' },
  ];

  return (
    <div className="text-white min-h-[80vh] pb-10 text-left">
      {/* ── Toast ──────────────────────────────────────────────────── */}
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-none text-[10px] uppercase tracking-widest font-black shadow-2xl transition-all duration-300
          ${toast.type === 'success' ? 'bg-sports-bg border border-green-500/40 text-green-400' 
          : toast.type === 'error' ? 'bg-sports-bg border border-red-500/40 text-red-400' 
          : 'bg-sports-bg border border-sports-border text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="mb-10 border-b border-sports-border pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Admin Panel</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-sports-muted">
          Manage team applications and schedule matches for your tournaments.
        </p>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      {selectedTournament ? (
        <>
          <div className="flex gap-8 mb-10 border-b border-sports-border">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-4 text-xs font-black uppercase tracking-widest transition duration-200 border-b-2 -mb-[1px]
                  ${activeTab === tab.id
                    ? 'border-sports-accent text-sports-accent'
                    : 'border-transparent text-sports-muted hover:text-white'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'teams' && <ApproveTeamsTab tournamentId={selectedTournament._id} token={token} showToast={showToast} />}
          {activeTab === 'schedule' && <ScheduleMatchTab tournamentId={selectedTournament._id} token={token} showToast={showToast} />}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-center border border-sports-border bg-sports-card">
          <p className="text-white font-bold uppercase tracking-widest text-sm">No tournament selected</p>
          <p className="text-sports-muted font-medium text-xs">Use the active tournament dropdown in the sidebar.</p>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
