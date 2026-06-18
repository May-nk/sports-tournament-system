import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMatchById } from '../services/matchService';

const safeName = (obj, fb = '—') => (obj && typeof obj === 'object' ? (obj.name || fb) : fb);

const formatDate = (raw) => {
  if (!raw) return '—';
  try {
    const d = new Date(raw);
    return isNaN(d.getTime())
      ? String(raw)
      : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return String(raw); }
};

const MatchDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await getMatchById(id);
        setMatch(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load match details.');
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sports-accent"></div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <p className="text-red-500 font-bold text-lg mb-4">{error || 'Match not found'}</p>
        <button onClick={() => navigate('/matches')} className="px-6 py-3 bg-sports-accent hover:bg-sports-accentHover text-white font-bold rounded transition">BACK TO MATCHES</button>
      </div>
    );
  }

  const nameA = safeName(match.teamA, 'Team A');
  const nameB = safeName(match.teamB, 'Team B');
  const isCompleted = match.status && match.status.toLowerCase() === 'completed';

  return (
    <div className="pb-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <button onClick={() => navigate(-1)} className="mb-6 mt-4 flex items-center text-sports-muted hover:text-white transition uppercase font-bold text-xs tracking-widest">
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        Back
      </button>

      {/* ── Match Status & Info ────────────────────────────────────── */}
      <div className="bg-sports-card border border-sports-border rounded-none p-6 md:p-10 relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-white">
           <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
          <div className="text-center md:text-left flex-1 w-full">
            <span className="text-[10px] font-bold uppercase tracking-widest text-sports-accent mb-4 block">
              {match.tournament?.type ? `${match.tournament.type} Match` : 'Cricket Match'} • {match.tournament?.name || 'Tournament'}
            </span>
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 justify-center md:justify-start w-full">
              <div className="text-center md:text-right flex-1">
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">{nameA}</h2>
                {isCompleted && <p className="text-sports-muted text-sm mt-2 font-bold uppercase">{match.team1Overs ? `${match.team1Overs} Overs` : ''}</p>}
              </div>
              <div className="flex flex-col items-center px-6 shrink-0">
                <span className="text-sports-muted/50 text-xs font-black mb-3">VS</span>
                {isCompleted ? (
                   <div className="bg-sports-bg border border-sports-border px-8 py-3 rounded text-center min-w-[140px]">
                     <span className="text-3xl md:text-4xl font-black text-white tracking-widest">
                       {match.team1Score ?? match.scoreA ?? 0} - {match.team2Score ?? match.scoreB ?? 0}
                     </span>
                   </div>
                ) : (
                  <span className={`px-4 py-1 text-[10px] uppercase font-black tracking-widest border ${match.status === 'Live' ? 'bg-red-600 border-red-500 text-white animate-pulse' : 'bg-sports-border border-transparent text-sports-muted'}`}>
                    {match.status || 'Scheduled'}
                  </span>
                )}
              </div>
              <div className="text-center md:text-left flex-1">
                <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tight">{nameB}</h2>
                {isCompleted && <p className="text-sports-muted text-sm mt-2 font-bold uppercase">{match.team2Overs ? `${match.team2Overs} Overs` : ''}</p>}
              </div>
            </div>
            {match.resultText && (
              <p className="mt-8 text-center md:text-center text-sports-accent font-black text-xl uppercase tracking-wide border-t border-sports-border pt-6">{match.resultText}</p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-sports-border flex flex-wrap justify-center md:justify-start gap-8 text-sm relative z-10">
          <div><span className="text-[10px] text-sports-muted uppercase tracking-widest block mb-1 font-bold">Venue</span><span className="text-white font-bold uppercase">{match.venue || '—'}</span></div>
          <div><span className="text-[10px] text-sports-muted uppercase tracking-widest block mb-1 font-bold">Date</span><span className="text-white font-bold uppercase">{formatDate(match.matchDate || match.date)}</span></div>
          {match.tossWinner && (
            <div><span className="text-[10px] text-sports-muted uppercase tracking-widest block mb-1 font-bold">Toss</span><span className="text-white font-bold uppercase">{safeName(match.tossWinner)} won & elected to {match.electedTo || '—'}</span></div>
          )}
        </div>
      </div>

      {/* ── Bottom Grid: Scorecards & Cards ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Left Column: Scorecards ──────────────────────────────── */}
        <div className="lg:col-span-2 space-y-8">
          {/* Team 1 Scorecard */}
          <div className="bg-sports-card border border-sports-border rounded-none overflow-hidden">
            <div className="bg-sports-border px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase tracking-wide">{nameA} Innings</h3>
              <div className="text-right">
                <span className="text-3xl font-black text-white">{match.team1Score ?? match.scoreA ?? 0}/{match.team1Wickets ?? 0}</span>
                <span className="text-sports-muted text-sm font-bold uppercase ml-3">({match.team1Overs ?? 0} Ov)</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center border-b border-sports-border pb-4 mb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-sports-muted">Top Scorer</span>
                <div className="text-right">
                  <span className="text-white font-bold text-lg uppercase">{match.team1TopScorer || '—'}</span>
                  <span className="text-sports-muted ml-3 font-bold">{match.team1TopScore ? `${match.team1TopScore} RUNS` : ''}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Team 2 Scorecard */}
          <div className="bg-sports-card border border-sports-border rounded-none overflow-hidden">
            <div className="bg-sports-border px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-black text-white uppercase tracking-wide">{nameB} Innings</h3>
              <div className="text-right">
                <span className="text-3xl font-black text-white">{match.team2Score ?? match.scoreB ?? 0}/{match.team2Wickets ?? 0}</span>
                <span className="text-sports-muted text-sm font-bold uppercase ml-3">({match.team2Overs ?? 0} Ov)</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center border-b border-sports-border pb-4 mb-4">
                <span className="text-[10px] uppercase font-bold tracking-widest text-sports-muted">Top Scorer</span>
                <div className="text-right">
                  <span className="text-white font-bold text-lg uppercase">{match.team2TopScorer || '—'}</span>
                  <span className="text-sports-muted ml-3 font-bold">{match.team2TopScore ? `${match.team2TopScore} RUNS` : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Cards ─────────────────────────────────── */}
        <div className="space-y-8">
          {/* Player of Match Card */}
          <div className="bg-sports-card border border-sports-border border-l-4 border-l-sports-accent p-6 relative overflow-hidden group">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-sports-muted mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2 text-sports-accent" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                Player of the Match
             </h3>
             <div className="text-3xl font-black text-white uppercase">{match.playerOfMatch || 'Not announced'}</div>
          </div>

          {/* Match Summary Card */}
          <div className="bg-sports-card border border-sports-border p-6 h-full max-h-80 overflow-y-auto">
             <h3 className="text-[10px] font-bold uppercase tracking-widest text-sports-muted mb-4">Match Summary</h3>
             <p className="text-white font-medium leading-relaxed text-sm">
                {match.matchSummary || 'No summary available for this match.'}
             </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MatchDetails;
