import express from "express";
import {
  saveVideo,
  getSavedVideos,
  deleteSavedVideo,
} from "../controllers/savedVideoController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route("/").post(saveVideo).get(getSavedVideos);
router.delete("/:videoId", deleteSavedVideo);

export default router;
