import Playlist from "../models/Playlist.js";

// @desc    Create a new playlist
// @route   POST /api/playlists
// @access  Private
export const createPlaylist = async (req, res, next) => {
  try {
    const { topic, playlistData } = req.body;

    if (!topic || !playlistData) {
      return res.status(400).json({ error: "Topic and playlist data are required" });
    }

    const playlist = await Playlist.create({
      userId: req.user._id,
      topic,
      playlistData,
    });

    res.status(201).json({
      success: true,
      playlist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all playlists for logged-in user
// @route   GET /api/playlists
// @access  Private
export const getPlaylists = async (req, res, next) => {
  try {
    const playlists = await Playlist.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select("-__v");

    res.json({
      success: true,
      count: playlists.length,
      playlists,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single playlist
// @route   GET /api/playlists/:id
// @access  Private
export const getPlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Check if user owns the playlist
    if (playlist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to access this playlist" });
    }

    res.json({
      success: true,
      playlist,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a playlist
// @route   DELETE /api/playlists/:id
// @access  Private
export const deletePlaylist = async (req, res, next) => {
  try {
    const playlist = await Playlist.findById(req.params.id);

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Check if user owns the playlist
    if (playlist.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Not authorized to delete this playlist" });
    }

    await Playlist.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Playlist deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
