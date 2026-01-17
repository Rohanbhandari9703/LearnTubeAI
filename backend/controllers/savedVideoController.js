import SavedVideo from "../models/SavedVideo.js";

// @desc    Save a video
// @route   POST /api/saved-videos
// @access  Private
export const saveVideo = async (req, res, next) => {
  try {
    const { playlistId, videoId, title, thumbnail, videoUrl } = req.body;

    if (!playlistId || !videoId || !title || !videoUrl) {
      return res.status(400).json({
        error: "playlistId, videoId, title, and videoUrl are required",
      });
    }

    // Check if video is already saved
    const existingVideo = await SavedVideo.findOne({
      userId: req.user._id,
      videoId,
    });

    if (existingVideo) {
      return res.status(400).json({ error: "Video already saved" });
    }

    const savedVideo = await SavedVideo.create({
      userId: req.user._id,
      playlistId,
      videoId,
      title,
      thumbnail: thumbnail || "",
      videoUrl,
    });

    res.status(201).json({
      success: true,
      savedVideo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all saved videos for logged-in user
// @route   GET /api/saved-videos
// @access  Private
export const getSavedVideos = async (req, res, next) => {
  try {
    const savedVideos = await SavedVideo.find({ userId: req.user._id })
      .populate("playlistId", "topic")
      .sort({ savedAt: -1 })
      .select("-__v");

    res.json({
      success: true,
      count: savedVideos.length,
      savedVideos,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a saved video
// @route   DELETE /api/saved-videos/:videoId
// @access  Private
export const deleteSavedVideo = async (req, res, next) => {
  try {
    const { videoId } = req.params;

    const savedVideo = await SavedVideo.findOne({
      userId: req.user._id,
      videoId,
    });

    if (!savedVideo) {
      return res.status(404).json({ error: "Saved video not found" });
    }

    await SavedVideo.findByIdAndDelete(savedVideo._id);

    res.json({
      success: true,
      message: "Video removed from saved list",
    });
  } catch (error) {
    next(error);
  }
};
