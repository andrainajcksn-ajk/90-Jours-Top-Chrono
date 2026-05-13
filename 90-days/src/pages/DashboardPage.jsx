import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

function authHeader(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

function formatChrono(ms) {
  if (!ms || ms <= 0) return { days: '00', hours: '00', minutes: '00', seconds: '00' };
  const total = Math.floor(ms / 1000);
  const seconds = String(total % 60).padStart(2, '0');
  const minutes = String(Math.floor(total / 60) % 60).padStart(2, '0');
  const hours   = String(Math.floor(total / 3600) % 24).padStart(2, '0');
  const days    = String(Math.floor(total / 86400)).padStart(2, '0');
  return { days, hours, minutes, seconds };
}

const CATEGORIES = [
  { key: 'exercice',     label: 'Exercices',     icon: 'fa-solid fa-dumbbell',  color: 'bg-cyan-100 text-cyan-800',     active: 'bg-cyan-600 text-white' },
  { key: 'alimentation', label: 'Alimentation',   icon: 'fa-solid fa-bowl-food', color: 'bg-green-100 text-green-800',   active: 'bg-green-600 text-white' },
  { key: 'hygiene',      label: 'Hygiène de vie', icon: 'fa-solid fa-moon',      color: 'bg-purple-100 text-purple-800', active: 'bg-purple-600 text-white' },
];

const ALL_SUGGESTIONS = {
  exercice:     ['30 min de cardio', '20 min de musculation', "10 min d'étirements", '5 km de course'],
  alimentation: ["Boire 2L d'eau", 'Manger 5 fruits/légumes', 'Éviter le sucre raffiné', 'Petit-déjeuner équilibré'],
  hygiene:      ['8h de sommeil', 'Se coucher avant 23h', '10 min de méditation', "Pas d'écran 1h avant de dormir"],
};

export default function DashboardPage() {
  const { token, tasks, setTasks, startTime, setStartTime, tasksLocked, setTasksLocked, logout } = useStore();
  const [newTask, setNewTask]           = useState('');
  const [activeCategory, setActiveCategory] = useState('exercice');
  const [panelCategory, setPanelCategory]   = useState('exercice');
  const [elapsed, setElapsed]           = useState(0);
  const [showPanel, setShowPanel]       = useState(false);
  const [dupError, setDupError]         = useState('');
  const navigate    = useNavigate();
  const intervalRef = useRef(null);

  const TOTAL_MS    = 90 * 24 * 3600 * 1000;

  // Chargement initial + reset journalier
  useEffect(() => {
    axios.post('/api/tasks/daily-reset', {}, authHeader(token));
    axios.get('/api/tasks', authHeader(token)).then(r => setTasks(r.data));
  }, []);

  // Chrono
  useEffect(() => {
    if (!startTime) return;
    const tick = () => setElapsed(Date.now() - Number(startTime));
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [startTime]);

  // Suggestions filtrées (on retire celles déjà ajoutées)
  const existingTitles = tasks.map(t => t.title.toLowerCase());
  const suggestions = (cat) =>
    ALL_SUGGESTIONS[cat].filter(s => !existingTitles.includes(s.toLowerCase()));

  const addTask = async (title, category) => {
    const t = (title || newTask).trim();
    if (!t) return;
    setDupError('');
    try {
      const { data } = await axios.post(
        '/api/tasks',
        { title: t, category: category || panelCategory },
        authHeader(token)
      );
      setTasks([...tasks, data]);
      setNewTask('');
    } catch (e) {
      setDupError(e.response?.data?.error || 'Erreur');
    }
  };

  const confirmTasks = async () => {
    if (tasks.length === 0) return alert('Ajoute au moins une tâche !');
    const { data } = await axios.post('/api/confirm', {}, authHeader(token));
    setStartTime(data.start_time);
    setTasksLocked(true);
    setShowPanel(false);
  };

  const updateStatus = async (id, status) => {
    const { data } = await axios.patch(`/api/tasks/${id}/status`, { status }, authHeader(token));
    setTasks(tasks.map(t => t.id === id ? { ...t, status: data.status } : t));
  };

  const progress    = startTime ? Math.min((elapsed / TOTAL_MS) * 100, 100) : 0;
  const daysElapsed = startTime ? Math.min(Math.floor(elapsed / (24 * 3600 * 1000)), 90) : 0;
  const chrono      = formatChrono(elapsed);
  const isFinished  = progress >= 100;

  const tasksByCategory  = (cat) => tasks.filter(t => t.category === cat);
  const doneInCategory   = (cat) => tasksByCategory(cat).filter(t => t.status === 'done').length;
  const failedInCategory = (cat) => tasksByCategory(cat).filter(t => t.status === 'failed').length;
  const totalDone        = tasks.filter(t => t.status === 'done').length;
  const totalFailed      = tasks.filter(t => t.status === 'failed').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50 flex flex-col">

      {/* Header */}
      <div className="bg-cyan-700 text-white px-4 py-3 flex items-center justify-between shadow">
        <div>
          <p className="text-xs font-medium opacity-75 tracking-widest uppercase">Top Chrono</p>
          <h1 className="text-lg font-bold leading-tight">90 Jours</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/reports')}
            className="text-xs font-semibold px-3 py-1.5 rounded-full bg-cyan-600 hover:bg-cyan-500 text-white transition flex items-center gap-1.5"
          >
            <i className="fa-solid fa-chart-bar text-xs"></i>
            Bilans
          </button>
          <button
            onClick={() => navigate('/copyright')}
            className="text-xs font-bold px-3 py-1.5 rounded-full border border-cyan-300 text-cyan-100 hover:bg-cyan-300 hover:text-cyan-900 transition-all duration-300 animate-pulse hover:animate-none flex items-center gap-1.5"
          >
            <i className="fa-solid fa-star text-xs"></i>
            By Andraina Rzf
          </button>
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="text-cyan-200 hover:text-white transition"
            title="Déconnexion"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
          </button>
        </div>
      </div>

      {/* Alerte fin */}
      {isFinished && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
          <p className="text-amber-700 font-semibold text-sm">
            <i className="fa-solid fa-trophy mr-1 text-amber-500"></i>
            Tes 90 jours sont terminés !
          </p>
          <button onClick={() => navigate('/reports')} className="mt-1 text-xs text-amber-600 underline">
            Voir le bilan général
            <i className="fa-solid fa-arrow-right ml-1"></i>
          </button>
        </div>
      )}

      {/* Chrono */}
      <div className="bg-cyan-800 text-white px-4 py-5">
        <p className="text-xs text-cyan-300 text-center mb-3 uppercase tracking-widest flex items-center justify-center gap-2">
          <i className="fa-regular fa-clock"></i>
          {startTime ? 'Temps écoulé' : 'Chrono en attente de confirmation...'}
        </p>

        <div className="flex justify-center gap-2">
          {[{ v: chrono.days, l: 'Jours' }, { v: chrono.hours, l: 'Heures' }, { v: chrono.minutes, l: 'Min' }, { v: chrono.seconds, l: 'Sec' }].map(({ v, l }) => (
            <div key={l} className="flex flex-col items-center bg-cyan-900 rounded-xl px-3 py-2 min-w-[56px]">
              <span className="text-2xl font-bold font-mono">{v}</span>
              <span className="text-[10px] text-cyan-400 uppercase tracking-wide">{l}</span>
            </div>
          ))}
        </div>

        {/* Barre % accompli */}
        <div className="mt-4 mx-2">
          <div className="flex justify-between text-[10px] text-cyan-400 mb-1">
            <span><i className="fa-solid fa-bolt mr-1"></i>Progression</span>
            <span>{progress.toFixed(2)}%</span>
          </div>
          <div className="bg-cyan-900 rounded-full h-2">
            <div className="bg-teal-400 h-2 rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* Barre jours écoulés */}
        <div className="mt-3 mx-2">
          <div className="flex justify-between text-[10px] text-cyan-400 mb-1">
            <span><i className="fa-regular fa-calendar mr-1"></i>Jours écoulés</span>
            <span>{daysElapsed} / 90 jours</span>
          </div>
          <div className="bg-cyan-900 rounded-full h-2">
            <div
              className="bg-cyan-400 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${(daysElapsed / 90) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Stats globales */}
      {tasksLocked && (
        <div className="px-4 pt-4">
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <div key={cat.key} className="bg-white rounded-xl p-3 shadow-sm text-center">
                <i className={`${cat.icon} text-slate-400 text-lg mb-1 block`}></i>
                <p className="text-sm font-bold">
                  <span className="text-green-600">{doneInCategory(cat.key)}</span>
                  <span className="text-slate-300 mx-0.5">/</span>
                  <span className="text-red-400">{failedInCategory(cat.key)}</span>
                </p>
                <p className="text-[9px] text-slate-400 mt-0.5">
                  <i className="fa-solid fa-check text-green-500 mr-0.5"></i>fait
                  <span className="mx-1">·</span>
                  <i className="fa-solid fa-xmark text-red-400 mr-0.5"></i>raté
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corps */}
      <div className="flex-1 px-4 py-4">

        {/* Bouton ajout — toujours visible si chrono lancé ou pas */}
        <button
          onClick={() => { setDupError(''); setShowPanel(true); }}
          className="w-full mb-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl shadow transition flex items-center justify-center gap-2"
        >
          <i className="fa-solid fa-plus"></i>
          Ajouter une tâche / exercice
        </button>

        {/* Onglets */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${activeCategory === cat.key ? cat.active : cat.color}`}
            >
              <i className={`${cat.icon} text-xs`}></i>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Liste tâches */}
        {tasksByCategory(activeCategory).length === 0 ? (
          <div className="text-center mt-10">
            <i className="fa-regular fa-clipboard text-4xl text-slate-200 mb-3 block"></i>
            <p className="text-slate-400 text-sm">Aucune tâche. Ajoutes-en !</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tasksByCategory(activeCategory).map(task => (
              <div
                key={task.id}
                className={`bg-white rounded-xl px-4 py-3 shadow-sm border-l-4 transition ${
                  task.status === 'done'   ? 'border-green-400' :
                  task.status === 'failed' ? 'border-red-400'   :
                  'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {task.status === 'done'    && <i className="fa-solid fa-circle-check text-green-500"></i>}
                  {task.status === 'failed'  && <i className="fa-solid fa-circle-xmark text-red-400"></i>}
                  {task.status === 'pending' && <i className="fa-regular fa-circle text-slate-300"></i>}
                  <p className={`text-sm font-medium ${
                    task.status === 'done'   ? 'text-green-700' :
                    task.status === 'failed' ? 'text-red-500 line-through' :
                    'text-slate-700'
                  }`}>
                    {task.title}
                  </p>
                </div>

                {/* Boutons toujours visibles si chrono lancé */}
                {tasksLocked && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(task.id, task.status === 'done' ? 'pending' : 'done')}
                      className={`flex-1 text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                        task.status === 'done' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      <i className="fa-solid fa-check"></i>
                      Accompli
                    </button>
                    <button
                      onClick={() => updateStatus(task.id, task.status === 'failed' ? 'pending' : 'failed')}
                      className={`flex-1 text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1.5 ${
                        task.status === 'failed' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      <i className="fa-solid fa-xmark"></i>
                      Raté
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Score du jour */}
        {tasksLocked && tasks.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-4 shadow-sm text-center">
            <p className="text-sm text-slate-500 mb-3 flex items-center justify-center gap-2">
              <i className="fa-solid fa-star text-amber-400"></i>
              Score du jour
            </p>
            <div className="flex justify-center gap-6">
              <div>
                <p className="text-3xl font-bold text-green-600">{totalDone}</p>
                <p className="text-xs text-slate-400 mt-0.5"><i className="fa-solid fa-check mr-1"></i>Accomplis</p>
              </div>
              <div className="text-slate-200 text-3xl">|</div>
              <div>
                <p className="text-3xl font-bold text-red-400">{totalFailed}</p>
                <p className="text-xs text-slate-400 mt-0.5"><i className="fa-solid fa-xmark mr-1"></i>Ratés</p>
              </div>
              <div className="text-slate-200 text-3xl">|</div>
              <div>
                <p className="text-3xl font-bold text-slate-300">{tasks.length - totalDone - totalFailed}</p>
                <p className="text-xs text-slate-400 mt-0.5"><i className="fa-regular fa-clock mr-1"></i>En attente</p>
              </div>
            </div>
            <div className="mt-3 bg-slate-100 rounded-full h-2 overflow-hidden flex">
              <div className="bg-green-500 h-2 transition-all" style={{ width: `${(totalDone / tasks.length) * 100}%` }} />
              <div className="bg-red-400 h-2 transition-all"   style={{ width: `${(totalFailed / tasks.length) * 100}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Panneau modal — accessible toujours */}
      {showPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50" onClick={() => setShowPanel(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-700 mb-1 flex items-center gap-2">
              <i className="fa-solid fa-list-check text-cyan-600"></i>
              {tasksLocked ? 'Ajouter une tâche' : 'Planifier mes 90 jours'}
            </h3>
            {!tasksLocked && (
              <p className="text-xs text-slate-400 mb-4">
                <i className="fa-solid fa-circle-info mr-1 text-cyan-400"></i>
                Clique sur "Confirmer" pour lancer le chrono.
              </p>
            )}

            {/* Erreur doublon */}
            {dupError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl mb-3">
                <i className="fa-solid fa-triangle-exclamation"></i>
                {dupError}
              </div>
            )}

            {/* Onglets */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {CATEGORIES.map(cat => (
                <button key={cat.key} onClick={() => setPanelCategory(cat.key)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-1.5 ${panelCategory === cat.key ? cat.active : cat.color}`}>
                  <i className={`${cat.icon} text-xs`}></i>
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Suggestions filtrées */}
            {suggestions(panelCategory).length > 0 && (
              <>
                <p className="text-xs text-slate-400 mb-2 flex items-center gap-1">
                  <i className="fa-solid fa-lightbulb text-amber-400"></i>
                  Suggestions :
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {suggestions(panelCategory).map(s => (
                    <button key={s} onClick={() => addTask(s, panelCategory)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-full transition flex items-center gap-1">
                      <i className="fa-solid fa-plus text-[10px]"></i>
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Input manuel */}
            <div className="flex gap-2 mb-4">
              <input
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                placeholder={`Nouvelle tâche ${panelCategory}...`}
                value={newTask}
                onChange={e => { setNewTask(e.target.value); setDupError(''); }}
                onKeyDown={e => e.key === 'Enter' && addTask()}
              />
              <button onClick={() => addTask()} className="bg-cyan-600 text-white px-4 rounded-xl font-bold text-sm hover:bg-cyan-700">
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>

            {/* Récap */}
            {CATEGORIES.map(cat => (
              tasksByCategory(cat.key).length > 0 && (
                <div key={cat.key} className="mb-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1 flex items-center gap-1">
                    <i className={`${cat.icon} text-xs`}></i>
                    {cat.label} ({tasksByCategory(cat.key).length})
                  </p>
                  <div className="flex flex-col gap-1">
                    {tasksByCategory(cat.key).map(t => (
                      <div key={t.id} className="flex items-center gap-2 bg-slate-50 rounded-xl px-4 py-2">
                        <i className="fa-solid fa-circle text-teal-400 text-[8px] flex-shrink-0"></i>
                        <span className="text-sm text-slate-700">{t.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}

            {/* Bouton confirmer seulement si pas encore lancé */}
            {!tasksLocked && (
              <button onClick={confirmTasks}
                className="w-full mt-2 bg-cyan-700 hover:bg-cyan-800 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                <i className="fa-solid fa-flag-checkered"></i>
                Confirmer et lancer le chrono
              </button>
            )}

            {tasksLocked && (
              <button onClick={() => setShowPanel(false)}
                className="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2">
                <i className="fa-solid fa-check"></i>
                Fermer
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}