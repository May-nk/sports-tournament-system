import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import Tournaments from './pages/Tournaments';
import Matches from './pages/Matches';
import Leaderboard from './pages/Leaderboard';
import AdminPanel from './pages/AdminPanel';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="teams" element={<Teams />} />
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="matches" element={<Matches />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="admin" element={<AdminPanel />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
