import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to protect routes
export const protect = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ error: "Not authorized, no token provided" });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token (excluding password)
      req.user = await User.findById(decoded.userId).select("-password");
      
      if (!req.user) {
        return res.status(401).json({ error: "User not found" });
      }

      next();
    } catch (error) {
      return res.status(401).json({ error: "Not authorized, invalid token" });
    }
  } catch (error) {
    res.status(500).json({ error: "Server error during authentication" });
  }
};
