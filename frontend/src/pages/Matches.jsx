import { Component, useState, useEffect, useCallback } from 'react';
import { getMatches, updateScore } from '../services/matchService';
import { getMyTeam } from '../services/teamService';
import { getRole, getToken, getUser } from '../services/authService';
import { useTournament } from '../context/TournamentContext';

/* ═══════════════════════════════════════════════════════════════════
   ERROR BOUNDARY
   ═══════════════════════════════════════════════════════════════════ */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-2xl w-full rounded-xl border border-red-900 bg-[#111827] p-8 text-gray-300">
          <h2 className="text-xl font-bold mb-3 text-red-500">Render Error Caught</h2>
          <pre className="text-xs text-red-400 bg-black/50 rounded-lg p-4 overflow-auto max-h-60 mt-4 border border-red-900/50">
            {String(this.state.error)}
          </pre>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-6 px-4 py-2 rounded border border-red-900 hover:bg-red-900/20 text-xs font-semibold transition-colors">
            Try Again
          </button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */
const safeStr  = (v, fb = '—') => (v != null ? String(v) : fb);
const safeName = (obj, fb)     => (obj && typeof obj === 'object' ? (obj.name ?? fb) : fb);

const getId = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  return ref._id ?? null;
};

const formatDate = (raw) => {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    return isNaN(d.getTime())
      ? String(raw)
      : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
   SHARED SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════════ */

/* ── Card Skeleton ─────────────────────────────────────────────────── */
const CardSkeleton = () => (
  <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 flex flex-col gap-3 animate-pulse">
    <div className="flex justify-between items-center mb-2">
      <div className="h-4 bg-[#1F2937] rounded w-1/3" />
      <div className="h-3 bg-[#1F2937] rounded w-6" />
      <div className="h-4 bg-[#1F2937] rounded w-1/3" />
    </div>
    <div className="h-4" />
    <div className="flex justify-between items-center mt-4 border-t border-[#1F2937] pt-4">
      <div className="h-3 bg-[#1F2937] rounded w-1/2" />
      <div className="h-5 bg-[#1F2937] rounded w-16" />
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════════════
   ADMIN MATCH CARD
   ═══════════════════════════════════════════════════════════════════ */
const AdminMatchCard = ({ match, onScoreUpdate }) => {
  const done  = isCompleted(match.status);
  const nameA = safeName(match.teamA, 'Team A');
  const nameB = safeName(match.teamB, 'Team B');

  const winnerId = getId(match.winner);
  const aId      = getId(match.teamA);
  const bId      = getId(match.teamB);
  const aWins    = done && winnerId && winnerId === aId;
  const bWins    = done && winnerId && winnerId === bId;

  /* score update local state */
  const [scoreA, setScoreA]   = useState('');
  const [scoreB, setScoreB]   = useState('');
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const handleSave = async () => {
    const a = Number(scoreA), b = Number(scoreB);
    if (scoreA === '' || scoreB === '' || isNaN(a) || isNaN(b)) {
      setErr('Enter valid numbers'); return;
    }
    setSaving(true); setErr('');
    try {
      await onScoreUpdate(match._id, a, b);
      setScoreA(''); setScoreB('');
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save');
    } finally { setSaving(false); }
  };

  return (
    <div id={`match-${match._id}`}
      className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 flex flex-col gap-3 transition duration-200 hover:border-purple-500/40 hover:bg-[#0F172A]">
      
      {/* TEAM SECTION */}
      <div className="flex justify-between items-center mb-1">
        <div className={`text-sm ${aWins ? 'text-green-400 font-semibold' : 'text-white font-medium'}`}>{nameA}</div>
        <div className="text-gray-500 text-xs uppercase tracking-wide">vs</div>
        <div className={`text-sm ${bWins ? 'text-green-400 font-semibold' : 'text-white font-medium'}`}>{nameB}</div>
      </div>

      {/* SCORE SECTION */}
      {done && (
        <div className="text-center text-lg font-semibold text-white my-1">
          {match.scoreA ?? 0} - {match.scoreB ?? 0}
        </div>
      )}

      {/* spacer if no score */}
      {!done && <div className="h-4"></div>}

      {/* META INFO + STATUS BADGE */}
      <div className="flex justify-between items-center mt-2 pt-4 border-t border-[#1F2937]">
        <div className="text-gray-400 text-xs">
          {formatDate(match.date)} • {safeStr(match.venue, 'TBD')}
        </div>
        <div className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider shrink-0 ${done ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
          {done ? 'Completed' : 'Scheduled'}
        </div>
      </div>

      {/* Admin-only: Score Update Panel */}
      {!done && (
        <div className="mt-2 pt-4 border-t border-[#1F2937]">
          <div className="flex gap-2 items-center">
            <input
              type="number" min="0" placeholder="A" value={scoreA}
              onChange={(e) => { setScoreA(e.target.value); setErr(''); }}
              className="w-14 px-2 py-1.5 rounded bg-[#0F172A] border border-[#1F2937] outline-none
                text-white text-xs focus:border-purple-500 transition-all text-center"
            />
            <span className="text-gray-500 text-xs">-</span>
            <input
              type="number" min="0" placeholder="B" value={scoreB}
              onChange={(e) => { setScoreB(e.target.value); setErr(''); }}
              className="w-14 px-2 py-1.5 rounded bg-[#0F172A] border border-[#1F2937] outline-none
                text-white text-xs focus:border-purple-500 transition-all text-center"
            />
            <button
              onClick={handleSave} disabled={saving}
              className="px-3 py-1.5 rounded bg-[#1F2937] hover:bg-purple-600/20 hover:text-purple-400 text-gray-300 text-xs font-semibold flex-1 transition-all border border-transparent hover:border-purple-500/30"
            >
              {saving ? '...' : 'Update'}
            </button>
          </div>
          {err && <p className="text-xs text-red-400 mt-2">{err}</p>}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   CAPTAIN MATCH CARD
   ═══════════════════════════════════════════════════════════════════ */
const CaptainMatchCard = ({ match, myTeamId }) => {
  const done  = isCompleted(match.status);
  const nameA = safeName(match.teamA, 'Team A');
  const nameB = safeName(match.teamB, 'Team B');
  const aId   = getId(match.teamA);
  const bId   = getId(match.teamB);

  const myTeamIsA = myTeamId && aId === myTeamId;
  const myTeamIsB = myTeamId && bId === myTeamId;

  const winnerId  = getId(match.winner);
  const aWins     = done && winnerId && winnerId === aId;
  const bWins     = done && winnerId && winnerId === bId;

  return (
    <div id={`captain-match-${match._id}`}
      className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 flex flex-col gap-3 transition duration-200 hover:border-purple-500/40 hover:bg-[#0F172A]">
      
      {/* TEAM SECTION */}
      <div className="flex justify-between items-center mb-1">
        <div className={`text-sm ${aWins ? 'text-green-400 font-semibold' : 'text-white font-medium'}`}>
          {nameA} {myTeamIsA && <span className="text-gray-500 font-normal ml-1">(You)</span>}
        </div>
        <div className="text-gray-500 text-xs uppercase tracking-wide px-2">vs</div>
        <div className={`text-sm ${bWins ? 'text-green-400 font-semibold' : 'text-white font-medium'}`}>
          {myTeamIsB && <span className="text-gray-500 font-normal mr-1">(You)</span>} {nameB}
        </div>
      </div>

      {/* SCORE SECTION */}
      {done && (
        <div className="text-center text-lg font-semibold text-white my-1">
          {match.scoreA ?? 0} - {match.scoreB ?? 0}
        </div>
      )}

      {/* spacer if no score */}
      {!done && <div className="h-4"></div>}

      {/* META INFO + STATUS BADGE */}
      <div className="flex justify-between items-center mt-2 pt-4 border-t border-[#1F2937]">
        <div className="text-gray-400 text-xs">
          {formatDate(match.date)} • {safeStr(match.venue, 'TBD')}
        </div>
        <div className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider shrink-0 ${done ? 'bg-green-600/20 text-green-400' : 'bg-gray-700 text-gray-300'}`}>
          {done ? 'Completed' : 'Scheduled'}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   STATS STRIP
   ═══════════════════════════════════════════════════════════════════ */
const StatsStrip = ({ matches, myTeamId }) => {
  const total     = matches.length;
  const completed = matches.filter(m => isCompleted(m.status)).length;
  const upcoming  = total - completed;

  // captain-specific stats
  const myMatches = myTeamId
    ? matches.filter(m => getId(m.teamA) === myTeamId || getId(m.teamB) === myTeamId)
    : [];
  const myWins = myMatches.filter(m => {
    const w = getId(m.winner);
    return w && (getId(m.teamA) === myTeamId || getId(m.teamB) === myTeamId) && w === myTeamId;
  }).length;

  const pills = myTeamId
    ? [
        { label: 'Your Matches', value: myMatches.length },
        { label: 'Wins',         value: myWins },
        { label: 'Completed',    value: completed },
        { label: 'Upcoming',     value: upcoming },
      ]
    : [
        { label: 'Total',     value: total },
        { label: 'Completed', value: completed },
        { label: 'Upcoming',  value: upcoming },
      ];

  return (
    <div className="flex gap-4 mb-8 flex-wrap">
      {pills.map(({ label, value }) => (
        <div key={label} className="bg-[#111827] border border-[#1F2937] rounded-xl px-5 py-4 flex-1 min-w-[120px]">
          <span className="text-2xl font-bold text-white block mb-1">{value}</span>
          <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide">{label}</span>
        </div>
      ))}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN INNER COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
const MatchesInner = () => {
  const { selected: selectedTournament } = useTournament();

  const role  = getRole();
  const token = getToken();
  const isAdmin   = role === 'admin';
  const isCaptain = role === 'captain';

  /* ── State ──────────────────────────────────────────────────────── */
  const [allMatches,  setAllMatches]  = useState([]);
  const [myTeamId,    setMyTeamId]    = useState(null);   // captain: own team _id
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [hasLoaded,   setHasLoaded]   = useState(false);
  const [toast,       setToast]       = useState({ msg: '', type: 'success' });
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'mine' | 'upcoming' | 'completed'

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3500);
  }, []);

  /* ── Fetch captain's own team once ─────────────────────────────── */
  useEffect(() => {
    if (!isCaptain || !token) return;
    getMyTeam(token)
      .then((res) => {
        setMyTeamId(res.data._id);
      })
      .catch(() => {/* captain has no team yet — show all matches */});
  }, [isCaptain, token]);

  /* ── Fetch matches ──────────────────────────────────────────────── */
  const fetchMatches = useCallback(async (id) => {
    setLoading(true);
    setError('');
    setAllMatches([]);
    try {
      const res = await getMatches(id);
      const normalized = toArray(res.data).filter(m => m && typeof m === 'object');
      setAllMatches(normalized);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load matches.');
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (selectedTournament?._id) {
      fetchMatches(selectedTournament._id);
    } else {
      setAllMatches([]); setError(''); setHasLoaded(false);
    }
  }, [selectedTournament?._id, fetchMatches]);

  /* ── Score update handler (admin only) ──────────────────────────── */
  const handleScoreUpdate = useCallback(async (matchId, scoreA, scoreB) => {
    await updateScore(matchId, { scoreA, scoreB }, token);
    showToast('Score updated successfully', 'success');
    await fetchMatches(selectedTournament._id);
  }, [token, selectedTournament, fetchMatches, showToast]);

  /* ── Derive displayed matches ────────────────────────────────────── */
  const visibleMatches = (() => {
    let base = allMatches;

    // Captain: if they have a team and filter is 'mine', show only their matches
    if (isCaptain && myTeamId && activeFilter === 'mine') {
      base = base.filter(m => getId(m.teamA) === myTeamId || getId(m.teamB) === myTeamId);
    }
    if (activeFilter === 'upcoming')  base = base.filter(m => !isCompleted(m.status));
    if (activeFilter === 'completed') base = base.filter(m => isCompleted(m.status));

    return base;
  })();

  /* ── Filter tabs config ──────────────────────────────────────────── */
  const filterTabs = [
    { id: 'all',       label: 'All Matches' },
    ...(isCaptain && myTeamId ? [{ id: 'mine', label: 'My Matches' }] : []),
    { id: 'upcoming',  label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
  ];

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="pb-10">

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded border
          text-sm font-semibold shadow-lg transition-all duration-300
          ${toast.type === 'success'
            ? 'bg-[#111827] border-green-500/40 text-green-400'
            : 'bg-[#111827] border-red-500/40 text-red-400'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="mb-8 border-b border-[#1F2937] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
          Matches
        </h1>
        {selectedTournament ? (
          <p className="text-gray-400 text-sm">
            {isAdmin ? 'Manage scores and scheduling for ' : 'Tracking matches for '}
            <span className="text-gray-300 font-medium">{selectedTournament.name}</span>
          </p>
        ) : (
          <p className="text-gray-400 text-sm">Select a tournament to view matches.</p>
        )}
      </div>

      {/* ── No Tournament Prompt ─────────────────────────────────────── */}
      {!selectedTournament && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-gray-500 text-sm">No tournament selected.</p>
        </div>
      )}

      {/* ── Stats Strip ──────────────────────────────────────────────── */}
      {selectedTournament && !loading && allMatches.length > 0 && (
        <StatsStrip matches={allMatches} myTeamId={myTeamId} />
      )}

      {/* ── Filter Tabs ──────────────────────────────────────────────── */}
      {selectedTournament && !loading && allMatches.length > 0 && (
        <div className="flex gap-4 mb-6 border-b border-[#1F2937] pb-[-1px]">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-1 py-2 text-sm font-medium transition-all duration-200 border-b-2 -mb-[1px]
                ${activeFilter === tab.id
                  ? 'border-purple-500 text-white'
                  : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Loading Skeletons ────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* ── Error State ──────────────────────────────────────────────── */}
      {!loading && error && (
        <div id="matches-error" className="flex items-center justify-center py-12">
          <p className="text-sm text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────────────── */}
      {selectedTournament && !loading && !error && hasLoaded && visibleMatches.length === 0 && (
        <div id="matches-empty" className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-gray-500 text-sm">No matches scheduled yet</p>
        </div>
      )}

      {/* ── Match Cards Grid ─────────────────────────────────────────── */}
      {!loading && visibleMatches.length > 0 && (
        <div id="matches-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleMatches.map((match, idx) =>
            isAdmin ? (
              <AdminMatchCard
                key={match._id ?? `m-${idx}`}
                match={match}
                onScoreUpdate={handleScoreUpdate}
              />
            ) : (
              <CaptainMatchCard
                key={match._id ?? `m-${idx}`}
                match={match}
                myTeamId={myTeamId}
              />
            )
          )}
        </div>
      )}

    </div>
  );
};

/* ─── Wrap with Error Boundary ──────────────────────────────────────── */
const Matches = () => (
  <ErrorBoundary>
    <MatchesInner />
  </ErrorBoundary>
);

export default Matches;
