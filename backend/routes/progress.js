import express from "express";
import {
  updateProgress,
  getProgress,
} from "../controllers/progressController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post("/", updateProgress);
router.get("/:playlistId", getProgress);

export default router;
