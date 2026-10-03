import cors from 'cors';
import express, { type ErrorRequestHandler } from 'express';
import Activity from './models/Activity.js';
import Leaderboard from './models/Leaderboard.js';
import Team from './models/Team.js';
import User from './models/User.js';
import Workout from './models/Workout.js';

export const app = express();
export const port = Number(process.env.PORT ?? 8000);
export const baseUrl = process.env.CODESPACE_NAME
  ? `https://${process.env.CODESPACE_NAME}-8000.app.github.dev`
  : 'http://localhost:8000';

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

app.use(cors());
app.use(express.json());

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', baseUrl });
});

app.get('/api/users/', async (_request, response) => {
  response.json(await User.find().lean().exec());
});

app.get('/api/teams/', async (_request, response) => {
  response.json(await Team.find().lean().exec());
});

app.get('/api/activities/', async (_request, response) => {
  response.json(await Activity.find().lean().exec());
});

app.get('/api/leaderboard/', async (_request, response) => {
  response.json(await Leaderboard.find().sort({ points: -1 }).lean().exec());
});

app.get('/api/workouts/', async (_request, response) => {
  response.json(await Workout.find().lean().exec());
});

const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  console.error('API request failed:', error);
  response.status(500).json({ error: 'Internal server error' });
};

app.use(errorHandler);

export function startServer() {
  return app.listen(port, () => {
    console.log(`OctoFit API listening at ${baseUrl}`);
  });
}
