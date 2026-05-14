import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function AuthPage() {
  const [step, setStep]         = useState('invite'); // 'invite' | 'login' | 'register'
  const [inviteCode, setInviteCode] = useState('');
  const [isLogin, setIsLogin]   = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const { setAuth }             = useStore();
  const navigate                = useNavigate();

  // Vérifie le code d'invitation
  const handleInvite = async () => {
    setError('');
    try {
      await axios.post('/api/check-invite', { code: inviteCode.trim() });
      setStep('register');
    } catch (e) {
      setError(e.response?.data?.error || 'Code invalide.');
    }
  };

  // Connexion / Inscription
  const handleSubmit = async () => {
    setError('');
    try {
      const url = step === 'login' ? '/api/login' : '/api/register';
      const { data } = await axios.post(url, { username, password });
      setAuth(data.token, { username: data.username });
      navigate('/welcome');
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur réseau');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-100 flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl font-bold text-cyan-800 mb-2 tracking-tight">⏱ 90 Jours</h1>
      <p className="text-cyan-600 mb-8 text-sm font-medium tracking-widest uppercase">Top Chrono</p>

      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">

        {/* ── Étape 1 : Code d'invitation (uniquement pour s'inscrire) ── */}
        {step === 'invite' && (
          <>
            <h2 className="text-xl font-semibold text-slate-700 mb-2 text-center">Code d'invitation</h2>
            <p className="text-xs text-slate-400 text-center mb-6">
              Cette application est réservée aux membres d'un club. <br />
              Entrez le code jck pour s'inscrire.
            </p>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <input
              className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-5 text-slate-700 text-center tracking-widest font-bold uppercase focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="CODE JCK"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvite()}
            />

            <button
              onClick={handleInvite}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-xl transition"
            >
              Valider
            </button>

            <p className="text-center text-sm text-slate-500 mt-5">
              Déjà membre ?{' '}
              <button
                onClick={() => { setStep('login'); setError(''); }}
                className="text-cyan-600 font-medium hover:underline"
              >
                Se connecter
              </button>
            </p>
          </>
        )}

        {/* ── Étape 2 : Connexion ou Inscription ── */}
        {(step === 'login' || step === 'register') && (
          <>
            <h2 className="text-xl font-semibold text-slate-700 mb-6 text-center">
              {step === 'login' ? 'Connexion' : 'Créer un compte'}
            </h2>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <input
              className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Nom d'utilisateur"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <input
              type="password"
              className="w-full border border-slate-200 rounded-xl px-4 py-3 mb-5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-400"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />

            <button
              onClick={handleSubmit}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-xl transition"
            >
              {step === 'login' ? 'Se connecter' : "S'inscrire"}
            </button>

            <p className="text-center text-sm text-slate-500 mt-5">
              {step === 'login' ? (
                <>
                  Pas encore de compte ?{' '}
                  <button
                    onClick={() => { setStep('invite'); setError(''); }}
                    className="text-cyan-600 font-medium hover:underline"
                  >
                    S'inscrire
                  </button>
                </>
              ) : (
                <>
                  Déjà membre ?{' '}
                  <button
                    onClick={() => { setStep('login'); setError(''); }}
                    className="text-cyan-600 font-medium hover:underline"
                  >
                    Se connecter
                  </button>
                </>
              )}
            </p>
          </>
        )}

      </div>
    </div>
  );
}