// Backend/src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
// Team model might not be directly used here but ensuring User model has ref correct.

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    // Populate the 'team' field when fetching the user
    const user = await User.findById(decoded.userId).select("-password").populate("team");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.user = user; // req.user will now have the populated team object if a team exists

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware: ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};