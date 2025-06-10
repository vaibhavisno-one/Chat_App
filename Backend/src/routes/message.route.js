import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);

// Updated routes for getting messages:
router.get("/direct/:userId", protectRoute, getMessages); // For direct messages
router.get("/team/:teamId", protectRoute, getMessages);   // For team messages

router.post("/send/:chatId", protectRoute, sendMessage); // :chatId can be userId or teamId

export default router;
