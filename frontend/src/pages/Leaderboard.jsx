import { useState, useEffect } from 'react';
import { getLeaderboardByTournament } from '../services/leaderboardService';
import { useTournament } from '../context/TournamentContext';

import { useNavigate } from 'react-router-dom';

/* ── Individual team card ────────────────────────────────────────── */
const TeamCard = ({ entry, rank }) => {
  const isFirst = rank === 1;
  const navigate = useNavigate();

  // No gold/silver/bronze glows. Just textual hierarchy.
  const rankColors = {
    1: 'text-sports-accent font-black',
    2: 'text-white font-black',
    3: 'text-sports-muted font-bold',
  };
  const rankStyle = rankColors[rank] || 'text-sports-muted font-bold';

  // Sorting visual: first card slightly prominent
  const borderStyle = isFirst 
    ? 'border-sports-accent hover:border-sports-accentHover' 
    : 'border-sports-border hover:border-sports-accent';

  const handleCardClick = () => {
    const teamId = entry.team?._id || entry.team;
    if (teamId) {
      navigate(`/team/${teamId}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      id={`team-card-rank-${rank}`}
      className={`
        bg-sports-card border ${borderStyle} rounded-none p-6
        flex flex-col gap-6 transition duration-200 
        cursor-pointer select-none hover:bg-sports-bg
      `}
    >
      {/* Top Section */}
      <div className="flex items-center justify-between">
        <span className={`text-2xl ${rankStyle}`}>
          #{rank}
        </span>
        <h3 className="text-white font-black text-xl uppercase tracking-wide truncate ml-4 text-right">
          {entry.team?.name ?? 'Unknown Team'}
        </h3>
      </div>

      {/* Middle Section: Stats row */}
      <div className="flex justify-between items-center px-4 py-3 bg-sports-bg rounded-none border border-sports-border">
        <div className="text-[10px] text-sports-muted font-black uppercase tracking-widest">W: <span className="text-white text-base">{entry.wins}</span></div>
        <div className="text-[10px] text-sports-muted font-black uppercase tracking-widest">L: <span className="text-white text-base">{entry.losses}</span></div>
        <div className="text-[10px] text-sports-muted font-black uppercase tracking-widest">D: <span className="text-white text-base">{entry.draws}</span></div>
      </div>

      {/* Bottom Section: Points */}
      <div className="flex justify-between items-end mt-2 pt-4 border-t border-sports-border">
        <span className="text-[10px] text-sports-muted uppercase font-black tracking-widest">Points</span>
        <span className="text-3xl font-black text-white leading-none tracking-tight">{entry.points}</span>
      </div>
    </div>
  );
};

/* ── Loading skeleton ────────────────────────────────────────────── */
const CardSkeleton = () => (
  <div className="bg-sports-card border border-sports-border rounded-none p-6 flex flex-col gap-6 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-8 bg-sports-bg rounded-none w-10" />
      <div className="h-6 bg-sports-bg rounded-none w-32" />
    </div>
    <div className="flex justify-between px-4 py-3 bg-sports-bg mt-2 border border-sports-border">
      <div className="h-4 bg-sports-card rounded-none w-8" />
      <div className="h-4 bg-sports-card rounded-none w-8" />
      <div className="h-4 bg-sports-card rounded-none w-8" />
    </div>
    <div className="flex justify-between items-end mt-2 pt-4 border-t border-sports-border">
      <div className="h-3 bg-sports-bg rounded-none w-16" />
      <div className="h-8 bg-sports-bg rounded-none w-12" />
    </div>
  </div>
);

/* ══ Main Leaderboard Component ═══════════════════════════════════ */
const Leaderboard = () => {
  const { selected: selectedTournament } = useTournament();
  const [teams, setTeams]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchLeaderboard = async (id) => {
    setLoading(true);
    setError('');
    setTeams([]);
    try {
      const res = await getLeaderboardByTournament(id);
      const sorted = [...(res.data ?? [])].sort((a, b) => b.points - a.points);
      setTeams(sorted);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load leaderboard.';
      setError(msg);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  };

  // Auto-fetch whenever the selected tournament changes
  useEffect(() => {
    if (selectedTournament?._id) {
      fetchLeaderboard(selectedTournament._id);
    } else {
      setTeams([]);
      setError('');
      setHasLoaded(false);
    }
  }, [selectedTournament?._id]);

  return (
    <div className="pb-12 font-sans max-w-[1600px] mx-auto text-left">

      {/* ── Page header ────────────────────────────────────────── */}
      <div className="mb-10 border-b border-sports-border pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
          Leaderboard
        </h1>
        {selectedTournament ? (
          <p className="text-sports-muted text-xs font-bold uppercase tracking-widest">
            Showing standings for{' '}
            <span className="text-white font-black">{selectedTournament.name}</span>
          </p>
        ) : (
          <p className="text-sports-muted text-xs font-bold uppercase tracking-widest">Select a tournament to view standings.</p>
        )}
      </div>

      {/* ── No tournament selected prompt ───────────────────────── */}
      {!selectedTournament && (
        <div className="flex flex-col items-center justify-center py-24 text-center bg-sports-card border border-sports-border">
          <p className="text-white font-bold uppercase tracking-widest text-sm">No tournament selected.</p>
        </div>
      )}

      {/* ── Loading skeletons ───────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────── */}
      {!loading && error && (
        <div id="leaderboard-error" className="flex flex-col items-center justify-center py-12 bg-red-900/20 border border-red-900 mt-4">
          <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">{error}</p>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────── */}
      {selectedTournament && !loading && !error && hasLoaded && teams.length === 0 && (
        <div id="leaderboard-empty" className="flex flex-col items-center justify-center py-24 text-center bg-sports-card border border-sports-border">
          <p className="text-white font-bold uppercase tracking-widest text-sm">No leaderboard data available</p>
        </div>
      )}

      {/* ── Results grid ───────────────────────────────────────── */}
      {!loading && teams.length > 0 && (
        <div
          id="leaderboard-grid"
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8"
        >
          {teams.map((entry, idx) => (
            <TeamCard key={entry._id} entry={entry} rank={idx + 1} />
          ))}
        </div>
      )}

    </div>
  );
};

export default Leaderboard;
