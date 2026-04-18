import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

/* ── Context ────────────────────────────────────────────────────────── */
import { TournamentProvider } from './context/TournamentContext';

/* ── Layouts & Guards ───────────────────────────────────────────────── */
import MainLayout               from './layouts/MainLayout';
import ProtectedRoute, { RoleRoute } from './components/ProtectedRoute';

/* ── Public pages ───────────────────────────────────────────────────── */
import Login        from './pages/Login';
import Register     from './pages/Register';
import Unauthorized from './pages/Unauthorized';

/* ── Shared pages ───────────────────────────────────────────────────── */
import Dashboard    from './pages/Dashboard';
import Matches      from './pages/Matches';
import Leaderboard  from './pages/Leaderboard';
import Tournaments  from './pages/Tournaments';

/* ── Role-specific pages ─────────────────────────────────────────────── */
import AdminPanel   from './pages/AdminPanel';
import Teams        from './pages/Teams';

const App = () => (
  <div className="min-h-screen bg-[#0B0F1A] text-white">
    <BrowserRouter>
      <TournamentProvider>
        <Routes>

          {/* ── Public ────────────────────────────────────────────────── */}
          <Route path="/login"        element={<Login />} />
          <Route path="/register"     element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* ── Authenticated ─────────────────────────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<MainLayout />}>

              <Route index element={<Dashboard />} />
              <Route path="matches"     element={<Matches />} />
              <Route path="leaderboard" element={<Leaderboard />} />
              <Route path="tournaments" element={<Tournaments />} />

              {/* Admin only */}
              <Route element={<RoleRoute allowedRoles={['admin']} />}>
                <Route path="admin" element={<AdminPanel />} />
              </Route>

              {/* Captain only */}
              <Route element={<RoleRoute allowedRoles={['captain']} />}>
                <Route path="teams"             element={<Teams />} />
                <Route path="teams/add-players" element={<Teams />} />
              </Route>

            </Route>
          </Route>

          {/* ── Fallback ──────────────────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </TournamentProvider>
    </BrowserRouter>
  </div>
);

export default App;

