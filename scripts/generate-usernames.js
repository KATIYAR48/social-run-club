import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

// MongoDB connection
const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error(
    "Please define the MONGO_URI environment variable inside .env.local"
  );
  process.exit(1);
}

// User model schema (duplicated here to avoid import issues)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: {
    type: String,
    required: false, // Temporarily make it optional for migration
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-z0-9_-]+$/,
    index: true,
    sparse: true, // Allow multiple null values during migration
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

const User = mongoose.model("User", UserSchema);

// Function to generate username from email
function generateUsernameFromEmail(email) {
  // Extract the part before @ symbol
  const emailPrefix = email.split("@")[0];

  // Replace dots with underscores, remove special characters
  let username = emailPrefix
    .toLowerCase()
    .replace(/\./g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .trim();

  // Ensure minimum length
  if (username.length < 3) {
    username = username + "_user";
  }

  // Ensure maximum length
  if (username.length > 30) {
    username = username.substring(0, 30);
  }

  return username;
}

// Function to find available username (handle duplicates)
async function findAvailableUsername(baseUsername) {
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      return username;
    }

    // If username exists, append a number
    const suffix = `_${counter}`;
    if (baseUsername.length + suffix.length > 30) {
      // Truncate base username to fit the suffix
      const maxBaseLength = 30 - suffix.length;
      username = baseUsername.substring(0, maxBaseLength) + suffix;
    } else {
      username = baseUsername + suffix;
    }

    counter++;
  }
}

// Main function to generate usernames
async function generateUsernames() {
  try {
    console.log("🚀 Starting username generation script...");
    console.log("📡 Connecting to MongoDB...");

    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB successfully");

    // First, check total users
    const totalUsers = await User.countDocuments();
    console.log(`📊 Total users in database: ${totalUsers}`);

    // Find all users without usernames
    const usersWithoutUsernames = await User.find({
      $or: [
        { username: { $exists: false } },
        { username: null },
        { username: "" },
      ],
    });

    console.log(
      `🔍 Found ${usersWithoutUsernames.length} users without usernames`
    );

    if (usersWithoutUsernames.length === 0) {
      console.log("✅ All users already have usernames. Script completed.");
      return;
    }

    let updatedCount = 0;
    let errorCount = 0;

    for (const user of usersWithoutUsernames) {
      try {
        // Generate base username from email
        const baseUsername = generateUsernameFromEmail(user.email);

        // Find available username (handle duplicates)
        const availableUsername = await findAvailableUsername(baseUsername);

        // Update user with new username
        await User.findByIdAndUpdate(user._id, {
          username: availableUsername,
          updatedAt: new Date(),
        });

        console.log(
          `✅ Updated user ${user.name} (${user.email}) with username: ${availableUsername}`
        );
        updatedCount++;
      } catch (error) {
        console.error(
          `❌ Error updating user ${user.name} (${user.email}):`,
          error.message
        );
        errorCount++;
      }
    }

    console.log("\n🎉 === Username Generation Complete ===");
    console.log(`✅ Successfully updated: ${updatedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
  } catch (error) {
    console.error("💥 Error in username generation script:", error);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 MongoDB connection closed");
  }
}

// Always run the script when this file is executed
console.log("📝 Script file loaded, executing...");
generateUsernames().catch(console.error);

export { generateUsernames, generateUsernameFromEmail, findAvailableUsername };
