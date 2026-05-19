import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { testDbConnection } from './db/index.js';
import { requireAuth, type AuthenticatedRequest } from './middleware/auth.js';
import historyRouter from './routes/historyRoutes.js';
import goalsRouter from './routes/goalsRoutes.js';
import statsRouter from './routes/statsRoutes.js';
import measurementsRouter from './routes/measurementsRoutes.js';
import profileRouter from './routes/profileRoutes.js';
import coachRoutes from './routes/coachRoutes.js';

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// Example protected route to test auth
app.get('/api/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ userId: req.userId });
});

app.use('/api', measurementsRouter);
app.use('/api', statsRouter);
app.use('/api', goalsRouter);
app.use('/api', historyRouter);
app.use('/api', profileRouter);
app.use('/api/coach', coachRoutes);

app.listen(port, async () => {
  console.log(`WellSync backend listening on port ${port}`);
  try {
    await testDbConnection();
  } catch (err) {
    console.error('Supabase admin connection failed:', err);
  }
});