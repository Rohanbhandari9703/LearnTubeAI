import Progress from "../models/Progress.js";

// @desc    Create or update progress
// @route   POST /api/progress
// @access  Private
export const updateProgress = async (req, res, next) => {
  try {
    const { playlistId, videoId, videoUrl, completed } = req.body;

    if (!playlistId || !videoId || !videoUrl || typeof completed !== "boolean") {
      return res.status(400).json({
        error: "playlistId, videoId, videoUrl, and completed (boolean) are required",
      });
    }

    // Find or create progress entry
    const progress = await Progress.findOneAndUpdate(
      {
        userId: req.user._id,
        playlistId,
        videoId,
      },
      {
        userId: req.user._id,
        playlistId,
        videoId,
        videoUrl,
        completed,
        updatedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json({
      success: true,
      progress,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get progress for a playlist
// @route   GET /api/progress/:playlistId
// @access  Private
export const getProgress = async (req, res, next) => {
  try {
    const { playlistId } = req.params;

    const progress = await Progress.find({
      userId: req.user._id,
      playlistId,
    }).select("-__v");

    res.json({
      success: true,
      count: progress.length,
      progress,
    });
  } catch (error) {
    next(error);
  }
};
