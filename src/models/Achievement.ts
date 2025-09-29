import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  name: string;
  nameHindi: string;
  description: string;
  descriptionHindi: string;
  icon: string;
  category: 'distance' | 'speed' | 'consistency' | 'participation' | 'special';
  criteria: {
    type: 'distance_total' | 'distance_single' | 'runs_count' | 'streak_days' | 'pace' | 'events_attended' | 'special';
    value: number;
    period?: 'week' | 'month' | 'year' | 'all_time';
  };
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  achievementId: mongoose.Types.ObjectId;
  earnedAt: Date;
  progress?: number; // for tracking progress towards achievements
}

const AchievementSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  nameHindi: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  descriptionHindi: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  icon: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['distance', 'speed', 'consistency', 'participation', 'special']
  },
  criteria: {
    type: {
      type: String,
      required: true,
      enum: ['distance_total', 'distance_single', 'runs_count', 'streak_days', 'pace', 'events_attended', 'special']
    },
    value: {
      type: Number,
      required: true,
      min: 0
    },
    period: {
      type: String,
      enum: ['week', 'month', 'year', 'all_time'],
      default: 'all_time'
    }
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    max: 1000
  },
  rarity: {
    type: String,
    required: true,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
    default: 'common'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const UserAchievementSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement',
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: false
});

// Compound index to prevent duplicate achievements
UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

// Static method to check and award achievements
AchievementSchema.statics.checkAndAwardAchievements = async function(userId: string) {
  const achievements = await this.find({ isActive: true });
  const UserAchievement = mongoose.model('UserAchievement');
  const Run = mongoose.model('Run');
  
  const newAchievements = [];

  for (const achievement of achievements) {
    // Check if user already has this achievement
    const existingAchievement = await UserAchievement.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      achievementId: achievement._id
    });

    if (existingAchievement) continue;

    let qualified = false;

    switch (achievement.criteria.type) {
      case 'distance_total':
        const totalDistance = await Run.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: null, total: { $sum: '$distance' } } }
        ]);
        qualified = totalDistance[0]?.total >= achievement.criteria.value;
        break;

      case 'distance_single':
        const longestRun = await Run.findOne(
          { userId: new mongoose.Types.ObjectId(userId) },
          { distance: 1 }
        ).sort({ distance: -1 });
        qualified = longestRun?.distance >= achievement.criteria.value;
        break;

      case 'runs_count':
        const runCount = await Run.countDocuments({
          userId: new mongoose.Types.ObjectId(userId)
        });
        qualified = runCount >= achievement.criteria.value;
        break;

      case 'pace':
        const fastestRun = await Run.findOne(
          { userId: new mongoose.Types.ObjectId(userId) },
          { pace: 1 }
        ).sort({ pace: 1 });
        qualified = fastestRun?.pace <= achievement.criteria.value;
        break;

      case 'streak_days':
        // Check for consecutive days of running
        const runs = await Run.find(
          { userId: new mongoose.Types.ObjectId(userId) },
          { date: 1 }
        ).sort({ date: -1 });
        
        let currentStreak = 0;
        let maxStreak = 0;
        let lastDate: Date | null = null;

        for (const run of runs) {
          const runDate = new Date(run.date);
          runDate.setHours(0, 0, 0, 0);

          if (!lastDate) {
            currentStreak = 1;
            lastDate = runDate;
          } else {
            const dayDiff = (lastDate.getTime() - runDate.getTime()) / (1000 * 60 * 60 * 24);
            
            if (dayDiff === 1) {
              currentStreak++;
            } else if (dayDiff > 1) {
              maxStreak = Math.max(maxStreak, currentStreak);
              currentStreak = 1;
            }
            
            lastDate = runDate;
          }
        }
        
        maxStreak = Math.max(maxStreak, currentStreak);
        qualified = maxStreak >= achievement.criteria.value;
        break;
    }

    if (qualified) {
      const userAchievement = new UserAchievement({
        userId: new mongoose.Types.ObjectId(userId),
        achievementId: achievement._id,
        earnedAt: new Date()
      });

      await userAchievement.save();
      newAchievements.push(achievement);
    }
  }

  return newAchievements;
};

// Static method to get user's achievements
UserAchievementSchema.statics.getUserAchievements = async function(userId: string) {
  return await this.find({ userId: new mongoose.Types.ObjectId(userId) })
    .populate('achievementId')
    .sort({ earnedAt: -1 });
};

const Achievement = mongoose.models.Achievement || mongoose.model<IAchievement>('Achievement', AchievementSchema);
const UserAchievement = mongoose.models.UserAchievement || mongoose.model<IUserAchievement>('UserAchievement', UserAchievementSchema);

export { Achievement, UserAchievement };