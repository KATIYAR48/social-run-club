import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  username: string;
  password: string;
  phone: string;
  age?: number;
  gender?: "male" | "female" | "other";
  emergencyContact?: string;
  instagramUsername?: string;
  joinCrew?: boolean;
  role: "user" | "admin" | "super-admin";
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
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
  age: { type: Number },
  gender: {
    type: String,
    enum: ["male", "female", "other"],
  },
  emergencyContact: { type: String },
  instagramUsername: { type: String, sparse: true, unique: true },
  joinCrew: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["user", "admin", "super-admin"],
    default: "user",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Check if the model already exists to prevent overwriting during hot reloads
export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);
