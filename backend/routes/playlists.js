import express from "express";
import {
  createPlaylist,
  getPlaylists,
  getPlaylist,
  deletePlaylist,
} from "../controllers/playlistController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route("/").post(createPlaylist).get(getPlaylists);
router.route("/:id").get(getPlaylist).delete(deletePlaylist);

export default router;
