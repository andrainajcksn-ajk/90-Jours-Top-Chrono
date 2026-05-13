import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import useStore from './store/useStore';
import AuthPage from './pages/AuthPage';
import WelcomePage from './pages/WelcomePage';
import DashboardPage from './pages/DashboardPage';
import CopyrightPage from './pages/CopyrightPage';
import ReportsPage from './pages/ReportsPage';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const { token, setAuth, setStartTime, setTasksLocked, logout } = useStore();

  useEffect(() => {
    if (!token) return;
    axios.get('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        setAuth(token, { username: r.data.username });
        setStartTime(r.data.start_time);
        setTasksLocked(!!r.data.tasks_locked);
      })
      .catch(() => logout());
  }, [token]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={!token ? <AuthPage />      : <Navigate to="/welcome" />} />
        <Route path="/welcome"   element={token  ? <WelcomePage />   : <Navigate to="/" />} />
        <Route path="/dashboard" element={token  ? <DashboardPage /> : <Navigate to="/" />} />
        <Route path="/copyright" element={token  ? <CopyrightPage /> : <Navigate to="/" />} />
        <Route path="/reports"   element={token  ? <ReportsPage />   : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}