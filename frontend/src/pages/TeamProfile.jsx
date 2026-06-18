import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTeams } from '../services/teamService';
import { getMatches } from '../services/matchService';
import { getLeaderboardByTournament } from '../services/leaderboardService';
import { useTournament } from '../context/TournamentContext';

const isCompleted = (status) => Boolean(status) && String(status).toLowerCase() === 'completed';

const TeamProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selected: tournament } = useTournament();

  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [matches, setMatches] = useState([]);
  const [leaderboardEntry, setLeaderboardEntry] = useState(null);
  const [rank, setRank] = useState(null);

  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true);
      try {
        // 1. Fetch team info from all teams
        const teamsRes = await getTeams();
        const teams = Array.isArray(teamsRes.data) ? teamsRes.data : [];
        const foundTeam = teams.find(t => t._id === id);
        
        if (!foundTeam) {
          setTeam(null);
          setLoading(false);
          return;
        }
        setTeam(foundTeam);

        // 2. Fetch tournament specific data if a tournament is selected
        if (tournament) {
          const [matchesRes, leaderRes] = await Promise.all([
            getMatches(tournament._id).catch(() => ({ data: [] })),
            getLeaderboardByTournament(tournament._id).catch(() => ({ data: [] }))
          ]);

          const allMatches = Array.isArray(matchesRes.data) ? matchesRes.data : [];
          // Filter matches involving this team
          const teamMatches = allMatches.filter(
            m => (m.teamA?._id || m.teamA) === id || (m.teamB?._id || m.teamB) === id
          );
          // Sort by date descending
          teamMatches.sort((a, b) => new Date(b.date) - new Date(a.date));
          setMatches(teamMatches);

          const leaderboard = Array.isArray(leaderRes.data) ? leaderRes.data : [];
          const lEntryIndex = leaderboard.findIndex(entry => (entry.team?._id || entry.team) === id);
          if (lEntryIndex !== -1) {
            setLeaderboardEntry(leaderboard[lEntryIndex]);
            setRank(lEntryIndex + 1);
          } else {
            setLeaderboardEntry(null);
            setRank(null);
          }
        } else {
           setMatches([]);
           setLeaderboardEntry(null);
           setRank(null);
        }

      } catch (err) {
        console.error("Failed to load team profile", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
  }, [id, tournament]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sports-accent"></div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold text-sports-muted">Team Not Found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-3 bg-sports-accent text-white font-bold uppercase rounded">Go Back</button>
      </div>
    );
  }

  // Calculate Stats
  const completedMatches = matches.filter(m => Boolean(m.status) && String(m.status).toLowerCase() === 'completed');
  const matchesPlayed = leaderboardEntry ? (leaderboardEntry.wins + leaderboardEntry.losses + leaderboardEntry.draws) : completedMatches.length;
  const wins = leaderboardEntry ? leaderboardEntry.wins : completedMatches.filter(m => (m.winner?._id || m.winner) === id).length;
  const draws = leaderboardEntry ? leaderboardEntry.draws : completedMatches.filter(m => !m.winner && m.status.toLowerCase() === 'completed').length;
  const losses = leaderboardEntry ? leaderboardEntry.losses : (matchesPlayed - wins - draws);
  const winRate = matchesPlayed > 0 ? Math.round((wins / matchesPlayed) * 100) : 0;
  const points = leaderboardEntry ? leaderboardEntry.points : (wins * 2 + draws * 1);

  // Recent Form (Last 5 completed matches)
  const recentCompleted = completedMatches.slice(0, 5);
  // Order from oldest to newest for form display (left to right = oldest to newest, wait typically left is newest or right is newest. Let's do newest first)
  const formStr = recentCompleted.map(m => {
    if (!m.winner) return 'D';
    return (m.winner?._id || m.winner) === id ? 'W' : 'L';
  });

  // Calculate best winning streak
  let bestStreak = 0;
  let currentStreak = 0;
  // Iterate chronologically (reverse of recentCompleted which is newest first)
  const chronologicalCompleted = [...completedMatches].reverse();
  chronologicalCompleted.forEach(m => {
    if (m.winner && (m.winner?._id || m.winner) === id) {
      currentStreak++;
      if (currentStreak > bestStreak) bestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  });

  const getTeamName = (t) => typeof t === 'object' ? t?.name || 'Unknown' : t || 'Unknown';
  const formatDate = (d) => {
    if (!d) return 'TBA';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="pb-12 text-sports-text font-sans max-w-[1600px] mx-auto">
      
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="mb-6 flex items-center text-sports-muted hover:text-white transition-colors text-xs uppercase tracking-widest font-bold">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back
      </button>

      {/* SECTION 1: TEAM HEADER */}
      <div className="bg-sports-card border border-sports-border rounded-none p-10 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg className="w-64 h-64 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 4.5l6.5 13h-13L12 6.5z"/></svg>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end relative z-10">
          <div>
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-2">{team.name}</h1>
            <p className="text-sports-muted uppercase tracking-widest text-sm font-bold">Captain: <span className="text-white">{getTeamName(team.captain)}</span></p>
          </div>
          
          <div className="flex gap-8 mt-6 md:mt-0">
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-sports-muted tracking-widest mb-1">Total Players</p>
              <p className="text-4xl font-black text-white">{team.players?.length || 0}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-sports-muted tracking-widest mb-1">Win Rate</p>
              <p className="text-4xl font-black text-white">{winRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {!tournament && (
        <div className="bg-sports-bg border border-sports-border rounded-none p-6 mb-8 text-center">
           <p className="text-sm text-sports-muted uppercase tracking-widest font-bold">Select a tournament to view full statistics and matches.</p>
        </div>
      )}

      {tournament && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* SECTION 3: TEAM STATISTICS */}
            <div className="bg-sports-card border border-sports-border rounded-none p-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-sports-muted mb-6">Tournament Statistics</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                 <div className="p-6 bg-sports-bg border border-sports-border rounded-none text-center">
                    <p className="text-[10px] font-bold uppercase text-sports-muted tracking-widest mb-2">Matches Played</p>
                    <p className="text-4xl font-black text-white">{matchesPlayed}</p>
                 </div>
                 <div className="p-6 bg-sports-bg border border-sports-border rounded-none text-center">
                    <p className="text-[10px] font-bold uppercase text-sports-muted tracking-widest mb-2">Wins</p>
                    <p className="text-4xl font-black text-white">{wins}</p>
                 </div>
                 <div className="p-6 bg-sports-bg border border-sports-border rounded-none text-center">
                    <p className="text-[10px] font-bold uppercase text-sports-muted tracking-widest mb-2">Losses</p>
                    <p className="text-4xl font-black text-white">{losses}</p>
                 </div>
                 <div className="p-6 bg-sports-bg border border-sports-border rounded-none text-center">
                    <p className="text-[10px] font-bold uppercase text-sports-muted tracking-widest mb-2">Draws</p>
                    <p className="text-4xl font-black text-white">{draws}</p>
                 </div>
                 <div className="p-6 bg-sports-bg border border-sports-border rounded-none text-center">
                    <p className="text-[10px] font-bold uppercase text-sports-muted tracking-widest mb-2">Total Points</p>
                    <p className="text-4xl font-black text-white">{points}</p>
                 </div>
                 <div className="p-6 bg-sports-bg border border-sports-border rounded-none text-center">
                    <p className="text-[10px] font-bold uppercase text-sports-muted tracking-widest mb-2">Current Rank</p>
                    <p className="text-4xl font-black text-white">{rank ? `#${rank}` : '—'}</p>
                 </div>
              </div>
            </div>

            {/* SECTION 5: RECENT MATCHES */}
            <div className="bg-sports-card border border-sports-border rounded-none p-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-sports-muted mb-6">Latest Matches</h2>
              <div className="space-y-4">
                {matches.length > 0 ? (
                  matches.slice(0, 5).map(match => {
                    const isTeamA = (match.teamA?._id || match.teamA) === id;
                    const opponent = isTeamA ? match.teamB : match.teamA;
                    const isCompletedMatch = isCompleted(match.status);
                    
                    let resultBadge = null;
                    if (isCompletedMatch) {
                      const isWinner = (match.winner?._id || match.winner) === id;
                      const isDraw = !match.winner;
                      if (isDraw) resultBadge = <span className="bg-sports-border text-sports-text px-3 py-1 rounded-none text-[10px] uppercase font-black tracking-widest">Draw</span>;
                      else if (isWinner) resultBadge = <span className="bg-sports-bg border border-sports-accent text-sports-accent px-3 py-1 rounded-none text-[10px] uppercase font-black tracking-widest">Won</span>;
                      else resultBadge = <span className="bg-sports-bg border border-sports-border text-sports-muted px-3 py-1 rounded-none text-[10px] uppercase font-black tracking-widest">Lost</span>;
                    } else {
                      resultBadge = <span className="bg-sports-bg text-sports-muted border border-sports-border px-3 py-1 rounded-none text-[10px] uppercase font-black tracking-widest">Upcoming</span>;
                    }

                    return (
                      <div key={match._id} onClick={() => navigate(`/matches/${match._id}`)} className="flex flex-col md:flex-row items-center justify-between border border-sports-border bg-sports-bg rounded-none p-5 cursor-pointer hover:border-sports-accent transition-colors">
                        <div className="flex items-center gap-6 mb-2 md:mb-0 w-full md:w-auto">
                           <div className="w-20 text-center">{resultBadge}</div>
                           <div className="flex flex-col">
                             <span className="text-[10px] font-bold text-sports-muted uppercase tracking-widest mb-1">VS {getTeamName(opponent)}</span>
                             {isCompletedMatch && <span className="text-xl font-black text-white">{match.scoreA ?? 0} - {match.scoreB ?? 0}</span>}
                           </div>
                        </div>
                        <div className="flex flex-col items-end text-right w-full md:w-auto">
                           <p className="text-[10px] font-bold text-sports-muted uppercase tracking-widest mb-1">{formatDate(match.date)}</p>
                           <p className="text-[10px] font-bold text-sports-text uppercase tracking-widest">{match.venue || 'TBA'}</p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center border border-sports-border border-dashed rounded-none bg-sports-bg">
                    <p className="text-sm font-bold text-sports-muted uppercase tracking-widest">No matches found</p>
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: TEAM SQUAD */}
            <div className="bg-sports-card border border-sports-border rounded-none p-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-sports-muted mb-6">Team Squad</h2>
              {team.players && team.players.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {team.players.map(player => (
                    <div key={player._id || player.name} className="bg-sports-bg border border-sports-border rounded-none p-5 flex justify-between items-center hover:border-sports-accent transition-colors">
                       <div>
                         <p className="text-lg font-black text-white uppercase mb-1">{player.name}</p>
                         <p className="text-[10px] font-bold text-sports-muted uppercase tracking-widest">Age: {player.age}</p>
                       </div>
                       <div className="text-right">
                         <span className="inline-block border border-sports-border bg-sports-card px-4 py-2 rounded-none text-[10px] uppercase tracking-widest text-sports-text font-black">
                           {player.position}
                         </span>
                       </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center border border-sports-border border-dashed rounded-none bg-sports-bg">
                  <p className="text-sm font-bold text-sports-muted uppercase tracking-widest">No players registered</p>
                </div>
              )}
            </div>

          </div>

          {/* Right Column */}
          <div className="space-y-8">
            
            {/* SECTION 4: RECENT FORM */}
            <div className="bg-sports-card border border-sports-border rounded-none p-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-sports-muted mb-6">Recent Form</h2>
              <div className="flex justify-center gap-4 py-2">
                {formStr.length > 0 ? (
                  formStr.map((res, i) => (
                    <div key={i} className={`w-12 h-12 rounded-none flex items-center justify-center text-lg font-black border uppercase
                      ${res === 'W' ? 'bg-sports-bg border-sports-accent text-sports-accent' : res === 'L' ? 'bg-sports-bg border-sports-border text-sports-muted' : 'bg-sports-bg border-sports-border text-sports-text'}`}>
                      {res}
                    </div>
                  ))
                ) : (
                  <p className="text-sm font-bold text-sports-muted uppercase tracking-widest">No completed matches</p>
                )}
              </div>
              <p className="text-[10px] font-bold text-sports-muted uppercase tracking-widest text-center mt-6 border-t border-sports-border pt-6">Last 5 Matches (Newest First)</p>
            </div>

            {/* SECTION 6: ACHIEVEMENTS */}
            <div className="bg-sports-card border border-sports-border rounded-none p-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-sports-muted mb-6">Achievements</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-sports-bg border border-sports-border rounded-none p-5">
                   <span className="text-[10px] font-bold text-sports-muted uppercase tracking-widest">Current Rank</span>
                   <span className="text-2xl font-black text-white">{rank ? `#${rank}` : '—'}</span>
                </div>
                <div className="flex justify-between items-center bg-sports-bg border border-sports-border rounded-none p-5">
                   <span className="text-[10px] font-bold text-sports-muted uppercase tracking-widest">Total Points</span>
                   <span className="text-2xl font-black text-white">{points}</span>
                </div>
                <div className="flex justify-between items-center bg-sports-bg border border-sports-border rounded-none p-5">
                   <span className="text-[10px] font-bold text-sports-muted uppercase tracking-widest">Best Win Streak</span>
                   <span className="text-2xl font-black text-white">{bestStreak}</span>
                </div>
                <div className="flex justify-between items-center bg-sports-bg border border-sports-border rounded-none p-5">
                   <span className="text-[10px] font-bold text-sports-muted uppercase tracking-widest">Total Wins</span>
                   <span className="text-2xl font-black text-white">{wins}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default TeamProfile;
