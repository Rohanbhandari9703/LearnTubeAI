import mongoose from "mongoose";

const playlistCacheSchema = new mongoose.Schema(
  {
    cacheKey: {
      type: String,
      required: [true, "Cache key is required"],
      unique: true,
      index: true,
    },
    topic: {
      type: String,
      required: true,
      index: true,
    },
    totalMinutes: {
      type: Number,
      required: true,
    },
    playlistData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    hitCount: {
      type: Number,
      default: 0,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      index: { expireAfterSeconds: 0 }, // Auto-delete expired cache
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient lookups
playlistCacheSchema.index({ topic: 1, totalMinutes: 1 });
playlistCacheSchema.index({ hitCount: -1, lastAccessed: -1 }); // For finding popular cache

const PlaylistCache = mongoose.model("PlaylistCache", playlistCacheSchema);

export default PlaylistCache;
