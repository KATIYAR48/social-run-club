const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

// Connect to MongoDB
const MONGODB_URI = process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error(
    "Please define the MONGO_URI environment variable inside .env.local"
  );
  process.exit(1);
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema (temporary for migration)
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  username: String,
  password: String,
  phone: String,
  age: Number, // Old field
  dateOfBirth: Date, // New field
  gender: String,
  emergencyContact: String,
  instagramUsername: String,
  role: String,
  strava: Object,
  createdAt: Date,
  updatedAt: Date,
});

const User = mongoose.model("User", UserSchema);

// Function to calculate approximate date of birth from age
function calculateDateOfBirthFromAge(age) {
  if (!age || age <= 0) return null;

  const today = new Date();
  const currentYear = today.getFullYear();
  const birthYear = currentYear - age;

  // Create a date in the middle of the year (July 1st) as an approximation
  return new Date(birthYear, 6, 1); // Month is 0-indexed, so 6 = July
}

async function migrateAgeToDateOfBirth() {
  try {
    console.log("Starting migration from age to dateOfBirth...");

    // Find all users with age but no dateOfBirth
    const usersWithAge = await User.find({
      age: { $exists: true, $ne: null },
      $or: [{ dateOfBirth: { $exists: false } }, { dateOfBirth: null }],
    });

    console.log(`Found ${usersWithAge.length} users with age field to migrate`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const user of usersWithAge) {
      try {
        const dateOfBirth = calculateDateOfBirthFromAge(user.age);

        if (dateOfBirth) {
          // Update the user with dateOfBirth
          await User.updateOne(
            { _id: user._id },
            {
              $set: {
                dateOfBirth: dateOfBirth,
                updatedAt: new Date(),
              },
              $unset: { age: 1 }, // Remove the age field
            }
          );

          console.log(
            `Migrated user ${user.name} (${user.email}): age ${
              user.age
            } -> dateOfBirth ${dateOfBirth.toISOString().split("T")[0]}`
          );
          migratedCount++;
        } else {
          console.log(
            `Skipped user ${user.name} (${user.email}): invalid age ${user.age}`
          );
          skippedCount++;
        }
      } catch (error) {
        console.error(
          `Error migrating user ${user.name} (${user.email}):`,
          error.message
        );
        skippedCount++;
      }
    }

    console.log("\nMigration completed!");
    console.log(`Successfully migrated: ${migratedCount} users`);
    console.log(`Skipped: ${skippedCount} users`);

    // Verify migration
    const usersWithAgeAfter = await User.find({ age: { $exists: true } });
    const usersWithDateOfBirth = await User.find({
      dateOfBirth: { $exists: true, $ne: null },
    });

    console.log(`\nVerification:`);
    console.log(`Users still with age field: ${usersWithAgeAfter.length}`);
    console.log(`Users with dateOfBirth field: ${usersWithDateOfBirth.length}`);
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the migration
migrateAgeToDateOfBirth();
