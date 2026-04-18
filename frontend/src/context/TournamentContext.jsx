import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getTournaments } from '../services/tournamentService';

/* ─── Context ──────────────────────────────────────────────────────── */
const TournamentContext = createContext(null);

const STORAGE_KEY = 'selectedTournamentId';

/* ─── Provider ─────────────────────────────────────────────────────── */
export const TournamentProvider = ({ children }) => {
  const [tournaments, setTournaments]   = useState([]);
  const [selected, setSelected]         = useState(null); // full tournament object
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');

  const fetchTournaments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getTournaments();
      const list = Array.isArray(res.data) ? res.data : [];
      setTournaments(list);

      // Restore persisted selection
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId) {
        const match = list.find((t) => t._id === savedId);
        if (match) setSelected(match);
      }
    } catch (err) {
      console.error('[TournamentContext] fetch error:', err);
      setError('Failed to load tournaments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTournaments(); }, [fetchTournaments]);

  const selectTournament = (tournament) => {
    setSelected(tournament);
    if (tournament) {
      localStorage.setItem(STORAGE_KEY, tournament._id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <TournamentContext.Provider
      value={{ tournaments, selected, loading, error, selectTournament, refetch: fetchTournaments }}
    >
      {children}
    </TournamentContext.Provider>
  );
};

/* ─── Hook ─────────────────────────────────────────────────────────── */
export const useTournament = () => {
  const ctx = useContext(TournamentContext);
  if (!ctx) throw new Error('useTournament must be used inside TournamentProvider');
  return ctx;
};

export default TournamentContext;
