import mongoose, { Schema, Document } from "mongoose";

export interface IFollow extends Document {
  followerId: mongoose.Types.ObjectId;
  followingId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const FollowSchema: Schema = new Schema({
  followerId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  followingId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a compound index to ensure a user can only follow another user once
FollowSchema.index({ followerId: 1, followingId: 1 }, { unique: true });

// Prevent users from following themselves
FollowSchema.pre("save", function (this: IFollow, next) {
  if (this.followerId.toString() === this.followingId.toString()) {
    const error = new Error("Users cannot follow themselves");
    return next(error);
  }
  next();
});

// Check if the model already exists to prevent overwriting during hot reloads
export default mongoose.models.Follow ||
  mongoose.model<IFollow>("Follow", FollowSchema);
