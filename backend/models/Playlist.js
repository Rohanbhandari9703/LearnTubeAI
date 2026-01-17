import mongoose from "mongoose";

const playlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    topic: {
      type: String,
      required: [true, "Topic is required"],
      trim: true,
    },
    playlistData: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, "Playlist data is required"],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
playlistSchema.index({ userId: 1, createdAt: -1 });

const Playlist = mongoose.model("Playlist", playlistSchema);

export default Playlist;
