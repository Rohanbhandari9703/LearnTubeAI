import mongoose from "mongoose";

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    playlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Playlist",
      required: [true, "Playlist ID is required"],
      index: true,
    },
    videoId: {
      type: String,
      required: [true, "Video ID is required"],
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure one progress entry per user-playlist-video combination
progressSchema.index({ userId: 1, playlistId: 1, videoId: 1 }, { unique: true });

const Progress = mongoose.model("Progress", progressSchema);

export default Progress;
