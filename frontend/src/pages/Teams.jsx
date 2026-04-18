import { useEffect, useState } from 'react';
import { getTeams, createTeam, addPlayers } from '../services/teamService';
import { getRole, getToken } from '../services/authService';

const INPUT_CLS = `w-full px-4 py-2 rounded-md bg-[#0F172A] border border-[#1F2937]
  text-white placeholder-gray-600 text-sm outline-none
  focus:border-purple-500 transition duration-200`;

const LABEL_CLS = `block text-xs font-medium text-gray-500 mb-2`;

/* ─── Team Card ────────────────────────────────────────────────────── */
const TeamCard = ({ team, isCaptain, onAddPlayer }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    await onAddPlayer(team._id, name.trim());
    setName('');
    setBusy(false);
    setOpen(false);
  };

  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6 text-left
      hover:border-purple-500/40 hover:scale-[1.01] transition duration-200">

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-white">{team.name}</h3>
          <p className="text-xs text-gray-400 mt-1">
            {team.players?.length ?? 0} player{(team.players?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        {isCaptain && (
          <button
            onClick={() => setOpen((v) => !v)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition duration-200 border
              ${open
                ? 'bg-[#0F172A] text-gray-400 border-[#1F2937]'
                : 'bg-[#111827] hover:bg-[#1F2937] text-white border-[#1F2937]'}`}
          >
            {open ? 'Cancel' : 'Add Player'}
          </button>
        )}
      </div>

      {/* Players list */}
      {team.players?.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2 pt-4 border-t border-[#1F2937]">
          {team.players.map((p, i) => (
            <span key={i}
              className="px-2 py-1 rounded-sm text-xs font-medium bg-[#0F172A] border border-[#1F2937] text-gray-400">
              {typeof p === 'string' ? p : p.name ?? `Player ${i + 1}`}
            </span>
          ))}
        </div>
      )}

      {/* Add player form */}
      {open && isCaptain && (
        <div className="mt-4 pt-4 border-t border-[#1F2937] flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Player name"
            className="flex-1 px-4 py-2 rounded-md bg-[#0F172A] border border-[#1F2937]
              text-white text-sm placeholder-gray-600 outline-none
              focus:border-purple-500 transition duration-200"
          />
          <button
            onClick={submit}
            disabled={busy || !name.trim()}
            className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500
              text-white text-sm font-medium transition duration-200 disabled:opacity-50"
          >
            {busy ? '...' : 'Add'}
          </button>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════
   TEAMS PAGE
   ═══════════════════════════════════════════════════════════════════ */
const Teams = () => {
  const role      = getRole();
  const isCaptain = role === 'captain';
  const isAdmin   = role === 'admin';
  const token     = getToken();

  const [teams, setTeams]       = useState([]);
  const [teamName, setTeamName]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [toast, setToast]       = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchTeams = async () => {
    try {
      const res = await getTeams();
      setTeams(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching teams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTeams(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!teamName.trim()) return;
    setCreating(true);
    try {
      await createTeam({ name: teamName.trim() }, token);
      setTeamName('');
      await fetchTeams();
      showToast('Team created');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to create team.');
    } finally {
      setCreating(false);
    }
  };

  const handleAddPlayer = async (teamId, playerName) => {
    try {
      await addPlayers(teamId, [{ name: playerName, age: 20, position: 'Player' }], token);
      await fetchTeams();
      showToast('Player added');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add player.');
    }
  };

  return (
    <div className="text-white pb-10 text-left">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded border border-[#1F2937] bg-[#111827] text-white text-sm font-medium shadow-lg transition-all duration-300">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-10 border-b border-[#1F2937] pb-6">
        <h1 className="text-xl font-semibold tracking-tight text-white mb-2">
          {isCaptain ? 'My Team' : 'All Teams'}
        </h1>
        <p className="text-sm text-gray-400">
          {isCaptain
            ? 'Create your team and add players to your squad.'
            : 'Overview of all registered teams.'}
        </p>
      </div>

      {/* Create Team — captain only */}
      {isCaptain && (
        <div className="mb-10 rounded-xl border border-[#1F2937] bg-[#111827] p-6">
          <h2 className="text-xl font-semibold text-white mb-6">
            Create New Team
          </h2>
          <form onSubmit={handleCreate} className="flex gap-4">
            <div className="flex-1">
              <label className={LABEL_CLS}>Team Name</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. Mumbai Indians"
                className={INPUT_CLS}
              />
            </div>
            <div className="flex items-end mt-[2px]">
              <button
                type="submit"
                disabled={creating || !teamName.trim()}
                className="px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500
                  text-white text-sm font-medium transition duration-200
                  disabled:opacity-50 h-[38px] flex items-center justify-center mt-[1px]"
              >
                {creating ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams grid */}
      <h2 className="text-xl font-semibold text-white mb-6">
        {isCaptain ? 'Your Teams' : 'All Teams'} <span className="text-gray-500 text-sm ml-2">({teams.length})</span>
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-[#1F2937] bg-[#111827] p-6 animate-pulse space-y-4">
              <div className="h-5 bg-[#1F2937] rounded w-1/2" />
              <div className="h-3 bg-[#1F2937] rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-center rounded-xl border border-[#1F2937] bg-[#111827]">
          <p className="text-white font-medium text-sm">No teams yet</p>
          {isCaptain && (
            <p className="text-gray-500 text-xs">Create your first team above to get started.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              isCaptain={isCaptain}
              onAddPlayer={handleAddPlayer}
            />
          ))}
        </div>
      )}

      {/* Admin note */}
      {isAdmin && (
        <p className="mt-8 text-xs text-gray-500">
          Team management is restricted to captains. Use Admin Panel to manage applications.
        </p>
      )}
    </div>
  );
};

export default Teams;