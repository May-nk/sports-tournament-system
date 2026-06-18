import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { getTeamsOfTournament } from '../services/teamTournamentService';
import { getMatches } from '../services/matchService';
import { getLeaderboardByTournament } from '../services/leaderboardService';
import { useTournament } from '../context/TournamentContext';

const isCompleted = (s) => Boolean(s) && String(s).toLowerCase() === 'completed';

const AdminCommandCenter = () => {
  const { selected: tournament } = useTournament();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  
  // Data state
  const [stats, setStats] = useState({
    totalTeams: 0,
    approvedTeams: 0,
    pendingTeams: 0,
    totalMatches: 0,
    completedMatches: 0,
    scheduledMatches: 0,
    totalRunsScored: 0,
    currentLeader: 'N/A',
    winPctLeader: 'N/A',
    matchesRemaining: 0,
    tournamentWinner: null
  });
  const [nextMatch, setNextMatch] = useState(null);
  const [recentMatches, setRecentMatches] = useState([]);
  const [topTeams, setTopTeams] = useState([]);
  const [insights, setInsights] = useState([]);

  // GSAP Refs
  const containerRef = useRef(null);
  const statsRef = useRef([]);
  const progressRef = useRef(null);

  useEffect(() => {
    if (!tournament) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [teamsRes, matchesRes, leaderRes] = await Promise.all([
          getTeamsOfTournament(tournament._id).catch(() => ({ data: [] })),
          getMatches(tournament._id).catch(() => ({ data: [] })),
          getLeaderboardByTournament(tournament._id).catch(() => ({ data: [] }))
        ]);

        // Process Teams
        const teams = Array.isArray(teamsRes.data) ? teamsRes.data : [];
        const approvedTeamsCount = teams.filter(t => t.status === 'approved').length;
        const pendingTeamsCount = teams.filter(t => t.status === 'pending').length;

        // Process Matches
        const matches = Array.isArray(matchesRes.data) ? matchesRes.data : [];
        let totalRuns = 0;
        
        matches.forEach(m => {
          totalRuns += (m.team1Score || m.scoreA || 0) + (m.team2Score || m.scoreB || 0);
        });

        const completedMatchesArr = matches.filter(m => isCompleted(m.status));
        const upcomingMatchesArr = matches.filter(m => !isCompleted(m.status));

        upcomingMatchesArr.sort((a, b) => new Date(a.date) - new Date(b.date));
        completedMatchesArr.sort((a, b) => new Date(b.date) - new Date(a.date));

        const recent5 = completedMatchesArr.slice(0, 5);
        const matchesRemaining = upcomingMatchesArr.length;
        const tournamentWinner = tournament.status === 'completed' && completedMatchesArr.length > 0 
          ? completedMatchesArr[0].winner?.name 
          : null;

        // Process Leaderboard
        const leaderData = Array.isArray(leaderRes.data) ? leaderRes.data : [];
        const top3 = leaderData.slice(0, 3);
        
        let currentLeader = 'N/A';
        let winPctLeader = 'N/A';
        
        if (leaderData.length > 0) {
          currentLeader = leaderData[0].team?.name || 'N/A';
          
          // Calculate win pct leader
          let bestPct = -1;
          let bestTeam = 'N/A';
          leaderData.forEach(entry => {
            const totalPlayed = entry.wins + entry.losses + entry.draws;
            if (totalPlayed >= 1) { // minimum 1 match
              const pct = entry.wins / totalPlayed;
              if (pct > bestPct) {
                bestPct = pct;
                bestTeam = entry.team?.name || 'N/A';
              }
            }
          });
          if (bestPct !== -1) {
            winPctLeader = `${bestTeam} (${Math.round(bestPct * 100)}%)`;
          }
        }

        setStats({
          totalTeams: teams.length,
          approvedTeams: approvedTeamsCount,
          pendingTeams: pendingTeamsCount,
          totalMatches: matches.length,
          completedMatches: completedMatchesArr.length,
          scheduledMatches: upcomingMatchesArr.length,
          totalRunsScored: totalRuns,
          currentLeader,
          winPctLeader,
          matchesRemaining,
          tournamentWinner
        });

        setNextMatch(upcomingMatchesArr[0] || null);
        setRecentMatches(recent5);
        setTopTeams(top3);

        // Generate Insights
        const newInsights = [];
        if (currentLeader !== 'N/A') {
          newInsights.push(`${currentLeader} currently leads the tournament standings.`);
        }
        if (matchesRemaining > 0) {
          newInsights.push(`Only ${matchesRemaining} matches remain in the schedule.`);
        } else if (matches.length > 0 && matchesRemaining === 0) {
          newInsights.push(`All scheduled matches have been completed.`);
        } else {
          newInsights.push(`No matches have been scheduled yet.`);
        }
        if (totalRuns > 0) {
          newInsights.push(`A massive total of ${totalRuns} runs have been scored so far.`);
        } else if (pendingTeamsCount > 0) {
          newInsights.push(`There are ${pendingTeamsCount} teams waiting for approval.`);
        }
        
        // Ensure exactly 3 insights
        while (newInsights.length < 3) {
           newInsights.push("Tournament is progressing steadily.");
        }
        setInsights(newInsights.slice(0, 3));

      } catch (err) {
        console.error("Failed to load command center data", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tournament]);

  // GSAP Animations
  useEffect(() => {
    if (loading) return;

    const ctx = gsap.context(() => {
      // Cards Fade In
      gsap.fromTo(
        ".gsap-card",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
      );

      // Stats Animate Upward
      statsRef.current.forEach(el => {
        if (!el) return;
        const val = parseFloat(el.innerText.replace(/[^0-9.]/g, '')) || 0;
        gsap.fromTo(el,
          { innerHTML: 0 },
          { 
            innerHTML: val, 
            duration: 1.5, 
            ease: "power2.out", 
            snap: { innerHTML: 1 },
            onUpdate: function() {
               // Preserve text parts if needed, but for simple stats, numbers suffice
               if (el.dataset.suffix) {
                  el.innerHTML = Math.round(this.targets()[0].innerHTML) + el.dataset.suffix;
               } else if (el.dataset.prefix) {
                  el.innerHTML = el.dataset.prefix + Math.round(this.targets()[0].innerHTML);
               }
            }
          }
        );
      });

      // Progress bar fill
      if (progressRef.current) {
        gsap.fromTo(progressRef.current,
          { width: "0%" },
          { width: progressRef.current.dataset.width, duration: 1.5, ease: "power3.out", delay: 0.3 }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [loading, stats]);

  if (!tournament) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold text-sports-muted uppercase tracking-widest">No Tournament Selected</h2>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sports-accent"></div>
      </div>
    );
  }

  const progressPct = stats.totalMatches > 0 ? Math.round((stats.completedMatches / stats.totalMatches) * 100) : 0;
  
  const formatDate = (dateStr) => {
    if (!dateStr) return 'TBA';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getTeamName = (team) => typeof team === 'object' ? team?.name || 'Unknown' : team || 'Unknown';

  const addStatRef = (el) => {
    if (el && !statsRef.current.includes(el)) {
      statsRef.current.push(el);
    }
  };

  return (
    <div className="pb-12 text-sports-text font-sans max-w-[1600px] mx-auto" ref={containerRef}>
      
      {/* Page Title */}
      <div className="mb-8 border-b border-sports-border pb-6">
        <h1 className="text-3xl font-black tracking-tight text-white uppercase">Command Center</h1>
        <p className="text-sm text-sports-accent uppercase tracking-widest mt-2 font-bold">Single Control Hub</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column (Main) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* SECTION 1: TOURNAMENT OVERVIEW */}
          <div className="gsap-card bg-sports-card border border-sports-border rounded-none p-8">
            <h2 className="text-xs uppercase tracking-widest text-sports-muted mb-6 font-bold">Tournament Overview</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 border-b border-sports-border pb-8">
              <div><p className="text-[10px] text-sports-muted uppercase tracking-widest mb-1 font-bold">Name</p><p className="font-bold text-white truncate text-sm uppercase">{tournament.name}</p></div>
              <div><p className="text-[10px] text-sports-muted uppercase tracking-widest mb-1 font-bold">Format</p><p className="font-bold text-white uppercase text-sm">{tournament.format}</p></div>
              <div><p className="text-[10px] text-sports-muted uppercase tracking-widest mb-1 font-bold">Status</p><p className="font-bold text-white uppercase text-sm">{tournament.status || 'Upcoming'}</p></div>
              <div><p className="text-[10px] text-sports-muted uppercase tracking-widest mb-1 font-bold">Timeline</p><p className="font-bold text-white text-sm uppercase">{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</p></div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
               <div className="p-6 bg-sports-bg border border-sports-border rounded-none">
                 <p className="text-[10px] uppercase text-sports-muted tracking-widest mb-2 font-bold">Total Teams</p>
                 <p className="text-3xl font-black text-white" ref={addStatRef}>{stats.totalTeams}</p>
               </div>
               <div className="p-6 bg-sports-bg border border-sports-border rounded-none">
                 <p className="text-[10px] uppercase text-sports-muted tracking-widest mb-2 font-bold">Approved Teams</p>
                 <p className="text-3xl font-black text-white" ref={addStatRef}>{stats.approvedTeams}</p>
               </div>
               <div className="p-6 bg-sports-bg border border-sports-border rounded-none">
                 <p className="text-[10px] uppercase text-sports-muted tracking-widest mb-2 font-bold">Pending Teams</p>
                 <p className="text-3xl font-black text-white" ref={addStatRef}>{stats.pendingTeams}</p>
               </div>
               <div className="p-6 bg-sports-bg border border-sports-border rounded-none">
                 <p className="text-[10px] uppercase text-sports-muted tracking-widest mb-2 font-bold">Scheduled Matches</p>
                 <p className="text-3xl font-black text-white" ref={addStatRef}>{stats.scheduledMatches}</p>
               </div>
               <div className="p-6 bg-sports-bg border border-sports-border rounded-none">
                 <p className="text-[10px] uppercase text-sports-muted tracking-widest mb-2 font-bold">Completed Matches</p>
                 <p className="text-3xl font-black text-white" ref={addStatRef}>{stats.completedMatches}</p>
               </div>
               <div className="p-6 bg-sports-bg border border-sports-border rounded-none">
                 <p className="text-[10px] uppercase text-sports-muted tracking-widest mb-2 font-bold">Tournament Winner</p>
                 <p className="text-lg font-black text-white mt-2 truncate uppercase">{stats.tournamentWinner || 'TBD'}</p>
               </div>
            </div>
          </div>

          {/* SECTION 2: LIVE TOURNAMENT STATS & SECTION 3: TOURNAMENT PROGRESS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="gsap-card bg-sports-card border border-sports-border rounded-none p-8">
              <h2 className="text-xs uppercase tracking-widest text-sports-muted mb-6 font-bold">Live Analytics</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase text-sports-muted tracking-widest mb-2 font-bold">Total Runs Scored</p>
                  <p className="text-4xl font-black text-white" ref={addStatRef}>{stats.totalRunsScored}</p>
                </div>
                <div className="border-t border-sports-border pt-4">
                  <p className="text-[10px] uppercase text-sports-muted tracking-widest mb-2 font-bold">Current Leader</p>
                  <p className="text-xl font-black text-white uppercase">{stats.currentLeader}</p>
                </div>
                <div className="border-t border-sports-border pt-4">
                  <p className="text-[10px] uppercase text-sports-muted tracking-widest mb-2 font-bold">Win Percentage Leader</p>
                  <p className="text-xl font-black text-white uppercase">{stats.winPctLeader}</p>
                </div>
              </div>
            </div>

            <div className="gsap-card bg-sports-card border border-sports-border rounded-none p-8 flex flex-col justify-between">
              <div>
                <h2 className="text-xs uppercase tracking-widest text-sports-muted mb-6 font-bold">Tournament Progress</h2>
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] uppercase text-sports-muted tracking-widest font-bold">Completion</span>
                  <span className="text-4xl font-black text-white" data-suffix="%" ref={addStatRef}>{progressPct}%</span>
                </div>
                <div className="w-full bg-sports-bg rounded-none h-2 overflow-hidden mb-8 border border-sports-border">
                  <div 
                    ref={progressRef}
                    data-width={`${progressPct}%`}
                    className="bg-sports-accent h-full" 
                    style={{ width: '0%' }}>
                  </div>
                </div>
              </div>
              <div className="bg-sports-bg border border-sports-border rounded-none p-6">
                 <p className="text-[10px] uppercase text-sports-muted tracking-widest mb-2 font-bold">Matches Remaining</p>
                 <p className="text-4xl font-black text-white" ref={addStatRef}>{stats.matchesRemaining}</p>
              </div>
            </div>
          </div>

          {/* SECTION 4: NEXT MATCH */}
          <div className="gsap-card bg-sports-card border border-sports-border rounded-none p-8">
            <h2 className="text-xs uppercase tracking-widest text-sports-muted mb-6 font-bold">Next Match</h2>
            {nextMatch ? (
              <div className="flex flex-col md:flex-row items-center justify-between border border-sports-border bg-sports-bg rounded-none p-6">
                <div className="flex-1 flex justify-end">
                  <span className="text-3xl font-black text-white truncate uppercase tracking-tight">{getTeamName(nextMatch.teamA)}</span>
                </div>
                <div className="px-8 py-2 flex flex-col items-center justify-center border-l border-r border-sports-border mx-8">
                  <span className="text-[10px] text-sports-muted uppercase tracking-widest mb-2 font-bold">VS</span>
                  <span className="text-xs bg-sports-border text-sports-text px-4 py-1.5 rounded-none uppercase font-black tracking-wider">{nextMatch.status || 'Scheduled'}</span>
                </div>
                <div className="flex-1 flex justify-start">
                  <span className="text-3xl font-black text-white truncate uppercase tracking-tight">{getTeamName(nextMatch.teamB)}</span>
                </div>
                <div className="w-full md:w-auto mt-6 md:mt-0 flex flex-col md:items-end text-sm text-sports-muted pl-0 md:pl-8">
                   <p className="mb-2 uppercase text-[10px] font-bold tracking-widest">{formatDate(nextMatch.date)}</p>
                   <p className="mb-2 font-bold text-white uppercase">{nextMatch.venue || 'TBA'}</p>
                   <p className="uppercase font-bold text-[10px] tracking-widest">{matchTypeStr(nextMatch.round)}</p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center border border-sports-border border-dashed rounded-none bg-sports-bg">
                <p className="text-sm text-sports-muted uppercase tracking-widest font-bold">No upcoming matches</p>
              </div>
            )}
          </div>

          {/* SECTION 5: RECENT RESULTS */}
          <div className="gsap-card bg-sports-card border border-sports-border rounded-none p-8">
            <h2 className="text-xs uppercase tracking-widest text-sports-muted mb-6 font-bold">Recent Results</h2>
            <div className="space-y-4">
              {recentMatches.length > 0 ? (
                recentMatches.map(match => (
                  <div 
                    key={match._id} 
                    onClick={() => navigate(`/matches/${match._id}`)}
                    className="flex flex-col md:flex-row items-center justify-between border border-sports-border bg-sports-bg rounded-none p-6 cursor-pointer hover:border-sports-accent transition-colors group"
                  >
                    <div className="flex-1 flex flex-col mb-4 md:mb-0">
                       <p className="text-lg font-black text-white mb-2 uppercase tracking-wide group-hover:text-sports-accent transition-colors">
                         {getTeamName(match.teamA)} <span className="text-sports-muted font-bold mx-3 text-xs tracking-widest">VS</span> {getTeamName(match.teamB)}
                       </p>
                       <p className="text-xs font-bold text-sports-muted uppercase tracking-widest">
                         {match.resultText || (match.winner ? `${getTeamName(match.winner)} won` : 'Completed')}
                       </p>
                    </div>
                    <div className="flex flex-col items-end text-right">
                       <p className="text-[10px] text-sports-muted font-bold uppercase tracking-widest mb-2">{formatDate(match.date)}</p>
                       <p className="text-xs font-bold text-white uppercase tracking-widest">{match.venue || 'TBA'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-10 text-center border border-sports-border border-dashed rounded-none bg-sports-bg">
                  <p className="text-sm font-bold text-sports-muted uppercase tracking-widest">No completed matches</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Column (Sidebar) */}
        <div className="space-y-8">
          
          {/* SECTION 7: QUICK ACTIONS */}
          <div className="gsap-card bg-sports-card border border-sports-border rounded-none p-8">
            <h2 className="text-xs uppercase tracking-widest text-sports-muted mb-6 font-bold">Quick Actions</h2>
            <div className="flex flex-col gap-4">
              <button onClick={() => navigate('/admin')} className="w-full text-left px-6 py-5 bg-sports-bg hover:border-sports-accent border border-sports-border rounded-none text-sm text-white uppercase tracking-widest font-black transition-colors">
                Approve Teams
              </button>
              <button onClick={() => navigate('/admin')} className="w-full text-left px-6 py-5 bg-sports-bg hover:border-sports-accent border border-sports-border rounded-none text-sm text-white uppercase tracking-widest font-black transition-colors">
                Schedule Match
              </button>
              <button onClick={() => navigate('/matches')} className="w-full text-left px-6 py-5 bg-sports-bg hover:border-sports-accent border border-sports-border rounded-none text-sm text-white uppercase tracking-widest font-black transition-colors">
                Update Score
              </button>
              <button onClick={() => navigate('/leaderboard')} className="w-full text-left px-6 py-5 bg-sports-bg hover:border-sports-accent border border-sports-border rounded-none text-sm text-white uppercase tracking-widest font-black transition-colors">
                View Leaderboard
              </button>
              <button onClick={() => navigate('/matches')} className="w-full text-left px-6 py-5 bg-sports-accent hover:bg-sports-accentHover text-white rounded-none text-sm uppercase tracking-widest font-black transition-colors mt-4">
                View Match Center
              </button>
            </div>
          </div>

          {/* SECTION 6: TOP TEAMS */}
          <div className="gsap-card bg-sports-card border border-sports-border rounded-none p-8">
            <h2 className="text-xs uppercase tracking-widest text-sports-muted mb-6 font-bold">Top Teams</h2>
            <div className="space-y-4">
              {topTeams.length > 0 ? (
                topTeams.map((entry, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-sports-bg border border-sports-border p-5 rounded-none">
                    <div className="flex items-center gap-6">
                      <span className="text-2xl font-black text-sports-muted">{idx + 1}</span>
                      <div>
                        <p className="text-base font-black uppercase tracking-wide text-white">{entry.team?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-sports-muted font-bold uppercase tracking-widest mt-1">{entry.wins}W - {entry.losses}L</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-white">{entry.points}</p>
                      <p className="text-[10px] font-bold text-sports-muted uppercase tracking-widest">PTS</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center border border-sports-border border-dashed rounded-none bg-sports-bg">
                  <p className="text-[10px] font-bold text-sports-muted uppercase tracking-widest">No leaderboard data</p>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 8: ADMIN INSIGHTS */}
          <div className="gsap-card bg-sports-card border border-sports-border rounded-none p-8">
            <h2 className="text-xs uppercase tracking-widest text-sports-muted mb-6 font-bold">Admin Insights</h2>
            <ul className="space-y-5">
              {insights.map((insight, idx) => (
                <li key={idx} className="flex gap-4">
                  <span className="text-sports-accent mt-1">
                     <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 12l5 5L20 7"></path></svg>
                  </span>
                  <p className="text-sm font-bold text-white leading-relaxed uppercase tracking-wide">{insight}</p>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

// Helper for match type
const matchTypeStr = (round) => {
  if (!round) return 'Regular Match';
  return round;
};

export default AdminCommandCenter;
