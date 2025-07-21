import mongoose, { Schema, Document } from "mongoose";

interface INotificationSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface INotificationHistory extends Document {
  title: string;
  message: string;
  url?: string;
  sentBy: mongoose.Types.ObjectId; // Admin who sent it
  sentTo: "all" | "crew" | "non-crew" | mongoose.Types.ObjectId[]; // Target audience
  totalSent: number;
  successCount: number;
  failureCount: number;
  status: "sending" | "completed" | "failed";
  errorLog?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSubscriptionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  endpoint: { type: String, required: true, unique: true },
  keys: {
    p256dh: { type: String, required: true },
    auth: { type: String, required: true },
  },
  userAgent: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const NotificationHistorySchema: Schema = new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  url: { type: String },
  sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sentTo: {
    type: Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function (v: string | mongoose.Types.ObjectId[]) {
        return typeof v === "string" || Array.isArray(v);
      },
      message: "sentTo must be a string or array",
    },
  },
  totalSent: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 },
  failureCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ["sending", "completed", "failed"],
    default: "sending",
  },
  errorLog: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Indexes for performance
NotificationSubscriptionSchema.index({ userId: 1 });
NotificationSubscriptionSchema.index({ endpoint: 1 });
NotificationSubscriptionSchema.index({ isActive: 1 });

NotificationHistorySchema.index({ sentBy: 1 });
NotificationHistorySchema.index({ createdAt: -1 });

export const NotificationSubscription =
  mongoose.models.NotificationSubscription ||
  mongoose.model<INotificationSubscription>(
    "NotificationSubscription",
    NotificationSubscriptionSchema
  );

export const NotificationHistory =
  mongoose.models.NotificationHistory ||
  mongoose.model<INotificationHistory>(
    "NotificationHistory",
    NotificationHistorySchema
  );

export type { INotificationSubscription, INotificationHistory };
