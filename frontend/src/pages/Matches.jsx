import { Component, useState, useEffect, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getMatches, updateScore } from '../services/matchService';
import { getMyTeam } from '../services/teamService';
import { getRole, getToken, getUser } from '../services/authService';
import { useTournament } from '../context/TournamentContext';
import { useNavigate } from 'react-router-dom';

gsap.registerPlugin(ScrollTrigger);


/* ═══════════════════════════════════════════════════════════════════
   ERROR BOUNDARY
   ═══════════════════════════════════════════════════════════════════ */
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('[ErrorBoundary]', error, info); }
  render() {
    if (this.state.hasError) return (
      <div className="min-h-[80vh] flex items-center justify-center p-8">
        <div className="max-w-2xl w-full rounded-none border border-red-900 bg-sports-card p-10 text-white">
          <h2 className="text-2xl font-black mb-4 text-red-500 uppercase tracking-tight">Render Error Caught</h2>
          <pre className="text-xs text-red-400 bg-sports-bg rounded-none p-6 overflow-auto max-h-64 border border-red-900/50 uppercase tracking-widest font-bold">
            {String(this.state.error)}
          </pre>
          <button onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-8 px-6 py-3 rounded-none border border-red-900 hover:bg-red-900/20 text-xs font-black uppercase tracking-widest transition-colors text-white">
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
  <div className="bg-sports-card border border-sports-border rounded-none p-6 flex flex-col gap-4 animate-pulse">
    <div className="flex justify-between items-center mb-3">
      <div className="h-5 bg-sports-bg rounded-none w-1/3" />
      <div className="h-4 bg-sports-bg rounded-none w-8" />
      <div className="h-5 bg-sports-bg rounded-none w-1/3" />
    </div>
    <div className="h-6" />
    <div className="flex justify-between items-center mt-5 border-t border-sports-border pt-5">
      <div className="h-3 bg-sports-bg rounded-none w-1/2" />
      <div className="h-6 bg-sports-bg rounded-none w-20" />
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

  const navigate = useNavigate();

  return (
    <div id={`match-${match._id}`}
      onClick={() => navigate(`/matches/${match._id}`)}
      className="bg-sports-card border border-sports-border rounded-none p-6 flex flex-col gap-4 transition duration-200 hover:border-sports-accent hover:bg-sports-bg cursor-pointer">
      
      {/* TEAM SECTION */}
      <div className="flex justify-between items-center mb-2">
        <div className={`text-base uppercase tracking-wide truncate w-[40%] text-left ${aWins ? 'text-sports-accent font-black' : 'text-white font-black'}`}>{nameA}</div>
        <div className="text-sports-muted text-[10px] font-black uppercase tracking-widest px-2">VS</div>
        <div className={`text-base uppercase tracking-wide truncate w-[40%] text-right ${bWins ? 'text-sports-accent font-black' : 'text-white font-black'}`}>{nameB}</div>
      </div>

      {/* SCORE SECTION */}
      {done && (
        <div className="text-center text-3xl font-black text-white my-2 tracking-widest">
          {match.scoreA ?? 0} - {match.scoreB ?? 0}
        </div>
      )}

      {/* spacer if no score */}
      {!done && <div className="h-6"></div>}

      {/* META INFO + STATUS BADGE */}
      <div className="flex justify-between items-center mt-3 pt-5 border-t border-sports-border">
        <div className="text-sports-muted text-[10px] font-bold uppercase tracking-widest">
          {formatDate(match.date)} • {safeStr(match.venue, 'TBD')}
        </div>
        <div className={`px-3 py-1 rounded-none text-[10px] uppercase font-black tracking-widest shrink-0 border ${done ? 'bg-sports-bg border-sports-accent text-sports-accent' : 'bg-sports-bg border-sports-border text-sports-muted'}`}>
          {done ? 'Completed' : 'Scheduled'}
        </div>
      </div>

      {/* Admin-only: Score Update Panel */}
      {!done && (
        <div className="mt-4 pt-5 border-t border-sports-border" onClick={(e) => e.stopPropagation()}>
          <div className="flex gap-3 items-center">
            <input
              type="number" min="0" placeholder="A" value={scoreA}
              onChange={(e) => { setScoreA(e.target.value); setErr(''); }}
              className="w-16 px-3 py-2 rounded-none bg-sports-bg border border-sports-border outline-none
                text-white text-sm font-bold focus:border-sports-accent transition-all text-center"
            />
            <span className="text-sports-muted text-lg font-black">-</span>
            <input
              type="number" min="0" placeholder="B" value={scoreB}
              onChange={(e) => { setScoreB(e.target.value); setErr(''); }}
              className="w-16 px-3 py-2 rounded-none bg-sports-bg border border-sports-border outline-none
                text-white text-sm font-bold focus:border-sports-accent transition-all text-center"
            />
            <button
              onClick={handleSave} disabled={saving}
              className="px-4 py-2 rounded-none bg-sports-border hover:bg-sports-accent text-white text-[10px] uppercase tracking-widest font-black flex-1 transition-all border border-transparent"
            >
              {saving ? '...' : 'Update'}
            </button>
          </div>
          {err && <p className="text-[10px] uppercase font-bold tracking-widest text-red-400 mt-3">{err}</p>}
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

  const navigate = useNavigate();

  return (
    <div id={`captain-match-${match._id}`}
      onClick={() => navigate(`/matches/${match._id}`)}
      className="bg-sports-card border border-sports-border rounded-none p-6 flex flex-col gap-4 transition duration-200 hover:border-sports-accent hover:bg-sports-bg cursor-pointer">
      
      {/* TEAM SECTION */}
      <div className="flex justify-between items-center mb-2">
        <div className={`text-base uppercase tracking-wide truncate w-[40%] text-left ${aWins ? 'text-sports-accent font-black' : 'text-white font-black'}`}>
          {nameA} {myTeamIsA && <span className="text-sports-muted font-bold text-[10px] tracking-widest ml-2">(YOU)</span>}
        </div>
        <div className="text-sports-muted text-[10px] font-black uppercase tracking-widest px-2">VS</div>
        <div className={`text-base uppercase tracking-wide truncate w-[40%] text-right ${bWins ? 'text-sports-accent font-black' : 'text-white font-black'}`}>
          {myTeamIsB && <span className="text-sports-muted font-bold text-[10px] tracking-widest mr-2">(YOU)</span>} {nameB}
        </div>
      </div>

      {/* SCORE SECTION */}
      {done && (
        <div className="text-center text-3xl font-black text-white my-2 tracking-widest">
          {match.scoreA ?? 0} - {match.scoreB ?? 0}
        </div>
      )}

      {/* spacer if no score */}
      {!done && <div className="h-6"></div>}

      {/* META INFO + STATUS BADGE */}
      <div className="flex justify-between items-center mt-3 pt-5 border-t border-sports-border">
        <div className="text-sports-muted text-[10px] font-bold uppercase tracking-widest">
          {formatDate(match.date)} • {safeStr(match.venue, 'TBD')}
        </div>
        <div className={`px-3 py-1 rounded-none text-[10px] uppercase font-black tracking-widest shrink-0 border ${done ? 'bg-sports-bg border-sports-accent text-sports-accent' : 'bg-sports-bg border-sports-border text-sports-muted'}`}>
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
    <div className="flex gap-6 mb-10 flex-wrap">
      {pills.map(({ label, value }) => (
        <div key={label} className="bg-sports-card border border-sports-border rounded-none p-6 flex-1 min-w-[140px] text-center">
          <span className="text-4xl font-black text-white block mb-2">{value}</span>
          <span className="text-[10px] text-sports-muted uppercase font-black tracking-widest">{label}</span>
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
  const containerRef = useRef(null);

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

  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      const cards = containerRef.current.children;
      gsap.fromTo(cards, 
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          stagger: 0.1,
          duration: 0.6,
          ease: "power2.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
          }
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [visibleMatches]); // animate when data updates

  /* ── Filter tabs config ──────────────────────────────────────────── */
  const filterTabs = [
    { id: 'all',       label: 'All Matches' },
    ...(isCaptain && myTeamId ? [{ id: 'mine', label: 'My Matches' }] : []),
    { id: 'upcoming',  label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
  ];

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="pb-12 font-sans max-w-[1600px] mx-auto text-left">

      {/* Toast */}
      {toast.msg && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-none border
          text-[10px] uppercase font-black tracking-widest shadow-2xl transition-all duration-300
          ${toast.type === 'success'
            ? 'bg-sports-bg border-green-500/40 text-green-400'
            : 'bg-sports-bg border-red-500/40 text-red-400'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="mb-10 border-b border-sports-border pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
          Matches
        </h1>
        {selectedTournament ? (
          <p className="text-sports-muted text-xs font-bold uppercase tracking-widest">
            {isAdmin ? 'Manage scores and scheduling for ' : 'Tracking matches for '}
            <span className="text-white font-black">{selectedTournament.name}</span>
          </p>
        ) : (
          <p className="text-sports-muted text-xs font-bold uppercase tracking-widest">Select a tournament to view matches.</p>
        )}
      </div>

      {/* ── No Tournament Prompt ─────────────────────────────────────── */}
      {!selectedTournament && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-sports-card border border-sports-border">
          <p className="text-white font-bold uppercase tracking-widest text-sm">No tournament selected.</p>
        </div>
      )}

      {/* ── Stats Strip ──────────────────────────────────────────────── */}
      {selectedTournament && !loading && allMatches.length > 0 && (
        <StatsStrip matches={allMatches} myTeamId={myTeamId} />
      )}

      {/* ── Filter Tabs ──────────────────────────────────────────────── */}
      {selectedTournament && !loading && allMatches.length > 0 && (
        <div className="flex gap-8 mb-8 border-b border-sports-border pb-[-1px]">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`px-2 py-4 text-xs font-black uppercase tracking-widest transition-all duration-200 border-b-2 -mb-[1px]
                ${activeFilter === tab.id
                  ? 'border-sports-accent text-sports-accent'
                  : 'border-transparent text-sports-muted hover:text-white'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Loading Skeletons ────────────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* ── Error State ──────────────────────────────────────────────── */}
      {!loading && error && (
        <div id="matches-error" className="flex items-center justify-center py-12 bg-red-900/20 border border-red-900 mt-6">
          <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* ── Empty State ──────────────────────────────────────────────── */}
      {selectedTournament && !loading && !error && hasLoaded && visibleMatches.length === 0 && (
        <div id="matches-empty" className="flex flex-col items-center justify-center py-24 text-center bg-sports-card border border-sports-border mt-6">
          <p className="text-white font-bold uppercase tracking-widest text-sm">No matches scheduled yet</p>
        </div>
      )}

      {/* ── Match Cards Grid ─────────────────────────────────────────── */}
      {!loading && visibleMatches.length > 0 && (
        <div id="matches-grid" ref={containerRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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
