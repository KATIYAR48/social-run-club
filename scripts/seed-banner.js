import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// Banner Schema (copy from the model)
const BannerSchema = new mongoose.Schema({
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

const Banner = mongoose.model("Banner", BannerSchema);

async function seedBanner() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Clear existing banners
    await Banner.deleteMany({});
    console.log("Cleared existing banners");

    // Create initial banner
    const initialBanner = new Banner({
      content:
        "Join our community of runners and discover amazing events, challenges, and connections. Start your running journey with us today!",
      isActive: true,
      backgroundColor: "#000000",
      textColor: "#ffffff",
      buttonText: "Join Now",
      buttonLink: "/signup",
      updatedBy: "system",
      updatedAt: new Date(),
    });

    await initialBanner.save();
    console.log("Initial banner created successfully");

    console.log("Banner seeding completed!");
  } catch (error) {
    console.error("Error seeding banner:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

seedBanner();
