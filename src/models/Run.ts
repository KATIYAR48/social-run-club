import mongoose, { Schema, Document } from 'mongoose';

export interface IRun extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  distance: number; // in kilometers
  duration: number; // in minutes
  pace: number; // minutes per kilometer
  date: Date;
  route?: string;
  notes?: string;
  location?: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  weather?: {
    temperature: number;
    condition: string;
  };
  elevationGain?: number; // in meters
  calories?: number;
  averageHeartRate?: number;
  isPublic: boolean;
  tags: string[];
  photos?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RunSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  distance: {
    type: Number,
    required: true,
    min: 0.1,
    max: 200 // reasonable max for runs
  },
  duration: {
    type: Number,
    required: true,
    min: 1 // at least 1 minute
  },
  pace: {
    type: Number,
    required: true,
    min: 0.5 // very fast pace
  },
  date: {
    type: Date,
    required: true,
    index: true
  },
  route: {
    type: String,
    trim: true,
    maxlength: 200
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  location: {
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    coordinates: {
      lat: {
        type: Number,
        min: -90,
        max: 90
      },
      lng: {
        type: Number,
        min: -180,
        max: 180
      }
    }
  },
  weather: {
    temperature: {
      type: Number,
      min: -50,
      max: 60 // celsius
    },
    condition: {
      type: String,
      trim: true,
      maxlength: 50
    }
  },
  elevationGain: {
    type: Number,
    min: 0,
    default: 0
  },
  calories: {
    type: Number,
    min: 0
  },
  averageHeartRate: {
    type: Number,
    min: 40,
    max: 220
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  photos: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better performance
RunSchema.index({ userId: 1, date: -1 });
RunSchema.index({ date: -1 });
RunSchema.index({ isPublic: 1, date: -1 });
RunSchema.index({ 'location.coordinates': '2dsphere' }); // For geo queries

// Virtual for calculated speed in km/h
RunSchema.virtual('speed').get(function() {
  return this.distance / (this.duration / 60);
});

// Method to calculate personal records
RunSchema.methods.calculatePRs = function() {
  return {
    fastestPace: this.pace,
    longestDistance: this.distance,
    longestDuration: this.duration
  };
};

// Static method to get user stats
RunSchema.statics.getUserStats = async function(userId: string) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$userId',
        totalRuns: { $sum: 1 },
        totalDistance: { $sum: '$distance' },
        totalDuration: { $sum: '$duration' },
        averagePace: { $avg: '$pace' },
        fastestPace: { $min: '$pace' },
        longestRun: { $max: '$distance' },
        totalCalories: { $sum: '$calories' },
        totalElevation: { $sum: '$elevationGain' }
      }
    }
  ]);
  
  return stats[0] || {
    totalRuns: 0,
    totalDistance: 0,
    totalDuration: 0,
    averagePace: 0,
    fastestPace: 0,
    longestRun: 0,
    totalCalories: 0,
    totalElevation: 0
  };
};

// Static method for leaderboard data
RunSchema.statics.getLeaderboardData = async function(period = 'month') {
  const startDate = new Date();
  
  switch (period) {
    case 'week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  const leaderboard = await this.aggregate([
    { $match: { date: { $gte: startDate }, isPublic: true } },
    {
      $group: {
        _id: '$userId',
        totalDistance: { $sum: '$distance' },
        totalRuns: { $sum: 1 },
        averagePace: { $avg: '$pace' },
        fastestPace: { $min: '$pace' }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        username: '$user.username',
        profileImage: '$user.profileImage',
        totalDistance: 1,
        totalRuns: 1,
        averagePace: 1,
        fastestPace: 1
      }
    },
    { $sort: { totalDistance: -1 } },
    { $limit: 50 }
  ]);

  return leaderboard;
};

const Run = mongoose.models.Run || mongoose.model<IRun>('Run', RunSchema);

export default Run;