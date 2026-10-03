import mongoose from 'mongoose';
import Activity from '../models/Activity.js';
import Leaderboard from '../models/Leaderboard.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Workout from '../models/Workout.js';

const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/octofit_db';

async function upsertUser(email: string, name: string) {
  const user = await User.findOne({ email });
  if (!user) {
    return User.create({ email, name });
  }

  user.name = name;
  return user.save();
}

async function upsertTeam(name: string, members: mongoose.Types.ObjectId[], points: number) {
  const team = await Team.findOne({ name });
  if (!team) {
    return Team.create({ name, members, points });
  }

  team.members = members;
  team.points = points;
  return team.save();
}

async function upsertActivity(activity: {
  user: mongoose.Types.ObjectId;
  name: string;
  durationMinutes: number;
  distance?: number;
  calories?: number;
  completedAt: Date;
}) {
  const existing = await Activity.findOne({
    user: activity.user,
    name: activity.name,
    completedAt: activity.completedAt,
  });
  if (!existing) {
    return Activity.create(activity);
  }

  existing.set(activity);
  return existing.save();
}

async function upsertLeaderboard(entry: {
  period: string;
  user: mongoose.Types.ObjectId;
  team: mongoose.Types.ObjectId;
  points: number;
}) {
  const existing = await Leaderboard.findOne({ period: entry.period, user: entry.user });
  if (!existing) {
    return Leaderboard.create(entry);
  }

  existing.set(entry);
  return existing.save();
}

async function upsertWorkout(workout: {
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationMinutes: number;
  category: string;
}) {
  const existing = await Workout.findOne({ name: workout.name });
  if (!existing) {
    return Workout.create(workout);
  }

  existing.set(workout);
  return existing.save();
}

/**
 * Seed the octofit_db database with test data
 */
async function seedDatabase() {
  try {
    await mongoose.connect(connectionString);
    console.log('Connected to octofit_db');

    const users = await Promise.all([
      upsertUser('alex.morgan@example.com', 'Alex Morgan'),
      upsertUser('sam.rivera@example.com', 'Sam Rivera'),
      upsertUser('jamie.chen@example.com', 'Jamie Chen'),
    ]);

    const teams = await Promise.all([
      upsertTeam('Trail Blazers', [users[0]._id, users[1]._id], 420),
      upsertTeam('Pace Makers', [users[2]._id], 315),
    ]);

    await Promise.all([
      User.updateOne({ _id: users[0]._id }, { team: teams[0]._id }),
      User.updateOne({ _id: users[1]._id }, { team: teams[0]._id }),
      User.updateOne({ _id: users[2]._id }, { team: teams[1]._id }),
    ]);

    const activitySamples = [
      {
        user: users[0]._id,
        name: 'Morning Run',
        durationMinutes: 32,
        distance: 5.2,
        calories: 340,
        completedAt: new Date('2026-09-28T07:30:00.000Z'),
      },
      {
        user: users[1]._id,
        name: 'Strength Training',
        durationMinutes: 45,
        calories: 290,
        completedAt: new Date('2026-09-29T17:00:00.000Z'),
      },
      {
        user: users[2]._id,
        name: 'Cycling',
        durationMinutes: 50,
        distance: 18.5,
        calories: 410,
        completedAt: new Date('2026-09-30T08:15:00.000Z'),
      },
    ];

    await Promise.all(activitySamples.map((activity) => upsertActivity(activity)));

    await Promise.all([
      upsertLeaderboard({ period: 'weekly-2026-09-28', user: users[0]._id, team: teams[0]._id, points: 185 }),
      upsertLeaderboard({ period: 'weekly-2026-09-28', user: users[1]._id, team: teams[0]._id, points: 160 }),
      upsertLeaderboard({ period: 'weekly-2026-09-28', user: users[2]._id, team: teams[1]._id, points: 205 }),
    ]);

    const workoutSamples = [
      {
        name: 'Beginner Cardio Intervals',
        description: 'Alternate brisk walking and easy jogging to build endurance.',
        difficulty: 'beginner',
        durationMinutes: 25,
        category: 'cardio',
      },
      {
        name: 'Full-Body Strength',
        description: 'A balanced strength session using bodyweight movements.',
        difficulty: 'intermediate',
        durationMinutes: 40,
        category: 'strength',
      },
      {
        name: 'Tempo Run',
        description: 'A steady-paced run to improve speed and aerobic fitness.',
        difficulty: 'advanced',
        durationMinutes: 35,
        category: 'running',
      },
    ] as const;

    await Promise.all(workoutSamples.map((workout) => upsertWorkout(workout)));

    console.log('Seeded users, teams, activities, leaderboard, and workouts');
    console.log('Database seeding complete');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

await seedDatabase();
