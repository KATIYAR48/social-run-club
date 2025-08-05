import mongoose, { Schema, Document } from "mongoose";

// Strava Stats Schema
const StravaStatsSchema = new Schema({
  // Personal Records
  fastest5k: { time: Number, date: Date },
  fastest10k: { time: Number, date: Date },
  fastestHalfMarathon: { time: Number, date: Date },
  fastestMarathon: { time: Number, date: Date },
  longestRun: { distance: Number, date: Date },

  // Recent Stats (updated periodically)
  weeklyDistance: Number,
  weeklyElevation: Number,
  monthlyDistance: Number,
  monthlyRuns: Number,
  yearlyDistance: Number,

  // All-time stats
  totalDistance: Number,
  totalRuns: Number,
  totalElevation: Number,

  // Achievement data for gamification
  achievements: [
    {
      type: String, // 'distance_milestone', 'speed_achievement', 'consistency_streak'
      title: String,
      description: String,
      unlockedAt: Date,
      value: Number,
    },
  ],

  // Streaks and consistency
  currentStreak: Number,
  longestStreak: Number,
  lastActivityDate: Date,

  lastUpdated: { type: Date, default: Date.now },
});

export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: "male" | "female" | "other";
  emergencyContact?: string;
  instagramUsername?: string;
  joinCrew?: boolean;
  role: "user" | "admin" | "super-admin";
  strava?: {
    athleteId?: string;
    accessToken?: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
    connected: boolean;
    profile?: {
      firstname: string;
      lastname: string;
      profile: string; // profile image URL
      city: string;
      state: string;
      country: string;
      sex: string;
      weight: number;
    };
    stats?: typeof StravaStatsSchema;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true, index: true },
  email: { type: String, required: true, unique: true, index: true },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-z0-9_-]+$/,
    index: true,
  },
  password: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  dateOfBirth: { type: Date, index: true },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
    index: true,
  },
  emergencyContact: { type: String },
  instagramUsername: { type: String, sparse: true, unique: true, index: true },
  joinCrew: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["user", "admin", "super-admin"],
    default: "user",
    index: true,
  },
  // Strava integration
  strava: {
    athleteId: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiresAt: Date,
    connected: { type: Boolean, default: false },
    profile: {
      firstname: String,
      lastname: String,
      profile: String, // profile image URL
      city: String,
      state: String,
      country: String,
      sex: String,
      weight: Number,
    },
    stats: StravaStatsSchema,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Check if the model already exists to prevent overwriting during hot reloads
export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
