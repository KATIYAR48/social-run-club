import mongoose, { Schema, Document } from "mongoose";

export interface IBanner extends Document {
  content: string;
  isActive: boolean;
  backgroundColor?: string;
  textColor?: string;
  buttonText: string;
  buttonLink: string;
  updatedBy: string;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema({
  content: {
    type: String,
    required: true,
    maxlength: 500,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  backgroundColor: {
    type: String,
    default: "#000000",
  },
  textColor: {
    type: String,
    default: "#ffffff",
  },
  buttonText: {
    type: String,
    required: true,
    maxlength: 50,
  },
  buttonLink: {
    type: String,
    required: true,
    maxlength: 500,
  },
  updatedBy: {
    type: String,
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Check if the model already exists to prevent overwriting during hot reloads
export default mongoose.models.Banner ||
  mongoose.model<IBanner>("Banner", BannerSchema);
