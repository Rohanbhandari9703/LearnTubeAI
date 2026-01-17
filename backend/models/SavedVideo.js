import mongoose from "mongoose";

const savedVideoSchema = new mongoose.Schema(
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
    },
    videoId: {
      type: String,
      required: [true, "Video ID is required"],
    },
    title: {
      type: String,
      required: [true, "Video title is required"],
    },
    thumbnail: {
      type: String,
      default: "",
    },
    videoUrl: {
      type: String,
      required: [true, "Video URL is required"],
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate saves
savedVideoSchema.index({ userId: 1, videoId: 1 }, { unique: true });

const SavedVideo = mongoose.model("SavedVideo", savedVideoSchema);

export default SavedVideo;
