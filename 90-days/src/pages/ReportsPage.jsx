import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

const CAT_ICONS = {
  exercice:     'fa-solid fa-dumbbell',
  alimentation: 'fa-solid fa-bowl-food',
  hygiene:      'fa-solid fa-moon',
};

export default function ReportsPage() {
  const { token, startTime } = useStore();
  const [reports, setReports] = useState({});
  const [openDays, setOpenDays] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const TOTAL_MS = 90 * 24 * 3600 * 1000;
  const elapsed = startTime ? Date.now() - Number(startTime) : 0;
  const isFinished = elapsed >= TOTAL_MS;

  useEffect(() => {
    axios.get('/api/reports', authHeader(token))
      .then(r => { setReports(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleDay = (date) => setOpenDays(prev => ({ ...prev, [date]: !prev[date] }));

  const handleReset = async () => {
    if (!window.confirm('Es-tu sûr de vouloir réinitialiser ? Toutes les données seront effacées.')) return;
    await axios.post('/api/reset', {}, authHeader(token));
    navigate('/welcome');
  };

  const dates = Object.keys(reports).sort((a, b) => b.localeCompare(a));

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50">

      <div className="bg-cyan-700 text-white px-4 py-3 flex items-center justify-between shadow">
        <button onClick={() => navigate('/dashboard')} className="text-cyan-200 hover:text-white transition flex items-center gap-1.5 text-sm">
          <i className="fa-solid fa-arrow-left"></i>
          Retour
        </button>
        <h1 className="text-lg font-bold flex items-center gap-2">
          <i className="fa-solid fa-chart-bar"></i>
          Bilans journaliers
        </h1>
        <div className="w-16" />
      </div>

      {isFinished && (
        <div className="mx-4 mt-4 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
          <i className="fa-solid fa-trophy text-3xl text-amber-500 mb-2 block"></i>
          <p className="text-amber-700 font-bold text-base mb-1">90 jours terminés !</p>
          <p className="text-amber-600 text-sm mb-3">Voici ton bilan complet. Félicitations !</p>
          <button
            onClick={handleReset}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2 rounded-xl text-sm transition flex items-center gap-2 mx-auto"
          >
            <i className="fa-solid fa-rotate"></i>
            Réinitialiser et recommencer
          </button>
        </div>
      )}

      <div className="px-4 py-4">
        {loading && (
          <div className="text-center mt-10">
            <i className="fa-solid fa-spinner fa-spin text-3xl text-cyan-400"></i>
          </div>
        )}

        {!loading && dates.length === 0 && (
          <div className="text-center mt-16">
            <i className="fa-regular fa-folder-open text-5xl text-slate-200 mb-3 block"></i>
            <p className="text-slate-500 text-sm">Aucun bilan pour le moment.</p>
            <p className="text-slate-400 text-xs mt-1">Les bilans apparaissent quand tu marques des tâches.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {dates.map(date => {
            const entries = reports[date];
            const done    = entries.filter(e => e.status === 'done').length;
            const failed  = entries.filter(e => e.status === 'failed').length;
            const total   = entries.length;
            const pct     = Math.round((done / total) * 100);
            const isOpen  = openDays[date];

            return (
              <div key={date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <button
                  onClick={() => toggleDay(date)}
                  className="w-full px-4 py-4 flex items-center justify-between text-left"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700 capitalize">{formatDate(date)}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                        <i className="fa-solid fa-check"></i>{done} accomplis
                      </span>
                      <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
                        <i className="fa-solid fa-xmark"></i>{failed} ratés
                      </span>
                      <span className="text-xs text-slate-400">{total} total</span>
                    </div>
                    <div className="mt-2 bg-slate-100 rounded-full h-1.5 w-48 overflow-hidden flex">
                      <div className="bg-green-500 h-1.5" style={{ width: `${(done / total) * 100}%` }} />
                      <div className="bg-red-400 h-1.5"   style={{ width: `${(failed / total) * 100}%` }} />
                    </div>
                  </div>
                  <div className="flex flex-col items-center ml-3">
                    <span className={`text-2xl font-bold ${pct >= 70 ? 'text-green-600' : pct >= 40 ? 'text-amber-500' : 'text-red-400'}`}>
                      {pct}%
                    </span>
                    <i className={`fa-solid ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-slate-300 text-xs mt-1`}></i>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-4 py-3">
                    {['exercice', 'alimentation', 'hygiene'].map(cat => {
                      const catEntries = entries.filter(e => e.category === cat);
                      if (catEntries.length === 0) return null;
                      const catLabel = cat === 'exercice' ? 'Exercices' : cat === 'alimentation' ? 'Alimentation' : 'Hygiène de vie';
                      return (
                        <div key={cat} className="mb-3">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <i className={`${CAT_ICONS[cat]} text-slate-300`}></i>
                            {catLabel}
                          </p>
                          <div className="flex flex-col gap-1.5">
                            {catEntries.map((e, i) => (
                              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${e.status === 'done' ? 'bg-green-50' : 'bg-red-50'}`}>
                                <i className={`fa-solid ${e.status === 'done' ? 'fa-circle-check text-green-500' : 'fa-circle-xmark text-red-400'}`}></i>
                                <span className={`text-sm ${e.status === 'done' ? 'text-green-700' : 'text-red-600 line-through'}`}>
                                  {e.task_title}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}