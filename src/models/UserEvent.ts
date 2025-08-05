import mongoose, { Schema, Document } from "mongoose";

export interface IUserEvent extends Document {
  userId: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  approved: boolean | null;
  checkedIn: boolean;
  checkedInAt: Date | null;
  createdAt: Date;
  additionalInfo?: string;
}

const UserEventSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  eventId: {
    type: Schema.Types.ObjectId,
    ref: "Event",
    required: true,
    index: true,
  },
  approved: {
    type: Boolean,
    default: null,
    index: true,
  },
  checkedIn: {
    type: Boolean,
    default: false,
    index: true,
  },
  checkedInAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  additionalInfo: {
    type: String,
    required: false,
  },
});

// Create a compound index to ensure a user can only register once for an event
UserEventSchema.index({ userId: 1, eventId: 1 }, { unique: true });

// Add additional indexes for better query performance
UserEventSchema.index({ eventId: 1, approved: 1 });
UserEventSchema.index({ eventId: 1, checkedIn: 1 });
UserEventSchema.index({ createdAt: -1 });

// Check if the model already exists to prevent overwriting during hot reloads
export default mongoose.models.UserEvent ||
  mongoose.model<IUserEvent>("UserEvent", UserEventSchema);
