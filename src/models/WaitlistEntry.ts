import mongoose, { Schema, Document } from "mongoose";

export interface IWaitlistEntry extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  preferredMerch: string;
  size?: string;
  colorPreference?: string;
  instagramUsername?: string;
  additionalInfo?: string;
  status: "waiting" | "notified";
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistEntrySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  preferredMerch: { type: String, required: true },
  size: { type: String },
  colorPreference: { type: String },
  instagramUsername: { type: String },
  additionalInfo: { type: String },
  status: { type: String, enum: ["waiting", "notified"], default: "waiting" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.WaitlistEntry ||
  mongoose.model<IWaitlistEntry>("WaitlistEntry", WaitlistEntrySchema);
