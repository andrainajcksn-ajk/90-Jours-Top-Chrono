import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user } = useStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-100 flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <i className="fa-regular fa-clock text-7xl text-cyan-700 mb-4 block"></i>
        <h1 className="text-4xl font-bold text-cyan-800 mb-1">90 Jours</h1>
        <p className="text-cyan-500 font-semibold tracking-widest uppercase text-sm mb-2">Top Chrono</p>
        {user && (
          <p className="text-slate-500 mb-10 text-base">
            Bonjour, <span className="font-semibold text-cyan-700">{user.username}</span>
            <i className="fa-regular fa-hand-wave ml-2 text-amber-400"></i>
          </p>
        )}
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white text-lg font-bold px-10 py-4 rounded-2xl shadow-md transition-all flex items-center gap-3 mx-auto"
        >
          <i className="fa-solid fa-play"></i>
          Commencer
        </button>
      </div>
    </div>
  );
}