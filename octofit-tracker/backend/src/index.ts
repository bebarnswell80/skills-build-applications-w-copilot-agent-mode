import { connectDatabase } from './config/database.js';
import { startServer } from './server.js';

try {
  await connectDatabase();
  startServer();
} catch (error) {
  console.error('Failed to start OctoFit API:', error);
  process.exitCode = 1;
}