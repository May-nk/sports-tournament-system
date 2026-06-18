import { useEffect, useState } from 'react';
import { getTournaments, createTournament, applyToTournament } from '../services/tournamentService';
import { getRole, getToken } from '../services/authService';

/* ─── Helpers ─────────────────────────────────────────────────────── */
const STATUS_STYLE = {
  upcoming:  'bg-sports-bg border border-blue-500/40 text-blue-400',
  ongoing:   'bg-sports-bg border border-green-500/40 text-green-400',
  completed: 'bg-sports-bg border border-sports-border text-sports-muted',
};

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const INPUT_CLS = `w-full px-4 py-3 rounded-none bg-sports-bg border border-sports-border
  text-white placeholder-sports-muted/50 text-sm font-bold uppercase outline-none
  focus:border-sports-accent transition duration-200`;

const LABEL_CLS = `block text-[10px] font-black uppercase tracking-widest text-sports-muted mb-2`;

/* ─── Loading skeleton ─────────────────────────────────────────────── */
const TournamentSkeleton = () => (
  <div className="rounded-none border border-sports-border bg-sports-card p-6 animate-pulse space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <div className="h-5 bg-sports-bg rounded-none w-1/2" />
        <div className="h-4 bg-sports-bg rounded-none w-1/3" />
      </div>
      <div className="h-6 w-16 bg-sports-bg rounded-none" />
    </div>
    <div className="h-4 bg-sports-bg rounded-none w-3/4 mt-6" />
  </div>
);

/* ─── Create Tournament Form (admin only) ──────────────────────────── */
const INITIAL_FORM = { name: '', sport: '', format: 'league', startDate: '', endDate: '' };

const CreateTournamentForm = ({ onCreated }) => {
  const [form, setForm]       = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const token = getToken();

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, sport, format, startDate, endDate } = form;
    if (!name || !sport || !startDate || !endDate) {
      setError('All fields are required.');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      setError('Start date must be before end date.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await createTournament(form, token);
      setForm(INITIAL_FORM);
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tournament.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-12 rounded-none border border-sports-border bg-sports-card p-8 text-left">
      <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-8">
        Create New Tournament
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className={LABEL_CLS}>Tournament Name</label>
          <input name="name" type="text" placeholder="e.g. Summer League 2026" value={form.name}
            onChange={handleChange} className={INPUT_CLS} />
        </div>

        {/* Sport */}
        <div>
          <label className={LABEL_CLS}>Sport</label>
          <input name="sport" type="text" placeholder="Cricket" value={form.sport}
            onChange={handleChange} className={INPUT_CLS} />
        </div>

        {/* Format */}
        <div>
          <label className={LABEL_CLS}>Format</label>
          <select name="format" value={form.format} onChange={handleChange} className={INPUT_CLS}>
            <option value="league">LEAGUE</option>
            <option value="knockout">KNOCKOUT</option>
          </select>
        </div>

        {/* Dates */}
        <div>
          <label className={LABEL_CLS}>Start Date</label>
          <input name="startDate" type="date" value={form.startDate}
            onChange={handleChange} className={`${INPUT_CLS} [color-scheme:dark]`} />
        </div>
        <div>
          <label className={LABEL_CLS}>End Date</label>
          <input name="endDate" type="date" value={form.endDate}
            onChange={handleChange} className={`${INPUT_CLS} [color-scheme:dark]`}  />
        </div>

        {/* Error */}
        {error && (
          <div className="sm:col-span-2 px-5 py-4 rounded-none border border-red-900 bg-red-900/20 text-red-400 text-[10px] uppercase font-black tracking-widest">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="sm:col-span-2 mt-4">
          <button type="submit" disabled={loading}
            className="w-full sm:w-auto px-8 py-4 rounded-none bg-sports-accent hover:bg-sports-accentHover
              text-white text-[10px] font-black uppercase tracking-widest transition duration-200 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Tournament'}
          </button>
        </div>
      </form>
    </div>
  );
};

/* ─── Tournament Card ──────────────────────────────────────────────── */
const TournamentCard = ({ t, isAdmin, applied, onApply }) => {
  const statusCls  = STATUS_STYLE[t.status] ?? STATUS_STYLE.upcoming;
  const isApplied  = applied.has(t._id);
  const isEnded    = t.status === 'completed';
  const [busy, setBusy] = useState(false);

  const handleApply = async () => {
    setBusy(true);
    await onApply(t._id);
    setBusy(false);
  };

  return (
    <div className="rounded-none border border-sports-border bg-sports-card p-6 text-left
      hover:border-sports-accent/40 transition duration-200">

      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-black uppercase tracking-wide text-white truncate">
            {t.name}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-sports-muted mt-2">
            {t.sport} · <span className="uppercase">{t.format}</span>
          </p>
        </div>
        <span className={`shrink-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest ${statusCls}`}>
          {t.status}
        </span>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-sports-muted mt-6 mb-6 border-t border-sports-border pt-6">
        <svg className="w-4 h-4 shrink-0 text-sports-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5A2.25 2.25 0 015.25 5.25h13.5A2.25 2.25 0 0121 7.5v11.25" />
        </svg>
        {formatDate(t.startDate)} — {formatDate(t.endDate)}
      </div>

      {/* Action row */}
      <div className="flex items-center justify-end">
        {!isAdmin && (
          <button
            onClick={handleApply}
            disabled={isApplied || isEnded || busy}
            className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest transition duration-200
              ${isApplied || isEnded
                ? 'bg-sports-bg text-sports-muted border border-sports-border cursor-not-allowed'
                : 'bg-sports-accent hover:bg-sports-accentHover text-white'}`}
          >
            {busy ? 'Applying...' : isApplied ? 'Applied' : isEnded ? 'Closed' : 'Apply Now'}
          </button>
        )}

        {isAdmin && (
          <span className="text-[10px] font-black uppercase tracking-widest text-sports-muted">
            Admin View
          </span>
        )}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   TOURNAMENTS PAGE
   ═══════════════════════════════════════════════════════════════════ */
const Tournaments = () => {
  const role    = getRole();
  const isAdmin = role === 'admin';
  const token   = getToken();

  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [applied, setApplied]         = useState(new Set());
  const [toast, setToast]             = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchTournaments = async () => {
    setLoading(true);
    try {
      const res = await getTournaments();
      setTournaments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching tournaments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTournaments(); }, []);

  const handleApply = async (tournamentId) => {
    try {
      await applyToTournament(tournamentId, token);
      setApplied((prev) => new Set([...prev, tournamentId]));
      showToast('Applied successfully');
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to apply.';
      showToast(msg);
    }
  };

  return (
    <div className="text-white pb-12 font-sans max-w-[1600px] mx-auto text-left">

      {/* ── Toast ──────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-6 py-4 rounded-none border border-sports-border bg-sports-bg text-sports-accent text-[10px] uppercase font-black tracking-widest shadow-2xl transition-all duration-300">
          {toast}
        </div>
      )}

      {/* ── Page header ────────────────────────────────────────── */}
      <div className="mb-10 border-b border-sports-border pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">Tournaments</h1>
        <p className="text-xs font-bold uppercase tracking-widest text-sports-muted">
          {isAdmin
            ? 'Create and manage all tournaments.'
            : 'Browse available tournaments and apply with your team.'}
        </p>
      </div>

      {/* ── Create form — admin only ────────────────────────────── */}
      {isAdmin && <CreateTournamentForm onCreated={fetchTournaments} />}

      {/* ── Tournament list ─────────────────────────────────────── */}
      <h2 className="text-2xl font-black uppercase tracking-tight text-white mb-8">
        All Tournaments <span className="text-sports-muted text-sm ml-3">({tournaments.length})</span>
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, i) => <TournamentSkeleton key={i} />)}
        </div>
      ) : tournaments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-none border border-sports-border bg-sports-card">
          <p className="text-white font-bold uppercase tracking-widest text-sm mb-2">No tournaments found</p>
          {isAdmin && <p className="text-sports-muted text-[10px] font-bold uppercase tracking-widest">Create your first tournament above.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {tournaments.map((t) => (
            <TournamentCard
              key={t._id}
              t={t}
              isAdmin={isAdmin}
              applied={applied}
              onApply={handleApply}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Tournaments;
