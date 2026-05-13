import { useNavigate } from 'react-router-dom';

export default function CopyrightPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-cyan-50 flex flex-col items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8 text-center">
        <div className="text-4xl mb-4">⏱</div>
        <h1 className="text-xl font-bold text-cyan-800 mb-1">90 Jours — Top Chrono</h1>
        <p className="text-xs text-cyan-500 tracking-widest uppercase mb-6">Application de remise en forme</p>

        <div className="border-t border-slate-100 pt-5">
          <p className="text-sm font-semibold text-slate-700 mb-4">Made by Andraina Razafindrakoto</p>
          <p className="text-sm font-semibold text-slate-500 mb-4">Cliquer pour contacter</p>

          <div className="flex flex-col gap-3">
            <a
              href="https://www.facebook.com/profile.php?id=61580171409644"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-800 px-4 py-3 rounded-xl transition"
            >
              <span className="text-xl"><i class="fa-brands fa-facebook-f"></i></span>
              <div className="text-left">
                <p className="text-xs text-blue-500 font-medium uppercase tracking-wide">Facebook</p>
                <p className="text-sm font-semibold">Andraina Ra Jacksons</p>
              </div>
            </a>

            <a
              href="https://wa.me/261389650327"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 bg-green-50 hover:bg-green-100 text-green-800 px-4 py-3 rounded-xl transition"
            >
              <span className="text-xl"><i class="fa-brands fa-whatsapp"></i></span>
              <div className="text-left">
                <p className="text-xs text-green-500 font-medium uppercase tracking-wide">WhatsApp</p>
                <p className="text-sm font-semibold">+261 38 96 503 27</p>
              </div>
            </a>

            <a
              href="https://www.instagram.com/andraina_gauchos?igsh=cjBzOTM4eXY4djcz"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 bg-pink-50 hover:bg-pink-100 text-pink-800 px-4 py-3 rounded-xl transition"
            >
              <span className="text-xl"><i class="fa-brands fa-instagram"></i></span>
              <div className="text-left">
                <p className="text-xs text-pink-500 font-medium uppercase tracking-wide">Instagram</p>
                <p className="text-sm font-semibold">andraina_gauchos</p>
              </div>
            </a>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-6">© 2026 Andraina Razafindrakoto. Tous droits réservés.</p>

        <button
          onClick={() => navigate('/dashboard')}
          className="mt-5 text-cyan-600 hover:text-cyan-800 text-sm font-medium transition"
        >
          ← Retour au dashboard
        </button>
      </div>
    </div>
  );
}