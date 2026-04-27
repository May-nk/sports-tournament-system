import { useEffect, useState } from 'react';
import { getTeams, createTeam, addPlayers, editPlayer, removePlayer } from '../services/teamService';
import { getRole, getToken } from '../services/authService';

const INPUT_CLS = `w-full px-4 py-2 rounded-md bg-[#0F172A] border border-[#1F2937]
  text-white placeholder-gray-600 text-sm outline-none
  focus:border-purple-500 transition duration-200`;

const LABEL_CLS = `block text-xs font-medium text-gray-500 mb-2`;

/* ─── Team Card ────────────────────────────────────────────────────── */
const TeamCard = ({ team, isCaptain, onAddPlayer, onEditPlayer, onRemovePlayer }) => {
  const [openAdd, setOpenAdd] = useState(false);
  const [addName, setAddName] = useState('');
  const [addAge, setAddAge] = useState('');
  const [addPosition, setAddPosition] = useState('');
  const [busy, setBusy] = useState(false);

  // Edit State
  const [editingPlayerId, setEditingPlayerId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editPosition, setEditPosition] = useState('');

  // Delete State
  const [deletingPlayerId, setDeletingPlayerId] = useState(null);

  const submitAdd = async () => {
    if (!addName.trim() || !addAge || !addPosition.trim()) return;
    setBusy(true);
    await onAddPlayer(team._id, { name: addName.trim(), age: Number(addAge), position: addPosition.trim() });
    setAddName('');
    setAddAge('');
    setAddPosition('');
    setBusy(false);
    setOpenAdd(false);
  };

  const startEdit = (player) => {
    setEditingPlayerId(player._id);
    setEditName(player.name || '');
    setEditAge(player.age || '');
    setEditPosition(player.position || '');
  };

  const cancelEdit = () => {
    setEditingPlayerId(null);
    setEditName('');
    setEditAge('');
    setEditPosition('');
  };

  const submitEdit = async (playerId) => {
    if (!editName.trim() || !editAge || !editPosition.trim()) return;
    setBusy(true);
    await onEditPlayer(team._id, playerId, { name: editName.trim(), age: Number(editAge), position: editPosition.trim() });
    cancelEdit();
    setBusy(false);
  };

  const confirmDelete = async (playerId) => {
    console.log("Delete clicked");
    console.log("Deleting:", playerId);
    console.log("Player object ID:", playerId);
    
    setBusy(true);
    await onRemovePlayer(team._id, playerId);
    setDeletingPlayerId(null);
    setBusy(false);
  };

  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#111827] p-6 text-left
      hover:border-purple-500/40 hover:scale-[1.01] transition duration-200 flex flex-col h-full">

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
            onClick={() => { setOpenAdd((v) => !v); cancelEdit(); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition duration-200 border whitespace-nowrap
              ${openAdd
                ? 'bg-[#0F172A] text-gray-400 border-[#1F2937]'
                : 'bg-[#111827] hover:bg-[#1F2937] text-white border-[#1F2937]'}`}
          >
            {openAdd ? 'Cancel' : 'Add Player'}
          </button>
        )}
      </div>

      {/* Players list */}
      {team.players?.length > 0 ? (
        <div className="flex-1 flex flex-col gap-3 pt-4 border-t border-[#1F2937]">
          {team.players.map((p, i) => (
            <div key={p._id || i} className="flex flex-col gap-2 p-3 rounded-lg bg-[#0F172A] border border-[#1F2937]">
              {editingPlayerId === p._id ? (
                // Edit Form
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Name"
                    className="w-full px-3 py-1.5 rounded bg-[#111827] border border-[#1F2937] text-white text-xs outline-none focus:border-purple-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      placeholder="Age"
                      className="w-1/3 px-3 py-1.5 rounded bg-[#111827] border border-[#1F2937] text-white text-xs outline-none focus:border-purple-500"
                    />
                    <input
                      type="text"
                      value={editPosition}
                      onChange={(e) => setEditPosition(e.target.value)}
                      placeholder="Position"
                      className="w-2/3 px-3 py-1.5 rounded bg-[#111827] border border-[#1F2937] text-white text-xs outline-none focus:border-purple-500"
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-2 py-1 text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => submitEdit(p._id)}
                      disabled={busy}
                      className="px-3 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : deletingPlayerId === p._id ? (
                // Delete Confirmation
                <div className="flex flex-col items-center gap-2 py-1">
                  <p className="text-xs text-gray-300">Are you sure you want to remove <span className="text-white font-medium">{p.name}</span>?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setDeletingPlayerId(null)}
                      className="px-3 py-1 text-xs text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(p._id)}
                      disabled={busy}
                      className="px-3 py-1 rounded bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 text-xs font-medium transition duration-200 disabled:opacity-50"
                    >
                      Yes, Remove
                    </button>
                  </div>
                </div>
              ) : (
                // Display Player
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">{p.name || `Player ${i + 1}`}</span>
                    <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                      {p.position && <span>{p.position}</span>}
                      {p.position && p.age && <span>•</span>}
                      {p.age && <span>{p.age} y/o</span>}
                    </div>
                  </div>
                  {isCaptain && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="px-2 py-1 rounded text-xs font-medium text-gray-400 border border-transparent hover:border-[#1F2937] hover:bg-[#111827] hover:text-white transition duration-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log("Initial Delete clicked, player:", p);
                          setDeletingPlayerId(p._id);
                        }}
                        className="px-2 py-1 rounded text-xs font-medium text-red-500/70 border border-transparent hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 transition duration-200"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 mt-4 border-t border-[#1F2937] pt-4 text-xs text-gray-500">
          No players added yet.
        </div>
      )}

      {/* Add player form */}
      {openAdd && isCaptain && (
        <div className="mt-4 pt-4 border-t border-[#1F2937] flex flex-col gap-3">
          <input
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Player name"
            className={INPUT_CLS}
          />
          <div className="flex gap-3">
            <input
              type="number"
              value={addAge}
              onChange={(e) => setAddAge(e.target.value)}
              placeholder="Age"
              className={`${INPUT_CLS} w-1/3`}
            />
            <input
              type="text"
              value={addPosition}
              onChange={(e) => setAddPosition(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
              placeholder="Position (e.g. Forward)"
              className={`${INPUT_CLS} w-2/3`}
            />
          </div>
          <button
            onClick={submitAdd}
            disabled={busy || !addName.trim() || !addAge || !addPosition.trim()}
            className="w-full px-4 py-2 rounded-md bg-purple-600 hover:bg-purple-500
              text-white text-sm font-medium transition duration-200 disabled:opacity-50"
          >
            {busy ? 'Adding...' : 'Add Player'}
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

  const handleAddPlayer = async (teamId, playerObj) => {
    try {
      await addPlayers(teamId, [playerObj], token);
      await fetchTeams();
      showToast('Player added');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add player.');
    }
  };

  const handleEditPlayer = async (teamId, playerId, data) => {
    try {
      console.log("Step 1: Edit clicked");
      console.log("Team ID:", teamId);
      console.log("Player ID:", playerId);
      console.log("Data to update:", data);
      console.log("Token:", token);

      if (!token) console.warn("WARNING: Token is null or undefined!");
      if (!teamId) console.warn("WARNING: Team ID is undefined!");
      if (!playerId) console.warn("WARNING: Player ID is undefined!");

      console.log("Step 2: before API (PUT)");

      const res = await editPlayer(teamId, playerId, data, token);

      console.log("Step 3: after API", res);

      await fetchTeams();
      showToast('Player updated');
    } catch (err) {
      console.error("ERROR in Edit:", err);
      console.dir(err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update player.';
      showToast('Edit Error: ' + errorMsg);
    }
  };

  const handleRemovePlayer = async (teamId, playerId) => {
    try {
      console.log("Step 1: Delete clicked");
      console.log("Team ID:", teamId);
      console.log("Player ID:", playerId);
      console.log("Token:", token);

      if (!token) console.warn("WARNING: Token is null or undefined!");
      if (!teamId) console.warn("WARNING: Team ID is undefined!");
      if (!playerId) console.warn("WARNING: Player ID is undefined!");

      console.log("Step 2: before API (DELETE)");

      const res = await removePlayer(teamId, playerId, token);

      console.log("Step 3: after API", res);

      await fetchTeams();
      showToast('Player removed');
    } catch (err) {
      console.error("ERROR in Delete:", err);
      console.dir(err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to remove player.';
      showToast('Delete Error: ' + errorMsg);
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
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
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 items-stretch">
          {teams.map((team) => (
            <TeamCard
              key={team._id}
              team={team}
              isCaptain={isCaptain}
              onAddPlayer={handleAddPlayer}
              onEditPlayer={handleEditPlayer}
              onRemovePlayer={handleRemovePlayer}
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