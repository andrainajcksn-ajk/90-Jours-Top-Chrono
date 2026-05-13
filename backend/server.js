require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('./db');

const app = express();
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://10.175.13.225:5173',
    /\.vercel\.app$/
  ]
}));
app.use(express.json());

const SECRET = process.env.JWT_SECRET;

function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Non autorisé' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token invalide' });
  }
}

// Vérification code d'invitation
app.post('/api/check-invite', (req, res) => {
  const { code } = req.body;
  if (code === process.env.INVITE_CODE) {
    res.json({ valid: true });
  } else {
    res.status(403).json({ error: 'Code d\'invitation invalide.' });
  }
});

app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Champs requis' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
      [username, hash]
    );
    const token = jwt.sign({ id: result.rows[0].id, username }, SECRET, { expiresIn: '7d' });
    res.json({ token, username });
  } catch {
    res.status(409).json({ error: "Nom d'utilisateur déjà pris" });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  const user = result.rows[0];
  if (!user || !bcrypt.compareSync(password, user.password))
    return res.status(401).json({ error: 'Identifiants incorrects' });
  const token = jwt.sign({ id: user.id, username }, SECRET, { expiresIn: '7d' });
  res.json({ token, username, start_time: user.start_time, tasks_locked: user.tasks_locked });
});

app.get('/api/me', auth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, username, start_time, tasks_locked FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json(result.rows[0]);
});

app.get('/api/tasks', auth, async (req, res) => {
  const result = await pool.query(
    'SELECT * FROM tasks WHERE user_id = $1 ORDER BY id',
    [req.user.id]
  );
  res.json(result.rows);
});

app.post('/api/tasks', auth, async (req, res) => {
  const { title, category } = req.body;
  if (!title) return res.status(400).json({ error: 'Titre requis' });
  const cat = ['exercice', 'alimentation', 'hygiene'].includes(category) ? category : 'exercice';

  // Vérifier doublon
  const existing = await pool.query(
    'SELECT id FROM tasks WHERE user_id = $1 AND LOWER(title) = LOWER($2)',
    [req.user.id, title]
  );
  if (existing.rows.length > 0)
    return res.status(409).json({ error: 'Cette tâche existe déjà !' });

  const result = await pool.query(
    'INSERT INTO tasks (user_id, title, category) VALUES ($1, $2, $3) RETURNING *',
    [req.user.id, title, cat]
  );
  res.json(result.rows[0]);
});

// Reset statuts toutes les 24h (appelé au chargement du dashboard)
app.post('/api/tasks/daily-reset', auth, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  await pool.query(
    `UPDATE tasks SET status = 'pending'
     WHERE user_id = $1 AND (last_updated IS NULL OR last_updated < $2)`,
    [req.user.id, today]
  );
  res.json({ message: 'Reset journalier effectué' });
});

app.post('/api/confirm', auth, async (req, res) => {
  const now = Date.now();
  await pool.query(
    'UPDATE users SET tasks_locked = 1, start_time = COALESCE(start_time, $1) WHERE id = $2',
    [now, req.user.id]
  );
  const result = await pool.query('SELECT start_time FROM users WHERE id = $1', [req.user.id]);
  res.json({ start_time: result.rows[0].start_time });
});

app.patch('/api/tasks/:id/status', auth, async (req, res) => {
  const { status } = req.body;
  if (!['done', 'failed', 'pending'].includes(status))
    return res.status(400).json({ error: 'Statut invalide' });

  const today = new Date().toISOString().slice(0, 10);
  const task = await pool.query(
    'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  if (!task.rows[0]) return res.status(404).json({ error: 'Tâche introuvable' });

  await pool.query(
    'UPDATE tasks SET status = $1, last_updated = $2 WHERE id = $3',
    [status, today, task.rows[0].id]
  );

  if (status !== 'pending') {
    await pool.query(`
      INSERT INTO daily_reports (user_id, report_date, task_id, task_title, category, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (user_id, report_date, task_id) DO UPDATE SET status = EXCLUDED.status
    `, [req.user.id, today, task.rows[0].id, task.rows[0].title, task.rows[0].category, status]);
  } else {
    await pool.query(
      'DELETE FROM daily_reports WHERE user_id = $1 AND report_date = $2 AND task_id = $3',
      [req.user.id, today, task.rows[0].id]
    );
  }

  res.json({ status });
});

app.get('/api/reports', auth, async (req, res) => {
  const result = await pool.query(`
    SELECT report_date, task_title, category, status
    FROM daily_reports
    WHERE user_id = $1
    ORDER BY report_date DESC
  `, [req.user.id]);

  const grouped = {};
  result.rows.forEach(r => {
    if (!grouped[r.report_date]) grouped[r.report_date] = [];
    grouped[r.report_date].push(r);
  });

  res.json(grouped);
});

app.post('/api/reset', auth, async (req, res) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const user = result.rows[0];
  if (!user.start_time) return res.status(400).json({ error: 'Pas encore démarré' });

  const elapsed = Date.now() - Number(user.start_time);
  const NINETY_DAYS = 90 * 24 * 3600 * 1000;
  if (elapsed < NINETY_DAYS)
    return res.status(403).json({ error: '90 jours pas encore écoulés' });

  await pool.query('DELETE FROM daily_reports WHERE user_id = $1', [req.user.id]);
  await pool.query('DELETE FROM tasks WHERE user_id = $1', [req.user.id]);
  await pool.query(
    'UPDATE users SET start_time = NULL, tasks_locked = 0 WHERE id = $1',
    [req.user.id]
  );
  res.json({ message: 'Réinitialisé avec succès' });
});

app.listen(process.env.PORT || 3001, '0.0.0.0', () =>
  console.log(`✅ Backend actif sur le port ${process.env.PORT || 3001}`)
);