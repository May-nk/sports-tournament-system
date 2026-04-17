import { useEffect, useState } from "react";
import {
  getTournaments,
  createTournament,
  applyToTournament,
} from "../services/tournamentService";

const statusColor = (status) => {
  switch (status) {
    case "upcoming":  return "bg-blue-700 text-blue-100";
    case "ongoing":   return "bg-green-700 text-green-100";
    case "completed": return "bg-gray-600 text-gray-300";
    default:          return "bg-gray-700 text-gray-300";
  }
};

const INITIAL_FORM = { name: "", sport: "", format: "league", startDate: "", endDate: "" };

const Tournaments = () => {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(new Set());
  const [form, setForm] = useState(INITIAL_FORM);

  const token = localStorage.getItem("token");

  const fetchTournaments = async () => {
    try {
      const res = await getTournaments();
      setTournaments(res.data);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    const { name, sport, format, startDate, endDate } = form;

    if (!name || !sport || !format || !startDate || !endDate) {
      alert("All fields are required.");
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      alert("Start date must be before end date.");
      return;
    }

    try {
      await createTournament(form, token);
      setForm(INITIAL_FORM);
      fetchTournaments();
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to create tournament";
      alert(msg);
      console.error("Create tournament error:", error.response?.data);
    }
  };

  const handleApply = async (tournamentId) => {
    try {
      await applyToTournament(tournamentId, token);
      setApplied((prev) => new Set([...prev, tournamentId]));
      alert("Applied successfully!");
    } catch (error) {
      const msg = error.response?.data?.message || "Failed to apply";
      alert(msg);
      console.error("Apply error:", error.response?.data);
    }
  };

  if (loading) {
    return <p className="p-6 text-gray-400">Loading tournaments...</p>;
  }

  return (
    <div className="p-6 text-white">
      <h1 className="text-2xl font-bold mb-6">Tournaments</h1>

      {/* ── Create Tournament Form ── */}
      <form
        onSubmit={handleCreate}
        className="bg-gray-800 p-4 rounded-lg mb-8 grid grid-cols-1 gap-3"
      >
        <h2 className="text-lg font-semibold text-gray-200">Create Tournament</h2>

        <input
          name="name"
          type="text"
          placeholder="Tournament Name"
          value={form.name}
          onChange={handleChange}
          className="p-2 rounded bg-gray-900 text-white w-full"
        />
        <input
          name="sport"
          type="text"
          placeholder="Sport (e.g. Cricket)"
          value={form.sport}
          onChange={handleChange}
          className="p-2 rounded bg-gray-900 text-white w-full"
        />
        <select
          name="format"
          value={form.format}
          onChange={handleChange}
          className="p-2 rounded bg-gray-900 text-white w-full"
        >
          <option value="league">League</option>
          <option value="knockout">Knockout</option>
        </select>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
            <input
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              className="p-2 rounded bg-gray-900 text-white w-full"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">End Date</label>
            <input
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              className="p-2 rounded bg-gray-900 text-white w-full"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-500 px-4 py-2 rounded font-medium"
        >
          Create Tournament
        </button>
      </form>

      {/* ── Tournament List ── */}
      {tournaments.length === 0 ? (
        <p className="text-gray-400">No tournaments found.</p>
      ) : (
        <div className="grid gap-4">
          {tournaments.map((t) => (
            <div
              key={t._id}
              className="bg-gray-800 p-4 rounded-lg shadow flex justify-between items-start"
            >
              <div>
                <h2 className="text-xl font-semibold mb-1">{t.name}</h2>
                <p className="text-gray-400 text-sm">Sport: {t.sport}</p>
                <p className="text-gray-400 text-sm capitalize">Format: {t.format}</p>
                <span
                  className={`inline-block mt-2 px-2 py-0.5 rounded text-xs font-medium capitalize ${statusColor(t.status)}`}
                >
                  {t.status}
                </span>
              </div>

              <button
                onClick={() => handleApply(t._id)}
                disabled={applied.has(t._id) || t.status === "completed"}
                className={`ml-4 px-4 py-2 rounded text-sm font-medium transition-colors ${
                  applied.has(t._id) || t.status === "completed"
                    ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                {applied.has(t._id) ? "Applied" : "Apply"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Tournaments;
