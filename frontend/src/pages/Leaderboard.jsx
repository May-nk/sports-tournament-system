import { useState, useEffect } from 'react';
import { getLeaderboardByTournament } from '../services/leaderboardService';
import { useTournament } from '../context/TournamentContext';

/* ── Individual team card ────────────────────────────────────────── */
const TeamCard = ({ entry, rank }) => {
  const isFirst = rank === 1;

  // No gold/silver/bronze glows. Just textual hierarchy.
  const rankColors = {
    1: 'text-white font-bold',
    2: 'text-gray-300 font-semibold',
    3: 'text-gray-400 font-semibold',
  };
  const rankStyle = rankColors[rank] || 'text-gray-400 font-semibold';

  // Sorting visual: first card slightly prominent
  const borderStyle = isFirst 
    ? 'border-purple-500/40 hover:border-purple-500/60' 
    : 'border-[#1F2937] hover:border-purple-500/40';

  return (
    <div
      id={`team-card-rank-${rank}`}
      className={`
        bg-[#111827] border ${borderStyle} rounded-xl p-5
        flex flex-col gap-4 transition duration-200 
        cursor-default select-none
      `}
    >
      {/* Top Section */}
      <div className="flex items-center justify-between">
        <span className={`text-lg ${rankStyle}`}>
          #{rank}
        </span>
        <h3 className="text-white font-medium text-base truncate ml-3 text-right">
          {entry.team?.name ?? 'Unknown Team'}
        </h3>
      </div>

      {/* Middle Section: Stats row */}
      <div className="flex justify-between items-center px-1 py-2 bg-[#0F172A]/50 rounded-lg border border-[transparent]">
        <div className="text-xs text-gray-400 font-medium tracking-wide">W: <span className="text-gray-300">{entry.wins}</span></div>
        <div className="text-xs text-gray-400 font-medium tracking-wide">L: <span className="text-gray-300">{entry.losses}</span></div>
        <div className="text-xs text-gray-400 font-medium tracking-wide">D: <span className="text-gray-300">{entry.draws}</span></div>
      </div>

      {/* Bottom Section: Points */}
      <div className="flex justify-between items-end mt-1 pt-3 border-t border-[#1F2937]">
        <span className="text-xs text-gray-500 uppercase font-semibold tracking-wide">Points</span>
        <span className="text-xl font-semibold text-white leading-none tracking-tight">{entry.points}</span>
      </div>
    </div>
  );
};

/* ── Loading skeleton ────────────────────────────────────────────── */
const CardSkeleton = () => (
  <div className="bg-[#111827] border border-[#1F2937] rounded-xl p-5 flex flex-col gap-4 animate-pulse">
    <div className="flex justify-between items-center">
      <div className="h-6 bg-[#1F2937] rounded w-8" />
      <div className="h-5 bg-[#1F2937] rounded w-28" />
    </div>
    <div className="flex justify-between px-2 py-2 mt-1">
      <div className="h-3 bg-[#1F2937] rounded w-6" />
      <div className="h-3 bg-[#1F2937] rounded w-6" />
      <div className="h-3 bg-[#1F2937] rounded w-6" />
    </div>
    <div className="flex justify-between items-end mt-1 pt-4 border-t border-[#1F2937]">
      <div className="h-3 bg-[#1F2937] rounded w-12" />
      <div className="h-6 bg-[#1F2937] rounded w-8" />
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
    <div className="pb-10">

      {/* ── Page header ────────────────────────────────────────── */}
      <div className="mb-8 border-b border-[#1F2937] pb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white mb-1">
          Leaderboard
        </h1>
        {selectedTournament ? (
          <p className="text-gray-400 text-sm">
            Showing standings for{' '}
            <span className="text-gray-300 font-medium">{selectedTournament.name}</span>
          </p>
        ) : (
          <p className="text-gray-400 text-sm">Select a tournament to view standings.</p>
        )}
      </div>

      {/* ── No tournament selected prompt ───────────────────────── */}
      {!selectedTournament && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-gray-500 text-sm">No tournament selected.</p>
        </div>
      )}

      {/* ── Loading skeletons ───────────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* ── Error state ────────────────────────────────────────── */}
      {!loading && error && (
        <div id="leaderboard-error" className="flex flex-col items-center justify-center py-12">
          <p className="text-sm text-red-400 font-medium">{error}</p>
        </div>
      )}

      {/* ── Empty state ────────────────────────────────────────── */}
      {selectedTournament && !loading && !error && hasLoaded && teams.length === 0 && (
        <div id="leaderboard-empty" className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-gray-500 text-sm">No leaderboard data available</p>
        </div>
      )}

      {/* ── Results grid ───────────────────────────────────────── */}
      {!loading && teams.length > 0 && (
        <div
          id="leaderboard-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
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
