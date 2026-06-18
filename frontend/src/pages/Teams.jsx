import { useEffect, useState } from 'react';
import { getTeams, createTeam, addPlayers, editPlayer, removePlayer } from '../services/teamService';
import { getRole, getToken } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const INPUT_CLS = `w-full px-4 py-3 rounded-none bg-sports-bg border border-sports-border
  text-white placeholder-sports-muted/50 text-sm font-bold uppercase outline-none
  focus:border-sports-accent transition duration-200`;

const LABEL_CLS = `block text-[10px] font-black uppercase tracking-widest text-sports-muted mb-2`;

/* ─── Team Card ────────────────────────────────────────────────────── */
const TeamCard = ({ team, isCaptain, onAddPlayer, onEditPlayer, onRemovePlayer }) => {
  const navigate = useNavigate();
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
    <div className="rounded-none border border-sports-border bg-sports-card p-6 text-left
      hover:border-sports-accent/40 transition duration-200 flex flex-col h-full">

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 
            className="text-xl font-black uppercase tracking-wide text-white cursor-pointer hover:text-sports-accent transition-colors"
            onClick={() => navigate(`/team/${team._id}`)}
          >
            {team.name}
          </h3>
          <p className="text-[10px] font-bold uppercase tracking-widest text-sports-muted mt-2">
            {team.players?.length ?? 0} player{(team.players?.length ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>
        {isCaptain && (
          <button
            onClick={() => { setOpenAdd((v) => !v); cancelEdit(); }}
            className={`px-4 py-2 rounded-none text-[10px] uppercase font-black tracking-widest transition duration-200 border whitespace-nowrap
              ${openAdd
                ? 'bg-sports-bg text-sports-muted border-sports-border'
                : 'bg-sports-card hover:bg-sports-bg text-white border-sports-border hover:border-sports-accent'}`}
          >
            {openAdd ? 'Cancel' : 'Add Player'}
          </button>
        )}
      </div>

      {/* Players list */}
      {team.players?.length > 0 ? (
        <div className="flex-1 flex flex-col gap-4 pt-6 border-t border-sports-border">
          {team.players.map((p, i) => (
            <div key={p._id || i} className="flex flex-col gap-3 p-4 rounded-none bg-sports-bg border border-sports-border">
              {editingPlayerId === p._id ? (
                // Edit Form
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Name"
                    className="w-full px-4 py-3 rounded-none bg-sports-card border border-sports-border text-white text-xs uppercase font-bold outline-none focus:border-sports-accent"
                  />
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      placeholder="Age"
                      className="w-1/3 px-4 py-3 rounded-none bg-sports-card border border-sports-border text-white text-xs uppercase font-bold outline-none focus:border-sports-accent"
                    />
                    <input
                      type="text"
                      value={editPosition}
                      onChange={(e) => setEditPosition(e.target.value)}
                      placeholder="Position"
                      className="w-2/3 px-4 py-3 rounded-none bg-sports-card border border-sports-border text-white text-xs uppercase font-bold outline-none focus:border-sports-accent"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-sports-muted hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => submitEdit(p._id)}
                      disabled={busy}
                      className="px-4 py-2 rounded-none bg-sports-accent hover:bg-sports-accentHover text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : deletingPlayerId === p._id ? (
                // Delete Confirmation
                <div className="flex flex-col items-center gap-4 py-3">
                  <p className="text-xs uppercase font-bold tracking-widest text-sports-text">Are you sure you want to remove <span className="text-white font-black">{p.name}</span>?</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDeletingPlayerId(null)}
                      className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-sports-muted hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => confirmDelete(p._id)}
                      disabled={busy}
                      className="px-4 py-2 rounded-none bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/30 text-[10px] font-black uppercase tracking-widest transition duration-200 disabled:opacity-50"
                    >
                      Yes, Remove
                    </button>
                  </div>
                </div>
              ) : (
                // Display Player
                <div className="flex items-center justify-between gap-4">
                  <div className="flex flex-col">
                    <span className="text-base font-black uppercase tracking-wide text-white">{p.name || `Player ${i + 1}`}</span>
                    <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest text-sports-muted mt-1">
                      {p.position && <span>{p.position}</span>}
                      {p.position && p.age && <span>•</span>}
                      {p.age && <span>{p.age} Y/O</span>}
                    </div>
                  </div>
                  {isCaptain && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="px-3 py-1.5 rounded-none text-[10px] uppercase font-black tracking-widest text-sports-muted border border-transparent hover:border-sports-border hover:bg-sports-card hover:text-white transition duration-200"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          console.log("Initial Delete clicked, player:", p);
                          setDeletingPlayerId(p._id);
                        }}
                        className="px-3 py-1.5 rounded-none text-[10px] uppercase font-black tracking-widest text-red-500/70 border border-transparent hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-500 transition duration-200"
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
        <div className="flex-1 mt-6 border-t border-sports-border pt-6 text-[10px] font-bold uppercase tracking-widest text-sports-muted">
          No players added yet.
        </div>
      )}

      {/* Add player form */}
      {openAdd && isCaptain && (
        <div className="mt-6 pt-6 border-t border-sports-border flex flex-col gap-4">
          <input
            type="text"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            placeholder="Player name"
            className={INPUT_CLS}
          />
          <div className="flex gap-4">
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
            className="w-full px-6 py-4 rounded-none bg-sports-accent hover:bg-sports-accentHover
              text-white text-[10px] uppercase tracking-widest font-black transition duration-200 disabled:opacity-50 mt-2"
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
    <div className="text-white pb-12 font-sans max-w-[1600px] mx-auto text-left">

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-6 py-4 rounded-none border border-sports-border bg-sports-bg text-sports-accent text-[10px] uppercase font-black tracking-widest shadow-2xl transition-all duration-300">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="mb-10 border-b border-sports-border pb-6">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-2">
          {isCaptain ? 'My Team' : 'All Teams'}
        </h1>
        <p className="text-xs font-bold uppercase tracking-widest text-sports-muted">
          {isCaptain
            ? 'Create your team and add players to your squad.'
            : 'Overview of all registered teams.'}
        </p>
      </div>

      {/* Create Team — captain only */}
      {isCaptain && (
        <div className="mb-12 rounded-none border border-sports-border bg-sports-card p-8">
          <h2 className="text-xl font-black uppercase text-white mb-8">
            Create New Team
          </h2>
          <form onSubmit={handleCreate} className="flex gap-6">
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
                className="px-6 py-3 rounded-none bg-sports-accent hover:bg-sports-accentHover
                  text-white text-[10px] font-black uppercase tracking-widest transition duration-200
                  disabled:opacity-50 h-[46px] flex items-center justify-center mt-[1px]"
              >
                {creating ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teams grid */}
      <h2 className="text-xl font-black uppercase text-white mb-8">
        {isCaptain ? 'Your Teams' : 'All Teams'} <span className="text-sports-muted text-sm ml-3">({teams.length})</span>
      </h2>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-stretch">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-none border border-sports-border bg-sports-card p-8 animate-pulse space-y-6">
              <div className="h-6 bg-sports-bg rounded-none w-1/2" />
              <div className="h-4 bg-sports-bg rounded-none w-1/4" />
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-24 text-center rounded-none border border-sports-border bg-sports-card">
          <p className="text-white font-bold uppercase tracking-widest text-sm">No teams yet</p>
          {isCaptain && (
            <p className="text-sports-muted text-[10px] font-bold uppercase tracking-widest">Create your first team above to get started.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-stretch">
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
        <p className="mt-12 pt-6 border-t border-sports-border text-[10px] font-bold uppercase tracking-widest text-sports-muted">
          Team management is restricted to captains. Use Admin Panel to manage applications.
        </p>
      )}
    </div>
  );
};

export default Teams;