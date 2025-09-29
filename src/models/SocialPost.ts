import mongoose, { Schema, Document } from 'mongoose';

export interface ISocialPost extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'run_completed' | 'achievement_earned' | 'event_joined' | 'photo_share' | 'general';
  content: string;
  photos: string[];
  runId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  achievementId?: mongoose.Types.ObjectId;
  location?: {
    name: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  tags: string[];
  likes: mongoose.Types.ObjectId[];
  comments: {
    userId: mongoose.Types.ObjectId;
    content: string;
    createdAt: Date;
  }[];
  isPublic: boolean;
  visibility: 'public' | 'followers' | 'private';
  createdAt: Date;
  updatedAt: Date;
}

export interface IPostLike extends Document {
  userId: mongoose.Types.ObjectId;
  postId: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface IPostComment extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  content: string;
  likes: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const SocialPostSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: ['run_completed', 'achievement_earned', 'event_joined', 'photo_share', 'general']
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  photos: [{
    type: String,
    trim: true
  }],
  runId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Run'
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  achievementId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Achievement'
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
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: true
  },
  visibility: {
    type: String,
    enum: ['public', 'followers', 'private'],
    default: 'public'
  }
}, {
  timestamps: true
});

const PostLikeSchema: Schema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialPost',
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false }
});

const PostCommentSchema: Schema = new Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialPost',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Indexes for better performance
SocialPostSchema.index({ createdAt: -1 });
SocialPostSchema.index({ userId: 1, createdAt: -1 });
SocialPostSchema.index({ type: 1, createdAt: -1 });
SocialPostSchema.index({ tags: 1 });
SocialPostSchema.index({ 'location.coordinates': '2dsphere' });

PostLikeSchema.index({ postId: 1, userId: 1 }, { unique: true });
PostCommentSchema.index({ postId: 1, createdAt: -1 });

// Virtual for like count
SocialPostSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
SocialPostSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Static method to create automatic posts for runs
SocialPostSchema.statics.createRunPost = async function(userId: string, runData: Record<string, unknown>) {
  const content = `Just completed a ${runData.distance}km run in ${Math.floor(runData.duration / 60)}:${(runData.duration % 60).toString().padStart(2, '0')}! 🏃‍♂️💪`;
  
  const post = new this({
    userId: new mongoose.Types.ObjectId(userId),
    type: 'run_completed',
    content,
    runId: runData._id,
    location: runData.location,
    tags: ['running', 'fitness', ...runData.tags],
    visibility: runData.isPublic ? 'public' : 'followers'
  });

  return await post.save();
};

// Static method to create achievement posts
SocialPostSchema.statics.createAchievementPost = async function(userId: string, achievement: Record<string, unknown>) {
  const content = `🎉 Just earned the "${achievement.name}" achievement! ${achievement.description}`;
  
  const post = new this({
    userId: new mongoose.Types.ObjectId(userId),
    type: 'achievement_earned',
    content,
    achievementId: achievement._id,
    tags: ['achievement', 'milestone'],
    visibility: 'public'
  });

  return await post.save();
};

// Static method to get feed for user
SocialPostSchema.statics.getFeedForUser = async function(userId: string, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  // Get user's following list
  const Follow = mongoose.model('Follow');
  const following = await Follow.find({ followerId: userId }).select('followeeId');
  const followingIds = following.map(f => f.followeeId);
  followingIds.push(new mongoose.Types.ObjectId(userId)); // Include user's own posts

  const posts = await this.find({
    $or: [
      { visibility: 'public' },
      { 
        userId: { $in: followingIds },
        visibility: { $in: ['public', 'followers'] }
      }
    ]
  })
  .populate('userId', 'name username profileImage')
  .populate('runId', 'distance duration pace')
  .populate('eventId', 'title date location')
  .populate('achievementId', 'name icon')
  .populate('comments.userId', 'name username profileImage')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

  return posts;
};

// Method to toggle like
SocialPostSchema.methods.toggleLike = async function(userId: string) {
  const userObjectId = new mongoose.Types.ObjectId(userId);
  const isLiked = this.likes.includes(userObjectId);

  if (isLiked) {
    this.likes = this.likes.filter((id: mongoose.Types.ObjectId) => !id.equals(userObjectId));
  } else {
    this.likes.push(userObjectId);
  }

  return await this.save();
};

// Method to add comment
SocialPostSchema.methods.addComment = async function(userId: string, content: string) {
  this.comments.push({
    userId: new mongoose.Types.ObjectId(userId),
    content,
    createdAt: new Date()
  });

  return await this.save();
};

const SocialPost = mongoose.models.SocialPost || mongoose.model<ISocialPost>('SocialPost', SocialPostSchema);
const PostLike = mongoose.models.PostLike || mongoose.model<IPostLike>('PostLike', PostLikeSchema);
const PostComment = mongoose.models.PostComment || mongoose.model<IPostComment>('PostComment', PostCommentSchema);

export { SocialPost, PostLike, PostComment };